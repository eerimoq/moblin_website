use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;

use anyhow::{Context, Result, bail};
use chrono::{DateTime, Duration, Utc};
use serde::{Deserialize, Serialize};

const MAX_CHANNELS: usize = 5;
const MAX_CHANNEL_LENGTH: usize = 40;

#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
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

/// Posted by Moblin when a stream starts.
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

#[derive(Clone, Debug, Serialize, Deserialize)]
struct Entry {
    #[serde(flatten)]
    streamer: Streamer,
    last_live_at: DateTime<Utc>,
}

/// The streamer list, kept in memory and mirrored to a JSON file on every change.
pub struct Store {
    path: PathBuf,
    retention: Duration,
    max_streamers: usize,
    entries: Mutex<Vec<Entry>>,
}

impl Store {
    pub fn open(path: PathBuf, retention_days: u32, max_streamers: usize) -> Result<Self> {
        let entries = if path.exists() {
            let json = fs::read_to_string(&path)
                .with_context(|| format!("failed to read {}", path.display()))?;
            serde_json::from_str(&json)
                .with_context(|| format!("failed to parse {}", path.display()))?
        } else {
            Vec::new()
        };
        Ok(Self {
            path,
            retention: Duration::days(i64::from(retention_days)),
            max_streamers,
            entries: Mutex::new(entries),
        })
    }

    /// Most recently live first, without streamers who have gone quiet.
    pub fn streamers(&self) -> Vec<Streamer> {
        self.streamers_at(Utc::now())
    }

    fn streamers_at(&self, now: DateTime<Utc>) -> Vec<Streamer> {
        let entries = self.entries.lock().unwrap();
        entries
            .iter()
            .filter(|entry| now - entry.last_live_at <= self.retention)
            .take(self.max_streamers)
            .map(|entry| entry.streamer.clone())
            .collect()
    }

    /// Records a streamer going live. The channels must already be validated.
    pub fn went_live(&self, channels: Vec<Channel>) -> Result<()> {
        self.went_live_at(channels, Utc::now())
    }

    fn went_live_at(&self, channels: Vec<Channel>, now: DateTime<Utc>) -> Result<()> {
        let streamer = Streamer { channels };
        let mut entries = self.entries.lock().unwrap();
        // Newest first, old ones expire, and a streamer sharing any channel with
        // the new one is the same streamer.
        entries.retain(|entry| {
            !entry.streamer.is(&streamer) && now - entry.last_live_at <= self.retention
        });
        entries.insert(
            0,
            Entry {
                streamer,
                last_live_at: now,
            },
        );
        entries.truncate(self.max_streamers);
        self.save(&entries)
    }

    fn save(&self, entries: &[Entry]) -> Result<()> {
        // Write to a sibling file and rename, so a crash never leaves a half-written list.
        let temporary = self.path.with_extension("json.tmp");
        fs::write(&temporary, serde_json::to_string_pretty(entries)?)
            .with_context(|| format!("failed to write {}", temporary.display()))?;
        fs::rename(&temporary, &self.path)
            .with_context(|| format!("failed to replace {}", self.path.display()))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn store(retention_days: u32, max_streamers: usize) -> (Store, tempfile::TempDir) {
        let dir = tempfile::tempdir().unwrap();
        let store = Store::open(
            dir.path().join("streamers.json"),
            retention_days,
            max_streamers,
        )
        .unwrap();
        (store, dir)
    }

    fn twitch(handle: &str) -> Vec<Channel> {
        vec![Channel {
            platform: Platform::Twitch,
            channel: handle.to_string(),
        }]
    }

    fn handles(store: &Store, now: DateTime<Utc>) -> Vec<String> {
        store
            .streamers_at(now)
            .into_iter()
            .map(|streamer| streamer.channels[0].channel.clone())
            .collect()
    }

    #[test]
    fn newest_first_and_one_entry_per_streamer() {
        let (store, _dir) = store(7, 24);
        let now = Utc::now();
        store.went_live_at(twitch("anna"), now).unwrap();
        store
            .went_live_at(twitch("bob"), now + Duration::minutes(1))
            .unwrap();
        store
            .went_live_at(twitch("Anna"), now + Duration::minutes(2))
            .unwrap();
        assert_eq!(handles(&store, now + Duration::minutes(2)), ["Anna", "bob"]);
    }

    #[test]
    fn sharing_a_channel_means_same_streamer() {
        let (store, _dir) = store(7, 24);
        let now = Utc::now();
        store.went_live_at(twitch("anna"), now).unwrap();
        let mut channels = twitch("anna");
        channels.push(Channel {
            platform: Platform::Kick,
            channel: "anna_irl".into(),
        });
        store
            .went_live_at(channels, now + Duration::minutes(1))
            .unwrap();
        let streamers = store.streamers_at(now + Duration::minutes(1));
        assert_eq!(handles(&store, now + Duration::minutes(1)), ["anna"]);
        assert_eq!(streamers[0].channels.len(), 2);
    }

    #[test]
    fn quiet_streamers_expire() {
        let (store, _dir) = store(7, 24);
        let now = Utc::now();
        store.went_live_at(twitch("anna"), now).unwrap();
        assert_eq!(handles(&store, now + Duration::days(7)), ["anna"]);
        assert!(handles(&store, now + Duration::days(8)).is_empty());
    }

    #[test]
    fn list_is_capped() {
        let (store, _dir) = store(7, 2);
        let now = Utc::now();
        for (i, handle) in ["a", "b", "c"].iter().enumerate() {
            store
                .went_live_at(twitch(handle), now + Duration::minutes(i as i64))
                .unwrap();
        }
        assert_eq!(handles(&store, now + Duration::hours(1)), ["c", "b"]);
    }

    #[test]
    fn survives_restart() {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("streamers.json");
        Store::open(path.clone(), 7, 24)
            .unwrap()
            .went_live(twitch("anna"))
            .unwrap();
        let store = Store::open(path, 7, 24).unwrap();
        assert_eq!(handles(&store, Utc::now()), ["anna"]);
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
