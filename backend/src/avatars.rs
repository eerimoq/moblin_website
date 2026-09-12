//! Profile images of the listed channels, looked up on their platforms by the
//! backend rather than by every visitor's browser: the lookups are slow and
//! flaky, and the third parties involved rate limit each caller. A channel
//! is looked up once, and only lookups that fail are tried again.
//!
//! The platforms are not hammered: a single worker makes one request at a
//! time with a pause in between, and a failed lookup is retried after an
//! ever longer delay.

use std::collections::{HashMap, HashSet};
use std::sync::Mutex;
use std::time::Duration;

use anyhow::{Context, Result, bail};
use log::{info, warn};
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use tokio::sync::Notify;
use tokio::time::Instant;

use crate::store::{Channel, Platform};

const TIMEOUT: Duration = Duration::from_secs(15);
/// The delay before the first retry of a failed lookup, doubled every time
/// it fails again, up to `RETRY_MAX_DELAY`.
const RETRY_DELAY: Duration = Duration::from_secs(30);
const RETRY_MAX_DELAY: Duration = Duration::from_secs(60 * 60);

/// Channels are matched regardless of case.
type Key = (Platform, String);

fn key(channel: &Channel) -> Key {
    (channel.platform, channel.channel.to_ascii_lowercase())
}

/// A lookup yet to succeed.
struct Pending {
    channel: Channel,
    /// When the next attempt may start.
    due: Instant,
    failures: u32,
}

#[derive(Default)]
struct State {
    /// The outcome of every completed lookup: the image URL, or `None`
    /// for a channel without one.
    done: HashMap<Key, Option<String>>,
    /// Lookups requested but not completed, including ones that failed
    /// and are waiting to be retried.
    queue: HashMap<Key, Pending>,
}

pub struct Avatars {
    client: Client,
    /// The pause between two platform requests.
    spacing: Duration,
    state: Mutex<State>,
    /// Pinged whenever the queue gets a new entry, for `run`.
    wake: Notify,
}

impl Avatars {
    pub fn new(spacing: Duration) -> Self {
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
            state: Mutex::new(State::default()),
            wake: Notify::new(),
        }
    }

    /// The channel's profile image URL, if a lookup has found one.
    pub fn get(&self, channel: &Channel) -> Option<String> {
        self.state
            .lock()
            .unwrap()
            .done
            .get(&key(channel))
            .cloned()
            .flatten()
    }

    /// Whether the channel's profile image has been looked up, whether or
    /// not it has one. A lookup that failed does not count.
    #[cfg(test)]
    fn looked_up(&self, channel: &Channel) -> bool {
        self.state.lock().unwrap().done.contains_key(&key(channel))
    }

    #[cfg(test)]
    fn queued(&self, channel: &Channel) -> bool {
        self.state.lock().unwrap().queue.contains_key(&key(channel))
    }

    /// Queues the channel for a lookup, unless it has been looked up or
    /// already waits for one. `run` does the actual work.
    pub fn request(&self, channel: &Channel) {
        let mut state = self.state.lock().unwrap();
        let key = key(channel);
        if state.done.contains_key(&key) || state.queue.contains_key(&key) {
            return;
        }
        state.queue.insert(
            key,
            Pending {
                channel: channel.clone(),
                due: Instant::now(),
                failures: 0,
            },
        );
        self.wake.notify_one();
    }

    /// Forgets every channel but these, so that the cache does not grow
    /// with every streamer that ever went live, and nothing is looked up
    /// for streamers no longer listed.
    pub fn retain<'a>(&self, channels: impl IntoIterator<Item = &'a Channel>) {
        let keep: HashSet<Key> = channels.into_iter().map(key).collect();
        let mut state = self.state.lock().unwrap();
        state.done.retain(|key, _| keep.contains(key));
        state.queue.retain(|key, _| keep.contains(key));
    }

    /// Looks the queued channels up, one at a time, `spacing` apart. Never
    /// returns, so spawn it.
    pub async fn run(&self) {
        loop {
            let next = {
                let state = self.state.lock().unwrap();
                state
                    .queue
                    .values()
                    .min_by_key(|pending| pending.due)
                    .map(|pending| (pending.channel.clone(), pending.due))
            };
            let Some((channel, due)) = next else {
                self.wake.notified().await;
                continue;
            };
            let now = Instant::now();
            if due > now {
                // A newly requested channel may be due sooner.
                tokio::select! {
                    _ = tokio::time::sleep(due - now) => {}
                    _ = self.wake.notified() => {}
                }
                continue;
            }
            info!("looking up the avatar of {channel}");
            let result = self.resolve(&channel).await;
            self.record(&channel, result);
            tokio::time::sleep(self.spacing).await;
        }
    }

    fn record(&self, channel: &Channel, result: Result<Option<String>>) {
        let mut state = self.state.lock().unwrap();
        let key = key(channel);
        // Pruned while being looked up, so no longer of interest.
        let Some(pending) = state.queue.get_mut(&key) else {
            return;
        };
        match result {
            Ok(url) => {
                match &url {
                    Some(url) => info!("the avatar of {channel} is {url}"),
                    None => info!("{channel} has no avatar"),
                }
                state.queue.remove(&key);
                state.done.insert(key, url);
            }
            Err(error) => {
                pending.failures += 1;
                let delay = RETRY_DELAY
                    .saturating_mul(2u32.saturating_pow(pending.failures - 1))
                    .min(RETRY_MAX_DELAY);
                pending.due = Instant::now() + delay;
                warn!(
                    "looking up the avatar of {channel} failed, retrying in {}s: {error:#}",
                    delay.as_secs()
                );
            }
        }
    }

    /// `Ok(None)` when the channel does not exist or has no image, `Err`
    /// when the platform could not be asked.
    async fn resolve(&self, channel: &Channel) -> Result<Option<String>> {
        // Validated to be plain ASCII, so it needs no escaping in a URL.
        let name = &channel.channel;
        match channel.platform {
            Platform::Twitch => self.twitch(name).await,
            Platform::YouTube => self.youtube(name).await,
            Platform::Kick => self.kick(name).await,
        }
    }

    /// Twitch's own API needs a secret, so this goes through the public
    /// decapi.me proxy, which answers with the image URL, or with
    /// "User not found: ..." and status 200.
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

    /// The channel page's Open Graph image is the profile image. Should the
    /// page not have one, the public unavatar.io proxy is asked instead. It
    /// allows only a few lookups a day, so it is not the first choice.
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

/// The page's Open Graph preview image, from its `<meta property="og:image">`.
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

    fn twitch(handle: &str) -> Channel {
        Channel {
            platform: Platform::Twitch,
            channel: handle.to_string(),
        }
    }

    fn avatars() -> Avatars {
        Avatars::new(Duration::ZERO)
    }

    fn due_in(avatars: &Avatars, channel: &Channel) -> Duration {
        let state = avatars.state.lock().unwrap();
        state.queue[&key(channel)]
            .due
            .saturating_duration_since(Instant::now())
    }

    #[test]
    fn a_channel_is_looked_up_once() {
        let avatars = avatars();
        let anna = twitch("anna");
        avatars.request(&anna);
        assert!(avatars.queued(&anna));
        assert!(!avatars.looked_up(&anna));
        assert_eq!(due_in(&avatars, &anna), Duration::ZERO);
        avatars.record(&anna, Ok(Some("https://a/1.png".into())));
        assert!(!avatars.queued(&anna));
        assert!(avatars.looked_up(&twitch("Anna")));
        assert_eq!(avatars.get(&anna).as_deref(), Some("https://a/1.png"));
        avatars.request(&twitch("Anna"));
        assert!(!avatars.queued(&anna));
    }

    #[test]
    fn no_avatar_is_an_answer_too() {
        let avatars = avatars();
        let bob = twitch("bob");
        avatars.request(&bob);
        avatars.record(&bob, Ok(None));
        assert!(avatars.looked_up(&bob));
        assert_eq!(avatars.get(&bob), None);
    }

    #[test]
    fn failed_lookups_are_retried_ever_later() {
        let avatars = avatars();
        let anna = twitch("anna");
        avatars.request(&anna);
        let mut previous = Duration::ZERO;
        for _ in 0..10 {
            avatars.record(&anna, Err(anyhow::anyhow!("down")));
            assert!(avatars.queued(&anna));
            assert!(!avatars.looked_up(&anna));
            let delay = due_in(&avatars, &anna);
            assert!(delay > previous || delay >= RETRY_MAX_DELAY - Duration::from_secs(1));
            assert!(delay <= RETRY_MAX_DELAY);
            previous = delay;
        }
        assert!(previous >= RETRY_MAX_DELAY - Duration::from_secs(1));
        // Requesting it again does not hurry the retry.
        avatars.request(&anna);
        assert!(due_in(&avatars, &anna) >= RETRY_MAX_DELAY - Duration::from_secs(1));
    }

    #[test]
    fn retains_only_the_listed_channels() {
        let avatars = avatars();
        let anna = twitch("anna");
        let bob = twitch("bob");
        let carl = twitch("carl");
        avatars.request(&anna);
        avatars.record(&anna, Ok(Some("https://a/1.png".into())));
        avatars.request(&bob);
        avatars.request(&carl);
        avatars.retain([&twitch("Anna"), &bob]);
        assert!(avatars.looked_up(&anna));
        assert!(avatars.queued(&bob));
        assert!(!avatars.queued(&carl));
        // A lookup finishing after the channel was pruned is discarded.
        avatars.record(&carl, Ok(Some("https://c/1.png".into())));
        assert!(!avatars.looked_up(&carl));
        avatars.retain([]);
        assert!(!avatars.looked_up(&anna));
        assert!(!avatars.queued(&bob));
    }

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
