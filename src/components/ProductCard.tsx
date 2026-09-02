import { For, Show } from "solid-js";
import type { Product } from "../data/products";
import Button from "./Button";
import Icon from "./Icon";

export default function ProductCard(props: { product: Product }) {
  const p = () => props.product;
  return (
    <li class="flex flex-col gap-5 rounded-3xl border-[1.5px] border-line bg-card p-6 sm:p-9">
      <div class="flex items-center gap-5">
        <Show
          when={p().logo}
          fallback={
            <div class="flex size-[84px] shrink-0 items-center justify-center">
              <Show when={p().icon}>{(icon) => <Icon name={icon()} class="size-14 text-leaf [stroke-width:1.6]" />}</Show>
            </div>
          }
        >
          {(logo) => (
            <img src={logo()} alt="" class="h-[90px] w-[84px] shrink-0 object-contain" loading="lazy" />
          )}
        </Show>
        <div class="flex flex-col gap-1">
          <h3 class="text-2xl font-bold sm:text-[30px]">{p().name}</h3>
          <p class="font-bold text-leaf">{p().tagline}</p>
        </div>
      </div>
      <p class="text-ink-2">{p().description}</p>
      <ol class="flex flex-col gap-2.5 rounded-2xl bg-page px-5 py-4">
        <For each={p().steps}>
          {(step) => (
            <li class="text-sm text-ink-2">
              <Show when={step.lead}>
                <strong class="font-bold text-ink">{step.lead} </strong>
              </Show>
              {step.text}
              <Show when={step.code}>
                {" "}
                <code class="rounded-lg border border-line bg-well px-2 py-0.5 font-mono text-[13.5px] whitespace-nowrap text-ink">
                  {step.code}
                </code>
              </Show>
              <Show when={step.path}>
                {" "}
                <strong class="font-bold text-ink">{step.path}</strong>
              </Show>
            </li>
          )}
        </For>
      </ol>
      <div class="mt-1 flex flex-wrap gap-3">
        <Button href={p().primary.href} size="sm">
          {p().primary.label}
        </Button>
        <Button href={p().secondary.href} variant="ghost" size="sm">
          {p().secondary.label}
        </Button>
      </div>
    </li>
  );
}
