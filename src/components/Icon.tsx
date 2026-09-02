import { Match, Switch } from "solid-js";

export type IconName =
  | "chat"
  | "bell"
  | "bonding"
  | "watch"
  | "remote"
  | "sparkle"
  | "discord"
  | "github"
  | "obs-relay"
  | "assistant-relay"
  | "warning"
  | "heart"
  | "menu"
  | "close";

type Props = {
  name: IconName;
  class?: string;
};

/** Stroke-based icons on a 24px grid. Color comes from `currentColor`. */
export default function Icon(props: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      class={props.class ?? "size-7"}
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <Switch>
        <Match when={props.name === "chat"}>
          <path d="M4 5h16v11H9l-5 4V5Z" />
          <path d="M8 9h8M8 12h5" />
        </Match>
        <Match when={props.name === "bell"}>
          <path d="M6 17V10a6 6 0 0 1 12 0v7l2 2H4l2-2Z" />
          <path d="M10 21h4" />
        </Match>
        <Match when={props.name === "bonding"}>
          <path d="M4 12h5l2-5 3 10 2-5h4" />
        </Match>
        <Match when={props.name === "watch"}>
          <rect x="7" y="6" width="10" height="12" rx="3" />
          <path d="M9 6V3h6v3M9 18v3h6v-3" />
        </Match>
        <Match when={props.name === "remote"}>
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8M12 17v4" />
          <circle cx="12" cy="11" r="2.5" />
        </Match>
        <Match when={props.name === "sparkle"}>
          <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
          <path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" />
        </Match>
        <Match when={props.name === "discord"}>
          <path d="M4 6.5c2-1 4-1.5 4-1.5l.6 1.3a12 12 0 0 1 6.8 0L16 5s2 .5 4 1.5c1.5 4 2 8 1.5 11-1.6 1.3-4 2.2-4 2.2l-.9-1.6c-2.8 1.2-6.4 1.2-9.2 0L6.5 19.7s-2.4-.9-4-2.2C2 14.5 2.5 10.5 4 6.5Z" />
          <circle cx="9" cy="12.5" r="1.3" />
          <circle cx="15" cy="12.5" r="1.3" />
        </Match>
        <Match when={props.name === "github"}>
          <path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1-.3-3.4 1.3a11.7 11.7 0 0 0-6.2 0C6.5 2.8 5.5 3.1 5.5 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
        </Match>
        <Match when={props.name === "obs-relay"}>
          <rect x="2" y="6" width="9" height="12" rx="2" />
          <rect x="13" y="6" width="9" height="12" rx="2" />
          <path d="M11 12h2" />
          <circle cx="6.5" cy="12" r="1.5" />
          <path d="M17.5 10v4M15.5 12h4" />
        </Match>
        <Match when={props.name === "assistant-relay"}>
          <circle cx="8" cy="8" r="3" />
          <path d="M2 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          <path d="M16 4l2 2-2 2M20 6h-4" />
          <rect x="15" y="12" width="7" height="9" rx="1.5" />
        </Match>
        <Match when={props.name === "warning"}>
          <path d="M12 3l10 18H2L12 3Z" />
          <path d="M12 10v5M12 18h.01" />
        </Match>
        <Match when={props.name === "heart"}>
          <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z" />
        </Match>
        <Match when={props.name === "menu"}>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </Match>
        <Match when={props.name === "close"}>
          <path d="M6 6l12 12M18 6L6 18" />
        </Match>
      </Switch>
    </svg>
  );
}
