import { onCleanup, Show } from "solid-js";
import { asset } from "../../asset";
import { pages } from "../../data/links";
import ControlBar from "./ControlBar";
import Preview from "./Preview";
import Settings from "./Settings";
import { createEmulator } from "./state";

export default function Emulator() {
  const emu = createEmulator();
  const observer = new IntersectionObserver(([entry]) => emu.setVisible(entry.isIntersecting));
  onCleanup(() => observer.disconnect());

  return (
    <section id="try-it" class="pt-10 pb-24">
      <div class="mx-auto flex max-w-[1120px] flex-col gap-10 px-5 sm:px-8">
        <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
          <div class="flex flex-col gap-2.5">
            <span class="font-display text-[15px] font-semibold uppercase tracking-[0.08em] text-leaf">
              Try it
            </span>
            <h2 class="text-4xl font-bold sm:text-[46px]">Tap around before you install.</h2>
          </div>
          <p class="max-w-[440px] text-lg text-muted">
            A simplified Moblin in your browser. Switch scenes, try the quick buttons, go live and
            dig into the settings. The{" "}
            <a href={asset(pages.docs)} class="font-bold text-leaf hover:text-leaf-bright">
              documentation
            </a>{" "}
            covers everything else.
          </p>
        </div>
        <p class="-mb-6 text-[15px] text-muted sm:hidden">
          Swipe sideways to see the whole phone, or turn your phone for a bigger view.
        </p>
        <div class="-mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0">
          <div
            ref={(el) => observer.observe(el)}
            class="@container mx-auto w-full max-w-[980px] min-w-[640px] select-none"
          >
            <div class="app-units rounded-[calc(var(--spacing)*15.5)] bg-black p-3.5 shadow-[0_30px_60px_rgba(0,0,0,0.45)] ring-2 ring-ghost-line">
              <div class="relative flex aspect-[852/393] overflow-hidden rounded-[calc(var(--spacing)*12.5)] bg-black font-[system-ui,-apple-system,sans-serif]">
                <Preview emu={emu} />
                <ControlBar emu={emu} />
                <div class="pointer-events-none absolute top-1/2 left-3 h-28 w-8 -translate-y-1/2 rounded-full bg-black" />
                <Settings emu={emu} />
                <Show when={emu.alert()}>
                  {(alert) => (
                    <div class="absolute inset-0 z-40 flex items-center justify-center bg-black/40 text-white">
                      <div
                        role="alertdialog"
                        aria-label={alert().title}
                        class="w-68 overflow-hidden rounded-[calc(var(--spacing)*3.5)] bg-app-alert text-center"
                      >
                        <div class="px-4 pt-4 pb-3.5">
                          <div class="font-semibold app-text-16">{alert().title}</div>
                          <div class="mt-0.5 app-text-13">{alert().message}</div>
                        </div>
                        <div class="flex border-t border-app-separator app-text-16">
                          <button
                            type="button"
                            class="h-11 flex-1 text-app-blue"
                            onClick={() => emu.setAlert(null)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            class="h-11 flex-1 border-l border-app-separator font-semibold text-app-red"
                            onClick={() => {
                              alert().onConfirm();
                              emu.setAlert(null);
                            }}
                          >
                            {alert().action}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Show>
                <Show when={emu.buttons.black}>
                  <button
                    type="button"
                    class="absolute inset-0 z-50 flex items-end justify-center bg-black pb-6 text-app-secondary/60 app-text-12"
                    onClick={() => emu.toggle("black")}
                  >
                    Black screen saves battery. Tap to leave.
                  </button>
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
