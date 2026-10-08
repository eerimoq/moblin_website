import { createSignal, For, Show } from "solid-js";
import {
  bitrateRow,
  micRow,
  quickButtonPages,
  streamButtonColors,
  type QuickButton,
} from "../../data/emulator";
import AppIcon from "./AppIcon";
import type { Emulator } from "./state";

const rows = (buttons: QuickButton[], columns: number) => {
  const result: QuickButton[][] = [];
  for (let i = 0; i < buttons.length; i += columns) {
    result.push(buttons.slice(i, i + columns));
  }
  return result.reverse();
};

export default function ControlBar(props: { emu: Emulator }) {
  const [page, setPage] = createSignal(0);
  const emu = props.emu;
  const columns = () => (emu.value("display.twoColumns") ? 2 : 1);
  const time = () =>
    new Date(emu.now()).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

  const press = (button: QuickButton) => {
    if (button.toggle) {
      emu.toggle(button.id);
    } else if (button.id === "bitrate") {
      emu.setPanel([{ picker: bitrateRow(emu.stream()) }]);
    } else if (button.id === "mic") {
      emu.setPanel([{ picker: micRow }]);
    } else if (button.id === "snapshot") {
      emu.setFlash(emu.flash() + 1);
      emu.showToast("Snapshot saved to Photos");
    }
  };

  const stream = () => {
    if (emu.live() === "off") {
      emu.setAlert({
        title: "Go Live",
        message: `Go live to ${emu.streamName()}?`,
        action: "Go Live",
        onConfirm: emu.goLive,
      });
    } else {
      emu.setAlert({
        title: "End",
        message: "End the stream?",
        action: "End",
        onConfirm: emu.endStream,
      });
    }
  };

  return (
    <div class="flex h-full w-26 shrink-0 flex-col items-center bg-black pt-2 pb-3 text-white">
      <div class="flex items-center gap-1.5 app-text-11">
        <span class="rounded-[calc(var(--spacing)*0.75)] border border-white/70 px-1 leading-none font-semibold">
          80
        </span>
        <span>{time()}</span>
      </div>
      <button
        type="button"
        class="mt-2 flex size-10 items-center justify-center rounded-full border border-app-secondary"
        aria-label="Settings"
        onClick={() => emu.setPanel(emu.panel() ? null : [{ page: "settings" }])}
      >
        <AppIcon name="gear" class="size-6" />
      </button>
      <div
        class="mt-2 flex min-h-0 w-full flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none]"
        onScroll={(e) =>
          setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))
        }
      >
        <For each={quickButtonPages}>
          {(buttons) => (
            <div class="flex h-full w-full shrink-0 snap-start flex-col overflow-y-auto [scrollbar-width:none]">
              <div class="mt-auto flex flex-col gap-2">
                <For each={rows(buttons, columns())}>
                  {(row) => (
                    <div class="flex justify-center gap-2.5">
                      <For each={row}>
                        {(button) => (
                          <QuickButtonView
                            button={button}
                            on={!!emu.buttons[button.id]}
                            showName={emu.value("display.showName") === true}
                            onPress={() => press(button)}
                          />
                        )}
                      </For>
                    </div>
                  )}
                </For>
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="my-2 flex gap-1.5">
        <For each={quickButtonPages}>
          {(_, i) => (
            <span class={`size-1.5 rounded-full ${page() === i() ? "bg-white" : "bg-white/35"}`} />
          )}
        </For>
      </div>
      <button
        type="button"
        class={`min-w-16 rounded-[calc(var(--spacing)*2.5)] px-3 py-1.5 font-semibold app-text-15 ${emu.live() === "off" ? "" : "outline-2 outline-white"}`}
        style={{
          "background-color": streamButtonColors[String(emu.value("display.streamButton"))],
        }}
        onClick={stream}
      >
        {emu.live() === "off" ? "Go Live" : "End"}
      </button>
    </div>
  );
}

function QuickButtonView(props: {
  button: QuickButton;
  on: boolean;
  showName: boolean;
  onPress: () => void;
}) {
  return (
    <div class="flex w-10 flex-col items-center gap-0.5">
      <button
        type="button"
        class={`flex size-10 items-center justify-center rounded-full bg-app-button transition-shadow ${props.on ? "ring-1 ring-white" : ""}`}
        aria-label={props.button.label}
        aria-pressed={props.button.toggle ? props.on : undefined}
        title={props.button.label}
        onClick={props.onPress}
      >
        <AppIcon
          name={!props.on && props.button.offIcon ? props.button.offIcon : props.button.icon}
          class="size-5"
        />
      </button>
      <Show when={props.showName}>
        <span class="w-14 truncate text-center app-text-8">{props.button.label}</span>
      </Show>
    </div>
  );
}
