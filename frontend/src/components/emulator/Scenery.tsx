import { For } from "solid-js";
import { asset } from "../../asset";

const buildings = [
  { x: -10, w: 120, h: 230, c: "#5b6573" },
  { x: 100, w: 90, h: 180, c: "#7a6a5c" },
  { x: 182, w: 70, h: 140, c: "#8d8172" },
  { x: 500, w: 80, h: 150, c: "#867565" },
  { x: 572, w: 100, h: 200, c: "#6a5f58" },
  { x: 664, w: 110, h: 250, c: "#56606c" },
];

const windows = (b: (typeof buildings)[number]) => {
  const result: { x: number; y: number }[] = [];
  for (let y = 300 - b.h + 18; y < 270; y += 34) {
    for (let x = b.x + 14; x < b.x + b.w - 20; x += 28) {
      result.push({ x, y });
    }
  }
  return result;
};

export function Street() {
  return (
    <svg
      viewBox="0 0 756 393"
      preserveAspectRatio="xMidYMid slice"
      class="absolute inset-0 size-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="emu-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#6fb1e6" />
          <stop offset="1" stop-color="#f3d9b0" />
        </linearGradient>
        <linearGradient id="emu-road" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#55585c" />
          <stop offset="1" stop-color="#2f3134" />
        </linearGradient>
      </defs>
      <rect width="756" height="393" fill="url(#emu-sky)" />
      <circle cx="420" cy="120" r="34" fill="#fff4cf" opacity="0.9" />
      <path
        d="M250 300 L290 150 L330 300 Z M320 300 L380 110 L440 300 Z M430 300 L470 170 L510 300 Z"
        fill="#9aa7a8"
        opacity="0.6"
      />
      <For each={buildings}>
        {(b) => (
          <>
            <rect x={b.x} y={300 - b.h} width={b.w} height={b.h} fill={b.c} />
            <For each={windows(b)}>
              {(w) => <rect x={w.x} y={w.y} width="14" height="18" fill="#cfe3f0" opacity="0.55" />}
            </For>
          </>
        )}
      </For>
      <path d="M0 300 H756 V393 H0 Z" fill="#8a8f86" />
      <path d="M300 300 H456 L640 393 H116 Z" fill="url(#emu-road)" />
      <path d="M376 306 h4 l3 18 h-10 Z M372 338 h12 l5 30 h-22 Z" fill="#f2f0e8" opacity="0.85" />
      <rect x="140" y="215" width="8" height="90" fill="#4a3b2c" />
      <circle cx="144" cy="200" r="42" fill="#3f7d3a" />
      <circle cx="120" cy="222" r="26" fill="#4f9147" />
      <rect x="616" y="225" width="8" height="85" fill="#4a3b2c" />
      <circle cx="620" cy="210" r="38" fill="#3f7d3a" />
      <rect x="530" y="250" width="4" height="60" fill="#2d2f31" />
      <rect x="520" y="240" width="24" height="10" rx="3" fill="#2d2f31" />
    </svg>
  );
}

export function Room() {
  return (
    <div class="absolute inset-0 overflow-hidden">
      <svg
        viewBox="0 0 756 393"
        preserveAspectRatio="xMidYMid slice"
        class="absolute inset-0 size-full"
        aria-hidden="true"
      >
        <rect width="756" height="393" fill="#d8c8b2" />
        <rect
          x="470"
          y="40"
          width="200"
          height="170"
          rx="6"
          fill="#9fd0f0"
          stroke="#f4efe6"
          stroke-width="12"
        />
        <path d="M570 40 V210 M470 125 H670" stroke="#f4efe6" stroke-width="8" />
        <rect x="60" y="250" width="150" height="143" fill="#8b6a4d" />
        <path
          d="M110 250 c-20 -40 -10 -80 25 -100 c-5 40 5 70 -10 100 Z M135 250 c10 -50 40 -70 70 -80 c-20 30 -25 60 -45 80 Z"
          fill="#4f9147"
        />
        <rect x="95" y="225" width="60" height="30" rx="6" fill="#b5654a" />
        <rect y="330" width="756" height="63" fill="#a88e72" />
      </svg>
      <img
        src={asset("logos/logo-happy.png")}
        alt=""
        class="absolute bottom-[-4%] left-1/2 h-[78%] -translate-x-1/2"
        draggable={false}
      />
    </div>
  );
}
