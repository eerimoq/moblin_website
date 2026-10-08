import { Match, Switch } from "solid-js";
import type { AppIconName } from "../../data/emulator";

export default function AppIcon(props: { name: AppIconName; class?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      class={props.class ?? "size-5"}
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <Switch>
        <Match when={props.name === "gear"}>
          <path d="M21.5 10.4 L21.5 13.6 L19.1 13.9 L18.3 15.7 L19.8 17.5 L17.5 19.8 L15.7 18.3 L13.9 19.1 L13.6 21.5 L10.4 21.5 L10.1 19.1 L8.3 18.3 L6.5 19.8 L4.2 17.5 L5.7 15.7 L4.9 13.9 L2.5 13.6 L2.5 10.4 L4.9 10.1 L5.7 8.3 L4.2 6.5 L6.5 4.2 L8.3 5.7 L10.1 4.9 L10.4 2.5 L13.6 2.5 L13.9 4.9 L15.7 5.7 L17.5 4.2 L19.8 6.5 L18.3 8.3 L19.1 10.1 Z" />
          <circle cx="12" cy="12" r="3.2" />
        </Match>
        <Match when={props.name === "torch"}>
          <path d="M8 3h8v4l-2 3v11h-4V10L8 7V3Z" fill="currentColor" />
        </Match>
        <Match when={props.name === "torch-off"}>
          <path d="M8 3h8v4l-2 3v11h-4V10L8 7V3Z" />
          <path d="M8 7h8" />
        </Match>
        <Match when={props.name === "mic"}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
        </Match>
        <Match when={props.name === "mic-off"}>
          <rect x="9" y="3" width="6" height="11" rx="3" />
          <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M4 3l16 18" />
        </Match>
        <Match when={props.name === "record"}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" fill="currentColor" />
        </Match>
        <Match when={props.name === "aperture"}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3l3 7M21 12l-7 3M12 21l-3-7M3 12l7-3M18.4 5.6 14 10M5.6 18.4 10 14" />
        </Match>
        <Match when={props.name === "widgets"}>
          <rect x="3" y="7" width="14" height="12" rx="2" />
          <path d="M7 4h12a2 2 0 0 1 2 2v9" />
          <path d="m3 16 4-4 4 4 2-2 4 4" />
        </Match>
        <Match when={props.name === "sunset"}>
          <path d="M7 16a5 5 0 0 1 10 0M3 16h18M6 20h12M12 3v5M9.5 5.5 12 8l2.5-2.5M4.2 9.2l1.4 1.4M19.8 9.2l-1.4 1.4" />
        </Match>
        <Match when={props.name === "chat"}>
          <path d="M4 5h16v11H9l-5 4V5Z" />
        </Match>
        <Match when={props.name === "speedometer"}>
          <path d="M3.5 17a9 9 0 1 1 17 0" />
          <path d="M12 14l4-5" />
          <circle cx="12" cy="14.5" r="1.2" fill="currentColor" />
        </Match>
        <Match when={props.name === "grid"}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
        </Match>
        <Match when={props.name === "gray"}>
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </Match>
        <Match when={props.name === "sepia"}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 3a9 9 0 0 1 0 18Z" fill="currentColor" />
        </Match>
        <Match when={props.name === "film"}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4" />
        </Match>
        <Match when={props.name === "square"}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
        </Match>
        <Match when={props.name === "tv"}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="m8 2 4 4 4-4" />
        </Match>
        <Match when={props.name === "sparkles"}>
          <path d="M10 3l1.8 5.2L17 10l-5.2 1.8L10 17l-1.8-5.2L3 10l5.2-1.8L10 3ZM18 14l.9 2.1L21 17l-2.1.9L18 20l-.9-2.1L15 17l2.1-.9L18 14Z" />
        </Match>
        <Match when={props.name === "eye"}>
          <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </Match>
        <Match when={props.name === "clock"}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </Match>
        <Match when={props.name === "stream"}>
          <circle cx="12" cy="12" r="1.8" fill="currentColor" />
          <path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" />
        </Match>
        <Match when={props.name === "camera"}>
          <path d="M3 8a2 2 0 0 1 2-2h2.5L9 4h6l1.5 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
          <circle cx="12" cy="13" r="3.5" />
        </Match>
        <Match when={props.name === "waveform"}>
          <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" />
        </Match>
        <Match when={props.name === "chevron-right"}>
          <path d="m9 5 7 7-7 7" />
        </Match>
        <Match when={props.name === "chevron-left"}>
          <path d="m15 5-7 7 7 7" />
        </Match>
        <Match when={props.name === "check"}>
          <path d="m4 12.5 5 5L20 6.5" />
        </Match>
        <Match when={props.name === "close"}>
          <path d="M6 6l12 12M18 6 6 18" />
        </Match>
      </Switch>
    </svg>
  );
}
