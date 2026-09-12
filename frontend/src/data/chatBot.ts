/**
 * Chat bot commands, grouped from
 * https://github.com/eerimoq/moblin/blob/main/docs/chat-bot-help.md
 *
 * Commands are written out exactly as typed in chat so they can be copied.
 * Placeholders are written as <name> and optional parts as [<name>].
 */
export type Command = {
  command: string;
  text: string;
};

export type CommandGroup = {
  title: string;
  commands: Command[];
};

const filters = [
  "movie",
  "grayscale",
  "sepia",
  "triple",
  "twin",
  "pixellate",
  "4:3",
  "whirlpool",
  "pinch",
];

const reactions: [string, string][] = [
  ["fireworks", "Apple fireworks"],
  ["balloons", "Apple balloons"],
  ["hearts", "Apple hearts"],
  ["confetti", "Apple confetti"],
  ["lasers", "Apple lasers"],
  ["rain", "Apple rain"],
  ["glasses", "glasses"],
  ["sparkle", "sparkle"],
];

export const commandGroups: CommandGroup[] = [
  {
    title: "Reactions",
    commands: reactions.map(([name, label]) => ({
      command: `!moblin reaction ${name}`,
      text: `Trigger ${label} reaction.`,
    })),
  },
  {
    title: "Filters",
    commands: filters.flatMap((name) => [
      { command: `!moblin filter ${name} on`, text: `Turn on the ${name} filter.` },
      { command: `!moblin filter ${name} off`, text: `Turn off the ${name} filter.` },
    ]),
  },
  {
    title: "Music",
    commands: [
      { command: "!moblin music add <song>", text: "Add a song. Free text search or share link." },
      { command: "!moblin music play", text: "Play." },
      { command: "!moblin music pause", text: "Pause." },
      { command: "!moblin music next [<count>]", text: "Next song(s)." },
      { command: "!moblin music previous [<count>]", text: "Previous song(s)." },
      { command: "!moblin music status", text: "Show status." },
    ],
  },
  {
    title: "Chat and AI",
    commands: [
      { command: "!moblin ai ask <question>", text: "Ask AI a question." },
      {
        command: "!moblin custom <name>",
        text: "Send the text of given custom command to chat. Configure custom commands in Moblin.",
      },
      { command: "!moblin help", text: "Reply with a link to the full command list." },
    ],
  },
  {
    title: "Stream",
    commands: [
      { command: "!moblin scene <name>", text: "Change scene." },
      { command: "!moblin stream title <title>", text: "Set stream title." },
      { command: "!moblin zoom <x>", text: "Set zoom for the current camera." },
      { command: "!moblin gimbal preset <name>", text: "Move to given gimbal preset." },
      { command: "!moblin obs fix", text: "Fix OBS input." },
      { command: "!moblin snapshot", text: "Take snapshot." },
      {
        command: "!moblin snapshot <message>",
        text: "Take snapshot showing given message to the streamer.",
      },
    ],
  },
  {
    title: "Audio and speech",
    commands: [
      { command: "!moblin mute", text: "Mute audio." },
      { command: "!moblin unmute", text: "Unmute audio." },
      { command: "!moblin tts on", text: "Turn on chat text to speech." },
      { command: "!moblin tts off", text: "Turn off chat text to speech." },
      { command: "!moblin say <message>", text: "Say given message." },
    ],
  },
  {
    title: "Widgets and alerts",
    commands: [
      {
        command: "!moblin alert <name>",
        text: "Trigger alerts. Configure alert names in alert widgets.",
      },
      { command: "!moblin fax <url>", text: "Fax the streamer images." },
      { command: "!moblin map zoom out", text: "Zoom out map widget temporarily." },
      {
        command: "!moblin widget <name> timer <number> add <seconds>",
        text: "Add time to a timer.",
      },
    ],
  },
  {
    title: "Macros",
    commands: [
      { command: "!moblin macro run <name>", text: "Run given macro." },
      { command: "!moblin macro cancel <name>", text: "Cancel given macro." },
    ],
  },
  {
    title: "Tesla",
    commands: [
      { command: "!moblin tesla trunk open", text: "Open the trunk." },
      { command: "!moblin tesla trunk close", text: "Close the trunk." },
      { command: "!moblin tesla media next", text: "Next track." },
      { command: "!moblin tesla media previous", text: "Previous track." },
      { command: "!moblin tesla media toggle-playback", text: "Toggle playback." },
    ],
  },
];
