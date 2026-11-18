import { createSignal, For } from "solid-js";
import { links } from "../data/links";
import { videos, type Video } from "../data/videos";
import BrandIcon from "./BrandIcon";
import Button from "./Button";
import Icon from "./Icon";
import { t } from "../i18n";

function VideoCard(props: { video: Video }) {
  const short = props.video.kind === "short";
  const [thumbnail, setThumbnail] = createSignal(
    `https://i.ytimg.com/vi/${props.video.id}/${short ? "oar2" : "hqdefault"}.jpg`,
  );
  return (
    <li
      class={`shrink-0 snap-start ${short ? "w-[220px] sm:w-[248px]" : "w-[min(784px,calc(100vw-40px))]"}`}
    >
      <a
        href={
          short
            ? `https://www.youtube.com/shorts/${props.video.id}`
            : `https://www.youtube.com/watch?v=${props.video.id}`
        }
        target="_blank"
        rel="noopener"
        class="group flex flex-col gap-3"
      >
        <div
          class={`relative flex items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-line bg-well ${short ? "aspect-[9/16]" : "aspect-video"}`}
        >
          <img
            src={thumbnail()}
            alt=""
            class="absolute inset-0 size-full object-cover"
            loading="lazy"
            onError={() => setThumbnail(`https://i.ytimg.com/vi/${props.video.id}/hqdefault.jpg`)}
          />
          <BrandIcon
            name="youtube"
            class="relative size-16 shadow-lg transition-transform group-hover:scale-110"
          />
        </div>
        <span class="text-[15px] font-semibold text-ink-2 group-hover:text-ink">
          {props.video.title}
        </span>
      </a>
    </li>
  );
}

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
          <For each={videos}>{(video) => <VideoCard video={video} />}</For>
        </ul>
      </div>
    </section>
  );
}
