import { For } from "solid-js";
import { features } from "../data/features";
import Icon from "./Icon";

export default function Features() {
  return (
    <section id="features" class="bg-band py-20 lg:py-24">
      <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
        <div class="flex max-w-[640px] flex-col gap-2.5">
          <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
            Features
          </span>
          <h2 class="text-4xl font-bold sm:text-[46px]">
            Everything a walk-and-talk stream needs.
          </h2>
        </div>
        <ul class="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <For each={features}>
            {(f) => (
              <li class="flex flex-col gap-3.5 rounded-3xl border-[1.5px] border-line bg-card p-7">
                <Icon name={f.icon} class="size-7 text-leaf" />
                <h3 class="text-[23px] font-semibold">{f.title}</h3>
                <p class="text-base text-ink-2">{f.text}</p>
              </li>
            )}
          </For>
        </ul>
      </div>
    </section>
  );
}
