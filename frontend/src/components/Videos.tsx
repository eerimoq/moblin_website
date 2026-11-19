import { For } from "solid-js";
import { links } from "../data/links";
import { videos } from "../data/videos";
import Button from "./Button";
import Icon from "./Icon";
import VideoCard from "./VideoCard";
import { t } from "../i18n";

export default function Videos() {
  return (
    <section id="videos" class="pt-10 pb-24">
      <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div class="flex max-w-[640px] flex-col gap-2.5">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              {t("Videos")}
            </span>
            <h2 class="text-4xl font-bold sm:text-[46px]">{t("See Moblin in action.")}</h2>
          </div>
          <Button href={links.youtube} variant="ghost" class="self-start md:self-auto">
            <Icon name="youtube" class="size-[22px]" />
            {t("More on YouTube")}
          </Button>
        </div>
        <ul class="-mx-5 flex snap-x snap-mandatory scroll-px-5 items-start gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8">
          <For each={videos}>
            {(video) => (
              <li
                class={`shrink-0 snap-start ${video.kind === "short" ? "w-min" : "w-[min(784px,calc(100vw-40px))]"}`}
              >
                <VideoCard video={video} />
              </li>
            )}
          </For>
        </ul>
      </div>
    </section>
  );
}
