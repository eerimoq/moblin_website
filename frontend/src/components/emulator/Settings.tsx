import { createEffect, createSignal, For, Match, on, Show, Switch } from "solid-js";
import { pages, type PickerRow, type Row, type Section } from "../../data/emulator";
import AppIcon from "./AppIcon";
import type { Emulator, NavEntry } from "./state";

const titleOf = (entry: NavEntry) =>
  "page" in entry ? pages[entry.page].title : entry.picker.label;

export default function Settings(props: { emu: Emulator }) {
  const stack = () => props.emu.panel() ?? [];
  const top = () => stack()[stack().length - 1];
  const push = (entry: NavEntry) => props.emu.setPanel([...stack(), entry]);
  const pop = () => props.emu.setPanel(stack().slice(0, -1));
  const close = () => props.emu.setPanel(null);
  const [scroller, setScroller] = createSignal<HTMLDivElement>();
  createEffect(on(top, () => scroller()?.scrollTo(0, 0)));

  return (
    <Show when={top()}>
      {(entry) => (
        <div class="absolute inset-y-0 right-0 z-30 flex w-100 max-w-full flex-col bg-black text-white">
          <div class="relative flex h-12 shrink-0 items-center justify-center px-3">
            <Show when={stack().length > 1}>
              <button
                type="button"
                class="absolute left-2 flex items-center gap-0.5 text-app-blue app-text-15"
                onClick={pop}
              >
                <AppIcon name="chevron-left" class="size-5.5" />
                {titleOf(stack()[stack().length - 2])}
              </button>
            </Show>
            <span class="font-semibold app-text-16">{titleOf(entry())}</span>
            <button
              type="button"
              class="absolute right-3 flex size-7.5 items-center justify-center rounded-full bg-app-alert text-app-secondary"
              aria-label="Close settings"
              onClick={close}
            >
              <AppIcon name="close" class="size-4" />
            </button>
          </div>
          <div
            ref={setScroller}
            class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-6"
          >
            <Switch>
              <Match when={"page" in entry() && (entry() as { page: string }).page}>
                {(id) => (
                  <For each={pages[id()].sections}>
                    {(section) => <Group emu={props.emu} section={section} push={push} />}
                  </For>
                )}
              </Match>
              <Match when={"picker" in entry() && (entry() as { picker: PickerRow }).picker}>
                {(row) => (
                  <PickerList
                    emu={props.emu}
                    row={row()}
                    done={() => (stack().length > 1 ? pop() : close())}
                  />
                )}
              </Match>
            </Switch>
          </div>
        </div>
      )}
    </Show>
  );
}

function Group(props: { emu: Emulator; section: Section; push: (entry: NavEntry) => void }) {
  return (
    <div class="mt-5 first:mt-2">
      <Show when={props.section.header}>
        <div class="mb-1.5 px-4 text-app-secondary uppercase app-text-12">
          {props.section.header}
        </div>
      </Show>
      <ul class="overflow-hidden rounded-[calc(var(--spacing)*2.5)] bg-app-cell">
        <For each={props.section.rows}>
          {(row) => (
            <li class="border-b border-app-separator pl-4 last:border-b-0">
              <RowView emu={props.emu} row={row} push={props.push} />
            </li>
          )}
        </For>
      </ul>
      <Show when={props.section.footer}>
        <p class="mt-1.5 px-4 text-app-secondary app-text-12">{props.section.footer}</p>
      </Show>
    </div>
  );
}

function RowView(props: { emu: Emulator; row: Row; push: (entry: NavEntry) => void }) {
  const base = "flex min-h-11 w-full items-center gap-2 pr-4 text-left app-text-15";
  return (
    <Switch>
      <Match when={props.row.kind === "page" && props.row}>
        {(row) => (
          <button type="button" class={base} onClick={() => props.push({ page: row().page })}>
            <span class="flex-1 truncate">{row().label}</span>
            <Show when={row().check}>
              {(check) => (
                <Show when={props.emu.value(check()[0]) === check()[1]}>
                  <AppIcon name="check" class="size-4.5 text-app-blue" />
                </Show>
              )}
            </Show>
            <AppIcon name="chevron-right" class="size-4 text-app-secondary" />
          </button>
        )}
      </Match>
      <Match when={props.row.kind === "picker" && props.row}>
        {(row) => (
          <button type="button" class={base} onClick={() => props.push({ picker: row() })}>
            <span class="flex-1 truncate">{row().label}</span>
            <span class="text-app-secondary">{String(props.emu.value(row().key))}</span>
            <AppIcon name="chevron-right" class="size-4 text-app-secondary" />
          </button>
        )}
      </Match>
      <Match when={props.row.kind === "toggle" && props.row}>
        {(row) => {
          const on = () =>
            row().option === undefined
              ? props.emu.value(row().key) === true
              : props.emu.value(row().key) === row().option;
          const flip = () => {
            if (row().option === undefined) {
              props.emu.setValue(row().key, !on());
            } else if (!on()) {
              props.emu.setValue(row().key, row().option!);
            }
          };
          return (
            <button type="button" role="switch" aria-checked={on()} class={base} onClick={flip}>
              <span class="flex-1 truncate">{row().label}</span>
              <span
                class={`relative h-7.5 w-12.5 shrink-0 rounded-full transition-colors ${on() ? "bg-app-green" : "bg-app-separator"}`}
              >
                <span
                  class={`absolute top-0.5 size-6.5 rounded-full bg-white shadow transition-[left] ${on() ? "left-5.5" : "left-0.5"}`}
                />
              </span>
            </button>
          );
        }}
      </Match>
      <Match when={props.row.kind === "text" && props.row}>
        {(row) => (
          <div class={base}>
            <span class="shrink-0">{row().label}</span>
            <span class="flex-1 truncate text-right text-app-secondary">{row().value}</span>
          </div>
        )}
      </Match>
      <Match when={props.row.kind === "demo" && props.row}>
        {(row) => (
          <button
            type="button"
            class={`${base} text-app-secondary`}
            onClick={() => props.emu.showToast(`${row().label} is not in this demo`)}
          >
            <span class="flex-1 truncate">{row().label}</span>
            <AppIcon name="chevron-right" class="size-4 opacity-50" />
          </button>
        )}
      </Match>
    </Switch>
  );
}

function PickerList(props: { emu: Emulator; row: PickerRow; done: () => void }) {
  return (
    <ul class="mt-2 overflow-hidden rounded-[calc(var(--spacing)*2.5)] bg-app-cell">
      <For each={props.row.options}>
        {(option) => (
          <li class="border-b border-app-separator pl-4 last:border-b-0">
            <button
              type="button"
              class="flex min-h-11 w-full items-center pr-4 text-left app-text-15"
              onClick={() => {
                props.emu.setValue(props.row.key, option);
                props.done();
              }}
            >
              <span class="flex-1">{option}</span>
              <Show when={props.emu.value(props.row.key) === option}>
                <AppIcon name="check" class="size-4.5 text-app-blue" />
              </Show>
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}
