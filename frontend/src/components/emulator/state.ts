import { createSignal, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";
import {
  chatMessages,
  initialButtons,
  initialValues,
  streams,
  type PickerRow,
  type SceneId,
  type StreamId,
} from "../../data/emulator";

export type NavEntry = { page: string } | { picker: PickerRow };

export type Alert = { title: string; message: string; action: string; onConfirm: () => void };

export type ChatLine = { id: number; user: string; color: string; text: string };

export function createEmulator() {
  const [values, setValues] = createStore({ ...initialValues });
  const [buttons, setButtons] = createStore<Record<string, boolean>>({ ...initialButtons });
  const [scene, setScene] = createSignal<SceneId>("back");
  const [zoom, setZoom] = createSignal("1x");
  const [live, setLive] = createSignal<"off" | "connecting" | "live">("off");
  const [liveStart, setLiveStart] = createSignal(0);
  const [recordStart, setRecordStart] = createSignal(0);
  const [now, setNow] = createSignal(Date.now());
  const [audioLevel, setAudioLevel] = createSignal(0.4);
  const [bitrate, setBitrate] = createSignal(0);
  const [sentBytes, setSentBytes] = createSignal(0);
  const [viewers, setViewers] = createSignal(0);
  const [chat, setChat] = createSignal<ChatLine[]>(
    chatMessages.slice(0, 3).map((m, id) => ({ ...m, id })),
  );
  const [toast, setToast] = createSignal<{ id: number; text: string } | null>(null);
  const [alert, setAlert] = createSignal<Alert | null>(null);
  const [panel, setPanel] = createSignal<NavEntry[] | null>(null);
  const [flash, setFlash] = createSignal(0);
  const [visible, setVisible] = createSignal(false);

  const stream = () => values.stream as StreamId;
  const streamName = () => streams.find((s) => s.id === stream())?.name ?? "";
  const value = (key: string) => values[key];
  const setValue = (key: string, v: string | boolean) => setValues(key, v);

  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  const showToast = (text: string) => {
    clearTimeout(toastTimer);
    setToast({ id: Date.now(), text });
    toastTimer = setTimeout(() => setToast(null), 2200);
  };

  const targetBitrate = () => {
    const text = String(values[`${stream()}.bitrate`]);
    const n = parseFloat(text);
    return text.endsWith("Kbps") ? n / 1000 : n;
  };

  let connectTimer: ReturnType<typeof setTimeout> | undefined;
  const goLive = () => {
    setLive("connecting");
    connectTimer = setTimeout(() => {
      setLive("live");
      setLiveStart(Date.now());
      setSentBytes(0);
      setViewers(3);
      showToast(`Live on ${streamName()}`);
    }, 1200);
  };
  const endStream = () => {
    clearTimeout(connectTimer);
    setLive("off");
    setBitrate(0);
    setViewers(0);
  };

  const toggle = (id: string) => {
    const on = !buttons[id];
    setButtons(id, on);
    if (id === "record") {
      setRecordStart(Date.now());
      showToast(on ? "Recording started" : "Recording stopped");
    }
  };

  let chatIndex = 3;
  const second = setInterval(() => {
    if (!visible()) {
      return;
    }
    setNow(Date.now());
    if (live() === "live") {
      const rate = Math.max(0.2, targetBitrate() * (0.85 + Math.random() * 0.2));
      setBitrate(rate);
      setSentBytes((b) => b + (rate * 1e6) / 8);
      if (Math.random() < 0.3) {
        setViewers((v) => Math.max(1, v + Math.round(Math.random() * 4 - 1)));
      }
    }
  }, 1000);
  const fast = setInterval(() => {
    if (visible()) {
      setAudioLevel((l) => Math.min(1, Math.max(0.1, l + (Math.random() - 0.5) * 0.35)));
    }
  }, 150);
  const chatTimer = setInterval(() => {
    if (visible()) {
      const m = chatMessages[chatIndex % chatMessages.length];
      setChat((lines) => [...lines.slice(-5), { ...m, id: chatIndex }]);
      chatIndex += 1;
    }
  }, 2600);
  onCleanup(() => {
    clearInterval(second);
    clearInterval(fast);
    clearInterval(chatTimer);
    clearTimeout(toastTimer);
    clearTimeout(connectTimer);
  });

  return {
    values,
    value,
    setValue,
    buttons,
    toggle,
    scene,
    setScene,
    zoom,
    setZoom,
    live,
    liveStart,
    recordStart,
    now,
    audioLevel,
    bitrate,
    sentBytes,
    viewers,
    chat,
    toast,
    showToast,
    alert,
    setAlert,
    panel,
    setPanel,
    flash,
    setFlash,
    setVisible,
    stream,
    streamName,
    goLive,
    endStream,
  };
}

export type Emulator = ReturnType<typeof createEmulator>;

export const duration = (ms: number) => {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
};
