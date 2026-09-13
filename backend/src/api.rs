use std::sync::Arc;

use axum::extract::State;
use axum::http::{HeaderValue, Method, StatusCode};
use axum::routing::{get, post};
use axum::{Json, Router};
use log::info;
use serde::Serialize;
use tower_http::cors::{Any, CorsLayer};

use crate::store::{Channel, Live, Store, Streamer};

pub fn router(store: Arc<Store>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(HeaderValue::from_static("https://moblin.app"))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);
    Router::new()
        .route("/streamers", get(handle_streamers))
        .route("/streamers/live", post(handle_streamers_live))
        .layer(cors)
        .with_state(store)
}

#[derive(Serialize)]
struct StreamersResponse {
    streamers: Vec<Streamer>,
}

async fn handle_streamers(State(store): State<Arc<Store>>) -> Json<StreamersResponse> {
    Json(StreamersResponse {
        streamers: store.streamers(),
    })
}

async fn handle_streamers_live(
    State(store): State<Arc<Store>>,
    Json(request): Json<Live>,
) -> Result<StatusCode, (StatusCode, String)> {
    request
        .validate()
        .map_err(|error| (StatusCode::BAD_REQUEST, error.to_string()))?;
    info!(
        "{} went live",
        request
            .channels
            .iter()
            .map(Channel::to_string)
            .collect::<Vec<_>>()
            .join(", ")
    );
    store.streamer_live(request.channels);
    Ok(StatusCode::NO_CONTENT)
}
