export type Video = {
  id: string;
  kind: "short" | "video";
  title: string;
};

export const videos: Video[] = [
  {
    id: "r-60-f4prss",
    kind: "short",
    title: "Moblin: Twitch raid",
  },
  {
    id: "5v07BwaDe0s",
    kind: "short",
    title: "Moblin: Zoom and scene controls layouts!",
  },
];
