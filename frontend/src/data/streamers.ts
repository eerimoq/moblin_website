/** Streamers who recently went live with Moblin, served by the backend in `backend/`. */
import { createResource, createRoot } from "solid-js";
import { links } from "./links";

export type StreamerPlatform = "twitch" | "youtube" | "kick";

export type StreamerChannel = {
  platform: StreamerPlatform;
  /** The streamer's handle on that platform, which usually differs between platforms. */
  channel: string;
};

export const channelUrl = ({ platform, channel }: StreamerChannel) => {
  const name = encodeURIComponent(channel);
  switch (platform) {
    case "twitch":
      return `https://www.twitch.tv/${name}`;
    case "youtube":
      return `https://www.youtube.com/@${name}`;
    case "kick":
      return `https://kick.com/${name}`;
  }
};

export type Streamer = {
  /** Every platform they stream to, at least one. */
  channels: StreamerChannel[];
};

/** The dev server proxies `/api` to a local backend (see `vite.config.ts`). */
const backendUrl = import.meta.env.DEV ? "/api" : links.api;

/** Newcomers first; a streamer already listed keeps its position. */
async function fetchStreamers(): Promise<Streamer[]> {
  const res = await fetch(`${backendUrl}/streamers`);
  if (!res.ok) throw new Error(`fetching streamers failed with status ${res.status}`);
  const body: { streamers: Streamer[] } = await res.json();
  return body.streamers;
}

/** Fetched once; the section shows placeholders until it answers. */
export const [streamers] = createRoot(() => createResource(fetchStreamers));
