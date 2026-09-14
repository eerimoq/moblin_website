use std::sync::Arc;
use std::time::Duration;

use log::{info, warn};
use tokio::time::Instant;

use crate::store::Store;
use crate::twitch::Twitch;

pub struct LiveStatus {
    twitch: Arc<Twitch>,
    store: Arc<Store>,
}

impl LiveStatus {
    pub fn new(twitch: Arc<Twitch>, store: Arc<Store>) -> Self {
        Self { twitch, store }
    }

    pub async fn run(&self) {
        let mut due = Instant::now() + Duration::from_secs(5 * 60);
        loop {
            tokio::select! {
                _ = tokio::time::sleep_until(due) => {
                    self.check().await;
                    due = Instant::now() + Duration::from_secs(5 * 60);
                }
                _ = self.store.went_live() => {
                    due = due.min(Instant::now() + Duration::from_secs(60));
                }
            }
        }
    }

    async fn check(&self) {
        let logins = self.store.twitch_logins();
        if logins.is_empty() {
            return;
        }
        match self.twitch.live(&logins).await {
            Ok(live) => {
                info!(
                    "{} of the {} listed Twitch channels are live",
                    live.len(),
                    logins.len()
                );
                self.store.set_live(&live);
            }
            Err(error) => {
                warn!("checking which listed Twitch channels are live failed: {error:#}");
            }
        }
    }
}
