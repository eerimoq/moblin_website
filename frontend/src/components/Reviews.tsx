import { For } from "solid-js";
import { links } from "../data/links";
import { appStoreRating, reviews } from "../data/reviews";
import Icon from "./Icon";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });

export default function Reviews() {
  return (
    <section id="reviews" class="pt-16 pb-8 lg:pt-20">
      <div class="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div class="flex flex-col gap-8 rounded-3xl border-[1.5px] border-line bg-card p-8 sm:p-12 lg:px-16">
          <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div class="flex flex-col gap-2.5">
              <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
                Reviews
              </span>
              <h2 class="text-[32px] font-bold sm:text-[40px]">What streamers say.</h2>
            </div>
            <a
              href={links.appStore}
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 text-ink-3 hover:text-ink"
            >
              <span class="flex text-amber" aria-hidden="true">
                <For each={[1, 2, 3, 4, 5]}>{() => <Icon name="star" class="size-5" />}</For>
              </span>
              <span class="text-[15px] font-bold">
                {appStoreRating.score} out of 5 on the App Store
                <span class="font-normal text-muted"> · {appStoreRating.count} ratings</span>
              </span>
            </a>
          </div>
          <ul class="grid gap-5 md:grid-cols-3">
            <For each={reviews}>
              {(r) => (
                <li class="flex flex-col gap-3 rounded-2xl bg-page px-6 py-5">
                  <h3 class="text-lg font-semibold">{r.title}</h3>
                  <p class="text-[15px] text-ink-2">“{r.text}”</p>
                  <p class="mt-auto text-sm text-muted">
                    <span class="font-bold">{r.name}</span> · {formatDate(r.date)}
                  </p>
                </li>
              )}
            </For>
          </ul>
        </div>
      </div>
    </section>
  );
}
