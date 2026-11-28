import { onSettled } from "solid-js";
import type { JSX } from "@solidjs/web";

export default function CardLightbox(props: { onClose: () => void; children: JSX.Element }) {
  const zoom = Math.min(1.5, (innerWidth - 32) / 284, (innerHeight - 32) / 396);

  onSettled(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        props.onClose();
      }
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  });

  return (
    <div
      class="tcard-lightbox"
      style={{ "--zoom": zoom.toFixed(2) }}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("a")) {
          props.onClose();
        }
      }}
    >
      {props.children}
    </div>
  );
}
