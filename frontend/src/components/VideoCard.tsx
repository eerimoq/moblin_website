import { createSignal, Show } from "solid-js";
import { videoUrl, type Video } from "../data/videos";
import BrandIcon from "./BrandIcon";

export default function VideoCard(props: { video: Video; compact?: boolean }) {
  const short = props.video.kind === "short";
  const [thumbnail, setThumbnail] = createSignal(
    `https://i.ytimg.com/vi/${props.video.id}/${short ? "oar2" : "hqdefault"}.jpg`,
  );
  return (
    <a
      href={videoUrl(props.video)}
      target="_blank"
      rel="noopener"
      class="group flex flex-col gap-3"
      aria-label={props.compact ? props.video.title : undefined}
    >
      <div
        class={`relative flex items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-line bg-well ${short ? (props.compact ? "h-[350px]" : "h-[391px] sm:h-[441px]") : ""}`}
        style={{ "aspect-ratio": props.video.aspect ?? (short ? "9 / 16" : "16 / 9") }}
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
          class={`relative shadow-lg transition-transform group-hover:scale-110 ${props.compact ? "size-14" : "size-16"}`}
        />
      </div>
      <Show when={!props.compact}>
        <span class="text-center text-[15px] font-semibold text-ink-2 group-hover:text-ink">
          {props.video.title}
        </span>
      </Show>
    </a>
  );
}
