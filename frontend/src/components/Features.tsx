import { For } from "solid-js";
import { asset } from "../asset";
import { features } from "../data/features";
import { pages } from "../data/links";
import Icon from "./Icon";
import { t } from "../i18n";

export default function Features() {
  return (
    <section id="features" class="pt-10 pb-24">
      <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
        <div class="flex max-w-[640px] flex-col gap-2.5">
          <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
            {t("Features")}
          </span>
          <h2 class="text-4xl font-bold sm:text-[46px]">
            {t("Everything a walk-and-talk stream needs.")}
          </h2>
        </div>
        <ul class="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          <For each={features}>
            {(f) => (
              <li class="flex flex-col gap-3.5 rounded-3xl border-[1.5px] border-line bg-card p-7">
                <Icon name={f.icon} class="size-7 text-leaf" />
                <h3 class="text-[23px] font-semibold">{f.title}</h3>
                <p class="text-base text-ink-2">{f.text}</p>
                <ul class="mt-auto flex flex-wrap gap-x-5 gap-y-1 pt-1">
                  <For each={f.guides}>
                    {(guide) => (
                      <li>
                        <a
                          href={`${asset(pages.docs)}#guides/${guide.id}`}
                          class="font-bold text-leaf hover:text-leaf-bright"
                        >
                          {guide.label} →
                        </a>
                      </li>
                    )}
                  </For>
                </ul>
              </li>
            )}
          </For>
        </ul>
      </div>
    </section>
  );
}
