use crate::store::{Channel, ListedChannel};

/// What the website shows for a channel: display name and profile image.
/// Streamers pick names and pictures per platform, so this is where a platform
/// lookup (Twitch Helix, YouTube Data API, Kick API) belongs once credentials
/// are configured. Until then the handle is shown, without an image.
pub async fn resolve(channel: Channel) -> ListedChannel {
    ListedChannel {
        name: channel.channel.clone(),
        image: None,
        platform: channel.platform,
        channel: channel.channel,
    }
}
