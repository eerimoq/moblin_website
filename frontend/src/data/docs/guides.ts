import type { CardId } from "../../cardArt";
import { t } from "../../i18n";

export type GuideBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "steps"; items: string[] }
  | { type: "list"; items: string[]; links?: Record<string, { text: string; url: string }> }
  | { type: "tip"; text: string }
  | { type: "links"; items: { text: string; url: string }[] }
  | { type: "video"; id: string }
  | { type: "card"; id: CardId };

export type Guide = {
  id: string;
  title: string;
  summary: string;
  card?: CardId;
  blocks: GuideBlock[];
  related: string[];
};

export const guides: Guide[] = [
  {
    id: "getting-started",
    title: t("Getting started: your first stream"),
    summary: t("Create a stream with the wizard, select it and go live."),
    blocks: [
      {
        type: "p",
        text: t("A stream is a saved destination with its own video, audio and platform settings."),
      },
      { type: "h", text: t("Create a stream") },
      {
        type: "steps",
        items: [
          t("Tap the gear icon in the control bar to open Settings."),
          t("Go to Settings → Streams and tap Create."),
          t(
            "Pick the platform: Twitch, Kick, YouTube, SOOP or OBS, Mobcam to use the phone " +
              "as a USB camera, or Custom for any other server.",
          ),
          t(
            "Fill in the platform page and tap Next. Logging in is optional but simplifies " +
              "the setup.",
          ),
          t("Choose a network setup (see below)."),
          t("On the General page, name the stream and tap Create."),
        ],
      },
      { type: "h", text: t("Network setups") },
      {
        type: "list",
        items: [
          t("Moblin → OBS → platform: good stability in most network conditions."),
          t(
            "Moblin → BELABOX cloud → OBS → platform: bonding, through a paid third-party " +
              "service.",
          ),
          t("Moblin → platform: direct, often unstable on a bad connection."),
          t("Moblin → My server(s) → platform: the most flexible setup."),
        ],
      },
      { type: "h", text: t("Select a stream and go live") },
      {
        type: "steps",
        items: [
          t(
            "A new stream is selected automatically. To select another, turn on its toggle in" +
              " Settings → Streams.",
          ),
          t("Close Settings, tap Go Live in the control bar and confirm. Tap End to stop."),
        ],
      },
      { type: "h", text: t("Good to know") },
      {
        type: "list",
        items: [
          t("Resolution, FPS and codec are in Settings → Streams → <your stream> → Video."),
          t("The stream URL is in Settings → Streams → <your stream> → URL."),
          t("Swipe left on a stream in the list to duplicate or delete it."),
          t(
            "The Switch stream quick button switches to another stream and goes live " +
              "automatically.",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "Many settings are hidden until you turn on Show all settings at the bottom of " +
            "Settings. Settings that would stop the stream are disabled while you are live.",
        ),
      },
    ],
    related: ["streams", "stream", "stream-video", "settings"],
  },
  {
    id: "quick-buttons",
    title: t("Quick buttons and the control bar"),
    summary: t("Choose which quick buttons are shown in the control bar and how they look."),
    blocks: [
      {
        type: "p",
        text: t(
          "Quick buttons toggle features or open panels. They sit in the control bar on up " +
            "to five pages. Tap the page dots to switch page.",
        ),
      },
      { type: "h", text: t("Choose your buttons") },
      {
        type: "steps",
        items: [
          t("Go to Settings → Display → Quick buttons."),
          t("Turn buttons on or off in the page lists. Use Filter to find a button by name."),
          t("Tap a button to set its page and background color."),
          t(
            "Under Appearance, choose Big buttons and Show name. Scroll and Two columns " +
              "appear when Show all settings is on.",
          ),
        ],
      },
      {
        type: "tip",
        text: t("Long press any quick button in the control bar to open its settings directly."),
      },
      { type: "h", text: t("Find a button quickly") },
      {
        type: "p",
        text: t(
          "Double tap the control bar outside the buttons, or on iOS 18 and later drag the " +
            "quick buttons past their end, and type a few letters. Each word matches the " +
            "start of a word in the button name, so “s w” finds Scene widgets.",
        ),
      },
      { type: "h", text: t("Useful buttons") },
      { type: "card", id: "pixellate" },
      {
        type: "list",
        items: [
          t(
            "Stream: set title and category on Twitch and Kick, manage YouTube streams and, " +
              "with Show all settings on and a go live notification configured, send it.",
          ),
          t("Bitrate: pick one of your bitrate presets, also while live."),
          t(
            "Moderation: moderate your Twitch and Kick chat, and raid another channel when " +
              "you end the stream.",
          ),
          t("Sound board: play sounds from the alerts sound library."),
          t(
            "Scene widgets: turn widgets in the current scene on and off and control timers, " +
              "scoreboards, wheel of luck, bingo cards and Pomodoro timers.",
          ),
          t("Scene editor: move and resize the widgets of your scenes on top of the video."),
          t("Stealth mode: shows a black screen, or an image you select, instead of the app."),
          t("Local overlays: shows or hides the on-screen status information."),
          t("Effects such as Movie, Gray scale, Pixellate, Blur faces and Beauty."),
        ],
      },
      { type: "h", text: t("Zoom and scene controls") },
      { type: "video", id: "5v07BwaDe0s" },
      {
        type: "p",
        text: t(
          "The zoom preset and scene buttons are shown on top of the video, never on " +
            "stream. Settings → Display → Zoom and scene controls sets their layout in " +
            "landscape:",
        ),
      },
      {
        type: "list",
        items: [
          t("Stacked: zoom buttons above the scene buttons."),
          t("One row: zoom buttons to the left and scene buttons to the right."),
          t("Vertical zoom: zoom buttons in a column, scene buttons in a row."),
          t("Vertical scenes: scene buttons in a column, zoom buttons in a row."),
          t("Vertical: both in columns."),
        ],
      },
      {
        type: "p",
        text: t(
          "Big buttons on the same page makes them larger. With Show all settings on, " +
            "Buttons and Slider under Zoom show or hide the zoom preset buttons and the zoom " +
            "slider.",
        ),
      },
      { type: "h", text: t("Status and other display settings") },
      {
        type: "list",
        items: [
          t(
            "Settings → Display → Status chooses the status information shown on top of the " +
              "video. Most of it needs Show all settings.",
          ),
          t(
            "Settings → Display also has the control bar Background and, with Show all " +
              "settings on, Low bitrate warning.",
          ),
        ],
      },
    ],
    related: [
      "quick-buttons",
      "button",
      "stream-button",
      "display",
      "zoom-and-scene-controls",
      "status",
    ],
  },
  {
    id: "twitch",
    title: t("Streaming to Twitch"),
    summary: t("Set up a Twitch stream with chat, viewer count, alerts, title and category."),
    blocks: [
      { type: "h", text: t("Create the stream") },
      {
        type: "steps",
        items: [
          t("Open the create stream wizard (Settings → Streams → Create) and pick Twitch."),
          t(
            "Tap Login. It is optional, but fills in your channel name, channel id and stream" +
              " key.",
          ),
          t("Without login, enter your Channel name, and optionally the Channel id."),
          t(
            "Pick a network setup. Moblin → Twitch needs the Nearby ingest endpoint and " +
              "Stream key, both prefilled when logged in.",
          ),
          t("Name the stream on the General page and tap Create."),
        ],
      },
      { type: "h", text: t("What needs a login") },
      {
        type: "list",
        items: [
          t("Chat only needs the channel name."),
          t("Viewer count needs login and the channel id."),
          t("Alerts, and setting the title and category, need login."),
        ],
      },
      { type: "h", text: t("Twitch settings") },
      {
        type: "p",
        text: t(
          "Log in later and set Title and Category in Settings → Streams → <your stream> → " +
            "Twitch. Under Alerts, choose which events (follows, subscriptions, rewards, " +
            "raids, bits, watch streaks) are shown in Chat and as Toasts.",
        ),
      },
      {
        type: "tip",
        text: t(
          "While live, the Stream quick button changes title and category without opening " +
            "Settings, and the Stream marker quick button creates a stream marker.",
        ),
      },
      { type: "h", text: t("Raid a channel") },
      { type: "video", id: "r-60-f4prss" },
      {
        type: "steps",
        items: [
          t("Tap the Moderation quick button and go to Twitch → Raid channel."),
          t(
            "Search for a channel, or pick one under Raided before, Raided you or Followed " +
              "channels.",
          ),
          t("Tap Raid on the channel."),
        ],
      },
    ],
    related: ["twitch", "category", "twitch-chat", "emotes", "streams"],
  },
  {
    id: "kick",
    title: t("Streaming to Kick"),
    summary: t("Set up a Kick stream with chat, viewer count, events, title and category."),
    blocks: [
      { type: "h", text: t("Create the stream") },
      {
        type: "steps",
        items: [
          t("Open the create stream wizard (Settings → Streams → Create) and pick Kick."),
          t("Tap Login (optional, but simplifies the setup), or enter your Channel name."),
          t(
            "Pick a network setup. For Moblin → Kick, copy the Stream URL and Stream key from" +
              " https://kick.com/dashboard/settings/stream (requires login).",
          ),
          t("Name the stream on the General page and tap Create."),
        ],
      },
      { type: "h", text: t("Kick settings") },
      {
        type: "list",
        items: [
          t("Chat and viewer count only need the channel name."),
          t(
            "When logged in, Settings → Streams → <your stream> → Kick lets you set Title and" +
              " Category.",
          ),
          t(
            "Under Alerts, choose which events are shown in Chat and as Toasts: " +
              "subscriptions, gift subscriptions, rewards, hosts, kicks (with a minimum) and, " +
              "in chat, bans and timeouts.",
          ),
        ],
      },
    ],
    related: ["kick", "kick-category", "kick-chat", "emotes"],
  },
  {
    id: "youtube",
    title: t("Streaming to YouTube"),
    summary: t("Set up a YouTube stream, get chat working and manage scheduled streams."),
    blocks: [
      { type: "h", text: t("Create the stream") },
      {
        type: "steps",
        items: [
          t("Open the create stream wizard (Settings → Streams → Create) and pick YouTube."),
          t(
            "Tap Login. It is optional, but fetches your channel handle, stream URL and " +
              "stream key.",
          ),
          t(
            "Without login, enter your Channel handle (only needed for chat), and for Moblin " +
              "→ YouTube copy the Stream URL and Stream key from youtube.com.",
          ),
          t("Name the stream on the General page and tap Create."),
        ],
      },
      { type: "h", text: t("Chat and viewers") },
      {
        type: "list",
        items: [
          t(
            "Chat is tied to the Video ID of each live stream. When you go live, Moblin tries" +
              " for up to a minute to fetch it. You must be live on YouTube for this to work.",
          ),
          t(
            "You can also tap Fetch Video IDs or enter Video IDs manually in Settings → " +
              "Streams → <your stream> → YouTube.",
          ),
          t("The viewer count needs login."),
        ],
      },
      { type: "h", text: t("Manage streams") },
      {
        type: "p",
        text: t(
          "When logged in, Manage streams in the YouTube settings lets you schedule a " +
            "stream before going live (Title, Visibility and Auto-stop), end live streams and" +
            " delete upcoming ones.",
        ),
      },
    ],
    related: ["youtube", "chat", "streaming-platforms"],
  },
  {
    id: "obs-and-own-server",
    title: t("Streaming to OBS or your own server"),
    summary: t("Send SRT(LA) to OBS or a server and let Moblin switch OBS scenes for you."),
    blocks: [
      {
        type: "p",
        text: t(
          "Streaming to OBS on a computer, which then streams to the platform, is more " +
            "stable than streaming directly. OBS can also show a BRB scene when your " +
            "connection drops.",
        ),
      },
      { type: "h", text: t("Set up with the wizard") },
      {
        type: "steps",
        items: [
          t(
            "Settings → Streams → Create → OBS (or pick a platform and the Moblin → OBS → " +
              "platform network setup).",
          ),
          t(
            "Enter the IP address or domain name of the OBS computer (your public IP address " +
              "if streaming over the internet) and a Port. Configure port forwarding in your " +
              "router.",
          ),
          t("In OBS, create a Media Source configured as shown in the wizard, with your port."),
          t(
            "Optionally enable OBS remote control (see below), then name the stream and tap " +
              "Create. Moblin creates an srt:// stream using H.265/HEVC.",
          ),
        ],
      },
      { type: "h", text: t("OBS remote control and BRB scene") },
      {
        type: "steps",
        items: [
          t(
            "In OBS, open Tools → WebSocket Server Settings → Show Connect Info and copy the " +
              "URL and password.",
          ),
          t(
            "Enter them in Settings → Streams → <your stream> → OBS remote control, together " +
              "with your Main scene, BRB scene and the Source name that receives the stream " +
              "from Moblin.",
          ),
          t(
            "Turn on Streaming directly to OBS. Moblin then switches to the BRB scene when " +
              "the stream is likely broken, and back to the main scene once it works again.",
          ),
        ],
      },
      {
        type: "list",
        items: [
          t(
            "The OBS quick button switches scenes, starts and stops OBS streaming and " +
              "recording, mutes audio inputs, adjusts audio sync and can Fix the source.",
          ),
          t(
            "With Show all settings on, OBS streaming and recording can start and stop " +
              "automatically when you go live and end.",
          ),
        ],
      },
      { type: "h", text: t("Your own server") },
      {
        type: "list",
        items: [
          t(
            "Pick Custom in the wizard (SRT(LA), RTMP(S), RIST or WHIP), or the My server(s) " +
              "network setup (SRT(LA) or RTMP(S)), to stream to an SRT server, SRTLA receiver " +
              "or BELABOX cloud.",
          ),
          t(
            "With Show all settings on, Settings → Streams → <your stream> → SRT(LA) has " +
              "Latency (3000 ms by default), adaptive bitrate and connection priorities.",
          ),
        ],
      },
    ],
    related: ["obs-remote-control", "srt-la", "adaptive-bitrate", "stream", "rist"],
  },
  {
    id: "bonding",
    title: t("Bonding with SRTLA and Moblink"),
    summary: t("Combine cellular, WiFi, Ethernet and other phones into one stable connection."),
    card: "bonding",
    blocks: [
      {
        type: "p",
        text: t(
          "With an srtla:// URL (or RIST with bonding), Moblin sends the stream over " +
            "cellular, WiFi and Ethernet at the same time. The receiving server, for example " +
            "BELABOX cloud, puts it back together.",
        ),
      },
      { type: "h", text: t("Adaptive bitrate") },
      {
        type: "p",
        text: t(
          "On by default, it lowers the bitrate when the network cannot keep up. With Show " +
            "all settings on, choose the algorithm in Settings → Streams → <your stream> → " +
            "SRT(LA) → Adaptive bitrate. BELABOX (the default) and Fast IRL are the safest.",
        ),
      },
      { type: "h", text: t("Connection priorities") },
      {
        type: "list",
        items: [
          t("Only SRTLA supports connection priorities."),
          t(
            "A stable connection with high priority is used more than one with low priority. " +
              "Disabled connections are not used.",
          ),
          t(
            "Set them in Settings → Streams → <your stream> → SRT(LA) → Connection " +
              "priorities, or with the Connection priorities quick button.",
          ),
        ],
      },
      { type: "h", text: t("Moblink: phones as extra connections") },
      { type: "card", id: "moblink" },
      {
        type: "steps",
        items: [
          t(
            "On the streaming device, go to Settings → Moblink, set a Password and turn on " +
              "Enabled under Streamer.",
          ),
          t(
            "On each extra phone, install Moblink on Android or use Moblin on another iPhone," +
              " enter the same password and turn on Enabled under Relay. The relay device must " +
              "have cellular data enabled.",
          ),
          t(
            "The relay finds streamers on your local network. Turn on Manual to enter one of " +
              "the streamer's URLs as Streamer URL instead.",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "Turn on the Bonding and Bonding RTTs local overlays (Settings → Display → " +
            "Status, with Show all settings on) to see how each connection performs.",
        ),
      },
    ],
    related: ["srt-la", "adaptive-bitrate", "rist", "moblink", "status"],
  },
  {
    id: "scenes-and-widgets",
    title: t("Scenes and widgets"),
    summary: t("Build scenes from a camera and widgets such as text, images, browsers and maps."),
    blocks: [
      {
        type: "p",
        text: t(
          "A scene has a video source (a camera, screen capture, ingest or media player) " +
            "and a list of widgets. A widget can be used in zero or more scenes. Switch " +
            "scenes with the scene buttons on top of the video.",
        ),
      },
      { type: "h", text: t("Create a scene") },
      {
        type: "p",
        text: t(
          "Go to Settings → Scenes and tap Create under Scenes. The wizard asks for a name," +
            " a video source and the widgets to add.",
        ),
      },
      { type: "h", text: t("Create a widget and add it to a scene") },
      {
        type: "steps",
        items: [
          t("Go to Settings → Scenes and tap Create under Widgets."),
          t("Pick a Type, give it a Name, configure it and choose the scenes to add it to."),
          t(
            "To add a widget from the scene itself, open the scene and tap Create or Add " +
              "under Widgets.",
          ),
          t(
            "Open the widget from the scene to set its alignment, position and size. Save " +
              "layout and Load layout reuse a position in other scenes.",
          ),
        ],
      },
      { type: "h", text: t("Scene editor") },
      {
        type: "p",
        text: t(
          "The Scene editor quick button outlines each widget on top of the video, so you " +
            "see the result while you change it.",
        ),
      },
      {
        type: "list",
        items: [
          t(
            "Tap a widget to select it, drag it to move it and drag its handle to resize it. " +
              "It snaps to the edges and center of the video and to other widgets.",
          ),
          t(
            "With a widget selected, the buttons show or hide it, change its alignment and " +
              "layer, open its settings and remove it.",
          ),
          t(
            "With no widget selected, the buttons switch, create and delete scenes and add " +
              "widgets.",
          ),
        ],
      },
      { type: "h", text: t("Widget types") },
      { type: "card", id: "pip" },
      {
        type: "list",
        items: [
          t("Text: text, clock, weather, location, timers and much more."),
          t("Image, Browser (a web page), QR code and Slideshow."),
          t("Video source: another camera or screen capture, for picture in picture."),
          t("Map: a map with your location."),
          t("Alerts, Chat and Chat emote combo for viewer interaction."),
          t("Scene: shows another scene's widgets."),
          t(
            "VTuber and PNGTuber, Scoreboard, Wheel of luck, Bingo card, Pomodoro timer, " +
              "Snapshot and Crop.",
          ),
        ],
      },
      { type: "h", text: t("Effects") },
      {
        type: "p",
        text: t(
          "Image, browser, video source, map and QR code widgets have an Effects section, " +
            "with for example Shape, Remove background, Dewarp 360, LUT, Opacity and Mask.",
        ),
      },
      {
        type: "tip",
        text: t(
          "With Show all settings on, Settings → Scenes also has Scene switching, Auto " +
            "scene switchers and Disconnect protection, which shows a fallback scene when the" +
            " video source disconnects.",
        ),
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
    title: t("Text widget variables"),
    summary: t("Show live data such as time, speed, weather and bitrate in a text widget."),
    card: "textwidget",
    blocks: [
      {
        type: "p",
        text: t(
          "A text widget's text can contain variables in curly braces that Moblin replaces " +
            "with live values.",
        ),
      },
      { type: "h", text: t("Add variables") },
      {
        type: "steps",
        items: [
          t("Open Settings → Scenes → <your text widget> → Text."),
          t("Pick a ready-made text under Suggestions, or open a category under Variables."),
          t("Tap a variable to add it to the text."),
        ],
      },
      { type: "h", text: t("Examples") },
      {
        type: "list",
        items: [
          t("Time: {time}, {shortTime}, {date}, {timer}, {stopwatch}, {lapTimes}."),
          t(
            "Location: {country}, {countryFlag}, {city}, {speed}, {altitude}, {distance}, " +
              "{slope}.",
          ),
          t("Weather: {conditions}, {temperature}, {feelsLikeTemperature}, {wind}."),
          t("Workout: {heartRate}, {stepCount}, {cyclingPower}."),
          t("Streaming: {latestFollower}, {latestSubscriber}."),
          t("Debug: {bitrate}, {bitrateAndTotal}, {bonding}, {resolution}, {fps}."),
          t("General: {muted}, {checkbox}, {rating} and {gForce}."),
          t("Language: {subtitles} for speech to text."),
        ],
      },
      {
        type: "tip",
        text: t(
          "Location and weather variables only update when Location is enabled. Control " +
            "timers, stopwatches, checkboxes and ratings while live with the Scene widgets " +
            "quick button.",
        ),
      },
    ],
    related: [
      "text",
      "text-text",
      "general",
      "time",
      "text-text-location",
      "weather",
      "workout",
      "text-text-debug",
    ],
  },
  {
    id: "chat",
    title: t("Chat and text to speech"),
    summary: t("Show, filter and read chat aloud from Twitch, Kick, YouTube and more."),
    card: "chat",
    blocks: [
      {
        type: "p",
        text: t("Moblin shows chat from the platforms configured on the selected stream."),
      },
      { type: "h", text: t("Read and send messages") },
      {
        type: "list",
        items: [
          t("Turn chat on or off in Settings → Chat → Enabled."),
          t(
            "The Chat quick button reads and sends messages. Messages you send go to all " +
              "platforms you are logged in to (Twitch and Kick).",
          ),
          t("The Scrollable chat quick button lets you scroll the on-screen chat."),
          t("To show chat on stream, add a Chat widget to a scene."),
        ],
      },
      { type: "h", text: t("Appearance and layout") },
      {
        type: "list",
        items: [
          t(
            "Settings → Chat → Appearance: font size, background and border. Timestamps, " +
              "badges, animated emotes and text colors need Show all settings.",
          ),
          t(
            "Settings → Chat → Layout: height, width and bottom position and, with Show all " +
              "settings on, New messages at top and Mirrored.",
          ),
        ],
      },
      { type: "h", text: t("Emotes") },
      {
        type: "list",
        items: [
          t(
            "BTTV, FFZ and 7TV emotes are turned on per stream in Settings → Streams → <your " +
              "stream> → Emotes. Streams created with the wizard start with them off.",
          ),
          t(
            "Reload emotes in Settings → Chat fetches them again, for example after the " +
              "channel added new ones.",
          ),
        ],
      },
      { type: "h", text: t("Text to speech") },
      {
        type: "steps",
        items: [
          t("Turn on Settings → Chat → Text to speech to have messages read aloud."),
          t("Choose voices, or TTS.Monster with an API token."),
          t(
            "Set the pause between messages and a default language, or Detect language per " +
              "message.",
          ),
        ],
      },
      {
        type: "list",
        items: [
          t("Options include Say username, Subscribers only and Bluetooth speaker only."),
          t("The Skip current TTS and Pause TTS quick buttons control it while live."),
        ],
      },
      { type: "h", text: t("Filters and nicknames") },
      {
        type: "list",
        items: [
          t(
            "With Show all settings on, Settings → Chat → Filters matches messages by " +
              "username and message start. The first matching filter is used.",
          ),
          t(
            "A filter decides whether a message is shown, read aloud, handled by the chat " +
              "bot, counted in polls or printed.",
          ),
          t("Nicknames replace usernames in chat."),
        ],
      },
    ],
    related: [
      "chat",
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
    title: t("Alerts"),
    summary: t(
      "Show follow, subscription, raid and other alerts on stream with sound and " + "speech.",
    ),
    blocks: [
      { type: "h", text: t("Set up an alert") },
      {
        type: "steps",
        items: [
          t(
            "For Twitch alerts, log in to Twitch in Settings → Streams → <your stream> → " +
              "Twitch. Kick events only need the channel name.",
          ),
          t("Create a widget of type Alerts in Settings → Scenes and add it to your scenes."),
          t(
            "Open the widget, pick an alert, for example Twitch → Follows or Kick → Gift " +
              "subscriptions, and turn it on.",
          ),
          t(
            "Choose the media (GIF and sound, or Video), the position (Scene or Face), text " +
              "colors and font.",
          ),
          t("Optionally turn on Text to speech for the alert and pick voices."),
        ],
      },
      { type: "h", text: t("Alert types") },
      {
        type: "list",
        items: [
          t(
            "Twitch: follows, subscriptions, raids and cheers. For cheers, the first item " +
              "that matches the cheered bits is played.",
          ),
          t("Kick: subscriptions, gift subscriptions, hosts, rewards and kicks."),
          t("Chat bot: trigger an alert with the chat message !moblin alert <name>."),
          t("Speech to text: trigger an alert when you say a given string."),
        ],
      },
      {
        type: "tip",
        text: t(
          "Add your own GIFs and sounds under My images and My sounds. Download enhanced " +
            "and premium voices in iOS Settings → Accessibility → Live Speech → Preferred " +
            "Voices.",
        ),
      },
    ],
    related: [
      "alerts",
      "alerts-twitch",
      "alert",
      "cheers",
      "alerts-kick",
      "speech-to-text",
      "voices",
      "my-images",
      "my-sounds",
    ],
  },
  {
    id: "moblin-cloud",
    title: t("Moblin Cloud: your tip page"),
    summary: t("Let viewers tip you from your own page on cloud.moblin.app."),
    blocks: [
      {
        type: "p",
        text: t(
          "Moblin Cloud gives you a tip page on cloud.moblin.app. Viewers tip you there in " +
            "the ways you turn on, and Moblin shows it on stream. The money goes straight to " +
            "your PayPal or Stripe account.",
        ),
      },
      { type: "h", text: t("Sign in and connect payments") },
      {
        type: "steps",
        items: [
          t("Open cloud.moblin.app and sign in with Twitch or Kick. Your page is ready."),
          t(
            "In Payments, connect PayPal or Stripe. Stripe asks for your country, which " +
              "cannot be changed later.",
          ),
          t(
            "Each way to tip has its own section in the dashboard. Turn on the ones you want " +
              "and set their amounts.",
          ),
        ],
      },
      { type: "h", text: t("Connect Moblin") },
      {
        type: "steps",
        items: [
          t(
            "In the dashboard's Moblin section, tap Show QR code and scan it with the camera " +
              "of the device running Moblin, or open the deep link on it. This turns on Moblin " +
              "Cloud with your key.",
          ),
          t(
            "Or copy the key, paste it in Settings → Moblin Cloud → Moblin Cloud key and turn" +
              " on Enabled. Settings → Moblin Cloud needs Show all settings, and is not " +
              "available on Mac.",
          ),
          t(
            "The device shows up as connected in the dashboard. Up to 5 devices can use the " +
              "same key.",
          ),
        ],
      },
      { type: "h", text: t("Show messages on stream") },
      {
        type: "p",
        text: t(
          "Messages always show up in Moblin's chat. To also show them as an alert on " + "stream:",
        ),
      },
      {
        type: "steps",
        items: [
          t(
            "Create a widget of type Alerts in Settings → Scenes and add it to the scenes you" +
              " stream with. An alerts widget you already use for Twitch or Kick works too.",
          ),
          t(
            "Optionally open the widget and change the message alert's media, position, " +
              "colors and text to speech under Moblin Cloud → Message.",
          ),
          t("In Settings → Moblin Cloud, pick the widget under Message."),
        ],
      },
      { type: "h", text: t("Let viewers tip to spin your wheel") },
      {
        type: "steps",
        items: [
          t(
            "Create a widget of type Wheel of luck in Settings → Scenes, add its options and " +
              "add it to the scenes you stream with.",
          ),
          t("In Settings → Moblin Cloud, pick the widget under Wheel of luck."),
          t(
            "Your tip page now draws your wheel with its options, and follows your changes to" +
              " them.",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "Viewers can only tip to spin the wheel while Moblin is connected with a wheel " +
            "picked. Other tips work all the time: those sent while Moblin is offline show up" +
            " when it connects.",
        ),
      },
      { type: "h", text: t("Test it and share your page") },
      {
        type: "steps",
        items: [
          t(
            "Each dashboard section has a free test, which shows up in Moblin like a real " +
              "tip.",
          ),
          t(
            "Copy your page's address from Tip page and put it in your chat, panels or bio, " +
              "or show it on stream with a QR code widget.",
          ),
        ],
      },
      { type: "h", text: t("More") },
      {
        type: "list",
        items: [
          t(
            "Subscribers: give your Twitch or Kick subscribers free tips every month, in the " +
              "dashboard sections that offer it.",
          ),
          t(
            "Assistants: add assistants in the dashboard. They can see your dashboard, send " +
              "tests and use the remote control, and you can turn on more for each of them.",
          ),
          t(
            "Spins go to the first connected device with a wheel picked. Other tips go to " +
              "every connected device.",
          ),
          t(
            "Keep your key to yourself. Reset key in the dashboard disconnects every device, " +
              "and each one needs the new key.",
          ),
        ],
      },
      { type: "h", text: t("Troubleshooting") },
      {
        type: "list",
        items: [
          t(
            "Messages only show up in chat? Pick an alerts widget under Settings → Moblin " +
              "Cloud → Message, add it to the current scene and check that Moblin Cloud → " +
              "Message is on in the widget.",
          ),
          t(
            "The page says the wheel is not available right now? Moblin is not connected, or " +
              "no wheel is picked under Settings → Moblin Cloud → Wheel of luck.",
          ),
          t(
            "A tip is sent but nothing shows? Add the widget to the scene you are in. The " +
              "dashboard's received lists show which devices got each one.",
          ),
          t(
            "Moblin says Failed to identify? Five devices are already connected with the key." +
              " Disconnect one, or update Moblin if it is old.",
          ),
        ],
      },
    ],
    related: ["moblin-cloud", "alerts", "alerts-moblin-cloud", "wheel-of-luck", "widget"],
  },
  {
    id: "chat-bot",
    title: t("Chat bot"),
    summary: t("Let you and your moderators control Moblin with !moblin chat commands."),
    card: "chatbot",
    blocks: [
      {
        type: "p",
        text: t(
          "The chat bot reacts to chat messages starting with !moblin, for example to " +
            "switch scene, take a snapshot or trigger an alert. The full command list is on " +
            "the Chat bot commands page.",
        ),
      },
      { type: "h", text: t("Turn it on") },
      {
        type: "steps",
        items: [
          t("Turn on Settings → Chat → Bot."),
          t(
            "Open Bot → Commands and pick a command to set who may use it: Moderators, " +
              "Subscribers (with a Minimum subscriber tier) and Others, plus an optional " +
              "Cooldown.",
          ),
          t(
            "Turn on Send chat responses to reply in chat, for example when a user is not " +
              "allowed to run a command.",
          ),
        ],
      },
      { type: "h", text: t("Who can run commands") },
      {
        type: "list",
        items: [
          t("You can always use all commands."),
          t(
            "Moderators are allowed by default, except for the scene, stream and macro " +
              "commands. Subscribers and others are not.",
          ),
          t("Cooldowns do not apply to you and your moderators."),
        ],
      },
      { type: "h", text: t("More commands") },
      {
        type: "list",
        items: [
          t("Custom commands: !moblin custom <name> sends a configured text to chat."),
          t("Aliases: replace a short command with a longer one."),
          t(
            "!moblin ai ask <question> needs an OpenAI compatible service (base URL, API key " +
              "and model).",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "With Show all settings on, set Estimated viewer delay in Settings → Streams → " +
            "<your stream>. It makes snapshots taken by the chat bot match what viewers saw, " +
            "without delaying the stream.",
        ),
      },
    ],
    related: ["bot", "commands", "custom-commands", "aliases", "moblin-ai-ask-question"],
  },
  {
    id: "recording-replays-snapshots",
    title: t("Recording, replays and snapshots"),
    summary: t("Record to disk, show instant replays and share snapshots to Discord."),
    blocks: [
      { type: "h", text: t("Recording") },
      {
        type: "list",
        items: [
          t("Tap the Record quick button to record to an MP4 file, live or not."),
          t("Find recordings in Settings → Recordings."),
          t(
            "With Show all settings on, Settings → Streams → <your stream> → Recording " +
              "overrides resolution, codec and bitrate, picks the folder, records without " +
              "widgets and starts and stops recording with the stream.",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "Recordings are fragmented MP4 to survive crashes. Settings → Recordings shows " +
            "ffmpeg commands to convert them to standard MP4.",
        ),
      },
      { type: "h", text: t("Replays") },
      {
        type: "steps",
        items: [
          t("Turn on Settings → Streams → <your stream> → Replay → Enabled."),
          t(
            "Use the Replay quick button to save and play replays, or Instant replay to save " +
              "the last moments and play them right away.",
          ),
        ],
      },
      {
        type: "p",
        text: t(
          "With Show all settings on, Post trigger delay sets how many seconds are recorded" +
            " after the button is pressed.",
        ),
      },
      { type: "h", text: t("Snapshots") },
      { type: "card", id: "snapshot" },
      {
        type: "list",
        items: [
          t("The Snapshot quick button takes a snapshot."),
          t("A Snapshot widget shows it on stream."),
          t("Photo shoot takes clean pictures periodically."),
        ],
      },
      { type: "h", text: t("Snapshots to Discord") },
      { type: "video", id: "MHUT8al6Wg8" },
      {
        type: "steps",
        items: [
          t("Create a webhook in your Discord server's settings and copy its URL."),
          t(
            "With Show all settings on, paste it as Webhook URL in Settings → Streams → <your" +
              " stream> → Snapshot. Use Chat bot webhook URL for snapshots taken with the chat " +
              "bot.",
          ),
          t("Turn on Only when live to upload only while streaming."),
        ],
      },
      {
        type: "list",
        items: [
          t(
            "While live, uploads are rate limited so they do not disturb the stream. Up to 20" +
              " snapshots are queued.",
          ),
          t(
            "Go live notification (also with Show all settings on) can post a message and a " +
              "snapshot to Discord when you go live.",
          ),
        ],
      },
    ],
    related: [
      "recording",
      "replay",
      "snapshot",
      "widget-snapshot",
      "go-live-notification",
      "discord",
    ],
  },
  {
    id: "location",
    title: t("Location, maps and RealtimeIRL"),
    summary: t("Share where you are with a map widget, location text and RealtimeIRL."),
    blocks: [
      { type: "h", text: t("Show your location") },
      {
        type: "steps",
        items: [
          t(
            "Turn on Settings → Location → Enabled and allow Moblin to access your location " +
              "in iOS Settings.",
          ),
          t(
            "Add a Map widget to a scene. Turn off North up to rotate the map with your " +
              "direction of movement.",
          ),
          t("Add location variables such as {city}, {speed} or {distance} to a text widget."),
        ],
      },
      { type: "h", text: t("Good to know") },
      {
        type: "list",
        items: [
          t(
            "Reset when going live resets distances, average speed and slope. Split resets " +
              "the split distance.",
          ),
          t(
            "Privacy regions: your location is not shared with any service while you are " +
              "inside one.",
          ),
          t(
            "RealtimeIRL sends your location to https://rtirl.com. With Show all settings on," +
              " enter your Push key in Settings → Streams → <your stream> → RealtimeIRL.",
          ),
          t("Viewers can zoom out the map widget temporarily with !moblin map zoom out."),
        ],
      },
    ],
    related: ["location", "map", "text-text-location", "realtimeirl"],
  },
  {
    id: "remote-control",
    title: t("Remote control"),
    summary: t("Monitor and control the streaming phone from another device or a web browser."),
    card: "remote",
    blocks: [
      {
        type: "p",
        text: t(
          "An assistant (another device running Moblin, or a website) can monitor and " +
            "control the streamer device: scene, mic, bitrate, zoom, scoreboards, replays and" +
            " a video preview. Settings → Remote control needs Show all settings.",
        ),
      },
      { type: "h", text: t("Streamer and assistant") },
      {
        type: "steps",
        items: [
          t("Set the same Password in Settings → Remote control on both devices."),
          t(
            "On the assistant device, go to Assistant and tap Create. The new streamer entry " +
              "has the assistant enabled on port 2345. Copy one of its URLs.",
          ),
          t(
            "On the streamer device, go to Streamer, turn on Enabled, tap Assistant and enter" +
              " the copied URL.",
          ),
          t(
            "On the assistant device, select the streamer as Current streamer and use the " +
              "Remote quick button to control it.",
          ),
        ],
      },
      {
        type: "list",
        items: [
          t(
            "If the assistant is behind CGNAT or similar, enable Relay on the streamer entry " +
              "and use the relay URL.",
          ),
          t(
            "Instead of an assistant device, the Assistant page links to websites that work " +
              "as assistants.",
          ),
        ],
      },
      { type: "h", text: t("Web remote control") },
      {
        type: "p",
        text: t(
          "Settings → Remote control → Web → Enabled lets any browser on your network " +
            "monitor and control the device (port 80 by default). There is no authentication " +
            "or encryption, so be careful.",
        ),
      },
      {
        type: "tip",
        text: t(
          "Settings → Scenes → Remote scene (with Show all settings on) shows the widgets " +
            "of a scene on the device the assistant is connected to.",
        ),
      },
    ],
    related: ["remote-control", "streamer", "assistant", "web", "scenes"],
  },
  {
    id: "ingests",
    title: t("Ingests: drones, DJI, GoPro and other cameras"),
    summary: t("Receive video from drones, action cameras and other phones and use it in scenes."),
    card: "ingests",
    blocks: [
      {
        type: "p",
        text: t(
          "Ingests let Moblin receive video from other devices over the network and use it " +
            "as a camera. Settings → Ingests needs Show all settings.",
        ),
      },
      { type: "h", text: t("Servers and clients") },
      {
        type: "list",
        items: [
          t(
            "Servers that devices send to: RTMP server (port 1935 by default), SRT(LA) server" +
              " (SRT 4000, SRTLA 5000), RIST server (6500) and WHIP server (8310).",
          ),
          t("Clients that pull from a server: SRT client, RTSP client and WHEP client."),
        ],
      },
      { type: "h", text: t("Receive a stream") },
      {
        type: "steps",
        items: [
          t(
            "Open a server, add a stream (each stream receives one publisher) and turn the " +
              "server on. Disable the server to change its settings.",
          ),
          t(
            "Enter one of the stream's publish URLs in the sending device, usually the WiFi " +
              "or Personal Hotspot URL.",
          ),
          t(
            "In Settings → Scenes → <your scene> → Video source, pick the stream by name. It " +
              "can also be shown with a Video source widget.",
          ),
        ],
      },
      {
        type: "list",
        items: [
          t(
            "Increase a stream's Latency if the video stutters. It is 2000 ms by default for " +
              "RTMP, RIST and RTSP, and 100 ms for WHIP and WHEP.",
          ),
          t("Talkback plays audio from an ingest in your speakers."),
        ],
      },
      { type: "h", text: t("DJI cameras") },
      {
        type: "steps",
        items: [
          t(
            "Open Settings → DJI devices, which controls DJI cameras over Bluetooth, and " +
              "select the device.",
          ),
          t("Enter the WiFi network it should use."),
          t(
            "Under RTMP, choose Server to stream into Moblin's RTMP server, or Custom for any" +
              " RTMP destination.",
          ),
          t("Tap Start live stream, or use the DJI devices quick button."),
        ],
      },
      { type: "h", text: t("GoPro cameras") },
      {
        type: "list",
        items: [
          t(
            "Settings → GoPro pairs HERO9 Black or newer over Bluetooth, with the same WiFi " +
              "and RTMP Server or Custom choices, plus resolution, maximum bitrate and lens.",
          ),
          t(
            "QR codes creates launch live stream, WiFi credentials and RTMP URL QR codes that" +
              " the GoPro quick button shows.",
          ),
        ],
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
    title: t("Mobcam: the phone as a USB camera"),
    summary: t("Use Moblin as a low latency camera in OBS Studio over a USB cable."),
    card: "mobcam",
    blocks: [
      { type: "h", text: t("What you need") },
      {
        type: "list",
        items: [
          t("An iPhone or iPad with Moblin."),
          t("A computer with OBS Studio 28 or newer: macOS 12 or newer, Windows or Linux."),
          t("A USB cable between the two."),
        ],
      },
      { type: "h", text: t("Step 1: Install the plugin on the computer") },
      {
        type: "p",
        text: t(
          "Quit OBS Studio, download the mobcam-obs-plugin file for your operating system and " +
            "install it.",
        ),
      },
      {
        type: "links",
        items: [
          {
            text: t("Download the Mobcam OBS Plugin for macOS, Windows and Linux"),
            url: "https://github.com/eerimoq/mobcam/releases/latest",
          },
        ],
      },
      {
        type: "list",
        items: [
          t("macOS: open the .pkg file and follow the installer."),
          t(
            "Windows: first install {appleDevices} from the Microsoft Store, or {itunes}, so the " +
              "computer can talk to the phone. Then run the Installer.exe file, click More " +
              "info and Run anyway if Windows asks, and select the folder OBS Studio is " +
              "installed in.",
          ),
          t(
            "Linux: first install usbmuxd. Then install the .deb file on Debian and Ubuntu, or " +
              "unpack the .tar.xz file into /usr on other distributions. OBS Studio installed " +
              "as a Flatpak or a Snap does not find the plugin.",
          ),
        ],
        links: {
          appleDevices: {
            text: "Apple Devices",
            url: "https://apps.microsoft.com/detail/9np83lwlpz9k",
          },
          itunes: { text: "iTunes", url: "https://www.apple.com/itunes/" },
        },
      },
      {
        type: "links",
        items: [
          {
            text: t("Full install and uninstall instructions for each operating system"),
            url: "https://github.com/eerimoq/mobcam/tree/main/crates/obs-plugin#install",
          },
        ],
      },
      { type: "h", text: t("Step 2: Create a Mobcam stream in Moblin") },
      {
        type: "steps",
        items: [
          t("Open Settings → Streams → Create."),
          t("Pick Mobcam."),
          t("Name the stream and tap Create."),
          t("Select the new stream if it is not selected already."),
        ],
      },
      { type: "h", text: t("Step 3: Connect and go live") },
      { type: "video", id: "_4ISwYTKV3s" },
      {
        type: "steps",
        items: [
          t("Connect the phone to the computer with the USB cable."),
          t("The first time, unlock the phone and tap Trust when it asks."),
          t("Start OBS Studio and add a source of the type Mobcam to your scene."),
          t("Tap Go Live in Moblin. The camera shows up in OBS."),
        ],
      },
      { type: "h", text: t("If it does not work") },
      {
        type: "list",
        items: [
          t(
            "Mobcam is not in the list of source types in OBS: the plugin is not installed " +
              "where OBS looks for it. Install it again and restart OBS Studio.",
          ),
          t(
            "No video in OBS: check that the phone is unlocked and trusted by the computer, " +
              "that the Mobcam stream is selected in Moblin and that Moblin is live.",
          ),
        ],
      },
      { type: "h", text: t("Good to know") },
      {
        type: "list",
        items: [
          t("Mobcam streams use a mobcam:// URL, and the wizard sets H.265/HEVC video."),
          t(
            "For the lowest latency, set Settings → Camera → Video stabilization to Off and " +
              "Settings → Debug → Builtin audio and video delay to 0.",
          ),
          t(
            "Turn on Auto go live on the stream to go live automatically when the app enters " +
              "the foreground.",
          ),
        ],
      },
    ],
    related: ["stream", "streams", "camera", "debug"],
  },
  {
    id: "apple-watch",
    title: t("Apple Watch"),
    summary: t("See status and chat and control your stream from the Apple Watch app."),
    card: "watch",
    blocks: [
      { type: "h", text: t("What the watch app does") },
      {
        type: "list",
        items: [
          t(
            "Shows a stream preview, audio level, bitrate, number of viewers, the iPhone's " +
              "thermal state and chat.",
          ),
          t(
            "Lets you zoom, switch scene, go live, record, mute, skip the current TTS " +
              "message, use instant replay, create stream markers, start workouts and update " +
              "scoreboards.",
          ),
        ],
      },
      { type: "h", text: t("Settings") },
      {
        type: "list",
        items: [
          t("Settings → Apple Watch is shown on iPhone when Show all settings is on."),
          t("Chat: timestamps, badges and notifications on new messages."),
          t("Display: choose local overlays such as thermal state, audio level and bitrate."),
          t(
            "Remote control assistant makes the watch act as a remote control assistant, but " +
              "then chat, skip current TTS and a few other features are not supported.",
          ),
        ],
      },
    ],
    related: ["apple-watch", "apple-watch-chat", "apple-watch-display", "local-overlays"],
  },
  {
    id: "deep-links-and-settings",
    title: t("Deep links, import and export"),
    summary: t("Share stream setups with moblin:// links and back up your settings."),
    blocks: [
      {
        type: "p",
        text: t(
          "A moblin:// deep link imports settings, for example a new stream with its URL, " +
            "video, SRT(LA), Twitch, Kick and OBS settings, quick buttons or the web browser " +
            "home page. Opening one asks for confirmation. Settings cannot be imported while " +
            "live or recording.",
        ),
      },
      { type: "h", text: t("Create a deep link") },
      {
        type: "steps",
        items: [
          t("Turn on Show all settings at the bottom of Settings."),
          t(
            "Open Settings → Deep link creator and fill in Streams, Quick buttons or Web " +
              "browser.",
          ),
          t(
            "A QR code and a Copy to clipboard button appear once something differs from the " +
              "defaults.",
          ),
        ],
      },
      { type: "h", text: t("Import and export settings") },
      {
        type: "list",
        items: [
          t(
            "Settings → Import and export settings (with Show all settings on) exports all " +
              "settings and imports them from a file or the clipboard.",
          ),
          t("Do not share exported settings, as they may contain stream keys."),
          t(
            "Exporting from one device and importing on another is not recommended. Deep " +
              "links work on any device.",
          ),
        ],
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
    title: t("Troubleshooting"),
    summary: t("Fixes for hidden settings, greyed out options and unstable streams."),
    card: "community",
    blocks: [
      { type: "h", text: t("Settings") },
      {
        type: "list",
        items: [
          t(
            "Cannot find a setting? Use the search field at the top of Settings to find " +
              "common settings by name or keyword.",
          ),
          t(
            "Still cannot find it? Turn on Show all settings at the bottom of Settings. It " +
              "shows for example Ingests, Remote control, Moblin Cloud, Macros, DJI devices, " +
              "GoPro and Apple Watch, and per stream Recording, Snapshot and SRT(LA).",
          ),
          t(
            "A setting is greyed out? Settings that would stop the stream are disabled while " +
              "live. End the stream first.",
          ),
          t(
            "Bitrate is under Settings → Streams → <your stream> → Video when Show all " +
              "settings is on. While live, use the Bitrate quick button.",
          ),
        ],
      },
      { type: "h", text: t("Stream problems") },
      {
        type: "list",
        items: [
          t(
            "An RTMP stream does not connect? The error toast shows the likely cause, such as" +
              " a server that cannot be reached or a stream key that is likely wrong.",
          ),
          t(
            "Unstable stream? Use SRT(LA) with adaptive bitrate instead of streaming directly" +
              " with RTMP, or stream through OBS or a bonding server.",
          ),
          t(
            "Low SRT latency: the Moblin SRT implementation does not perform well below 1000 " +
              "ms. Select the Official implementation in the SRT(LA) settings.",
          ),
          t(
            "Streaming over an Android hotspot fails? Try turning off Big packets in the " +
              "SRT(LA) settings.",
          ),
          t(
            "Video or audio issues in OBS? Use Fix in the OBS quick button, or !moblin obs " +
              "fix in chat.",
          ),
        ],
      },
      {
        type: "tip",
        text: t(
          "Need more help? Settings → Help and support links to the Moblin Discord server " +
            "and GitHub.",
        ),
      },
    ],
    related: ["settings", "srt-la", "stream-video", "obs-remote-control", "debug"],
  },
];
