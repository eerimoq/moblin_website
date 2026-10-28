use std::sync::Arc;

use anyhow::{Context, Result};
use axum::Json;
use axum::body::Bytes;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use log::{info, warn};
use serde::{Deserialize, Serialize};

use crate::app_attest::{AppAttest, Attestation, base64};
use crate::challenges::Challenges;
use crate::cloud::Page;
use crate::store::{Channel, Streamer};

use super::*;

const ASSERTION_HEADER: &str = "moblin-assertion";

#[derive(Serialize)]
pub(super) struct StreamersResponse {
    streamers: Vec<ListedStreamer>,
}

#[derive(Serialize)]
pub(super) struct ListedStreamer {
    #[serde(flatten)]
    streamer: Streamer,
    page: Option<Page>,
}

pub(super) async fn handle_streamers(State(api): State<Arc<Api>>) -> Json<StreamersResponse> {
    Json(StreamersResponse {
        streamers: api
            .store
            .streamers()
            .into_iter()
            .map(|streamer| ListedStreamer {
                page: api.cloud.as_ref().and_then(|cloud| cloud.page(&streamer)),
                streamer,
            })
            .collect(),
    })
}

#[derive(Serialize)]
pub(super) struct TwitchLiveResponse {
    channel: String,
    live: bool,
}

pub(super) async fn handle_twitch_live(
    State(api): State<Arc<Api>>,
) -> Result<Json<TwitchLiveResponse>, (StatusCode, String)> {
    let Some(live) = &api.live else {
        return Err((
            StatusCode::SERVICE_UNAVAILABLE,
            "no Twitch client ID and secret".to_string(),
        ));
    };
    let is_live = live.is_live().await.map_err(|error| {
        warn!("checking if {} is live failed: {error:#}", live.login());
        (StatusCode::SERVICE_UNAVAILABLE, format!("{error:#}"))
    })?;
    Ok(Json(TwitchLiveResponse {
        channel: live.login().to_string(),
        live: is_live,
    }))
}

#[derive(Serialize)]
pub(super) struct ChallengeResponse {
    challenge: String,
}

pub(super) async fn handle_challenge(
    State(api): State<Arc<Api>>,
) -> Result<Json<ChallengeResponse>, StatusCode> {
    let challenge = api
        .challenges
        .issue()
        .ok_or(StatusCode::SERVICE_UNAVAILABLE)?;
    Ok(Json(ChallengeResponse {
        challenge: BASE64_STANDARD.encode(challenge),
    }))
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub(super) struct LiveRequest {
    channels: Vec<Channel>,
    challenge: Option<String>,
    #[serde(flatten)]
    app_attest: Attestation,
}

pub(super) async fn handle_streamers_live(
    State(api): State<Arc<Api>>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<StatusCode, (StatusCode, String)> {
    let request: LiveRequest = serde_json::from_slice(&body)
        .map_err(|error| (StatusCode::BAD_REQUEST, error.to_string()))?;
    if let Some(app_attest) = &api.app_attest
        && let Err(error) = verify(app_attest, &api.challenges, &request, &headers, &body)
    {
        warn!("rejected live post: {error:#}");
        return Err((StatusCode::UNAUTHORIZED, format!("{error:#}")));
    }
    let channels = request.channels;
    Channel::validate_all(&channels)
        .map_err(|error| (StatusCode::BAD_REQUEST, error.to_string()))?;
    info!(
        "{} went live",
        channels
            .iter()
            .map(Channel::to_string)
            .collect::<Vec<_>>()
            .join(", ")
    );
    api.store.streamer_live(channels);
    Ok(StatusCode::NO_CONTENT)
}

fn verify(
    app_attest: &AppAttest,
    challenges: &Challenges,
    request: &LiveRequest,
    headers: &HeaderMap,
    body: &[u8],
) -> Result<()> {
    let assertion = headers
        .get(ASSERTION_HEADER)
        .context("no assertion")?
        .to_str()
        .ok()
        .context("assertion is not text")?;
    let challenge =
        base64(request.challenge.as_deref().context("no challenge")?).context("challenge")?;
    app_attest.verify(
        &Attestation {
            assertion: Some(assertion.to_string()),
            ..request.app_attest.clone()
        },
        body,
    )?;
    anyhow::ensure!(
        challenges.consume(&challenge),
        "the challenge is unknown, used or expired"
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;

    use tokio::net::TcpListener;

    use crate::api::{Api, router};
    use crate::challenges::Challenges;
    use crate::database::Database;
    use crate::store::Store;

    #[tokio::test]
    async fn the_frontends_origin_is_allowed() {
        let api = Arc::new(Api {
            store: Arc::new(Store::new(6, Database::memory())),
            cloud: None,
            challenges: Challenges::new(),
            app_attest: None,
            live: None,
            frontend_url: "https://example.com/website".to_string(),
        });
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move { axum::serve(listener, router(api)).await.unwrap() });
        let allowed = async |origin: &str| {
            let response = reqwest::Client::new()
                .get(format!("http://{address}/streamers"))
                .header("origin", origin)
                .send()
                .await
                .unwrap();
            response
                .headers()
                .get("access-control-allow-origin")
                .map(|value| value.to_str().unwrap().to_string())
        };
        for origin in ["https://example.com", "https://moblin.app"] {
            assert_eq!(
                allowed(origin).await,
                Some("https://example.com".to_string())
            );
        }
    }
}
