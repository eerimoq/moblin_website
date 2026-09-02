import { links } from "../data/links";
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
              Thousands of IRL streamers share setups, fix problems and vote on what Moblin does
              next. The developer hangs out there too.
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
            <Mascot variant="heart" class="absolute right-10 -bottom-2.5 w-[120px] rotate-[10deg]" />
          </div>
        </div>
        <div
          id="support"
          class="relative mt-6 flex scroll-mt-24 flex-col gap-5 overflow-hidden rounded-3xl border-[1.5px] border-line bg-card p-8 sm:p-12 md:flex-row md:items-center md:justify-between md:gap-10 lg:px-16">
          <Mascot variant="heart" class="pointer-events-none absolute -right-8 -bottom-10 hidden w-[130px] -rotate-[8deg] opacity-30 lg:block" />
          <div class="flex max-w-[560px] flex-col gap-4">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              Support Moblin
            </span>
            <h2 class="text-[28px] font-bold sm:text-[36px] sm:leading-tight">
              Like Moblin? Help keep it free.
            </h2>
            <p class="text-lg text-ink-2">
              Moblin is built in Erik's spare time. Sponsor the project, send a tip, or just drop by
              the stream and say hi.
            </p>
          </div>
          <div class="flex flex-wrap gap-3 md:shrink-0 md:flex-col md:items-stretch">
            <Button href={links.sponsor}>
              <Icon name="heart" class="size-[22px]" />
              GitHub Sponsors
            </Button>
            <Button href={links.paypal} variant="ghost">
              Tip on PayPal
            </Button>
            <Button href={links.twitch} variant="ghost">
              Watch Erik on Twitch
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
