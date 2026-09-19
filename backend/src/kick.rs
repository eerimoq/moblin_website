use anyhow::{Context, Result};
use reqwest::{Client, StatusCode};
use serde::Deserialize;
use serde::de::DeserializeOwned;

use crate::store::{Profile, Stream};

#[derive(Deserialize)]
struct Channel {
    user: Option<User>,
}

#[derive(Deserialize)]
struct User {
    username: Option<String>,
    profile_pic: Option<String>,
}

#[derive(Deserialize)]
struct LivestreamBody {
    data: Option<Livestream>,
}

#[derive(Deserialize)]
struct Livestream {
    session_title: Option<String>,
    category: Option<Category>,
    thumbnail: Option<Thumbnail>,
}

#[derive(Deserialize)]
struct Thumbnail {
    src: Option<String>,
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
            match self
                .get::<Channel>(&format!("https://kick.com/api/v2/channels/{}", slug(name)))
                .await?
                .and_then(|channel| channel.user)
            {
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
            .get::<LivestreamBody>(&format!(
                "https://kick.com/api/v2/channels/{}/livestream",
                slug(name)
            ))
            .await?
            .and_then(|body| body.data)
            .map(|livestream| Stream {
                category: livestream.category.map(|category| category.name),
                title: livestream.session_title.filter(|title| !title.is_empty()),
                thumbnail: livestream
                    .thumbnail
                    .and_then(|thumbnail| thumbnail.src)
                    .filter(|url| !url.is_empty()),
            }))
    }

    async fn get<T: DeserializeOwned>(&self, url: &str) -> Result<Option<T>> {
        let res = self.client.get(url).send().await?;
        if res.status() == StatusCode::NOT_FOUND {
            return Ok(None);
        }
        let body = res
            .error_for_status()?
            .json()
            .await
            .context("unexpected answer")?;
        Ok(Some(body))
    }
}

fn slug(name: &str) -> String {
    name.replace('_', "-")
}
