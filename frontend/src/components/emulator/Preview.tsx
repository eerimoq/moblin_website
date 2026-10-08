import { For, Show, type JSX } from "solid-js";
import { asset } from "../../asset";
import { scenes, zoomPresets, zoomScale, type AppIconName } from "../../data/emulator";
import AppIcon from "./AppIcon";
import { Room, Street } from "./Scenery";
import { duration, type Emulator } from "./state";

const shadow = "[text-shadow:0_1px_2px_rgb(0_0_0/0.9)]";

export default function Preview(props: { emu: Emulator }) {
  const emu = props.emu;
  const on = (id: string) => !!emu.buttons[id];
  const scene = (key: string) => emu.value(`scene.${emu.scene()}.${key}`);
  const front = () => scene("source") === "Front camera";
  const presets = () => (front() ? ["1x"] : zoomPresets);
  const filter = () =>
    [
      on("gray") && "grayscale(1)",
      on("sepia") && "sepia(0.9)",
      on("torch") && !front() && "brightness(1.15) contrast(1.05)",
      on("beauty") && "saturate(1.3) brightness(1.06) contrast(0.95)",
    ]
      .filter(Boolean)
      .join(" ") || "none";
  const transition = () =>
    ({ Blur: "app-transition-blur", "Blur & zoom": "app-transition-zoom" })[
      String(emu.value("transition"))
    ] ?? "";

  return (
    <div class="relative h-full flex-1 overflow-hidden bg-black text-white">
      <div class="absolute inset-0" style={{ filter: filter() }}>
        <Show when={emu.scene()} keyed>
          {(id) => (
            <div class={`absolute inset-0 overflow-hidden ${transition()}`}>
              <div
                class="absolute inset-0 transition-transform duration-500 ease-out"
                style={{
                  transform: `scale(${front() ? 1 : zoomScale[emu.zoom()]}) scaleX(${emu.value(`scene.${id}.mirror`) ? -1 : 1})`,
                }}
              >
                {front() ? <Room /> : <Street />}
              </div>
            </div>
          )}
        </Show>
        <Show when={on("widgets")}>
          <Show when={scene("pip")}>
            <div class="absolute top-[30%] right-[3%] aspect-video w-[26%] overflow-hidden rounded-[calc(var(--spacing)*2.5)] border-2 border-white/80">
              <Room />
            </div>
          </Show>
          <Show when={scene("clock")}>
            <div
              class={`absolute top-[18%] left-1/2 -translate-x-1/2 font-semibold app-text-28 ${shadow}`}
            >
              {new Date(emu.now()).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </div>
          </Show>
          <Show when={scene("logo")}>
            <img
              src={asset("logos/logo-party.png")}
              alt=""
              class="absolute top-[24%] right-[4%] w-[13%] rotate-[8deg]"
              draggable={false}
            />
          </Show>
        </Show>
      </div>
      <Show when={on("movie")}>
        <div class="absolute inset-x-0 top-0 h-[12%] bg-black" />
        <div class="absolute inset-x-0 bottom-0 h-[12%] bg-black" />
      </Show>
      <Show when={on("fourThree")}>
        <div class="absolute inset-y-0 left-0 w-[15%] bg-black" />
        <div class="absolute inset-y-0 right-0 w-[15%] bg-black" />
      </Show>
      <Show when={on("crt")}>
        <div class="app-scanlines absolute inset-0" />
      </Show>
      <Show when={emu.flash()} keyed>
        <div class="app-flash pointer-events-none absolute inset-0 bg-white" />
      </Show>
      <Show when={on("grid")}>
        <div class="pointer-events-none absolute inset-0">
          <div class="absolute inset-y-0 left-1/3 w-px bg-white/50" />
          <div class="absolute inset-y-0 left-2/3 w-px bg-white/50" />
          <div class="absolute inset-x-0 top-1/3 h-px bg-white/50" />
          <div class="absolute inset-x-0 top-2/3 h-px bg-white/50" />
        </div>
      </Show>

      <div class={`absolute top-2 left-14 flex flex-col gap-0.5 app-text-12 ${shadow}`}>
        <Show when={emu.value("overlay.stream")}>
          <Status icon="stream">
            {emu.streamName()} ({String(emu.value(`${emu.stream()}.resolution`)).split("x")[1]}p
            {String(emu.value(`${emu.stream()}.fps`))},{" "}
            {String(emu.value(`${emu.stream()}.codec`)).split("/")[0]})
          </Status>
        </Show>
        <Show when={emu.live() === "connecting"}>
          <Status icon="stream">Connecting…</Status>
        </Show>
        <Show when={emu.value("overlay.viewers") && emu.live() === "live"}>
          <Status icon="eye">{emu.viewers()}</Status>
        </Show>
      </div>

      <div class={`absolute top-2 right-2 flex flex-col items-end gap-0.5 app-text-12 ${shadow}`}>
        <Show when={emu.value("overlay.audio")}>
          <div class="flex items-center gap-1">
            <Show when={!on("mute")} fallback={<span class="text-app-red">Muted</span>}>
              <div class="flex h-3 gap-px rounded-[calc(var(--spacing)*0.5)] border border-white/60 p-px">
                <For each={Array.from({ length: 10 }, (_, i) => i)}>
                  {(i) => (
                    <span
                      class={`w-1 rounded-[1px] ${i >= 8 ? "bg-app-red" : i >= 6 ? "bg-amber" : "bg-app-green"}`}
                      style={{ opacity: i / 10 < emu.audioLevel() ? 1 : 0.15 }}
                    />
                  )}
                </For>
              </div>
            </Show>
            <AppIcon name="waveform" class="size-3.5" />
          </div>
        </Show>
        <Show when={on("record")}>
          <Status icon="record" right class="text-app-red">
            {duration(emu.now() - emu.recordStart())}
          </Status>
        </Show>
        <Show when={emu.value("overlay.bitrate") && emu.live() === "live"}>
          <Status icon="speedometer" right>
            {emu.bitrate().toFixed(1)} Mbps ({(emu.sentBytes() / 1e6).toFixed(1)} MB)
          </Status>
        </Show>
        <Show when={emu.value("overlay.uptime") && emu.live() === "live"}>
          <Status icon="clock" right>
            {duration(emu.now() - emu.liveStart())}
          </Status>
        </Show>
      </div>

      <Show when={on("chat")}>
        <ul class="absolute bottom-2 left-14 flex max-w-[44%] flex-col items-start gap-0.5 app-text-13">
          <For each={emu.chat()}>
            {(line) => (
              <li class="rounded-[calc(var(--spacing)*1)] bg-black/50 px-1.5 py-0.5">
                <span class="font-bold" style={{ color: line.color }}>
                  {line.user}
                </span>
                : {line.text}
              </li>
            )}
          </For>
        </ul>
      </Show>

      <div class="absolute right-2 bottom-2 flex flex-col items-end gap-1.5">
        <Show when={emu.value("overlay.zoom")}>
          <Segmented
            options={presets()}
            selected={front() ? "1x" : emu.zoom()}
            onSelect={(z) => !front() && emu.setZoom(z)}
            label="Zoom"
          />
        </Show>
        <Segmented
          options={scenes.map((s) => s.name)}
          selected={scenes.find((s) => s.id === emu.scene())!.name}
          onSelect={(name) => emu.setScene(scenes.find((s) => s.name === name)!.id)}
          label="Scene"
        />
      </div>

      <Show when={emu.toast()} keyed>
        {(toast) => (
          <div
            role="status"
            class="absolute top-3 left-1/2 -translate-x-1/2 rounded-full bg-app-alert/95 px-4 py-2 font-semibold whitespace-nowrap app-text-13"
          >
            {toast.text}
          </div>
        )}
      </Show>
    </div>
  );
}

function Status(props: {
  icon: AppIconName;
  right?: boolean;
  class?: string;
  children: JSX.Element;
}) {
  return (
    <div
      class={`flex items-center gap-1 ${props.right ? "flex-row-reverse" : ""} ${props.class ?? ""}`}
    >
      <AppIcon name={props.icon} class="size-3.5 shrink-0" />
      <span>{props.children}</span>
    </div>
  );
}

function Segmented(props: {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={props.label}
      class="flex divide-x divide-app-secondary/40 overflow-hidden rounded-[calc(var(--spacing)*2)] bg-black/40 app-text-13"
    >
      <For each={props.options}>
        {(option) => (
          <button
            type="button"
            role="radio"
            aria-checked={props.selected === option}
            class={`h-8 min-w-13 px-2 ${props.selected === option ? "bg-app-segment" : ""}`}
            onClick={() => props.onSelect(option)}
          >
            {option}
          </button>
        )}
      </For>
    </div>
  );
}
