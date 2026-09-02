import type { IconName } from "../components/Icon";

export type Feature = {
  icon: IconName;
  title: string;
  text: string;
};

export const features: Feature[] = [
  {
    icon: "chat",
    title: "Chat on screen",
    text: "Twitch, YouTube and Kick chat over your camera view. Read it, and show it on stream if you want.",
  },
  {
    icon: "bell",
    title: "Alerts and widgets",
    text: "Follows, subs, text, a live map, QR codes and more. Drop them anywhere on the picture.",
  },
  {
    icon: "bonding",
    title: "Bonding for bad signal",
    text: "Use WiFi and cellular at the same time, or add spare phones. When one drops, the stream keeps going.",
  },
  {
    icon: "watch",
    title: "Apple Watch companion",
    text: "Preview, audio level, bitrate and viewer count on your wrist. The phone stays in your pocket.",
  },
  {
    icon: "remote",
    title: "Remote control",
    text: "Run OBS at home from your phone, or let a friend keep an eye on your stream while you walk.",
  },
  {
    icon: "sparkle",
    title: "Effects and filters",
    text: "Beauty filter, blur, background removal and face effects while you stream. Or go full VTuber.",
  },
];

export const steps = [
  {
    mascot: "default",
    title: "Install Moblin",
    text: "Free on the App Store for iPhone and iPad. Nothing to sign up for.",
  },
  {
    mascot: "looking",
    title: "Add your stream",
    text: "Paste the stream key from Twitch, YouTube or Kick. Moblin picks sensible settings for you.",
  },
  {
    mascot: "thumbs-up",
    title: "Tap Go live",
    text: "Chat, bitrate and viewers show up right on screen. On your Apple Watch too.",
  },
] as const;
