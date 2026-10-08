export type AppIconName =
  | "gear"
  | "torch"
  | "torch-off"
  | "mic"
  | "mic-off"
  | "record"
  | "aperture"
  | "widgets"
  | "sunset"
  | "chat"
  | "speedometer"
  | "grid"
  | "gray"
  | "sepia"
  | "film"
  | "square"
  | "tv"
  | "sparkles"
  | "eye"
  | "clock"
  | "stream"
  | "camera"
  | "chevron-right"
  | "chevron-left"
  | "check"
  | "close"
  | "waveform";

export type QuickButton = {
  id: string;
  label: string;
  icon: AppIconName;
  offIcon?: AppIconName;
  toggle: boolean;
};

export const quickButtonPages: QuickButton[][] = [
  [
    { id: "torch", label: "Torch", icon: "torch", offIcon: "torch-off", toggle: true },
    { id: "mute", label: "Mute", icon: "mic-off", offIcon: "mic", toggle: true },
    { id: "grid", label: "Grid", icon: "grid", toggle: true },
    { id: "bitrate", label: "Bitrate", icon: "speedometer", toggle: false },
    { id: "mic", label: "Mic", icon: "waveform", toggle: false },
    { id: "record", label: "Record", icon: "record", toggle: true },
    { id: "snapshot", label: "Snapshot", icon: "aperture", toggle: false },
    { id: "widgets", label: "Widgets", icon: "widgets", toggle: true },
    { id: "black", label: "Black screen", icon: "sunset", toggle: true },
    { id: "chat", label: "Chat", icon: "chat", toggle: true },
  ],
  [
    { id: "gray", label: "Gray scale", icon: "gray", toggle: true },
    { id: "sepia", label: "Sepia", icon: "sepia", toggle: true },
    { id: "movie", label: "Movie", icon: "film", toggle: true },
    { id: "fourThree", label: "4:3", icon: "square", toggle: true },
    { id: "crt", label: "CRT", icon: "tv", toggle: true },
    { id: "beauty", label: "Beauty", icon: "sparkles", toggle: true },
  ],
];

export const initialButtons: Record<string, boolean> = { widgets: true, chat: true };

export type SceneId = "back" | "front" | "pip";

export const scenes: { id: SceneId; name: string }[] = [
  { id: "back", name: "Back" },
  { id: "front", name: "Front" },
  { id: "pip", name: "PiP" },
];

export const zoomPresets = ["0.5x", "1x", "2x", "4x", "8x"];

export const zoomScale: Record<string, number> = {
  "0.5x": 1,
  "1x": 1.3,
  "2x": 1.9,
  "4x": 2.8,
  "8x": 4,
};

export type StreamId = "twitch" | "irl";

export const streams: { id: StreamId; name: string; url: string }[] = [
  { id: "twitch", name: "Twitch", url: "rtmp://live.twitch.tv/app/live_4512••••" },
  { id: "irl", name: "IRL backpack", url: "srtla://irl.example.com:5000?streamid=••••" },
];

export type Row =
  | { kind: "page"; label: string; page: string; check?: [string, string] }
  | { kind: "picker"; label: string; key: string; options: string[] }
  | { kind: "toggle"; label: string; key: string; option?: string }
  | { kind: "text"; label: string; value: string }
  | { kind: "demo"; label: string };

export type PickerRow = Extract<Row, { kind: "picker" }>;

export type Section = { header?: string; footer?: string; rows: Row[] };

export type Page = { title: string; sections: Section[] };

const demo = (...labels: string[]): Row[] => labels.map((label) => ({ kind: "demo", label }));

export const bitrates = ["8 Mbps", "6 Mbps", "5 Mbps", "3 Mbps", "1 Mbps", "500 Kbps"];

export const bitrateRow = (stream: StreamId): PickerRow => ({
  kind: "picker",
  label: "Bitrate",
  key: `${stream}.bitrate`,
  options: bitrates,
});

export const micRow: PickerRow = {
  kind: "picker",
  label: "Mic",
  key: "mic",
  options: ["Bottom", "Front", "Back", "AirPods Pro", "Wireless GO II"],
};

const streamPages = (
  id: StreamId,
  name: string,
  url: string,
  srt: boolean,
): Record<string, Page> => ({
  [`stream-${id}`]: {
    title: name,
    sections: [
      { rows: [{ kind: "toggle", label: "Enabled", key: "stream", option: id }] },
      { rows: [{ kind: "text", label: "Name", value: name }] },
      {
        header: "Destination",
        rows: [
          { kind: "text", label: "URL", value: url },
          srt
            ? { kind: "page", label: "SRT(LA)", page: `srt-${id}` }
            : { kind: "page", label: "RTMP", page: `rtmp-${id}` },
          ...demo("Multi streaming", "RIST", "WHIP"),
        ],
      },
      {
        header: "Media",
        rows: [
          { kind: "page", label: "Video", page: `video-${id}` },
          { kind: "page", label: "Audio", page: `audio-${id}` },
          ...demo("Recording", "Replay", "Snapshot"),
          { kind: "toggle", label: "Portrait", key: `${id}.portrait` },
        ],
      },
      {
        header: "Streaming platforms",
        rows: [
          { kind: "page", label: "Twitch", page: "twitch" },
          ...demo("Kick", "YouTube", "SOOP", "Open Streaming Platform"),
        ],
      },
      { rows: demo("Background streaming", "OBS remote control", "Go live notification") },
    ],
  },
  [`video-${id}`]: {
    title: "Video",
    sections: [
      {
        rows: [
          {
            kind: "picker",
            label: "Resolution",
            key: `${id}.resolution`,
            options: ["3840x2160", "2560x1440", "1920x1080", "1280x720", "854x480"],
          },
          {
            kind: "picker",
            label: "FPS",
            key: `${id}.fps`,
            options: ["15", "24", "25", "30", "50", "60"],
          },
        ],
      },
      { rows: [{ kind: "toggle", label: "Low light boost (LLB)", key: `${id}.llb` }] },
      {
        rows: [
          {
            kind: "picker",
            label: "Codec",
            key: `${id}.codec`,
            options: ["H.265/HEVC", "H.264/AVC"],
          },
        ],
      },
      { rows: [bitrateRow(id), ...demo("Bitrate presets")] },
      { rows: [{ kind: "toggle", label: "B-frames", key: `${id}.bframes` }] },
    ],
  },
  [`audio-${id}`]: {
    title: "Audio",
    sections: [
      {
        footer: "WHIP generally only supports Opus.",
        rows: [
          { kind: "picker", label: "Codec", key: `${id}.audioCodec`, options: ["AAC", "Opus"] },
        ],
      },
      {
        header: "Bitrate",
        footer: "128 Kbps or higher is recommended.",
        rows: [
          {
            kind: "picker",
            label: "Bitrate",
            key: `${id}.audioBitrate`,
            options: ["64 Kbps", "96 Kbps", "128 Kbps", "160 Kbps", "192 Kbps"],
          },
        ],
      },
    ],
  },
  [`srt-${id}`]: {
    title: "SRT(LA)",
    sections: [
      {
        rows: [
          {
            kind: "picker",
            label: "Latency",
            key: `${id}.latency`,
            options: ["500 ms", "1000 ms", "2000 ms", "3000 ms"],
          },
          { kind: "toggle", label: "Adaptive bitrate", key: `${id}.adaptive` },
          { kind: "toggle", label: "Big packets", key: `${id}.bigPackets` },
        ],
      },
    ],
  },
  [`rtmp-${id}`]: {
    title: "RTMP",
    sections: [{ rows: [{ kind: "toggle", label: "Adaptive bitrate", key: `${id}.adaptive` }] }],
  },
});

const scenePage = (id: SceneId, name: string): Page => ({
  title: name,
  sections: [
    { rows: [{ kind: "text", label: "Name", value: name }] },
    {
      rows: [
        {
          kind: "picker",
          label: "Video source",
          key: `scene.${id}.source`,
          options: ["Back camera", "Front camera"],
        },
        { kind: "toggle", label: "Mirror", key: `scene.${id}.mirror` },
      ],
    },
    {
      header: "Widgets",
      footer: "Widgets are drawn on the stream, in this order.",
      rows: [
        { kind: "toggle", label: "Clock", key: `scene.${id}.clock` },
        { kind: "toggle", label: "Logo", key: `scene.${id}.logo` },
        { kind: "toggle", label: "Front camera", key: `scene.${id}.pip` },
      ],
    },
  ],
});

export const streamButtonColors: Record<string, string> = {
  Red: "#ff3b30",
  Orange: "#ff9500",
  Green: "#34c759",
  Blue: "#0a84ff",
  Purple: "#af52de",
};

export const pages: Record<string, Page> = {
  settings: {
    title: "Settings",
    sections: [
      {
        rows: [
          { kind: "page", label: "Streams", page: "streams" },
          { kind: "page", label: "Scenes", page: "scenes" },
          ...demo("Chat"),
          { kind: "page", label: "Display", page: "display" },
          ...demo("Camera"),
          { kind: "page", label: "Audio", page: "audio" },
          ...demo("Macros", "Location"),
        ],
      },
      { rows: demo("Ingests", "Talkback", "Moblink", "Media players") },
      { rows: demo("Gimbal", "Game controllers", "Stream decks", "Remote control") },
      { rows: demo("DJI devices", "GoPro", "Cat printers", "Tesla", "Workout devices") },
      {
        footer:
          "This demo has only a few settings. Greyed out pages are in the app, and every setting is in the documentation.",
        rows: demo("Recordings", "Streaming history", "Apple Watch", "About"),
      },
    ],
  },
  streams: {
    title: "Streams",
    sections: [
      {
        footer: "The enabled stream is used when you go live.",
        rows: streams.map((s) => ({
          kind: "page",
          label: s.name,
          page: `stream-${s.id}`,
          check: ["stream", s.id],
        })),
      },
    ],
  },
  ...streamPages("twitch", "Twitch", streams[0].url, false),
  ...streamPages("irl", "IRL backpack", streams[1].url, true),
  twitch: {
    title: "Twitch",
    sections: [
      {
        footer: "The name of your channel.",
        rows: [{ kind: "text", label: "Channel name", value: "moblinfan" }],
      },
      { rows: [{ kind: "text", label: "Title", value: "Walking around town 🚶" }] },
    ],
  },
  scenes: {
    title: "Scenes",
    sections: [
      {
        header: "Scenes",
        rows: scenes.map((s) => ({ kind: "page", label: s.name, page: `scene-${s.id}` })),
      },
      { rows: [{ kind: "page", label: "Scene switching", page: "scene-switching" }] },
      { rows: demo("Auto scene switchers", "Disconnect protection") },
    ],
  },
  "scene-back": scenePage("back", "Back"),
  "scene-front": scenePage("front", "Front"),
  "scene-pip": scenePage("pip", "PiP"),
  "scene-switching": {
    title: "Scene switching",
    sections: [
      {
        rows: [
          {
            kind: "picker",
            label: "Transition",
            key: "transition",
            options: ["Blur", "Freeze", "Blur & zoom"],
          },
        ],
      },
    ],
  },
  display: {
    title: "Display",
    sections: [
      {
        header: "Control bar",
        rows: [
          { kind: "page", label: "Quick buttons", page: "quick-buttons" },
          { kind: "page", label: "Stream button", page: "stream-button" },
        ],
      },
      {
        header: "General",
        rows: [
          { kind: "page", label: "Local overlays", page: "local-overlays" },
          ...demo("Big audio level meter", "Low bitrate warning"),
        ],
      },
    ],
  },
  "quick-buttons": {
    title: "Quick buttons",
    sections: [
      {
        header: "Appearance",
        rows: [
          { kind: "toggle", label: "Two columns", key: "display.twoColumns" },
          { kind: "toggle", label: "Show name", key: "display.showName" },
        ],
      },
    ],
  },
  "stream-button": {
    title: "Stream button",
    sections: [
      {
        rows: [
          {
            kind: "picker",
            label: "Color",
            key: "display.streamButton",
            options: Object.keys(streamButtonColors),
          },
        ],
      },
    ],
  },
  "local-overlays": {
    title: "Local overlays",
    sections: [
      {
        header: "Top left",
        rows: [
          { kind: "toggle", label: "Stream", key: "overlay.stream" },
          { kind: "toggle", label: "Viewers", key: "overlay.viewers" },
        ],
      },
      {
        header: "Top right",
        rows: [
          { kind: "toggle", label: "Audio level", key: "overlay.audio" },
          { kind: "toggle", label: "Bitrate", key: "overlay.bitrate" },
          { kind: "toggle", label: "Uptime", key: "overlay.uptime" },
        ],
      },
      {
        header: "Bottom right",
        footer: "Local overlays do not appear on stream.",
        rows: [{ kind: "toggle", label: "Zoom presets", key: "overlay.zoom" }],
      },
    ],
  },
  audio: {
    title: "Audio",
    sections: [
      { rows: [micRow] },
      {
        footer: "Makes most Bluetooth speakers work better.",
        rows: [{ kind: "toggle", label: "Bluetooth output only", key: "bluetoothOutput" }],
      },
    ],
  },
};

export const initialValues: Record<string, string | boolean> = {
  stream: "twitch",
  "twitch.resolution": "1920x1080",
  "twitch.fps": "30",
  "twitch.codec": "H.265/HEVC",
  "twitch.bitrate": "6 Mbps",
  "twitch.audioCodec": "AAC",
  "twitch.audioBitrate": "128 Kbps",
  "twitch.adaptive": true,
  "irl.resolution": "1920x1080",
  "irl.fps": "60",
  "irl.codec": "H.265/HEVC",
  "irl.bitrate": "8 Mbps",
  "irl.audioCodec": "AAC",
  "irl.audioBitrate": "128 Kbps",
  "irl.latency": "2000 ms",
  "irl.adaptive": true,
  "irl.bigPackets": true,
  "scene.back.source": "Back camera",
  "scene.back.clock": true,
  "scene.front.source": "Front camera",
  "scene.front.mirror": true,
  "scene.front.logo": true,
  "scene.pip.source": "Back camera",
  "scene.pip.pip": true,
  transition: "Blur",
  "display.twoColumns": true,
  "display.streamButton": "Red",
  "overlay.stream": true,
  "overlay.viewers": true,
  "overlay.audio": true,
  "overlay.bitrate": true,
  "overlay.uptime": true,
  "overlay.zoom": true,
  mic: "Bottom",
};

export const chatMessages: { user: string; color: string; text: string }[] = [
  { user: "Stumpy_Stump", color: "#5ac8fa", text: "hello from Sweden 👋" },
  { user: "Muldoon42", color: "#ff9f0a", text: "the bitrate is holding up great" },
  { user: "ttebeppe", color: "#bf5af2", text: "where are you walking today?" },
  { user: "adam24seven", color: "#30d158", text: "go left at the next corner!" },
  { user: "picexolaf", color: "#ff375f", text: "is that the new Moblin version?" },
  { user: "nightowl", color: "#64d2ff", text: "chat on screen is so handy" },
  { user: "Stumpy_Stump", color: "#5ac8fa", text: "zoom in on that sign" },
  { user: "glimmer", color: "#ffd60a", text: "first time here, love the stream" },
];
