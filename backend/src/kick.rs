use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use serde::Deserialize;

use crate::store::Profile;

#[derive(Deserialize)]
struct Channel {
    user: Option<User>,
    livestream: Option<Livestream>,
}

#[derive(Deserialize)]
struct User {
    username: Option<String>,
    profile_pic: Option<String>,
}

#[derive(Deserialize)]
struct Livestream {
    is_live: bool,
}

pub struct Kick {
    client: Client,
}

impl Kick {
    pub fn new(client: Client) -> Self {
        Self { client }
    }

    pub async fn user(&self, name: &str) -> Result<Profile> {
        Ok(
            match self.channel(name).await?.and_then(|channel| channel.user) {
                Some(user) => Profile {
                    avatar: user.profile_pic,
                    display_name: user.username,
                },
                None => Profile::default(),
            },
        )
    }

    pub async fn is_live(&self, name: &str) -> Result<bool> {
        Ok(self
            .channel(name)
            .await?
            .and_then(|channel| channel.livestream)
            .is_some_and(|livestream| livestream.is_live))
    }

    async fn channel(&self, name: &str) -> Result<Option<Channel>> {
        let res = self
            .client
            .get(format!("https://kick.com/api/v2/channels/{name}"))
            .send()
            .await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        let channel = res
            .error_for_status()?
            .json()
            .await
            .context("unexpected answer")?;
        Ok(Some(channel))
    }
}
