use std::sync::Arc;

use axum::extract::State;
use axum::http::{Method, StatusCode};
use axum::routing::{get, post};
use axum::{Json, Router};
use log::info;
use serde::Serialize;
use tower_http::cors::{Any, CorsLayer};

use crate::avatars::Avatars;
use crate::store::{Channel, Store, WentLive};

#[derive(Clone)]
pub struct App {
    pub store: Arc<Store>,
    pub avatars: Arc<Avatars>,
}

pub fn router(app: App) -> Router {
    // The website is served from another origin (GitHub Pages), so allow
    // any site to read the list. Moblin posts from the app, not a browser.
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);
    Router::new()
        .route("/streamers", get(streamers))
        .route("/streamers/live", post(live))
        .layer(cors)
        .with_state(app)
}

#[derive(Serialize)]
struct StreamersResponse {
    streamers: Vec<StreamerResponse>,
}

#[derive(Serialize)]
struct StreamerResponse {
    channels: Vec<ChannelResponse>,
}

#[derive(Serialize)]
struct ChannelResponse {
    #[serde(flatten)]
    channel: Channel,
    /// The channel's profile image URL, once looked up on its platform.
    avatar: Option<String>,
}

/// Streamers who recently went live with Moblin, newcomers first.
async fn streamers(State(app): State<App>) -> Json<StreamersResponse> {
    let streamers = app
        .store
        .streamers()
        .into_iter()
        .map(|streamer| StreamerResponse {
            channels: streamer
                .channels
                .into_iter()
                .map(|channel| ChannelResponse {
                    avatar: app.avatars.get(&channel),
                    channel,
                })
                .collect(),
        })
        .collect();
    Json(StreamersResponse { streamers })
}

/// Called by Moblin when a streamer who opted in starts streaming.
async fn live(
    State(app): State<App>,
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
            .map(Channel::to_string)
            .collect::<Vec<_>>()
            .join(", ")
    );
    app.store.went_live(request.channels.clone());
    // Streamers pushed off the list take their avatars with them, and the
    // ones that went live get theirs looked up, unless already done.
    let listed = app.store.streamers();
    app.avatars
        .retain(listed.iter().flat_map(|streamer| &streamer.channels));
    for channel in &request.channels {
        app.avatars.request(channel);
    }
    Ok(StatusCode::NO_CONTENT)
}
