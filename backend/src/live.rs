//! Whether the Twitch channel shown on the website is live, asked from Twitch
//! at most once per `REFRESH`, no matter how many visitors ask.

use std::sync::Arc;
use std::time::Duration;

use anyhow::{Result, bail};
use tokio::sync::Mutex;
use tokio::time::Instant;

use crate::twitch::Twitch;

const REFRESH: Duration = Duration::from_secs(60);

pub struct Live {
    twitch: Option<Arc<Twitch>>,
    login: String,
    cached: Mutex<Option<Cached>>,
}

struct Cached {
    live: bool,
    checked: Instant,
}

impl Live {
    pub fn new(twitch: Option<Arc<Twitch>>, login: String) -> Self {
        Self {
            twitch,
            login,
            cached: Mutex::new(None),
        }
    }

    pub fn login(&self) -> &str {
        &self.login
    }

    /// False without Twitch credentials, when `is_live` always fails.
    pub fn enabled(&self) -> bool {
        self.twitch.is_some()
    }

    /// Whether the channel is live, as of at most `REFRESH` ago.
    pub async fn is_live(&self) -> Result<bool> {
        let Some(twitch) = &self.twitch else {
            bail!("no Twitch client ID and secret");
        };
        // Held while asking Twitch, so that visitors arriving in the meantime
        // wait for that answer instead of asking Twitch too.
        let mut cached = self.cached.lock().await;
        if let Some(current) = cached.as_ref()
            && current.checked.elapsed() < REFRESH
        {
            return Ok(current.live);
        }
        let live = twitch.is_live(&self.login).await?;
        *cached = Some(Cached {
            live,
            checked: Instant::now(),
        });
        Ok(live)
    }
}
