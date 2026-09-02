import type { JSX } from "solid-js";

type Props = {
  href: string;
  variant?: "primary" | "ghost";
  size?: "md" | "sm";
  class?: string;
  children: JSX.Element;
};

const isExternal = (href: string) => /^https?:/.test(href);

export default function Button(props: Props) {
  const variant = () =>
    props.variant === "ghost"
      ? "bg-ghost text-ink border-[1.5px] border-ghost-line hover:bg-ghost-hover hover:text-white"
      : "bg-moss text-white hover:bg-moss-bright";
  const size = () => (props.size === "sm" ? "h-11 px-5 text-base" : "h-13 px-6 text-lg");
  return (
    <a
      href={props.href}
      target={isExternal(props.href) ? "_blank" : undefined}
      rel={isExternal(props.href) ? "noopener" : undefined}
      class={`inline-flex items-center justify-center gap-2.5 rounded-full font-display font-semibold whitespace-nowrap transition-colors ${variant()} ${size()} ${props.class ?? ""}`}
    >
      {props.children}
    </a>
  );
}
