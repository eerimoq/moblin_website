/** Streamers who recently went live with Moblin, served by the backend in `backend/`. */
import { createResource, createRoot } from "solid-js";
import { backendUrl } from "./backend";

export type StreamerPlatform = "twitch" | "youtube" | "kick";

export type StreamerChannel = {
  platform: StreamerPlatform;
  /** The streamer's handle on that platform, which usually differs between platforms. */
  name: string;
  /** The channel's profile image URL, once the backend has looked it up on the platform. */
  avatar: string | null;
  /** The name shown on the platform, once looked up; Twitch never has one. */
  displayName: string | null;
  live: boolean;
  /** What the channel streams, such as "Just Chatting", while live and when the platform knows. */
  category: string | null;
  /** The stream's title, while live and when the platform knows. */
  title: string | null;
};

/** The name to show for the channel: its display name when known, its handle otherwise. */
export const channelLabel = ({ displayName, name }: StreamerChannel) => displayName ?? name;

export const channelUrl = ({ platform, name }: StreamerChannel) => {
  const encodedName = encodeURIComponent(name);
  switch (platform) {
    case "twitch":
      return `https://www.twitch.tv/${encodedName}`;
    case "youtube":
      return `https://www.youtube.com/@${encodedName}`;
    case "kick":
      return `https://kick.com/${encodedName}`;
  }
};

export type Streamer = {
  /** Every platform they stream to, at least one. */
  channels: StreamerChannel[];
  image: string | null;
};

export const streamerImageUrl = (image: string) =>
  `${backendUrl}/streamers/images/${encodeURIComponent(image)}`;

/** Newcomers first; a streamer already listed keeps its position. */
async function fetchStreamers(): Promise<Streamer[]> {
  const res = await fetch(`${backendUrl}/streamers`);
  if (!res.ok) throw new Error(`fetching streamers failed with status ${res.status}`);
  const body: { streamers: Streamer[] } = await res.json();
  return body.streamers;
}

/** Fetched once; the section shows placeholders until it answers. */
export const [streamers] = createRoot(() => createResource(fetchStreamers));
