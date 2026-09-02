import { asset } from "../asset";
import { shopIcons } from "../data/features";
import { links } from "../data/links";
import { For } from "solid-js";
import Button from "./Button";
import Icon from "./Icon";
import Mascot from "./Mascot";

export default function Community() {
  return (
    <section id="community" class="pt-10 pb-24">
      <div class="mx-auto max-w-[1120px] px-5 sm:px-8">
        <div class="relative grid items-center gap-10 overflow-hidden rounded-3xl border-[1.5px] border-grove-line bg-grove p-8 sm:p-12 md:grid-cols-2 lg:px-16 lg:py-14">
          <div class="flex flex-col gap-5">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              Community
            </span>
            <h2 class="text-[32px] font-bold sm:text-[44px] sm:leading-tight">
              Stuck? Someone on Discord has been there.
            </h2>
            <p class="max-w-[480px] text-lg text-ink-2">
              Thousands of IRL streamers share setups, fix problems and vote on
              what Moblin does next. The developer hangs out there too.
            </p>
            <div class="flex flex-wrap gap-3">
              <Button href={links.discord}>
                <Icon name="discord" class="size-[22px]" />
                Join the Discord
              </Button>
              <Button href={links.github} variant="ghost">
                <Icon name="github" class="size-[22px]" />
                Star on GitHub
              </Button>
              <Button href={links.testFlight} variant="ghost">
                Try the beta
              </Button>
            </div>
          </div>
          <div class="relative hidden h-[260px] items-center justify-center md:flex">
            <Mascot variant="discord" class="w-[220px] -rotate-[6deg]" />
            <Mascot
              variant="heart"
              class="absolute right-10 -bottom-2.5 w-[120px] rotate-[10deg]"
            />
          </div>
        </div>
        <div
          id="support"
          class="relative mt-6 flex scroll-mt-24 flex-col gap-5 overflow-hidden rounded-3xl border-[1.5px] border-line bg-card p-8 sm:p-12 md:flex-row md:items-center md:justify-between md:gap-10 lg:px-16"
        >
          <Mascot
            variant="heart"
            class="pointer-events-none absolute -right-8 -bottom-10 hidden w-[130px] -rotate-[8deg] opacity-30 lg:block"
          />
          <div class="flex max-w-[560px] flex-col gap-4">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              Support Moblin
            </span>
            <h2 class="text-[28px] font-bold sm:text-[36px] sm:leading-tight">
              Like Moblin? Help keep it free.
            </h2>
            <p class="text-lg text-ink-2">
              Moblin is built in Erik's spare time. Sponsor the project, send a
              tip, or just drop by the stream and say hi.
            </p>
            <div class="flex flex-col gap-4">
              <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                <div class="relative shrink-0 overflow-hidden rounded-xl border-[1.5px] border-line">
                  <img
                    src={asset("screenshots/icon-shop.jpg")}
                    alt="Top right corner of Moblin, with the app icon button next to the settings gear"
                    class="h-36 w-auto sm:h-40"
                    width="720"
                    height="419"
                    loading="lazy"
                  />
                  <span
                    class="tap-ripple"
                    style={{
                      left: "70.2%",
                      top: "15%",
                      width: "11.4%",
                      height: "19.6%",
                    }}
                    aria-hidden="true"
                  />
                  <Icon
                    name="tap"
                    class="tap-hand absolute size-[22%] text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] [stroke-width:1.9]"
                    style={{ left: "68%", top: "21%" }}
                  />
                </div>
                <p class="text-[15px] text-ink-2">
                  <strong class="font-bold text-ink">
                    Or buy a new app icon.
                  </strong>{" "}
                  Tap the Moblin icon in the top right corner of the app, next
                  to the settings gear, to open the shop. Every icon helps keep
                  Moblin free.
                </p>
              </div>
              <div class="flex flex-wrap items-end gap-2.5">
                <For each={shopIcons}>
                  {(src) => (
                    <img
                      src={asset(src)}
                      alt=""
                      class="h-11 w-auto"
                      loading="lazy"
                    />
                  )}
                </For>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap gap-3 md:shrink-0 md:flex-col md:items-stretch">
            <Button href={links.paypal}>
              <Icon name="heart" class="size-[22px]" />
              Tip on PayPal
            </Button>
            <Button href={links.sponsor} variant="ghost">
              <Icon name="github" class="size-5" />
              GitHub Sponsors
            </Button>
            <Button href={links.twitch} variant="ghost">
              <Icon name="twitch" class="size-5" />
              Watch Erik on Twitch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
