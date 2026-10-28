use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use anyhow::Result;
use log::warn;
use reqwest::Client;
use serde::{Deserialize, Serialize};

use crate::store::{Platform, Store, Streamer};

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Page {
    pub url: String,
    pub icon: Option<String>,
}

pub struct Cloud {
    client: Client,
    url: String,
    store: Arc<Store>,
    pages: Mutex<HashMap<String, Page>>,
}

impl Cloud {
    pub fn new(client: Client, url: String, store: Arc<Store>) -> Self {
        Self {
            client,
            url,
            store,
            pages: Mutex::default(),
        }
    }

    pub fn page(&self, streamer: &Streamer) -> Option<Page> {
        let pages = self.pages.lock().unwrap();
        logins(streamer).find_map(|login| pages.get(&login).cloned())
    }

    pub async fn run(&self) {
        loop {
            if let Err(error) = self.refresh().await {
                warn!("looking the tip pages up at {} failed: {error:#}", self.url);
            }
            tokio::time::sleep(Duration::from_secs(60)).await;
        }
    }

    async fn refresh(&self) -> Result<()> {
        let logins: Vec<String> = self.store.streamers().iter().flat_map(logins).collect();
        let pages = if logins.is_empty() {
            HashMap::new()
        } else {
            self.client
                .get(format!("{}/pages/addresses", self.url))
                .query(&[("logins", logins.join(","))])
                .send()
                .await?
                .error_for_status()?
                .json()
                .await?
        };
        *self.pages.lock().unwrap() = pages;
        Ok(())
    }
}

fn logins(streamer: &Streamer) -> impl Iterator<Item = String> + '_ {
    streamer.channels.iter().filter_map(|listed| {
        let name = listed.channel.name.to_lowercase();
        match listed.channel.platform {
            Platform::Twitch => Some(format!("twitch:{name}")),
            Platform::Kick => Some(format!("kick:{}", name.replace('_', "-"))),
            Platform::YouTube => None,
        }
    })
}

#[cfg(test)]
mod tests {
    use axum::Router;
    use axum::extract::Query;
    use axum::routing::get;
    use serde_json::{Value, json};
    use tokio::net::TcpListener;

    use super::*;
    use crate::database::Database;
    use crate::store::Channel;

    async fn fake_cloud() -> String {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap();
        let router = Router::new().route(
            "/pages/addresses",
            get(|Query(query): Query<HashMap<String, String>>| async move {
                let mut pages = serde_json::Map::new();
                for login in query["logins"].split(',') {
                    let icon = match login {
                        "kick:anna-irl" => json!("http://cloud/icons/king"),
                        "twitch:bob" => Value::Null,
                        _ => continue,
                    };
                    let (platform, login) = login.split_once(':').unwrap();
                    pages.insert(
                        format!("{platform}:{login}"),
                        json!({"url": format!("http://cloud/{platform}/{login}"), "icon": icon}),
                    );
                }
                axum::Json(Value::Object(pages))
            }),
        );
        tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
        format!("http://{address}")
    }

    fn channel(platform: Platform, name: &str) -> Channel {
        Channel {
            platform,
            name: name.to_string(),
        }
    }

    #[tokio::test]
    async fn the_first_twitch_or_kick_channel_with_a_page_is_linked() {
        let store = Arc::new(Store::new(6, Database::memory()));
        store.streamer_live(vec![
            channel(Platform::YouTube, "anna"),
            channel(Platform::Twitch, "anna"),
            channel(Platform::Kick, "Anna_IRL"),
        ]);
        store.streamer_live(vec![
            channel(Platform::Twitch, "Bob"),
            channel(Platform::Kick, "anna-irl"),
        ]);
        store.streamer_live(vec![channel(Platform::Twitch, "carl")]);
        let cloud = Cloud::new(Client::new(), fake_cloud().await, store.clone());
        cloud.refresh().await.unwrap();
        let pages: Vec<Option<Page>> = store
            .streamers()
            .iter()
            .map(|streamer| cloud.page(streamer))
            .collect();
        assert_eq!(
            pages,
            [
                None,
                Some(Page {
                    url: "http://cloud/twitch/bob".to_string(),
                    icon: None,
                }),
                Some(Page {
                    url: "http://cloud/kick/anna-irl".to_string(),
                    icon: Some("http://cloud/icons/king".to_string()),
                }),
            ]
        );
    }

    #[tokio::test]
    async fn pages_are_kept_while_the_cloud_does_not_answer() {
        let store = Arc::new(Store::new(6, Database::memory()));
        store.streamer_live(vec![channel(Platform::Twitch, "bob")]);
        let cloud = Cloud::new(Client::new(), fake_cloud().await, store.clone());
        cloud.refresh().await.unwrap();
        let cloud = Cloud {
            url: "http://127.0.0.1:1".to_string(),
            ..cloud
        };
        assert!(cloud.refresh().await.is_err());
        assert!(cloud.page(&store.streamers()[0]).is_some());
    }
}
