import { createSignal, onCleanup, onMount } from "solid-js";

/**
 * Whether a Twitch channel is live right now, via the public decapi.me uptime
 * endpoint (Twitch's own API needs a secret, which a static site cannot hold).
 * Falls back to "not live" whenever the check fails.
 */
export function createTwitchLive(channel: string, refreshMs = 5 * 60 * 1000) {
  const [live, setLive] = createSignal(false);

  const check = async () => {
    try {
      const res = await fetch(`https://decapi.me/twitch/uptime/${channel}`, {
        cache: "no-store",
      });
      const text = (await res.text()).trim();
      setLive(res.ok && text !== "" && !/is offline|not found|error/i.test(text));
    } catch {
      setLive(false);
    }
  };

  onMount(() => {
    void check();
    const timer = setInterval(() => void check(), refreshMs);
    onCleanup(() => clearInterval(timer));
  });

  return live;
}
