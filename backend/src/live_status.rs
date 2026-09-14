use std::sync::Arc;
use std::time::Duration;

use log::{info, warn};
use tokio::time::Instant;

use crate::kick::Kick;
use crate::store::{Platform, Store};
use crate::twitch::Twitch;

pub struct LiveStatus {
    twitch: Option<Arc<Twitch>>,
    kick: Arc<Kick>,
    spacing: Duration,
    store: Arc<Store>,
}

impl LiveStatus {
    pub fn new(
        twitch: Option<Arc<Twitch>>,
        kick: Arc<Kick>,
        spacing: Duration,
        store: Arc<Store>,
    ) -> Self {
        Self {
            twitch,
            kick,
            spacing,
            store,
        }
    }

    pub async fn run(&self) {
        let mut due = Instant::now() + Duration::from_secs(5 * 60);
        loop {
            tokio::select! {
                _ = tokio::time::sleep_until(due) => {
                    self.check_twitch().await;
                    self.check_kick().await;
                    due = Instant::now() + Duration::from_secs(5 * 60);
                }
                _ = self.store.went_live() => {
                    due = due.min(Instant::now() + Duration::from_secs(60));
                }
            }
        }
    }

    async fn check_twitch(&self) {
        let Some(twitch) = &self.twitch else {
            return;
        };
        let channels = self.store.channels(Platform::Twitch);
        if channels.is_empty() {
            return;
        }
        let logins: Vec<String> = channels
            .iter()
            .map(|channel| channel.name.clone())
            .collect();
        match twitch.live(&logins).await {
            Ok(live) => {
                info!(
                    "{} of the {} listed Twitch channels are live",
                    live.len(),
                    channels.len()
                );
                for channel in &channels {
                    self.store
                        .set_live(channel, live.get(&channel.key().1).cloned());
                }
            }
            Err(error) => {
                warn!("checking which listed Twitch channels are live failed: {error:#}");
            }
        }
    }

    async fn check_kick(&self) {
        let channels = self.store.channels(Platform::Kick);
        let mut live_count = 0;
        for (index, channel) in channels.iter().enumerate() {
            if index > 0 {
                tokio::time::sleep(self.spacing).await;
            }
            match self.kick.live(&channel.name).await {
                Ok(stream) => {
                    live_count += usize::from(stream.is_some());
                    self.store.set_live(channel, stream);
                }
                Err(error) => warn!("checking if {channel} is live failed: {error:#}"),
            }
        }
        if !channels.is_empty() {
            info!(
                "{live_count} of the {} listed Kick channels are live",
                channels.len()
            );
        }
    }
}
