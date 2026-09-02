import { For } from "solid-js";
import { steps } from "../data/features";
import Mascot from "./Mascot";

const tilt = ["rotate-[10deg]", "-rotate-[8deg]", "rotate-[12deg]"];

export default function GetStarted() {
  return (
    <section id="get-started" class="pt-10 pb-24">
      <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div class="flex flex-col gap-2.5">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              Get started
            </span>
            <h2 class="text-4xl font-bold sm:text-[46px]">Live in three steps.</h2>
          </div>
          <p class="max-w-[420px] text-lg text-muted">
            No account, no subscription. Install it, paste your stream key, go.
          </p>
        </div>
        <ol class="grid gap-7 md:grid-cols-3 md:gap-6">
          <For each={steps}>
            {(step, i) => (
              <li class="wiggle relative flex flex-col gap-4 rounded-3xl border-[1.5px] border-line bg-card p-8">
                <Mascot
                  variant={step.mascot}
                  class={`absolute -top-7 right-6 w-[66px] ${tilt[i()]}`}
                />
                <span class="font-display text-[54px] leading-none font-bold text-moss">{i() + 1}</span>
                <h3 class="text-[26px] font-semibold">{step.title}</h3>
                <p class="text-ink-2">{step.text}</p>
              </li>
            )}
          </For>
        </ol>
      </div>
    </section>
  );
}
