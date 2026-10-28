use std::sync::Arc;

use axum::Router;
use axum::http::{HeaderValue, Method};
use axum::routing::{get, post};
use tower_http::cors::{Any, CorsLayer};

use crate::app_attest::AppAttest;
use crate::challenges::Challenges;
use crate::cloud::Cloud;
use crate::live::Live;
use crate::store::Store;

mod streamers;

use streamers::*;

pub struct Api {
    pub store: Arc<Store>,
    pub cloud: Option<Arc<Cloud>>,
    pub challenges: Challenges,
    pub app_attest: Option<AppAttest>,
    pub live: Option<Live>,
    pub frontend_url: String,
}

pub fn router(api: Arc<Api>) -> Router {
    let origin = reqwest::Url::parse(&api.frontend_url)
        .expect("the frontend URL is not a URL")
        .origin()
        .ascii_serialization();
    let cors = CorsLayer::new()
        .allow_origin(HeaderValue::from_str(&origin).expect("the frontend URL is not an origin"))
        .allow_methods([Method::GET, Method::POST])
        .allow_headers(Any);
    Router::new()
        .route("/streamers", get(handle_streamers))
        .route("/streamers/live/challenge", post(handle_challenge))
        .route("/streamers/live", post(handle_streamers_live))
        .route("/twitch/live", get(handle_twitch_live))
        .layer(cors)
        .with_state(api)
}
