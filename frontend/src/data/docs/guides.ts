export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[] }
  | { type: "tip"; text: string };

export type Guide = {
  id: string;
  title: string;
  summary: string;
  blocks: GuideBlock[];
  related: string[];
};

export const guides: Guide[] = [
  {
    id: "getting-started",
    title: "Getting started: your first stream",
    summary: "Create a stream with the wizard, select it and go live.",
    blocks: [
      {
        type: "p",
        text:
          "In Moblin a stream is a saved destination with its own video, audio and platform " +
          "settings. You can have several streams and switch between them. The easiest way to " +
          "create one is the create stream wizard.",
      },
      { type: "h", text: "Create a stream" },
      {
        type: "steps",
        items: [
          "Tap the gear icon in the control bar to open Settings.",
          "Go to Settings → Streams and tap Create. If no stream is configured yet, the stream " +
            "button in the control bar shows Setup, which opens the same wizard.",
          "Under Platform to stream to, pick Twitch, Kick, YouTube, SOOP or OBS. Pick Mobcam to " +
            "use the phone as a USB camera, or Custom for any other server (SRT(LA), RTMP(S), " +
            "RIST or WHIP).",
          "Fill in the platform page (logging in is optional but simplifies the setup) and tap " +
            "Next.",
          "Choose a network setup. Moblin → OBS → platform gives good stability in most network " +
            "conditions. Moblin → BELABOX cloud → OBS → platform uses bonding and is a paid " +
            "third-party service. Moblin → platform streams directly, which is often unstable on " +
            "a bad connection. Moblin → My server(s) → platform is the most flexible setup.",
          "On the General page, name the stream and tap Create.",
        ],
      },
      { type: "h", text: "Select a stream and go live" },
      {
        type: "steps",
        items: [
          "A newly created stream is selected automatically. To select another one, turn on the " +
            "toggle next to it in Settings → Streams.",
          "Close Settings, tap Go Live in the control bar and confirm. Tap End to stop.",
          "Long press the stream button to change its color.",
        ],
      },
      {
        type: "list",
        items: [
          "Resolution, FPS and codec are in Settings → Streams → <your stream> → Video.",
          "The stream URL is in Settings → Streams → <your stream> → URL. It shows examples for " +
            "RTMP, SRT(LA), WHIP and Mobcam URLs.",
          "Swipe left on a stream in the list to duplicate or delete it.",
          "The Switch stream quick button switches to another stream and automatically goes live.",
        ],
      },
      {
        type: "tip",
        text:
          "Many settings are hidden until you turn on Show all settings at the bottom of " +
          "Settings. Settings that would stop the stream are disabled while you are live.",
      },
    ],
    related: ["streams", "stream", "video", "settings"],
  },
  {
    id: "quick-buttons",
    title: "Quick buttons and the control bar",
    summary: "Choose which quick buttons are shown in the control bar and how they look.",
    blocks: [
      {
        type: "p",
        text:
          "The control bar holds the stream button, the gear icon for Settings and the quick " +
          "buttons. Quick buttons toggle features or open panels, for example Mute, Torch, " +
          "Record, Snapshot, Chat, Bitrate, Scene widgets, Stream and OBS. Buttons can be spread " +
          "over up to five pages; tap the page dots to switch page.",
      },
      {
        type: "steps",
        items: [
          "Go to Settings → Display → Quick buttons.",
          "Turn buttons on or off in the Page 1 to Page 5 lists. Use Filter to find a button by " +
            "name.",
          "Tap a button to set its page and background color.",
          "Under Appearance, choose Big buttons and Show name. Scroll and Two columns appear " +
            "when Show all settings is on.",
        ],
      },
      {
        type: "tip",
        text: "Long press any quick button in the control bar to open its settings directly.",
      },
      { type: "h", text: "Useful buttons" },
      {
        type: "list",
        items: [
          "Stream: set title and category on Twitch and Kick, manage YouTube streams and send " +
            "the go live notification.",
          "Bitrate: pick one of your bitrate presets, also while live.",
          "Scene widgets: turn widgets in the current scene on and off and control timers, " +
            "scoreboards, wheel of luck, bingo cards and Pomodoro timers.",
          "Stealth mode: shows a custom image instead of the app. Lock screen and Grid are also " +
            "available.",
          "Local overlays: shows or hides on-screen status information that never appears on " +
            "stream.",
          "Effects such as Movie, 4:3, Gray scale, Sepia, Pixellate, Blur faces, Blur background " +
            "and Beauty.",
        ],
      },
      {
        type: "p",
        text:
          "Settings → Display also controls the control bar Background, Big buttons, Vertical " +
          "buttons and, with Show all settings on, Local overlays and Low bitrate warning.",
      },
    ],
    related: ["quick-buttons", "button", "stream-button", "display", "local-overlays"],
  },
  {
    id: "twitch",
    title: "Streaming to Twitch",
    summary: "Set up a Twitch stream with chat, viewer count, alerts, title and category.",
    blocks: [
      {
        type: "steps",
        items: [
          "Open the create stream wizard (Settings → Streams → Create) and pick Twitch.",
          "Tap Login (optional, but simplifies the setup). Logging in fills in your channel " +
            "name, channel id and stream key.",
          "Without login, enter your Channel name, and optionally the Channel id.",
          "Pick a network setup. For Moblin → Twitch, the Nearby ingest endpoint and Stream key " +
            "are needed; both are prefilled when logged in.",
          "Name the stream on the General page and tap Create.",
        ],
      },
      { type: "h", text: "What needs a login" },
      {
        type: "list",
        items: [
          "Chat only needs the channel name.",
          "Viewer count needs login and the channel id.",
          "Follow, subscription, raid and other alerts need login.",
          "Setting the stream title and category needs login.",
        ],
      },
      {
        type: "p",
        text:
          "Log in later in Settings → Streams → <your stream> → Twitch. There you can also set " +
          "Title and Category, and under Alerts choose which events are shown in Chat and as " +
          "Toasts (follows, subscriptions, gift subscriptions, resubscriptions, rewards, raids, " +
          "bits and watch streaks).",
      },
      {
        type: "tip",
        text:
          "While live, the Stream quick button lets you change title and category without " +
          "opening Settings, and the Stream marker quick button creates a stream marker.",
      },
    ],
    related: ["twitch", "category", "chat", "emotes", "streams"],
  },
  {
    id: "kick",
    title: "Streaming to Kick",
    summary: "Set up a Kick stream with chat, viewer count, events, title and category.",
    blocks: [
      {
        type: "steps",
        items: [
          "Open the create stream wizard (Settings → Streams → Create) and pick Kick.",
          "Tap Login (optional, but simplifies the setup), or enter your Channel name.",
          "Pick a network setup. For Moblin → Kick, copy the Stream URL and Stream key from " +
            "https://kick.com/dashboard/settings/stream (requires login).",
          "Name the stream on the General page and tap Create.",
        ],
      },
      {
        type: "p",
        text:
          "Chat and viewer count only need the channel name. When you are logged in, Settings → " +
          "Streams → <your stream> → Kick also lets you set the Title and Category.",
      },
      {
        type: "p",
        text:
          "Under Alerts, choose which events are shown in Chat and as Toasts: subscriptions, " +
          "gift subscriptions, rewards, hosts, kicks (with a minimum) and, in chat, bans and " +
          "timeouts.",
      },
    ],
    related: ["kick", "kick-category", "kick-chat", "emotes"],
  },
  {
    id: "youtube",
    title: "Streaming to YouTube",
    summary: "Set up a YouTube stream, get chat working and manage scheduled streams.",
    blocks: [
      {
        type: "steps",
        items: [
          "Open the create stream wizard (Settings → Streams → Create) and pick YouTube.",
          "Tap Login (optional, but simplifies the setup). When logged in, Moblin fetches your " +
            "channel handle, stream URL and stream key.",
          "Without login, enter your Channel handle (only needed for chat), and for Moblin → " +
            "YouTube copy the Stream URL and Stream key from youtube.com.",
          "Name the stream on the General page and tap Create.",
        ],
      },
      { type: "h", text: "Chat and viewers" },
      {
        type: "p",
        text:
          "YouTube chat is tied to the Video ID of each live stream. When you go live, Moblin " +
          "tries for up to a minute to fetch it, using your login or channel handle. You must " +
          "be live on YouTube for this to work. You can also tap Fetch Video IDs or enter Video " +
          "IDs manually in Settings → Streams → <your stream> → YouTube. The viewer count needs " +
          "login.",
      },
      { type: "h", text: "Manage streams" },
      {
        type: "p",
        text:
          "When logged in, Manage streams in the YouTube settings lets you schedule a stream " +
          "(Title, Visibility Public, Private or Unlisted, and Auto-stop) before going live, end " +
          "live streams and delete upcoming ones.",
      },
    ],
    related: ["youtube", "settings-chat", "streaming-platforms"],
  },
  {
    id: "obs-and-own-server",
    title: "Streaming to OBS or your own server",
    summary: "Send SRT(LA) to OBS or a server and let Moblin switch OBS scenes for you.",
    blocks: [
      {
        type: "p",
        text:
          "Streaming to OBS on a computer, which then streams to the platform, gives better " +
          "stability than streaming directly. OBS can also show a BRB scene when your connection " +
          "drops.",
      },
      { type: "h", text: "Set up with the wizard" },
      {
        type: "steps",
        items: [
          "Settings → Streams → Create → OBS (or pick a platform and the Moblin → OBS → platform " +
            "network setup).",
          "Enter the IP address or domain name of the OBS computer (your public IP address if " +
            "streaming over the internet) and a Port. Configure port forwarding in your router.",
          "In OBS, create a Media Source configured as shown in the wizard, with your port.",
          "Optionally enable OBS remote control (next step), then name the stream and tap " +
            "Create. Moblin creates an srt:// stream using H.265/HEVC.",
        ],
      },
      { type: "h", text: "OBS remote control and BRB scene" },
      {
        type: "p",
        text:
          "OBS remote control uses the OBS WebSocket server. Copy the URL and password from OBS " +
          "Tools → WebSocket Server Settings → Show Connect Info, and enter your Main scene, BRB " +
          "scene and the Source name that receives the stream from Moblin. With Streaming " +
          "directly to OBS on, Moblin periodically switches to the BRB scene if the stream is " +
          "likely broken and back to the main scene once everything works again.",
      },
      {
        type: "list",
        items: [
          "Settings are in Settings → Streams → <your stream> → OBS remote control.",
          "The OBS quick button shows the current scene, lets you switch scenes, start and stop " +
            "OBS streaming and recording, mute audio inputs, adjust audio sync and Fix the " +
            "source if audio or video has issues.",
          "With Show all settings on, OBS streaming and recording can start and stop " +
            "automatically when you go live and end.",
        ],
      },
      { type: "h", text: "Your own server" },
      {
        type: "p",
        text:
          "Pick Custom in the wizard (SRT(LA), RTMP(S), RIST or WHIP), or the My server(s) " +
          "network setup (SRT(LA) or RTMP(S)), to stream to an SRT server, SRTLA receiver or " +
          "BELABOX cloud. With Show all settings on, Settings → Streams → <your stream> → " +
          "SRT(LA) has Latency (3000 ms by default), adaptive bitrate and connection priorities.",
      },
    ],
    related: ["obs-remote-control", "srt-la", "adaptive-bitrate", "stream", "rist"],
  },
  {
    id: "bonding",
    title: "Bonding with SRTLA and Moblink",
    summary: "Combine cellular, WiFi, Ethernet and other phones into one stable connection.",
    blocks: [
      {
        type: "p",
        text:
          "With an srtla:// URL (or RIST with bonding), Moblin sends the stream over one " +
          "cellular, one WiFi and multiple Ethernet connections at the same time. The receiving " +
          "server, for example an SRTLA server or BELABOX cloud, puts the stream back together.",
      },
      { type: "h", text: "Adaptive bitrate" },
      {
        type: "p",
        text:
          "Adaptive bitrate is on by default and lowers the bitrate when the network cannot keep " +
          "up. With Show all settings on, choose the algorithm in Settings → Streams → <your " +
          "stream> → SRT(LA) → Adaptive bitrate. BELABOX (the default) and Fast IRL are the " +
          "safest options.",
      },
      { type: "h", text: "Connection priorities" },
      {
        type: "p",
        text:
          "Only SRTLA supports connection priorities. A connection with high priority is used " +
          "more than one with low priority if it is stable, and disabled connections are not " +
          "used. Set them in Settings → Streams → <your stream> → SRT(LA) → Connection " +
          "priorities or with the Connection priorities quick button.",
      },
      { type: "h", text: "Moblink: phones as extra connections" },
      {
        type: "steps",
        items: [
          "On the streaming device, go to Settings → Moblink, set a Password and turn on " +
            "Streamer.",
          "On each extra phone, install Moblink on Android or use Moblin on another iPhone, " +
            "enter the same password and enable Relay. The relay device must have cellular data " +
            "enabled.",
          "The relay discovers streamers on your local network. Turn on Manual to enter one of " +
            "the streamer's URLs as Streamer URL instead.",
        ],
      },
      {
        type: "tip",
        text:
          "Turn on the Bonding and Bonding RTTs local overlays (Settings → Display → Local " +
          "overlays, with Show all settings on) to see how each connection performs.",
      },
    ],
    related: ["srt-la", "adaptive-bitrate", "rist", "moblink", "local-overlays"],
  },
  {
    id: "scenes-and-widgets",
    title: "Scenes and widgets",
    summary: "Build scenes from a camera and widgets such as text, images, browsers and maps.",
    blocks: [
      {
        type: "p",
        text:
          "A scene has a video source (a camera, screen capture, ingest or media player) and a " +
          "list of widgets. A widget can be used in zero or more scenes. Switch scenes with the " +
          "scene selector on the right side of the screen.",
      },
      { type: "h", text: "Create a widget and add it to a scene" },
      {
        type: "steps",
        items: [
          "Go to Settings → Scenes and tap Create under Widgets.",
          "Pick a Type, give it a Name, configure it and choose the scenes to add the widget to.",
          "To add an existing widget, open a scene and tap Add under Widgets.",
          "Open the widget from the scene to set its alignment, position and size. Save layout " +
            "and Load layout reuse a position in other scenes.",
        ],
      },
      { type: "h", text: "Widget types" },
      {
        type: "list",
        items: [
          "Text: text, clock, weather, location, timers and much more.",
          "Image, Browser (a web page), QR code and Slideshow.",
          "Video source: another camera or screen capture, for picture in picture.",
          "Map: a map with your location.",
          "Alerts, Chat and Chat emote combo for viewer interaction.",
          "Scene: shows another scene's widgets.",
          "VTuber and PNGTuber, Scoreboard, Wheel of luck, Bingo card, Pomodoro timer, Snapshot " +
            "and Crop.",
        ],
      },
      { type: "h", text: "Effects" },
      {
        type: "p",
        text:
          "Image, browser, video source, map and QR code widgets have an Effects section, with " +
          "for example Shape (corner radius, border, crop), Remove background, Dewarp 360, " +
          "Anamorphic lens, LUT, Opacity and Mask.",
      },
      {
        type: "tip",
        text:
          "With Show all settings on, Settings → Scenes also has Scene switching transitions, " +
          "Auto scene switchers and Disconnect protection, which switches to a fallback scene " +
          "when the video source disconnects.",
      },
    ],
    related: [
      "scenes",
      "widget",
      "effect",
      "image",
      "browser",
      "video-source",
      "scene-switching",
      "auto-scene-switchers",
      "disconnect-protection",
    ],
  },
  {
    id: "text-widget-variables",
    title: "Text widget variables",
    summary: "Show live data such as time, speed, weather and bitrate in a text widget.",
    blocks: [
      {
        type: "p",
        text:
          "A text widget's text can contain variables in curly braces that Moblin replaces with " +
          "live values. Edit the text in Settings → Scenes → <your text widget> → Text, where " +
          "Suggestions gives ready-made texts and Variables lists everything available. Tap a " +
          "variable to add it.",
      },
      {
        type: "list",
        items: [
          "Time: {time}, {shortTime}, {date}, {timer}, {stopwatch}, {lapTimes}.",
          "Location: {country}, {countryFlag}, {city}, {speed}, {altitude}, {distance}, {slope}.",
          "Weather: {conditions}, {temperature}, {feelsLikeTemperature}, {wind}.",
          "Workout: {heartRate}, {stepCount}, {cyclingPower}.",
          "Streaming: {latestFollower}, {latestSubscriber}.",
          "Debug: {bitrate}, {bitrateAndTotal}, {bonding}, {resolution}, {fps}.",
          "General: {muted}, {checkbox}, {rating}, {gForce}, and {subtitles} for speech to text.",
        ],
      },
      {
        type: "tip",
        text:
          "Location and weather variables only update when Location is enabled. Control timers, " +
          "stopwatches, checkboxes and ratings while live with the Scene widgets quick button.",
      },
    ],
    related: ["text", "text-text", "general", "time", "location", "weather", "workout", "debug"],
  },
  {
    id: "chat",
    title: "Chat and text to speech",
    summary: "Show, filter and read chat aloud from Twitch, Kick, YouTube and more.",
    blocks: [
      {
        type: "p",
        text:
          "Moblin shows chat from the platforms configured on the selected stream. Turn chat on " +
          "or off in Settings → Chat → Enabled. Use the Chat quick button to read and send " +
          "messages, and Scrollable chat to scroll the on-screen chat.",
      },
      {
        type: "list",
        items: [
          "Settings → Chat → Appearance: font, timestamps, badges, animated emotes, colors, " +
            "background and border.",
          "Settings → Chat → Layout: new messages at top and mirrored chat.",
          "BTTV, FFZ and 7TV emotes are turned on per stream in Settings → Streams → <your " +
            "stream> → Emotes. Streams created with the wizard start with them off.",
          "To show chat on stream, add a Chat widget to a scene.",
        ],
      },
      { type: "h", text: "Text to speech" },
      {
        type: "p",
        text:
          "Turn on Settings → Chat → Text to speech to have messages read aloud. Choose voices " +
          "(or TTS.Monster with an API token), pause between messages, default language or " +
          "Detect language per message, and options such as Say username, Subscribers only, " +
          "Filter, Filter mentions and Bluetooth speaker only. The Skip current TTS and Pause " +
          "TTS quick buttons control it while live.",
      },
      { type: "h", text: "Filters and nicknames" },
      {
        type: "p",
        text:
          "With Show all settings on, Settings → Chat → Filters matches messages by username and " +
          "message start, and decides whether they are shown in chat or the activity feed, read " +
          "by text to speech, handled by the chat bot, counted in polls or printed. The first " +
          "matching filter is used. Nicknames replace usernames in chat.",
      },
    ],
    related: [
      "settings-chat",
      "appearance",
      "layout",
      "text-to-speech",
      "tts-monster",
      "filters",
      "nicknames",
      "emotes",
      "widget-chat",
    ],
  },
  {
    id: "alerts",
    title: "Alerts",
    summary: "Show follow, subscription, raid and other alerts on stream with sound and speech.",
    blocks: [
      {
        type: "steps",
        items: [
          "For Twitch alerts, log in to Twitch in Settings → Streams → <your stream> → Twitch. " +
            "Kick events only need the channel name.",
          "Create a widget of type Alerts in Settings → Scenes and add it to your scenes.",
          "Open the widget and pick an alert, for example Twitch → Follows or Kick → Gift " +
            "subscriptions, and turn it on.",
          "Choose the media (GIF and sound, or Video), the position (Scene or Face), text colors " +
            "and font.",
          "Optionally turn on Text to speech for the alert and pick voices.",
        ],
      },
      {
        type: "list",
        items: [
          "Twitch: follows, subscriptions, raids and cheers. For cheers, the first item that " +
            "matches the cheered bits is played.",
          "Kick: subscriptions, gift subscriptions, hosts, rewards and kicks.",
          "Chat bot: trigger an alert with the chat message !moblin alert <name>.",
          "Speech to text: trigger an alert when you say a given string.",
        ],
      },
      {
        type: "tip",
        text:
          "Add your own GIFs and sounds under My images and My sounds. Download enhanced and " +
          "premium voices in iOS Settings → Accessibility → Live Speech → Preferred Voices.",
      },
    ],
    related: [
      "alerts",
      "alerts-twitch",
      "follows",
      "cheers",
      "alerts-kick",
      "speech-to-text",
      "voices",
      "my-images",
      "my-sounds",
    ],
  },
  {
    id: "chat-bot",
    title: "Chat bot",
    summary: "Let you and your moderators control Moblin with !moblin chat commands.",
    blocks: [
      {
        type: "p",
        text:
          "The chat bot reacts to chat messages starting with !moblin, for example to switch " +
          "scene, take a snapshot, trigger an alert or turn text to speech on and off. The full " +
          "command list is on the Chat bot commands page.",
      },
      {
        type: "steps",
        items: [
          "Turn on Settings → Chat → Bot.",
          "Open Bot → Commands and pick a command to set who may use it: Moderators, Subscribers " +
            "(with a Minimum subscriber tier) and Others, plus an optional Cooldown.",
          "Turn on Send chat responses to reply in chat, for example when a user is not allowed " +
            "to run a command.",
        ],
      },
      {
        type: "p",
        text:
          "You can always use all commands. Moderators are allowed by default, while " +
          "subscribers and others are not. Cooldowns do not apply to you and your moderators.",
      },
      {
        type: "list",
        items: [
          "Custom commands: !moblin custom <name> sends a configured text to chat.",
          "Aliases: replace a short command with a longer one.",
          "!moblin ai ask <question> needs an OpenAI compatible service (base URL, API key and " +
            "model).",
        ],
      },
      {
        type: "tip",
        text:
          "With Show all settings on, set Estimated viewer delay in Settings → Streams → <your " +
          "stream>. It makes snapshots taken by the chat bot match what viewers saw, without " +
          "delaying the stream.",
      },
    ],
    related: ["bot", "commands", "custom-commands", "aliases", "moblin-ai-ask-question"],
  },
  {
    id: "recording-replays-snapshots",
    title: "Recording, replays and snapshots",
    summary: "Record to disk, show instant replays and share snapshots to Discord.",
    blocks: [
      { type: "h", text: "Recording" },
      {
        type: "p",
        text:
          "Tap the Record quick button to record to an MP4 file, live or not. Find recordings in " +
          "Settings → Recordings. With Show all settings on, Settings → Streams → <your stream> " +
          "→ Recording lets you override resolution, codec and bitrate, pick a Recording path " +
          "folder, record without widgets (Clean recordings) and start and stop recording " +
          "automatically with the stream.",
      },
      {
        type: "tip",
        text:
          "Recordings are saved as variable frame rate fragmented MP4 to survive crashes. " +
          "Settings → Recordings shows ffmpeg commands to convert them to standard MP4.",
      },
      { type: "h", text: "Replays" },
      {
        type: "p",
        text:
          "Turn on Settings → Streams → <your stream> → Replay → Enabled. The Replay quick " +
          "button lets you save and play replays, and Instant replay saves the last moments and " +
          "plays them right away. Post trigger delay sets how many seconds are recorded after " +
          "the button is pressed.",
      },
      { type: "h", text: "Snapshots" },
      {
        type: "p",
        text:
          "The Snapshot quick button takes a snapshot, and a Snapshot widget shows it on stream. " +
          "Photo shoot takes clean pictures periodically.",
      },
      {
        type: "steps",
        items: [
          "Create a webhook in your Discord server's settings and copy its URL.",
          "With Show all settings on, paste it as Webhook URL in Settings → Streams → <your " +
            "stream> → Snapshot. Use Chat bot webhook URL for snapshots taken with the chat bot.",
          "Turn on Only when live to upload only while streaming.",
        ],
      },
      {
        type: "p",
        text:
          "Go live notification (also with Show all settings on) can post a message and a " +
          "snapshot to Discord when you go live.",
      },
    ],
    related: [
      "recording",
      "recording-path",
      "replay",
      "snapshot",
      "widget-snapshot",
      "go-live-notification",
      "discord",
    ],
  },
  {
    id: "location",
    title: "Location, maps and RealtimeIRL",
    summary: "Share where you are with a map widget, location text and RealtimeIRL.",
    blocks: [
      {
        type: "steps",
        items: [
          "Turn on Settings → Location → Enabled and allow Moblin to access your location in " +
            "iOS Settings.",
          "Add a Map widget to a scene. Turn off North up to rotate the map with your direction " +
            "of movement.",
          "Add location variables such as {city}, {speed} or {distance} to a text widget.",
        ],
      },
      {
        type: "list",
        items: [
          "Reset when going live resets distances, average speed and slope. Split resets the " +
            "split distance.",
          "Privacy regions: your location is not shared with any service while you are inside " +
            "one.",
          "RealtimeIRL sends your location to https://rtirl.com. With Show all settings on, " +
            "enter your Push key in Settings → Streams → <your stream> → RealtimeIRL.",
          "Viewers can zoom out the map widget temporarily with !moblin map zoom out.",
        ],
      },
    ],
    related: ["map-location", "map", "location", "realtimeirl"],
  },
  {
    id: "remote-control",
    title: "Remote control",
    summary: "Monitor and control the streaming phone from another device or a web browser.",
    blocks: [
      {
        type: "p",
        text:
          "An assistant (another device running Moblin, or a website) can monitor and control " +
          "the streamer device: change scene, mic, bitrate and zoom, update scoreboards, play " +
          "replays and see a video preview. Turn on Show all settings to see Settings → Remote " +
          "control.",
      },
      { type: "h", text: "Streamer and assistant" },
      {
        type: "steps",
        items: [
          "Set the same Password in Settings → Remote control on both devices.",
          "On the assistant device, go to Assistant and tap Create. The new streamer entry has " +
            "the assistant enabled on port 2345. Copy one of its URLs.",
          "On the streamer device, go to Streamer, turn on Enabled and enter the copied URL as " +
            "Assistant URL.",
          "On the assistant device, select the streamer as Current streamer and use the Remote " +
            "quick button to control it.",
        ],
      },
      {
        type: "p",
        text:
          "If the assistant is behind CGNAT or similar, enable Relay on the streamer entry and " +
          "use the relay URL. As an alternative to an assistant device, the Assistant page links " +
          "to websites that work as assistants.",
      },
      { type: "h", text: "Web remote control" },
      {
        type: "p",
        text:
          "Settings → Remote control → Web → Enabled lets any browser on your network monitor " +
          "and control the device (port 80 by default). There is no authentication or " +
          "encryption, so be careful.",
      },
      {
        type: "tip",
        text:
          "Settings → Scenes → Remote scene (with Show all settings on) shows the widgets of a " +
          "scene on the device the assistant is connected to.",
      },
    ],
    related: [
      "settings-remote-control",
      "settings-remote-control-streamer",
      "settings-remote-control-assistant",
      "web",
      "scenes",
    ],
  },
  {
    id: "ingests",
    title: "Ingests: drones, DJI, GoPro and other cameras",
    summary: "Receive video from drones, action cameras and other phones and use it in scenes.",
    blocks: [
      {
        type: "p",
        text:
          "Ingests let Moblin receive video from other devices over the network and use it as a " +
          "camera. Turn on Show all settings at the bottom of Settings to see Settings → " +
          "Ingests.",
      },
      {
        type: "list",
        items: [
          "Servers that devices send to: RTMP server (port 1935 by default), SRT(LA) server " +
            "(SRT 4000, SRTLA 5000), RIST server (6500) and WHIP server (8310).",
          "Clients that pull from a server: SRT client, RTSP client and WHEP client.",
        ],
      },
      {
        type: "steps",
        items: [
          "Open a server, add a stream (each stream receives one publisher) and turn the server " +
            "on. Disable the server to change its settings.",
          "Enter one of the stream's publish URLs in the sending device, usually the WiFi or " +
            "Personal Hotspot URL.",
          "In Settings → Scenes → <your scene> → Video source, pick the stream by name. It can " +
            "also be shown with a Video source widget.",
        ],
      },
      {
        type: "p",
        text:
          "Increase a stream's Latency if the video stutters (2000 ms by default, 100 ms for " +
          "WHIP). Talkback plays audio from an ingest in your speakers.",
      },
      { type: "h", text: "DJI cameras" },
      {
        type: "p",
        text:
          "Settings → DJI devices controls DJI cameras over Bluetooth. Select the device, enter " +
          "the WiFi network it should use, and choose RTMP Server to stream into Moblin's RTMP " +
          "server or Custom for any RTMP destination. Then tap Start live stream, or use the DJI " +
          "devices quick button.",
      },
      { type: "h", text: "GoPro cameras" },
      {
        type: "p",
        text:
          "Settings → GoPro pairs HERO9 Black or newer over Bluetooth, with the same WiFi and " +
          "RTMP Server or Custom choices, plus resolution, maximum bitrate and lens. QR codes " +
          "creates launch live stream, WiFi credentials and RTMP URL QR codes that the GoPro " +
          "quick button shows.",
      },
    ],
    related: [
      "ingests",
      "rtmp-server",
      "srt-la-server",
      "rist-server",
      "whip-server",
      "srt-client",
      "rtsp-client",
      "whep-client",
      "talkback",
      "dji-devices",
      "dji-device",
      "gopro",
      "qr-codes",
    ],
  },
  {
    id: "mobcam",
    title: "Mobcam: the phone as a USB camera",
    summary: "Use Moblin as a low latency camera in OBS Studio over a USB cable.",
    blocks: [
      {
        type: "steps",
        items: [
          "Install the Mobcam OBS Plugin on the computer.",
          "In Moblin, open the create stream wizard (Settings → Streams → Create) and pick " +
            "Mobcam, then name the stream and tap Create.",
          "Connect the phone to the computer with a USB cable.",
          "Add a Mobcam source in OBS.",
          "Tap Go Live in Moblin to start the stream to OBS.",
        ],
      },
      {
        type: "p",
        text:
          "Mobcam streams use a mobcam:// URL and the wizard sets H.265/HEVC video. Turn on Auto " +
          "go live on the stream to automatically go live when the app enters the foreground.",
      },
    ],
    related: ["stream", "streams"],
  },
  {
    id: "apple-watch",
    title: "Apple Watch",
    summary: "See status and chat and control your stream from the Apple Watch app.",
    blocks: [
      {
        type: "p",
        text:
          "The Moblin Apple Watch app shows a stream preview, audio level, bitrate, number of " +
          "viewers, the iPhone's thermal state and chat. From the watch you can zoom, switch " +
          "scene, go live, record, mute, skip the current TTS message, use instant replay, " +
          "create stream markers, start workouts and update padel and generic scoreboards.",
      },
      {
        type: "list",
        items: [
          "Settings → Apple Watch is shown on iPhone when Show all settings is on.",
          "Chat: timestamps, badges and notifications on new messages.",
          "Display: choose local overlays such as thermal state, audio level and bitrate.",
          "Remote control assistant makes the watch act as a remote control assistant, but then " +
            "chat, skip current TTS and a few other features are not supported.",
        ],
      },
    ],
    related: ["apple-watch", "apple-watch-chat", "apple-watch-display"],
  },
  {
    id: "deep-links-and-settings",
    title: "Deep links, import and export",
    summary: "Share stream setups with moblin:// links and back up your settings.",
    blocks: [
      {
        type: "p",
        text:
          "A moblin:// deep link contains a URL encoded JSON blob that imports settings, for " +
          "example a new stream with its URL, video, SRT(LA), Twitch, Kick and OBS settings, " +
          "quick buttons or the web browser home page. Opening one asks for confirmation. " +
          "Settings cannot be imported while live or recording.",
      },
      {
        type: "steps",
        items: [
          "Turn on Show all settings at the bottom of Settings.",
          "Open Settings → Deep link creator and fill in Streams, Quick buttons or Web browser.",
          "A QR code and a Copy to clipboard button appear once something differs from the " +
            "defaults.",
        ],
      },
      { type: "h", text: "Import and export settings" },
      {
        type: "p",
        text:
          "Settings → Import and export settings (with Show all settings on) exports all " +
          "settings and imports them from a file or the clipboard. Do not share exported " +
          "settings, as they may contain stream keys. Exporting from one device and importing " +
          "on another is not recommended; deep links work on any device.",
      },
    ],
    related: [
      "deep-link-creator",
      "deep-link-creator-streams",
      "deep-link-creator-quick-buttons",
      "settings",
    ],
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting",
    summary: "Fixes for hidden settings, greyed out options and unstable streams.",
    blocks: [
      {
        type: "list",
        items: [
          "Cannot find a setting? Turn on Show all settings at the bottom of Settings. It shows " +
            "for example Ingests, Remote control, Audio, Macros, DJI devices, GoPro, Apple " +
            "Watch, Debug, and per stream Recording, Snapshot and the SRT(LA) page.",
          "A setting is greyed out? Settings that would stop the stream are disabled while " +
            "live. End the stream first.",
          "Bitrate is under Settings → Streams → <your stream> → Video when Show all settings is " +
            "on. While live, use the Bitrate quick button.",
          "Unstable stream? Use SRT(LA) with adaptive bitrate instead of streaming directly with " +
            "RTMP, or stream through OBS or a bonding server.",
          "Low SRT latency: the Moblin SRT implementation does not perform well below 1000 ms. " +
            "Select the Official implementation in the SRT(LA) settings.",
          "Streaming over an Android hotspot fails? Try turning off Big packets in the SRT(LA) " +
            "settings.",
          "Video or audio issues in OBS? Use Fix in the OBS quick button, or !moblin obs fix in " +
            "chat.",
        ],
      },
      {
        type: "tip",
        text:
          "Need more help? Settings → Help and support links to the Moblin Discord server and " +
          "GitHub.",
      },
    ],
    related: ["settings", "srt-la", "video", "obs-remote-control", "settings-debug"],
  },
];
