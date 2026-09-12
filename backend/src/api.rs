use std::sync::Arc;

use axum::extract::State;
use axum::http::{Method, StatusCode};
use axum::routing::{get, post};
use axum::{Json, Router};
use log::info;
use serde::Serialize;
use tower_http::cors::{Any, CorsLayer};

use crate::store::{Store, Streamer, WentLive};

pub fn router(store: Arc<Store>) -> Router {
    // The website is served from another origin (GitHub Pages), so allow
    // any site to read the list. Moblin posts from the app, not a browser.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);
    Router::new()
        .route("/streamers", get(streamers))
        .route("/streamers/went-live", post(went_live))
        .layer(cors)
        .with_state(store)
}

#[derive(Serialize)]
struct StreamersResponse {
    streamers: Vec<Streamer>,
}

/// Streamers who recently went live with Moblin, most recent first.
async fn streamers(State(store): State<Arc<Store>>) -> Json<StreamersResponse> {
    Json(StreamersResponse {
        streamers: store.streamers(),
    })
}

/// Called by Moblin when a streamer who opted in starts streaming.
async fn went_live(
    State(store): State<Arc<Store>>,
    Json(request): Json<WentLive>,
) -> Result<StatusCode, (StatusCode, String)> {
    request
        .validate()
        .map_err(|error| (StatusCode::BAD_REQUEST, error.to_string()))?;
    info!(
        "{} went live",
        request
            .channels
            .iter()
            .map(|channel| format!("{:?}/{}", channel.platform, channel.channel))
            .collect::<Vec<_>>()
            .join(", ")
    );
    store.went_live(request.channels);
    Ok(StatusCode::NO_CONTENT)
}
