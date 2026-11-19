export type Video = {
  id: string;
  kind: "short" | "video";
  title: string;
  aspect?: string;
};

export const videos: Video[] = [
  {
    id: "MHUT8al6Wg8",
    kind: "short",
    title: "Moblin: Chat snapshots to Discord!",
  },
  {
    id: "r-60-f4prss",
    kind: "short",
    title: "Moblin: Twitch raid",
    aspect: "3 / 4",
  },
  {
    id: "5v07BwaDe0s",
    kind: "short",
    title: "Moblin: Zoom and scene controls layouts!",
  },
];
