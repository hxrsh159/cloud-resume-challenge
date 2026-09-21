//! Visitor counter storage backed by Firestore in Datastore mode (REST API).
//!
//! The counter is a single entity: kind `counter`, name `visitors`,
//! property `value` (int64). Every increment runs inside a Datastore
//! transaction (begin -> lookup -> commit). Concurrent transactions on the
//! same entity conflict; losers retry with backoff. This is what makes the
//! increment atomic — no lost updates under parallel requests.
//!
//! `CounterStore` is a trait so Phase 5 unit tests can mock the handler
//! without touching GCP.

use anyhow::{anyhow, Context};
use async_trait::async_trait;
use std::sync::Arc;
use std::time::Duration;

const DATASTORE_SCOPE: &str = "https://www.googleapis.com/auth/datastore";
const MAX_ATTEMPTS: u32 = 3;

/// Errors from a single increment attempt.
#[derive(Debug)]
pub enum StoreError {
    /// Transaction conflict / abort — safe to retry.
    Retryable(String),
    /// Anything else — auth, network, malformed response.
    Fatal(anyhow::Error),
}

#[async_trait]
pub trait CounterStore: Send + Sync {
    /// Atomically increment the visitor counter and return the new value.
    async fn increment(&self) -> Result<i64, StoreError>;
}

pub struct DatastoreStore {
    http: reqwest::Client,
    project: String,
    base_url: String,
    /// None when DATASTORE_EMULATOR_HOST is set: the emulator needs no auth.
    token_provider: Option<Arc<dyn gcp_auth::TokenProvider>>,
}

impl DatastoreStore {
    /// Auth uses Application Default Credentials: on Cloud Run this is the
    /// attached service account (metadata server); locally it is
    /// `gcloud auth application-default login`.
    ///
    /// If DATASTORE_EMULATOR_HOST is set, talks plain HTTP to the emulator
    /// with no credentials (local dev / docker-compose, Phase 5).
    pub async fn new(project: String) -> anyhow::Result<Self> {
        if let Ok(host) = std::env::var("DATASTORE_EMULATOR_HOST") {
            return Ok(Self {
                http: reqwest::Client::new(),
                project,
                base_url: format!("http://{host}/v1"),
                token_provider: None,
            });
        }
        let token_provider = gcp_auth::provider().await.context("gcp_auth init")?;
        Ok(Self {
            http: reqwest::Client::new(),
            project,
            base_url: "https://datastore.googleapis.com/v1".to_string(),
            token_provider: Some(token_provider),
        })
    }

    fn url(&self, op: &str) -> String {
        format!("{}/projects/{}:{}", self.base_url, self.project, op)
    }

    async fn bearer(&self) -> anyhow::Result<Option<String>> {
        match &self.token_provider {
            None => Ok(None),
            Some(tp) => {
                let token = tp
                    .token(&[DATASTORE_SCOPE])
                    .await
                    .context("fetching access token")?;
                Ok(Some(token.as_str().to_string()))
            }
        }
    }

    /// POST helper: attaches the bearer token unless running against the
    /// emulator.
    async fn post(&self, op: &str, body: serde_json::Value) -> Result<reqwest::Response, StoreError> {
        let mut req = self.http.post(self.url(op)).json(&body);
        if let Some(token) = self.bearer().await.map_err(StoreError::Fatal)? {
            req = req.bearer_auth(token);
        }
        req.send().await.map_err(|e| StoreError::Fatal(e.into()))
    }

    fn counter_key(&self) -> serde_json::Value {
        serde_json::json!({
            "partitionId": { "projectId": self.project },
            "path": [{ "kind": "counter", "name": "visitors" }]
        })
    }

    async fn begin_transaction(&self) -> Result<String, StoreError> {
        let resp = self.post("beginTransaction", serde_json::json!({})).await?;

        let status = resp.status();
        let body: serde_json::Value = resp.json().await.map_err(|e| StoreError::Fatal(e.into()))?;
        if !status.is_success() {
            return Err(classify(status, &body));
        }
        body["transaction"]
            .as_str()
            .map(str::to_string)
            .ok_or_else(|| StoreError::Fatal(anyhow!("beginTransaction: no transaction id")))
    }

    /// Current counter value within `tx`, or `None` if the entity does not
    /// exist yet (first ever visitor).
    async fn lookup(&self, tx: &str) -> Result<Option<i64>, StoreError> {
        let resp = self
            .post(
                "lookup",
                serde_json::json!({
                    "readOptions": { "transaction": tx },
                    "keys": [self.counter_key()]
                }),
            )
            .await?;

        let status = resp.status();
        let body: serde_json::Value = resp.json().await.map_err(|e| StoreError::Fatal(e.into()))?;
        if !status.is_success() {
            return Err(classify(status, &body));
        }

        if let Some(found) = body["found"].as_array().and_then(|f| f.first()) {
            let raw = found["entity"]["properties"]["value"]["integerValue"]
                .as_str()
                .ok_or_else(|| StoreError::Fatal(anyhow!("counter entity missing integerValue")))?;
            return raw
                .parse::<i64>()
                .map(Some)
                .map_err(|e| StoreError::Fatal(e.into()));
        }
        Ok(None) // "missing" — counter not created yet
    }

    async fn commit(&self, tx: &str, value: i64) -> Result<(), StoreError> {
        let resp = self
            .post(
                "commit",
                serde_json::json!({
                    "mode": "TRANSACTIONAL",
                    "transaction": tx,
                    "mutations": [{
                        "upsert": {
                            "key": self.counter_key(),
                            "properties": {
                                "value": { "integerValue": value.to_string() }
                            }
                        }
                    }]
                }),
            )
            .await?;

        let status = resp.status();
        if status.is_success() {
            return Ok(());
        }
        let body: serde_json::Value = resp.json().await.unwrap_or_default();
        Err(classify(status, &body))
    }

    async fn try_increment(&self) -> Result<i64, StoreError> {
        let tx = self.begin_transaction().await?;
        let current = self.lookup(&tx).await?.unwrap_or(0);
        let next = current + 1;
        self.commit(&tx, next).await?;
        Ok(next)
    }
}

#[async_trait]
impl CounterStore for DatastoreStore {
    async fn increment(&self) -> Result<i64, StoreError> {
        let mut attempt = 0;
        loop {
            match self.try_increment().await {
                Ok(v) => return Ok(v),
                Err(StoreError::Retryable(msg)) if attempt + 1 < MAX_ATTEMPTS => {
                    attempt += 1;
                    tracing::warn!(attempt, %msg, "transaction conflict, retrying");
                    tokio::time::sleep(Duration::from_millis(50 * attempt as u64)).await;
                }
                Err(e) => return Err(e),
            }
        }
    }
}

/// Datastore signals a transaction conflict either as HTTP 409, or HTTP 400
/// with status "ABORTED" in the error payload.
fn classify(status: reqwest::StatusCode, body: &serde_json::Value) -> StoreError {
    let api_status = body["error"]["status"].as_str().unwrap_or("");
    let msg = body["error"]["message"].as_str().unwrap_or("").to_string();
    if status == reqwest::StatusCode::CONFLICT
        || api_status == "ABORTED"
        || api_status == "FAILED_PRECONDITION"
    {
        StoreError::Retryable(format!("{status} {api_status}: {msg}"))
    } else {
        StoreError::Fatal(anyhow!("datastore error {status} {api_status}: {msg}"))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn http_409_is_retryable() {
        let err = classify(reqwest::StatusCode::CONFLICT, &serde_json::json!({}));
        assert!(matches!(err, StoreError::Retryable(_)));
    }

    #[test]
    fn aborted_body_is_retryable_even_with_400() {
        let body = serde_json::json!({"error": {"status": "ABORTED", "message": "contention"}});
        let err = classify(reqwest::StatusCode::BAD_REQUEST, &body);
        assert!(matches!(err, StoreError::Retryable(_)));
    }

    #[test]
    fn server_error_is_fatal_not_retried() {
        let body = serde_json::json!({"error": {"status": "INTERNAL", "message": "boom"}});
        let err = classify(reqwest::StatusCode::INTERNAL_SERVER_ERROR, &body);
        assert!(matches!(err, StoreError::Fatal(_)));
    }

    #[test]
    fn permission_denied_is_fatal() {
        let body = serde_json::json!({"error": {"status": "PERMISSION_DENIED", "message": "iam"}});
        let err = classify(reqwest::StatusCode::FORBIDDEN, &body);
        assert!(matches!(err, StoreError::Fatal(_)));
    }
}
