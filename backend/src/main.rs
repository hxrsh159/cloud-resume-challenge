mod store;

use axum::{extract::State, http::StatusCode, response::IntoResponse, routing::get, Json, Router};
use std::sync::Arc;
use store::{CounterStore, DatastoreStore};
use tower_http::cors::CorsLayer;

type SharedStore = Arc<dyn CounterStore>;

async fn get_visitors(State(store): State<SharedStore>) -> impl IntoResponse {
    match store.increment().await {
        Ok(count) => (StatusCode::OK, Json(serde_json::json!({ "count": count }))).into_response(),
        Err(e) => {
            let detail = match &e {
                store::StoreError::Retryable(m) => m.clone(),
                store::StoreError::Fatal(err) => err.to_string(),
            };
            tracing::error!(error = %detail, "counter increment failed");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": "visitor counter unavailable" })),
            )
                .into_response()
        }
    }
}

// NOTE: /healthz is unreachable on Cloud Run — Google's front end reserves
// that path and answers it before the container sees the request.
async fn health() -> &'static str {
    "ok"
}

/// Router construction, separated from main() so tests can mount the app
/// with a mock store and no environment dependencies.
fn app(store: SharedStore) -> Router {
    // CORS: only the resume site may call this API from a browser.
    let cors = CorsLayer::new()
        .allow_origin([
            "https://theozdev.com".parse().unwrap(),
            "https://www.theozdev.com".parse().unwrap(),
            "https://theozdev.web.app".parse().unwrap(),
            "https://theozdev.firebaseapp.com".parse().unwrap(),
        ])
        .allow_methods([axum::http::Method::GET])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    Router::new()
        .route("/api/visitors", get(get_visitors))
        .route("/health", get(health))
        .layer(cors)
        .with_state(store)
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info".into()),
        )
        .init();

    let project =
        std::env::var("GCP_PROJECT_ID").expect("GCP_PROJECT_ID environment variable must be set");
    let store: SharedStore = Arc::new(DatastoreStore::new(project).await?);

    // Cloud Run injects PORT; default 8080 for local runs.
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!("resume-api listening on :{port}");
    axum::serve(listener, app(store)).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use axum::body::Body;
    use axum::http::Request;
    use std::sync::atomic::{AtomicI64, Ordering};
    use store::StoreError;
    use tower::ServiceExt;

    /// In-memory CounterStore: the Phase 2 trait seam paying off.
    struct MockStore {
        value: AtomicI64,
        fail: bool,
    }

    impl MockStore {
        fn new() -> Self {
            Self { value: AtomicI64::new(0), fail: false }
        }
        fn failing() -> Self {
            Self { value: AtomicI64::new(0), fail: true }
        }
    }

    #[async_trait]
    impl CounterStore for MockStore {
        async fn increment(&self) -> Result<i64, StoreError> {
            if self.fail {
                return Err(StoreError::Fatal(anyhow::anyhow!("mock failure")));
            }
            Ok(self.value.fetch_add(1, Ordering::SeqCst) + 1)
        }
    }

    fn get(uri: &str) -> Request<Body> {
        Request::builder().uri(uri).body(Body::empty()).unwrap()
    }

    async fn body_json(resp: axum::response::Response) -> serde_json::Value {
        let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .unwrap();
        serde_json::from_slice(&bytes).unwrap()
    }

    #[tokio::test]
    async fn visitors_returns_incremented_count() {
        let resp = app(Arc::new(MockStore::new()))
            .oneshot(get("/api/visitors"))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
        assert_eq!(body_json(resp).await["count"], 1);
    }

    #[tokio::test]
    async fn store_failure_returns_500_and_never_leaks_details() {
        let resp = app(Arc::new(MockStore::failing()))
            .oneshot(get("/api/visitors"))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::INTERNAL_SERVER_ERROR);
        let body = body_json(resp).await;
        assert!(body.get("count").is_none());
        // client sees a generic message, not the internal error
        assert_eq!(body["error"], "visitor counter unavailable");
    }

    #[tokio::test]
    async fn concurrent_requests_each_receive_a_unique_count() {
        const N: i64 = 50;
        let app = app(Arc::new(MockStore::new()));

        let mut handles = Vec::new();
        for _ in 0..N {
            let app = app.clone();
            handles.push(tokio::spawn(async move {
                app.oneshot(get("/api/visitors")).await.unwrap()
            }));
        }

        let mut counts = Vec::new();
        for h in handles {
            let resp = h.await.unwrap();
            assert_eq!(resp.status(), StatusCode::OK);
            counts.push(body_json(resp).await["count"].as_i64().unwrap());
        }
        counts.sort_unstable();
        assert_eq!(counts, (1..=N).collect::<Vec<i64>>());
    }

    #[tokio::test]
    async fn health_is_ok() {
        let resp = app(Arc::new(MockStore::new()))
            .oneshot(get("/health"))
            .await
            .unwrap();
        assert_eq!(resp.status(), StatusCode::OK);
    }
}
