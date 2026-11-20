export type Video = {
  id: string;
  kind: "short" | "video";
  title: string;
  settings?: string[];
};

export function videoUrl(video: Video): string {
  return video.kind === "short"
    ? `https://www.youtube.com/shorts/${video.id}`
    : `https://www.youtube.com/watch?v=${video.id}`;
}

export const videos: Video[] = [
  {
    id: "MHUT8al6Wg8",
    kind: "short",
    title: "Chat snapshots to Discord!",
    settings: ["snapshot", "moblin-snapshot-optional-message"],
  },
  {
    id: "r-60-f4prss",
    kind: "short",
    title: "Twitch raid",
    settings: ["twitch"],
  },
  {
    id: "5v07BwaDe0s",
    kind: "short",
    title: "Zoom and scene controls layouts!",
    settings: ["zoom-and-scene-controls"],
  },
];
