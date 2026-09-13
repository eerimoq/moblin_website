use std::sync::Arc;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use log::{info, warn};
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use tokio::time::Instant;

use crate::store::{Channel, Platform, Profile, Store};

const TIMEOUT: Duration = Duration::from_secs(15);

pub struct Profiles {
    client: Client,
    spacing: Duration,
    store: Arc<Store>,
}

impl Profiles {
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
            let Some((channel, due)) = self.store.next_lookup() else {
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
            info!("looking up the profile of {channel}");
            match self.resolve(&channel).await {
                Ok(profile) => {
                    info!(
                        "{channel} is {} with avatar {}",
                        profile.display_name.as_deref().unwrap_or("unnamed"),
                        profile.avatar.as_deref().unwrap_or("missing")
                    );
                    self.store.looked_up(&channel, profile);
                }
                Err(error) => {
                    if let Some(delay) = self.store.lookup_failed(&channel) {
                        warn!(
                            "looking up the profile of {channel} failed, retrying in {}s: {error:#}",
                            delay.as_secs()
                        );
                    }
                }
            }
            tokio::time::sleep(self.spacing).await;
        }
    }

    async fn resolve(&self, channel: &Channel) -> Result<Profile> {
        let name = &channel.name;
        match channel.platform {
            Platform::Twitch => self.twitch(name).await,
            Platform::YouTube => self.youtube(name).await,
            Platform::Kick => self.kick(name).await,
        }
    }

    async fn twitch(&self, name: &str) -> Result<Profile> {
        let text = self
            .client
            .get(format!("https://decapi.me/twitch/avatar/{name}"))
            .send()
            .await?
            .error_for_status()?
            .text()
            .await?;
        let text = text.trim();
        let avatar = if text.starts_with("https://") {
            Some(text.to_string())
        } else if text.starts_with("User not found") {
            None
        } else {
            bail!("unexpected answer {text:?}")
        };
        Ok(Profile {
            avatar,
            display_name: None,
        })
    }

    async fn youtube(&self, name: &str) -> Result<Profile> {
        let res = self
            .client
            .get(format!("https://www.youtube.com/@{name}"))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(Profile::default());
        }
        let html = res.error_for_status()?.text().await?;
        let display_name = og(&html, "title").filter(|title| !title.is_empty());
        if let Some(url) = og(&html, "image").filter(|url| url.starts_with("https://")) {
            return Ok(Profile {
                avatar: Some(url),
                display_name,
            });
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
            return Ok(Profile::default());
        }
        let body: Body = res.error_for_status()?.json().await?;
        Ok(Profile {
            avatar: body.url,
            display_name,
        })
    }

    async fn kick(&self, name: &str) -> Result<Profile> {
        #[derive(Deserialize)]
        struct Body {
            user: Option<User>,
        }
        #[derive(Deserialize)]
        struct User {
            username: Option<String>,
            profile_pic: Option<String>,
        }
        let res = self
            .client
            .get(format!("https://kick.com/api/v2/channels/{name}"))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(Profile::default());
        }
        let body: Body = res
            .error_for_status()?
            .json()
            .await
            .context("unexpected answer")?;
        Ok(match body.user {
            Some(user) => Profile {
                avatar: user.profile_pic,
                display_name: user.username,
            },
            None => Profile::default(),
        })
    }
}

fn og(html: &str, name: &str) -> Option<String> {
    let properties = [
        format!("property=\"og:{name}\""),
        format!("property='og:{name}'"),
    ];
    html.match_indices("<meta").find_map(|(start, _)| {
        let tag = &html[start..start + html[start..].find('>')?];
        if !properties.iter().any(|property| tag.contains(property)) {
            return None;
        }
        let value = tag.split_once("content=")?.1;
        let quote = value.chars().next()?;
        if quote != '"' && quote != '\'' {
            return None;
        }
        Some(unescape(value[1..].split(quote).next()?))
    })
}

fn unescape(text: &str) -> String {
    let mut out = String::with_capacity(text.len());
    let mut rest = text;
    while let Some((before, after)) = rest.split_once('&') {
        out.push_str(before);
        let Some((reference, after_reference)) = after.split_once(';') else {
            out.push('&');
            rest = after;
            continue;
        };
        let decoded = match reference {
            "amp" => Some('&'),
            "lt" => Some('<'),
            "gt" => Some('>'),
            "quot" => Some('"'),
            "apos" => Some('\''),
            _ => reference
                .strip_prefix('#')
                .and_then(|number| match number.strip_prefix(['x', 'X']) {
                    Some(hex) => u32::from_str_radix(hex, 16).ok(),
                    None => number.parse().ok(),
                })
                .and_then(char::from_u32),
        };
        match decoded {
            Some(c) => {
                out.push(c);
                rest = after_reference;
            }
            None => {
                out.push('&');
                rest = after;
            }
        }
    }
    out.push_str(rest);
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn finds_open_graph_properties() {
        let html = r#"<html><head>
            <meta property="og:title" content="Anna &amp; Bob&#39;s &quot;IRL&quot;">
            <meta property="og:image:width" content="900">
            <meta name="x" content="https://not.this/one.png">
            <meta property="og:image" content="https://a/pic.png?x=1&amp;y=2"/>
            <meta property="og:image" content="https://a/second.png">
            </head></html>"#;
        assert_eq!(
            og(html, "image").as_deref(),
            Some("https://a/pic.png?x=1&y=2")
        );
        assert_eq!(og(html, "title").as_deref(), Some("Anna & Bob's \"IRL\""));
        let single_quoted = "<meta property='og:image' content='https://a/pic.jpg'>";
        assert_eq!(
            og(single_quoted, "image").as_deref(),
            Some("https://a/pic.jpg")
        );
        assert_eq!(
            og("<meta property=\"og:title\" content=\"x\">", "image"),
            None
        );
        assert_eq!(og("", "title"), None);
    }

    #[test]
    fn unescapes_character_references() {
        assert_eq!(unescape("plain"), "plain");
        assert_eq!(
            unescape("a &amp; b &lt;c&gt; &quot;d&quot; &apos;e&apos;"),
            "a & b <c> \"d\" 'e'"
        );
        assert_eq!(unescape("&#39;&#x1F4F7;&#X41;"), "'📷A");
        assert_eq!(
            unescape("&bogus; & &#; &#xZZ; &amp"),
            "&bogus; & &#; &#xZZ; &amp"
        );
    }
}
