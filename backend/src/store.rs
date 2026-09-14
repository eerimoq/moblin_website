use std::fmt;
use std::sync::Mutex;
use std::time::Duration;

use anyhow::{Result, bail};
use serde::{Deserialize, Serialize, Serializer};
use tokio::sync::Notify;
use tokio::sync::futures::Notified;
use tokio::time::Instant;

const MAX_CHANNELS: usize = 5;
const MAX_NAME_LENGTH: usize = 40;
const RETRY_DELAY: Duration = Duration::from_secs(30);
const RETRY_MAX_DELAY: Duration = Duration::from_secs(60 * 60);

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
    pub name: String,
}

pub type ChannelKey = (Platform, String);

impl Channel {
    fn validate(&self) -> Result<()> {
        let name = &self.name;
        let plain = name
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || matches!(c, '_' | '-' | '.'));
        if name.is_empty() || name.len() > MAX_NAME_LENGTH || !plain {
            bail!("{name:?} is not a valid {:?} channel", self.platform);
        }
        Ok(())
    }

    pub fn validate_all(channels: &[Channel]) -> Result<()> {
        if channels.is_empty() {
            bail!("at least one channel");
        }
        if channels.len() > MAX_CHANNELS {
            bail!("at most {MAX_CHANNELS} channels");
        }
        channels.iter().try_for_each(Channel::validate)
    }

    pub fn key(&self) -> ChannelKey {
        (self.platform, self.name.to_ascii_lowercase())
    }

    fn same_as(&self, other: &Channel) -> bool {
        self.key() == other.key()
    }
}

impl fmt::Display for Channel {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "{:?}/{}", self.platform, self.name)
    }
}

#[derive(Clone, Debug, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Profile {
    pub avatar: Option<String>,
    pub display_name: Option<String>,
}

const NO_PROFILE: Profile = Profile {
    avatar: None,
    display_name: None,
};

#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Lookup {
    Pending { failures: u32, due: Instant },
    Done(Profile),
}

impl Lookup {
    fn pending() -> Self {
        Lookup::Pending {
            failures: 0,
            due: Instant::now(),
        }
    }

    pub fn profile(&self) -> &Profile {
        match self {
            Lookup::Done(profile) => profile,
            Lookup::Pending { .. } => &NO_PROFILE,
        }
    }
}

impl Serialize for Lookup {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.profile().serialize(serializer)
    }
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct ListedChannel {
    #[serde(flatten)]
    pub channel: Channel,
    #[serde(flatten)]
    pub lookup: Lookup,
    pub live: bool,
}

#[derive(Clone, Debug, PartialEq, Eq, Serialize)]
pub struct Streamer {
    pub channels: Vec<ListedChannel>,
}

impl Streamer {
    fn same_as(&self, other: &Streamer) -> bool {
        self.channels.iter().any(|mine| {
            other
                .channels
                .iter()
                .any(|theirs| mine.channel.same_as(&theirs.channel))
        })
    }

    fn listed(&self, channel: &Channel) -> Option<&ListedChannel> {
        self.channels
            .iter()
            .find(|listed| listed.channel.same_as(channel))
    }
}

pub struct Store {
    max_streamers: usize,
    streamers: Mutex<Vec<Streamer>>,
    lookup_pending: Notify,
    went_live: Notify,
}

impl Store {
    pub fn new(max_streamers: usize) -> Self {
        Self {
            max_streamers,
            streamers: Mutex::new(Vec::new()),
            lookup_pending: Notify::new(),
            went_live: Notify::new(),
        }
    }

    pub fn streamers(&self) -> Vec<Streamer> {
        self.streamers.lock().unwrap().clone()
    }

    pub fn streamer_live(&self, channels: Vec<Channel>) {
        let mut streamers = self.streamers.lock().unwrap();
        let mut streamer = Streamer {
            channels: channels
                .into_iter()
                .map(|channel| ListedChannel {
                    channel,
                    lookup: Lookup::pending(),
                    live: false,
                })
                .collect(),
        };
        let position = streamers.iter().position(|other| other.same_as(&streamer));
        let (same, others): (Vec<_>, Vec<_>) = streamers
            .drain(..)
            .partition(|other| other.same_as(&streamer));
        *streamers = others;
        for listed in &mut streamer.channels {
            if let Some(known) = same.iter().find_map(|other| other.listed(&listed.channel)) {
                listed.lookup = known.lookup.clone();
                listed.live = known.live;
            }
        }
        match position {
            Some(index) => streamers.insert(index, streamer),
            None => {
                streamers.insert(0, streamer);
                streamers.truncate(self.max_streamers);
            }
        }
        self.lookup_pending.notify_one();
        self.went_live.notify_one();
    }

    pub fn went_live(&self) -> Notified<'_> {
        self.went_live.notified()
    }

    pub fn channels(&self, platform: Platform) -> Vec<Channel> {
        self.streamers
            .lock()
            .unwrap()
            .iter()
            .flat_map(|streamer| &streamer.channels)
            .filter(|listed| listed.channel.platform == platform)
            .map(|listed| listed.channel.clone())
            .collect()
    }

    pub fn set_live(&self, channel: &Channel, live: bool) {
        let mut streamers = self.streamers.lock().unwrap();
        if let Some(listed) = streamers
            .iter_mut()
            .flat_map(|streamer| &mut streamer.channels)
            .find(|listed| listed.channel.same_as(channel))
        {
            listed.live = live;
        }
    }

    pub fn next_lookup(&self) -> Option<(Channel, Instant)> {
        self.streamers
            .lock()
            .unwrap()
            .iter()
            .flat_map(|streamer| &streamer.channels)
            .filter_map(|listed| match listed.lookup {
                Lookup::Pending { due, .. } => Some((&listed.channel, due)),
                Lookup::Done(_) => None,
            })
            .min_by_key(|(_, due)| *due)
            .map(|(channel, due)| (channel.clone(), due))
    }

    pub fn lookup_pending(&self) -> Notified<'_> {
        self.lookup_pending.notified()
    }

    pub fn looked_up(&self, channel: &Channel, profile: Profile) {
        self.set_lookup(channel, |_| Lookup::Done(profile));
    }

    pub fn lookup_failed(&self, channel: &Channel) -> Option<Duration> {
        let mut delay = None;
        self.set_lookup(channel, |lookup| {
            let failures = match lookup {
                Lookup::Pending { failures, .. } => failures + 1,
                Lookup::Done(_) => 1,
            };
            let retry_in = RETRY_DELAY
                .saturating_mul(2u32.saturating_pow(failures - 1))
                .min(RETRY_MAX_DELAY);
            delay = Some(retry_in);
            Lookup::Pending {
                failures,
                due: Instant::now() + retry_in,
            }
        });
        delay
    }

    fn set_lookup(&self, channel: &Channel, lookup: impl FnOnce(&Lookup) -> Lookup) {
        let mut streamers = self.streamers.lock().unwrap();
        let listed = streamers
            .iter_mut()
            .flat_map(|streamer| &mut streamer.channels)
            .find(|listed| listed.channel.same_as(channel));
        if let Some(listed) = listed {
            listed.lookup = lookup(&listed.lookup);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn channel(platform: Platform, handle: &str) -> Channel {
        Channel {
            platform,
            name: handle.to_string(),
        }
    }

    fn twitch(handle: &str) -> Vec<Channel> {
        vec![channel(Platform::Twitch, handle)]
    }

    fn handles(store: &Store) -> Vec<String> {
        store
            .streamers()
            .into_iter()
            .map(|streamer| streamer.channels[0].channel.name.clone())
            .collect()
    }

    fn lookups(store: &Store) -> Vec<Lookup> {
        store
            .streamers()
            .into_iter()
            .flat_map(|streamer| streamer.channels)
            .map(|listed| listed.lookup)
            .collect()
    }

    fn lives(store: &Store) -> Vec<bool> {
        store
            .streamers()
            .into_iter()
            .flat_map(|streamer| streamer.channels)
            .map(|listed| listed.live)
            .collect()
    }

    fn pending_in(lookup: &Lookup) -> Duration {
        match lookup {
            Lookup::Pending { due, .. } => due.saturating_duration_since(Instant::now()),
            Lookup::Done(_) => panic!("{lookup:?} is not pending"),
        }
    }

    fn profile(avatar: &str, display_name: &str) -> Profile {
        Profile {
            avatar: Some(avatar.to_string()),
            display_name: Some(display_name.to_string()),
        }
    }

    #[test]
    fn newcomers_first_and_one_entry_per_streamer() {
        let store = Store::new(24);
        store.streamer_live(twitch("anna"));
        store.streamer_live(twitch("bob"));
        store.streamer_live(twitch("Anna"));
        assert_eq!(handles(&store), ["bob", "Anna"]);
        store.streamer_live(twitch("carl"));
        store.streamer_live(twitch("bob"));
        assert_eq!(handles(&store), ["carl", "bob", "Anna"]);
    }

    #[test]
    fn sharing_a_channel_means_same_streamer() {
        let store = Store::new(24);
        store.streamer_live(twitch("anna"));
        let mut channels = twitch("anna");
        channels.push(channel(Platform::Kick, "anna_irl"));
        store.streamer_live(channels);
        let streamers = store.streamers();
        assert_eq!(handles(&store), ["anna"]);
        assert_eq!(streamers[0].channels.len(), 2);
    }

    #[test]
    fn list_is_capped() {
        let store = Store::new(2);
        for handle in ["a", "b", "c"] {
            store.streamer_live(twitch(handle));
        }
        assert_eq!(handles(&store), ["c", "b"]);
    }

    #[test]
    fn rejects_bad_requests() {
        let request = |channels: Vec<Channel>| Channel::validate_all(&channels);
        let twitch = |handle: &str| channel(Platform::Twitch, handle);
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

    #[test]
    fn a_channel_is_looked_up_once() {
        let store = Store::new(24);
        let anna = channel(Platform::Twitch, "anna");
        assert_eq!(store.next_lookup(), None);
        store.streamer_live(vec![anna.clone()]);
        let (channel, due) = store.next_lookup().unwrap();
        assert_eq!(channel, anna);
        assert!(due <= Instant::now());
        store.looked_up(&anna, profile("https://a/1.png", "Anna"));
        assert_eq!(store.next_lookup(), None);
        assert_eq!(
            lookups(&store),
            [Lookup::Done(profile("https://a/1.png", "Anna"))]
        );
        store.streamer_live(twitch("Anna"));
        assert_eq!(store.next_lookup(), None);
        assert_eq!(
            lookups(&store),
            [Lookup::Done(profile("https://a/1.png", "Anna"))]
        );
    }

    #[test]
    fn no_profile_is_an_answer_too() {
        let store = Store::new(24);
        let bob = channel(Platform::Twitch, "bob");
        store.streamer_live(vec![bob.clone()]);
        assert_eq!(
            store.streamers()[0].channels[0].lookup.profile(),
            &NO_PROFILE
        );
        store.looked_up(&bob, Profile::default());
        assert_eq!(store.next_lookup(), None);
        assert_eq!(lookups(&store), [Lookup::Done(Profile::default())]);
    }

    #[test]
    fn a_new_channel_of_a_listed_streamer_is_looked_up() {
        let store = Store::new(24);
        let anna = channel(Platform::Twitch, "anna");
        let kick = channel(Platform::Kick, "anna_irl");
        store.streamer_live(vec![anna.clone()]);
        store.looked_up(&anna, profile("https://a/1.png", "Anna"));
        store.streamer_live(vec![anna.clone(), kick.clone()]);
        assert_eq!(store.next_lookup().unwrap().0, kick);
        assert_eq!(
            lookups(&store)[0],
            Lookup::Done(profile("https://a/1.png", "Anna"))
        );
        assert_eq!(pending_in(&lookups(&store)[1]), Duration::ZERO);
    }

    #[test]
    fn failed_lookups_are_retried_ever_later() {
        let store = Store::new(24);
        let anna = channel(Platform::Twitch, "anna");
        store.streamer_live(vec![anna.clone()]);
        let mut previous = Duration::ZERO;
        for _ in 0..10 {
            let delay = store.lookup_failed(&anna).unwrap();
            assert!(delay > previous || delay >= RETRY_MAX_DELAY);
            assert!(delay <= RETRY_MAX_DELAY);
            let due = store.next_lookup().unwrap().1;
            assert!(due > Instant::now() + delay - Duration::from_secs(1));
            previous = delay;
        }
        assert_eq!(previous, RETRY_MAX_DELAY);
        store.streamer_live(twitch("Anna"));
        assert!(pending_in(&lookups(&store)[0]) >= RETRY_MAX_DELAY - Duration::from_secs(1));
    }

    #[test]
    fn a_lookup_for_a_channel_no_longer_listed_is_discarded() {
        let store = Store::new(1);
        let anna = channel(Platform::Twitch, "anna");
        let bob = channel(Platform::Twitch, "bob");
        store.streamer_live(vec![anna.clone()]);
        store.streamer_live(vec![bob.clone()]);
        assert_eq!(handles(&store), ["bob"]);
        store.looked_up(&anna, profile("https://a/1.png", "Anna"));
        assert_eq!(store.lookup_failed(&anna), None);
        assert_eq!(handles(&store), ["bob"]);
        assert_eq!(store.next_lookup().unwrap().0, bob);
    }

    #[test]
    fn live_status_is_kept_per_channel() {
        let store = Store::new(24);
        let anna = channel(Platform::Twitch, "Anna");
        let kick = channel(Platform::Kick, "anna_irl");
        store.streamer_live(vec![anna.clone(), kick.clone()]);
        store.streamer_live(twitch("bob"));
        assert_eq!(
            store.channels(Platform::Twitch),
            [channel(Platform::Twitch, "bob"), anna.clone()]
        );
        assert_eq!(store.channels(Platform::Kick), std::slice::from_ref(&kick));
        assert_eq!(lives(&store), [false, false, false]);
        store.set_live(&channel(Platform::Twitch, "anna"), true);
        store.set_live(&kick, true);
        assert_eq!(lives(&store), [false, true, true]);
        store.streamer_live(vec![anna.clone(), channel(Platform::YouTube, "AnnaIRL")]);
        assert_eq!(lives(&store), [false, true, false]);
        store.set_live(&anna, false);
        store.set_live(&channel(Platform::Twitch, "carl"), true);
        assert_eq!(lives(&store), [false, false, false]);
    }

    #[test]
    fn serializes_the_profile_flat_with_nulls_for_the_unknown() {
        let store = Store::new(24);
        let anna = channel(Platform::Twitch, "anna");
        let kick = channel(Platform::Kick, "anna_irl");
        store.streamer_live(vec![
            anna.clone(),
            kick.clone(),
            channel(Platform::YouTube, "AnnaIRL"),
        ]);
        store.looked_up(&anna, profile("https://a/1.png", "Anna"));
        store.looked_up(
            &kick,
            Profile {
                avatar: None,
                display_name: Some("Anna_IRL".into()),
            },
        );
        store.set_live(&anna, true);
        let json = serde_json::to_value(store.streamers()).unwrap();
        assert_eq!(
            json,
            serde_json::json!([{"channels": [
                {"platform": "twitch", "name": "anna", "avatar": "https://a/1.png", "displayName": "Anna", "live": true},
                {"platform": "kick", "name": "anna_irl", "avatar": null, "displayName": "Anna_IRL", "live": false},
                {"platform": "youtube", "name": "AnnaIRL", "avatar": null, "displayName": null, "live": false},
            ]}])
        );
    }
}
