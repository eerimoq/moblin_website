/**
 * Profile images for streamer channels, looked up straight from the browser.
 * None of the platforms' own APIs can be called without a secret, so Twitch
 * and YouTube go through public proxies (like the live check in `twitch.ts`),
 * while Kick's channel endpoint allows any origin.
 */
import type { StreamerChannel } from "./streamers";

const fetchTwitch = async (channel: string) => {
  // Answers with the image URL, or "User not found: ..." with status 200.
  const res = await fetch(`https://decapi.me/twitch/avatar/${channel}`);
  const text = (await res.text()).trim();
  return res.ok && text.startsWith("https://") ? text : undefined;
};

const fetchYouTube = async (channel: string) => {
  const res = await fetch(`https://unavatar.io/youtube/@${channel}?json&fallback=false`);
  if (!res.ok) return undefined;
  const body: { url?: string } = await res.json();
  return body.url;
};

const fetchKick = async (channel: string) => {
  const res = await fetch(`https://kick.com/api/v2/channels/${channel}`);
  if (!res.ok) return undefined;
  const body: { user?: { profile_pic?: string | null } } = await res.json();
  return body.user?.profile_pic ?? undefined;
};

/** The channel's profile image URL, or `undefined` when there is none or the lookup fails. */
export async function fetchProfileImage({
  platform,
  channel,
}: StreamerChannel): Promise<string | undefined> {
  const name = encodeURIComponent(channel);
  try {
    switch (platform) {
      case "twitch":
        return await fetchTwitch(name);
      case "youtube":
        return await fetchYouTube(name);
      case "kick":
        return await fetchKick(name);
    }
  } catch {
    return undefined;
  }
}
