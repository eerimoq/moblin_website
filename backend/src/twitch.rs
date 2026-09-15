use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use log::info;
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use serde::de::DeserializeOwned;
use tokio::sync::Mutex;
use tokio::time::Instant;

use crate::store::{Profile, Stream};

const TOKEN_URL: &str = "https://id.twitch.tv/oauth2/token";
const USERS_URL: &str = "https://api.twitch.tv/helix/users";
const STREAMS_URL: &str = "https://api.twitch.tv/helix/streams";
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

    pub async fn user(&self, login: &str) -> Result<Profile> {
        #[derive(Deserialize)]
        struct User {
            display_name: Option<String>,
            profile_image_url: Option<String>,
        }
        let users: Vec<User> = self.helix(USERS_URL, &[("login", login)]).await?;
        Ok(match users.into_iter().next() {
            Some(user) => Profile {
                avatar: user.profile_image_url,
                display_name: user.display_name,
            },
            None => Profile::default(),
        })
    }

    pub async fn is_live(&self, login: &str) -> Result<bool> {
        let live = self.live(&[login.to_string()]).await?;
        Ok(live.contains_key(&login.to_ascii_lowercase()))
    }

    pub async fn live(&self, logins: &[String]) -> Result<HashMap<String, Stream>> {
        #[derive(Deserialize)]
        struct LiveStream {
            user_login: String,
            #[serde(rename = "type")]
            kind: String,
            game_name: Option<String>,
            title: Option<String>,
            thumbnail_url: Option<String>,
        }
        let logins: Vec<&str> = logins
            .iter()
            .map(String::as_str)
            .filter(|login| login.chars().all(|c| c.is_ascii_alphanumeric() || c == '_'))
            .collect();
        let mut live = HashMap::new();
        for chunk in logins.chunks(100) {
            let mut query = vec![("first", "100")];
            query.extend(chunk.iter().map(|login| ("user_login", *login)));
            let streams: Vec<LiveStream> = self.helix(STREAMS_URL, &query).await?;
            live.extend(
                streams
                    .into_iter()
                    .filter(|stream| stream.kind == "live")
                    .map(|stream| {
                        (
                            stream.user_login.to_ascii_lowercase(),
                            Stream {
                                category: stream.game_name.filter(|name| !name.is_empty()),
                                title: stream.title.filter(|title| !title.is_empty()),
                                thumbnail: stream.thumbnail_url.filter(|url| !url.is_empty()).map(
                                    |url| url.replace("{width}", "640").replace("{height}", "360"),
                                ),
                            },
                        )
                    }),
            );
        }
        Ok(live)
    }

    async fn helix<T: DeserializeOwned>(
        &self,
        url: &str,
        query: &[(&str, &str)],
    ) -> Result<Vec<T>> {
        #[derive(Deserialize)]
        struct Body<T> {
            data: Vec<T>,
        }
        let mut token = self.token(None).await?;
        let mut res = self.get(url, query, &token).await?;
        if res.status() == StatusCode::UNAUTHORIZED {
            info!("Twitch rejected the app access token, getting a new one");
            token = self.token(Some(&token)).await?;
            res = self.get(url, query, &token).await?;
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
        query: &[(&str, &str)],
        token: &str,
    ) -> Result<reqwest::Response> {
        Ok(self
            .client
            .get(url)
            .query(query)
            .bearer_auth(token)
            .header("Client-Id", &self.client_id)
            .send()
            .await?)
    }

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
