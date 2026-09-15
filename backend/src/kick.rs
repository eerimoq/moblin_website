use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use serde::Deserialize;

use crate::store::{Profile, Stream};

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
    session_title: Option<String>,
    #[serde(default)]
    categories: Vec<Category>,
    thumbnail: Option<Thumbnail>,
}

#[derive(Deserialize)]
struct Thumbnail {
    url: Option<String>,
}

#[derive(Deserialize)]
struct Category {
    name: String,
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

    pub async fn live(&self, name: &str) -> Result<Option<Stream>> {
        Ok(self
            .channel(name)
            .await?
            .and_then(|channel| channel.livestream)
            .filter(|livestream| livestream.is_live)
            .map(|livestream| Stream {
                category: livestream
                    .categories
                    .into_iter()
                    .next()
                    .map(|category| category.name),
                title: livestream.session_title.filter(|title| !title.is_empty()),
                thumbnail: livestream
                    .thumbnail
                    .and_then(|thumbnail| thumbnail.url)
                    .filter(|url| !url.is_empty()),
            }))
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
