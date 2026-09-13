//! Looks Twitch users up with the Helix API, authenticated with an app access
//! token from the client credentials grant flow.

use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use log::info;
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use serde::de::DeserializeOwned;
use tokio::sync::Mutex;
use tokio::time::Instant;

use crate::store::Profile;

const TOKEN_URL: &str = "https://id.twitch.tv/oauth2/token";
const USERS_URL: &str = "https://api.twitch.tv/helix/users";
const STREAMS_URL: &str = "https://api.twitch.tv/helix/streams";
/// Get a new token this long before the current one expires, so that a
/// request never starts with a token that expires while in flight.
const EXPIRY_MARGIN: Duration = Duration::from_secs(60);

pub struct Twitch {
    client: Client,
    client_id: String,
    client_secret: String,
    token: Mutex<Option<Token>>,
}

struct Token {
    access_token: Arc<str>,
    expires_at: Instant,
}

impl Twitch {
    pub fn new(client: Client, client_id: String, client_secret: String) -> Self {
        Self {
            client,
            client_id,
            client_secret,
            token: Mutex::new(None),
        }
    }

    /// Looks the user with the given login up, returning an empty profile if
    /// there is no such user.
    pub async fn user(&self, login: &str) -> Result<Profile> {
        #[derive(Deserialize)]
        struct User {
            display_name: Option<String>,
            profile_image_url: Option<String>,
        }
        let users: Vec<User> = self.helix(USERS_URL, "login", login).await?;
        Ok(match users.into_iter().next() {
            Some(user) => Profile {
                avatar: user.profile_image_url,
                display_name: user.display_name,
            },
            None => Profile::default(),
        })
    }

    /// Whether the channel with the given login is live right now.
    pub async fn is_live(&self, login: &str) -> Result<bool> {
        #[derive(Deserialize)]
        struct Stream {
            #[serde(rename = "type")]
            kind: String,
        }
        let streams: Vec<Stream> = self.helix(STREAMS_URL, "user_login", login).await?;
        Ok(streams.iter().any(|stream| stream.kind == "live"))
    }

    /// The `data` of a Helix endpoint filtered on one query parameter, empty
    /// if Helix rejects the value (it answers 400 to logins that cannot
    /// exist, for example ones with a period in them).
    async fn helix<T: DeserializeOwned>(
        &self,
        url: &str,
        parameter: &str,
        value: &str,
    ) -> Result<Vec<T>> {
        #[derive(Deserialize)]
        struct Body<T> {
            data: Vec<T>,
        }
        let mut token = self.token(None).await?;
        let mut res = self.get(url, parameter, value, &token).await?;
        if res.status() == StatusCode::UNAUTHORIZED {
            info!("Twitch rejected the app access token, getting a new one");
            token = self.token(Some(&token)).await?;
            res = self.get(url, parameter, value, &token).await?;
        }
        if res.status() == StatusCode::BAD_REQUEST {
            return Ok(Vec::new());
        }
        let body: Body<T> = res
            .error_for_status()?
            .json()
            .await
            .context("unexpected answer")?;
        Ok(body.data)
    }

    async fn get(
        &self,
        url: &str,
        parameter: &str,
        value: &str,
        token: &str,
    ) -> Result<reqwest::Response> {
        Ok(self
            .client
            .get(url)
            .query(&[(parameter, value)])
            .bearer_auth(token)
            .header("Client-Id", &self.client_id)
            .send()
            .await?)
    }

    /// The cached app access token, or a new one if there is none, it is
    /// about to expire or Twitch `rejected` it (unless another lookup
    /// already replaced it since it was handed out).
    async fn token(&self, rejected: Option<&str>) -> Result<Arc<str>> {
        let mut token = self.token.lock().await;
        if let Some(current) = token.as_ref()
            && current.expires_at > Instant::now() + EXPIRY_MARGIN
            && rejected.is_none_or(|rejected| &*current.access_token != rejected)
        {
            return Ok(current.access_token.clone());
        }
        let new = self.fetch_token().await?;
        let access_token = new.access_token.clone();
        *token = Some(new);
        Ok(access_token)
    }

    /// The client credentials grant flow.
    async fn fetch_token(&self) -> Result<Token> {
        #[derive(Deserialize)]
        struct Body {
            access_token: String,
            expires_in: u64,
            token_type: String,
        }
        info!("getting a Twitch app access token");
        let body: Body = self
            .client
            .post(TOKEN_URL)
            .form(&[
                ("client_id", self.client_id.as_str()),
                ("client_secret", self.client_secret.as_str()),
                ("grant_type", "client_credentials"),
            ])
            .send()
            .await
            .context("failed to get a Twitch app access token")?
            .error_for_status()
            .context("Twitch refused to issue an app access token")?
            .json()
            .await
            .context("unexpected answer to the Twitch app access token request")?;
        if !body.token_type.eq_ignore_ascii_case("bearer") {
            bail!("unexpected Twitch token type {:?}", body.token_type);
        }
        Ok(Token {
            access_token: body.access_token.into(),
            expires_at: Instant::now() + Duration::from_secs(body.expires_in),
        })
    }
}
