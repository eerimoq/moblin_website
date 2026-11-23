import { t } from "../i18n";
import type { IconName } from "../components/Icon";

export type Feature = {
  icon: IconName;
  title: string;
  text: string;
  guides: { label: string; id: string }[];
};

export const shopIcons = [
  "king",
  "queen",
  "tetris",
  "tub",
  "billionaire",
  "pixels",
  "happy",
  "pink",
].map((name) => `logos/icons/${name}.png`);

export const features: Feature[] = [
  {
    icon: "chat",
    title: t("Chat on screen"),
    text: t(
      "Twitch, YouTube and Kick chat over your camera view. Read it, and show it on stream if you want.",
    ),
    guides: [{ label: t("Guide"), id: "chat" }],
  },
  {
    icon: "bell",
    title: t("Alerts and widgets"),
    text: t(
      "Follows, subs, text, a live map, QR codes and more. Drop them anywhere on the picture.",
    ),
    guides: [
      { label: t("Alerts"), id: "alerts" },
      { label: t("Scenes and widgets"), id: "scenes-and-widgets" },
    ],
  },
  {
    icon: "bonding",
    title: t("Bonding for bad signal"),
    text: t(
      "Use WiFi and cellular at the same time, or add spare phones. When one drops, the stream keeps going.",
    ),
    guides: [{ label: t("Guide"), id: "bonding" }],
  },
  {
    icon: "remote",
    title: t("Remote control"),
    text: t(
      "Run OBS at home from your phone, or let a friend keep an eye on your stream while you walk.",
    ),
    guides: [{ label: t("Guide"), id: "remote-control" }],
  },
  {
    icon: "plug",
    title: t("Integrations"),
    text: t(
      "Works with GoPro and DJI cameras, gimbals, game controllers, heart rate monitors and even your Tesla.",
    ),
    guides: [{ label: t("Guide"), id: "ingests" }],
  },
  {
    icon: "video",
    title: t("Mobcam"),
    text: t(
      "Your phone as a low latency camera in OBS Studio over a USB cable. Plug it in and go live.",
    ),
    guides: [{ label: t("Guide"), id: "mobcam" }],
  },
];

export const steps = [
  {
    mascot: "default",
    title: t("Install Moblin"),
    text: t("Free on the App Store for iPhone and iPad. Nothing to sign up for."),
  },
  {
    mascot: "looking",
    title: t("Set up your stream"),
    text: t(
      "Pick your platform, paste your stream key and adjust the settings if you like. The defaults work fine to begin with.",
    ),
  },
  {
    mascot: "thumbs-up",
    title: t("Tap Go live"),
    text: t("Chat, bitrate and viewers show up right on screen. On your Apple Watch too."),
  },
] as const;
