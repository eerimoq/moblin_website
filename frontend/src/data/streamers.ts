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

/** Most recently live first. */
async function fetchStreamers(): Promise<Streamer[]> {
  const res = await fetch(`${backendUrl}/streamers`);
  if (!res.ok) throw new Error(`fetching streamers failed with status ${res.status}`);
  const body: { streamers: Streamer[] } = await res.json();
  return body.streamers;
}

/** Fetched once, shared by the nav and the section so they appear together. */
export const [streamers] = createRoot(() => createResource(fetchStreamers));

/**
 * Until the backend is known to be stable, nothing about streamers is shown
 * unless it answered with at least one. Remove this check once it is.
 */
export const haveStreamers = () => (streamers()?.length ?? 0) > 0;
