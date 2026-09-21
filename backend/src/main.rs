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

async fn healthz() -> &'static str {
    "ok"
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

    // CORS: only the resume site may call this API from a browser.
    let cors = CorsLayer::new()
        .allow_origin([
            "https://theozdev.com".parse()?,
            "https://www.theozdev.com".parse()?,
            "https://theozdev.web.app".parse()?,
            "https://theozdev.firebaseapp.com".parse()?,
        ])
        .allow_methods([axum::http::Method::GET])
        .allow_headers([axum::http::header::CONTENT_TYPE]);

    let app = Router::new()
        .route("/api/visitors", get(get_visitors))
        .route("/healthz", get(healthz))
        .layer(cors)
        .with_state(store);

    // Cloud Run injects PORT; default 8080 for local runs.
    let port = std::env::var("PORT").unwrap_or_else(|_| "8080".into());
    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}")).await?;
    tracing::info!("resume-api listening on :{port}");
    axum::serve(listener, app).await?;
    Ok(())
}
