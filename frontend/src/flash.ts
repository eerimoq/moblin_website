import { createSignal, onSettled } from "solid-js";

export function createFlash(duration: number) {
  const [shown, setShown] = createSignal(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onSettled(() => () => clearTimeout(timer));

  const flash = () => {
    setShown(true);
    clearTimeout(timer);
    timer = setTimeout(() => setShown(false), duration);
  };

  return [shown, flash] as const;
}
