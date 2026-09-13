use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use log::{info, warn};
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use tokio::time::Instant;

use crate::store::{Channel, Platform, Store};

const TIMEOUT: Duration = Duration::from_secs(15);

pub struct Avatars {
    client: Client,
    spacing: Duration,
    store: Arc<Store>,
}

impl Avatars {
    pub fn new(spacing: Duration, store: Arc<Store>) -> Self {
        let client = Client::builder()
            .user_agent(concat!(
                env!("CARGO_PKG_NAME"),
                "/",
                env!("CARGO_PKG_VERSION"),
                " (+https://moblin.app)"
            ))
            .timeout(TIMEOUT)
            .build()
            .expect("a client without a proxy or TLS config always builds");
        Self {
            client,
            spacing,
            store,
        }
    }

    pub async fn run(&self) {
        loop {
            let Some((channel, due)) = self.store.next_avatar_lookup() else {
                self.store.lookup_pending().await;
                continue;
            };
            let now = Instant::now();
            if due > now {
                tokio::select! {
                    _ = tokio::time::sleep(due - now) => {}
                    _ = self.store.lookup_pending() => {}
                }
                continue;
            }
            info!("looking up the avatar of {channel}");
            match self.resolve(&channel).await {
                Ok(url) => {
                    match &url {
                        Some(url) => info!("the avatar of {channel} is {url}"),
                        None => info!("{channel} has no avatar"),
                    }
                    self.store.avatar_looked_up(&channel, url);
                }
                Err(error) => {
                    if let Some(delay) = self.store.avatar_lookup_failed(&channel) {
                        warn!(
                            "looking up the avatar of {channel} failed, retrying in {}s: {error:#}",
                            delay.as_secs()
                        );
                    }
                }
            }
            tokio::time::sleep(self.spacing).await;
        }
    }

    async fn resolve(&self, channel: &Channel) -> Result<Option<String>> {
        let name = &channel.name;
        match channel.platform {
            Platform::Twitch => self.twitch(name).await,
            Platform::YouTube => self.youtube(name).await,
            Platform::Kick => self.kick(name).await,
        }
    }

    async fn twitch(&self, name: &str) -> Result<Option<String>> {
        let text = self
            .client
            .get(format!("https://decapi.me/twitch/avatar/{name}"))
            .send()
            .await?
            .error_for_status()?
            .text()
            .await?;
        let text = text.trim();
        if text.starts_with("https://") {
            Ok(Some(text.to_string()))
        } else if text.starts_with("User not found") {
            Ok(None)
        } else {
            bail!("unexpected answer {text:?}")
        }
    }

    async fn youtube(&self, name: &str) -> Result<Option<String>> {
        let res = self
            .client
            .get(format!("https://www.youtube.com/@{name}"))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        let html = res.error_for_status()?.text().await?;
        if let Some(url) = og_image(&html) {
            return Ok(Some(url));
        }
        info!("no og:image in the YouTube channel page of {name}, asking unavatar.io");
        #[derive(Deserialize)]
        struct Body {
            url: Option<String>,
        }
        let res = self
            .client
            .get(format!(
                "https://unavatar.io/youtube/@{name}?json&fallback=false"
            ))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        let body: Body = res.error_for_status()?.json().await?;
        Ok(body.url)
    }

    async fn kick(&self, name: &str) -> Result<Option<String>> {
        #[derive(Deserialize)]
        struct Body {
            user: Option<User>,
        }
        #[derive(Deserialize)]
        struct User {
            profile_pic: Option<String>,
        }
        let res = self
            .client
            .get(format!("https://kick.com/api/v2/channels/{name}"))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        let body: Body = res
            .error_for_status()?
            .json()
            .await
            .context("unexpected answer")?;
        Ok(body.user.and_then(|user| user.profile_pic))
    }
}

fn og_image(html: &str) -> Option<String> {
    html.match_indices("<meta").find_map(|(start, _)| {
        let tag = &html[start..start + html[start..].find('>')?];
        if !["property=\"og:image\"", "property='og:image'"]
            .iter()
            .any(|property| tag.contains(property))
        {
            return None;
        }
        let value = tag.split_once("content=")?.1;
        let quote = value.chars().next()?;
        if quote != '"' && quote != '\'' {
            return None;
        }
        let url = value[1..].split(quote).next()?.replace("&amp;", "&");
        url.starts_with("https://").then_some(url)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_the_og_image() {
        let html = r#"<html><head>
            <meta property="og:title" content="Anna">
            <meta property="og:image:width" content="900">
            <meta name="x" content="https://not.this/one.png">
            <meta property="og:image" content="https://a/pic.png?x=1&amp;y=2"/>
            <meta property="og:image" content="https://a/second.png">
            </head></html>"#;
        assert_eq!(og_image(html).as_deref(), Some("https://a/pic.png?x=1&y=2"));
        let single_quoted = "<meta property='og:image' content='https://a/pic.jpg'>";
        assert_eq!(
            og_image(single_quoted).as_deref(),
            Some("https://a/pic.jpg")
        );
        assert_eq!(og_image("<meta property=\"og:title\" content=\"x\">"), None);
        assert_eq!(
            og_image("<meta property=\"og:image\" content=\"/rel.png\">"),
            None
        );
        assert_eq!(og_image(""), None);
    }
}
