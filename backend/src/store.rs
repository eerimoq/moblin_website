use std::fmt;
use std::sync::Mutex;

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize};

const MAX_CHANNELS: usize = 5;
const MAX_CHANNEL_LENGTH: usize = 40;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Platform {
    Twitch,
    YouTube,
    Kick,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Channel {
    pub platform: Platform,
    /// The streamer's handle on that platform, which usually differs between platforms.
    pub channel: String,
}

impl Channel {
    fn validate(&self) -> Result<()> {
        // Handles become URL path segments on the website, so keep them plain.
        let name = &self.channel;
        let plain = name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | '.'));
        if name.is_empty() || name.len() > MAX_CHANNEL_LENGTH || !plain {
            bail!("{name:?} is not a valid {:?} channel", self.platform);
        }
        Ok(())
    }

    fn is(&self, other: &Channel) -> bool {
        self.platform == other.platform && self.channel.eq_ignore_ascii_case(&other.channel)
    }
}

impl fmt::Display for Channel {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}/{}", self.platform, self.channel)
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub struct Streamer {
    pub channels: Vec<Channel>,
}

impl Streamer {
    /// Sharing any channel makes it the same streamer.
    fn is(&self, other: &Streamer) -> bool {
        self.channels
            .iter()
            .any(|mine| other.channels.iter().any(|theirs| mine.is(theirs)))
    }
}

#[derive(Clone, Debug, Deserialize)]
pub struct WentLive {
    pub channels: Vec<Channel>,
}

impl WentLive {
    pub fn validate(&self) -> Result<()> {
        if self.channels.is_empty() {
            bail!("at least one channel");
        }
        if self.channels.len() > MAX_CHANNELS {
            bail!("at most {MAX_CHANNELS} channels");
        }
        self.channels.iter().try_for_each(Channel::validate)
    }
}

pub struct Store {
    max_streamers: usize,
    streamers: Mutex<Vec<Streamer>>,
}

impl Store {
    pub fn new(max_streamers: usize) -> Self {
        Self {
            max_streamers,
            streamers: Mutex::new(Vec::new()),
        }
    }

    /// Newcomers first; a streamer already listed keeps its position.
    pub fn streamers(&self) -> Vec<Streamer> {
        self.streamers.lock().unwrap().clone()
    }

    /// Records a streamer going live. The channels must already be validated.
    pub fn went_live(&self, channels: Vec<Channel>) {
        let streamer = Streamer { channels };
        let mut streamers = self.streamers.lock().unwrap();
        // A streamer sharing any channel with the new one is the same
        // streamer, and keeps its position. Newcomers go first.
        let position = streamers.iter().position(|other| other.is(&streamer));
        streamers.retain(|other| !other.is(&streamer));
        match position {
            Some(index) => streamers.insert(index, streamer),
            None => {
                streamers.insert(0, streamer);
                streamers.truncate(self.max_streamers);
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn twitch(handle: &str) -> Vec<Channel> {
        vec![Channel {
            platform: Platform::Twitch,
            channel: handle.to_string(),
        }]
    }

    fn handles(store: &Store) -> Vec<String> {
        store
            .streamers()
            .into_iter()
            .map(|streamer| streamer.channels[0].channel.clone())
            .collect()
    }

    #[test]
    fn newcomers_first_and_one_entry_per_streamer() {
        let store = Store::new(24);
        store.went_live(twitch("anna"));
        store.went_live(twitch("bob"));
        store.went_live(twitch("Anna"));
        assert_eq!(handles(&store), ["bob", "Anna"]);
        store.went_live(twitch("carl"));
        store.went_live(twitch("bob"));
        assert_eq!(handles(&store), ["carl", "bob", "Anna"]);
    }

    #[test]
    fn sharing_a_channel_means_same_streamer() {
        let store = Store::new(24);
        store.went_live(twitch("anna"));
        let mut channels = twitch("anna");
        channels.push(Channel {
            platform: Platform::Kick,
            channel: "anna_irl".into(),
        });
        store.went_live(channels);
        let streamers = store.streamers();
        assert_eq!(handles(&store), ["anna"]);
        assert_eq!(streamers[0].channels.len(), 2);
    }

    #[test]
    fn list_is_capped() {
        let store = Store::new(2);
        for handle in ["a", "b", "c"] {
            store.went_live(twitch(handle));
        }
        assert_eq!(handles(&store), ["c", "b"]);
    }

    #[test]
    fn rejects_bad_requests() {
        let request = |channels: Vec<Channel>| WentLive { channels }.validate();
        let twitch = |handle: &str| Channel {
            platform: Platform::Twitch,
            channel: handle.into(),
        };
        assert!(request(vec![]).is_err());
        assert!(request((0..6).map(|i| twitch(&format!("anna{i}"))).collect()).is_err());
        for handle in [
            "",
            "anna/../x",
            "anna banana",
            "https://twitch.tv/anna",
            &"x".repeat(41),
        ] {
            assert!(request(vec![twitch(handle)]).is_err(), "{handle:?}");
        }
        assert!(request(vec![twitch("anna")]).is_ok());
    }
}
