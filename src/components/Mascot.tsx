import { asset } from "../asset";

export type MascotVariant =
  | "default"
  | "party"
  | "happy"
  | "thumbs-up"
  | "looking"
  | "heart"
  | "discord";

type Props = {
  variant: MascotVariant;
  class?: string;
  /** Adds a white sticker outline and a soft shadow. */
  sticker?: boolean;
  alt?: string;
};

export default function Mascot(props: Props) {
  return (
    <img
      src={asset(`logos/logo-${props.variant}.png`)}
      alt={props.alt ?? ""}
      class={`${props.sticker ? "sticker " : ""}${props.class ?? ""}`}
      loading="lazy"
      decoding="async"
    />
  );
}
