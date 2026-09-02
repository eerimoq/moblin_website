import { For } from "solid-js";
import { asset } from "../asset";
import { links, platforms } from "../data/links";
import Button from "./Button";
import Icon from "./Icon";
import Mascot from "./Mascot";

const confetti = [
  "left-[78%] top-[8%] size-[18px] rotate-[20deg] bg-amber",
  "left-[86%] top-[4%] size-[14px] rounded-full bg-confetti-blue",
  "left-[70%] top-[18%] h-[26px] w-[12px] -rotate-[30deg] bg-confetti-red",
  "left-[93%] top-[30%] size-4 rotate-45 bg-confetti-purple",
  "left-[75%] top-[62%] size-[14px] rounded-full bg-amber",
  "left-[90%] top-[70%] h-6 w-3 rotate-[25deg] bg-confetti-blue",
];

export default function Hero() {
  return (
    <section id="top" class="relative overflow-hidden">
      <div class="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden="true">
        <For each={confetti}>{(c) => <span class={`absolute rounded-[3px] ${c}`} />}</For>
      </div>
      <div class="mx-auto grid max-w-[1120px] items-center gap-12 px-5 pt-12 pb-16 sm:px-8 lg:grid-cols-2 lg:pt-18 lg:pb-22">
        <div class="flex flex-col gap-6">
          <span class="font-display text-sm font-semibold uppercase tracking-[0.08em] text-leaf sm:text-[15px]">
            Free · Open source · iPhone and iPad
          </span>
          <h1 class="text-[46px] leading-[1.02] font-bold text-balance sm:text-6xl lg:text-[76px] lg:leading-none">
            Stream IRL straight from your iPhone.
          </h1>
          <p class="max-w-[520px] text-lg leading-normal text-ink-2 text-pretty sm:text-[21px]">
            Moblin is a free app for going live on Twitch, YouTube, Kick and more. Chat on your
            screen, bonding for bad signal, and a friendly green face to keep you company.
          </p>
          <div class="mt-1 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a href={links.appStore} target="_blank" rel="noopener" class="shrink-0">
              <img src={asset("badges/app-store.svg")} alt="Download on the App Store" class="h-14 w-auto" />
            </a>
            <Button href={links.discord} variant="ghost" class="h-14">
              <Icon name="discord" class="size-[22px]" />
              Join the Discord
            </Button>
          </div>
          <p class="text-[15px] text-muted">
            Want the newest features first?{" "}
            <a href={links.testFlight} target="_blank" rel="noopener" class="text-leaf hover:text-leaf-bright">
              Join the TestFlight beta
            </a>
            .
          </p>
        </div>
        <div class="relative mx-auto w-full max-w-[600px] pt-6 pb-12 pl-10 sm:pl-16 lg:pl-20">
          <img
            src={asset("screenshots/moblin.jpg")}
            srcset={`${asset("screenshots/moblin-800.jpg")} 800w, ${asset("screenshots/moblin.jpg")} 1600w`}
            sizes="(min-width: 1024px) 500px, 90vw"
            alt="Moblin streaming with chat, bitrate and controls on screen"
            class="w-full -rotate-[4deg] rounded-[22px] border-[6px] border-line shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
            width="1600"
            height="813"
            fetchpriority="high"
          />
          <Mascot
            variant="party"
            sticker
            class="absolute -bottom-1 -left-1 w-[120px] rotate-[8deg] sm:w-[160px] lg:w-[190px]"
          />
        </div>
      </div>
      <div class="mx-auto flex max-w-[1120px] flex-wrap items-center gap-3 px-5 pb-16 sm:px-8 lg:pb-18">
        <span class="mr-1 text-[15px] font-bold text-muted">Goes live on</span>
        <For each={platforms}>
          {(name) => (
            <span class="inline-flex h-10 items-center rounded-full border-[1.5px] border-line bg-card px-4 text-[15px] font-bold text-ink-3">
              {name}
            </span>
          )}
        </For>
        <span class="ml-1 hidden text-[15px] text-muted sm:inline">
          and anything that speaks RTMP or SRT.
        </span>
      </div>
    </section>
  );
}
