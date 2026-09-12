import { createSignal, For, Show } from "solid-js";
import {
  channelUrl,
  haveStreamers,
  streamers,
  type Streamer,
  type StreamerChannel,
  type StreamerPlatform,
} from "../data/streamers";
import Icon from "./Icon";

const platformName: Record<StreamerPlatform, string> = {
  twitch: "Twitch",
  youtube: "YouTube",
  kick: "Kick",
};

/** A stable hue (0-360) per name, for the placeholder avatar. */
const hue = (name: string) => {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.codePointAt(0)!) % 360;
  return hash;
};

/** Up to two initials, so "sofia.cycles" becomes "SC" and "TokyoTom" becomes "T". */
const initials = (name: string) =>
  name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

/** The channel's profile image, or its initials when there is none or it fails to load. */
function Avatar(props: { channel: StreamerChannel }) {
  const [broken, setBroken] = createSignal(false);
  return (
    <Show
      when={props.channel.image && !broken()}
      fallback={
        <span
          class="flex size-11 shrink-0 items-center justify-center rounded-full font-display text-base font-bold text-white"
          style={{
            background: `linear-gradient(135deg, hsl(${hue(props.channel.name)} 55% 50%), hsl(${hue(props.channel.name) + 40} 60% 30%))`,
          }}
          aria-hidden="true"
        >
          {initials(props.channel.name)}
        </span>
      }
    >
      <img
        src={props.channel.image!}
        alt=""
        class="size-11 shrink-0 rounded-full bg-ghost object-cover"
        width="44"
        height="44"
        loading="lazy"
        onError={() => setBroken(true)}
      />
    </Show>
  );
}

function ChannelRow(props: { channel: StreamerChannel }) {
  return (
    <li>
      <a
        href={channelUrl(props.channel)}
        target="_blank"
        rel="noopener"
        class="group flex items-center gap-3"
        title={`${props.channel.channel} on ${platformName[props.channel.platform]}`}
      >
        <span class="relative shrink-0">
          <Avatar channel={props.channel} />
          <span class="absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border-2 border-card bg-page text-ink">
            <Icon name={props.channel.platform} class="size-3" />
          </span>
        </span>
        <span class="truncate font-bold text-ink group-hover:text-leaf">{props.channel.name}</span>
      </a>
    </li>
  );
}

function StreamerCard(props: { streamer: Streamer }) {
  return (
    <li class="rounded-3xl border-[1.5px] border-line bg-card p-5">
      <ul class="flex flex-col gap-3">
        <For each={props.streamer.channels}>{(channel) => <ChannelRow channel={channel} />}</For>
      </ul>
    </li>
  );
}

export default function Streamers() {
  return (
    <Show when={haveStreamers()}>
      <section id="streamers" class="py-20 lg:py-24">
        <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div class="flex max-w-[640px] flex-col gap-2.5">
              <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
                Streamers
              </span>
              <h2 class="text-4xl font-bold sm:text-[46px]">Who's streaming with Moblin.</h2>
            </div>
            <p class="max-w-[440px] text-lg text-muted">
              IRL streamers who recently went live with Moblin. Drop by their channels and say hi.
            </p>
          </div>
          <ul class="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <For each={streamers()}>{(streamer) => <StreamerCard streamer={streamer} />}</For>
          </ul>
        </div>
      </section>
    </Show>
  );
}
