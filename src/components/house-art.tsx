// The illustrated street that stands in for a photo: a few houses with
// two-tone roofs, a tree and the sun, on a soft gradient sky. Drawn here
// as shapes, so it is crisp at any size and needs no image request.
// Four palettes; a home always gets the same one, picked from its id,
// so the list reads as varied but never changes between visits.
// The colours are artwork, fixed in both themes, like a photo would be.

const PALETTES = {
  warm: { sky: ["#f9d58f", "#d3e9c6"], sun: "#fff4d6", hill: "#c3dfb1", roof: "#ee7c5d", roofShade: "#d8634a", wall: "#fae2b8", wallShade: "#f1c992", window: "#f3a462", ground: "#f6cda2", tree: "#9cc98a" },
  sky: { sky: ["#a3cff3", "#ecdcf6"], sun: "#ffffff", hill: "#cbc4f0", roof: "#f08a6a", roofShade: "#d96f52", wall: "#fbe9d6", wallShade: "#f2d3b6", window: "#8f9be8", ground: "#cdbfee", tree: "#8fc7a6" },
  rose: { sky: ["#f8c9bf", "#fde6c4"], sun: "#fff1e0", hill: "#f3bcaa", roof: "#e86d55", roofShade: "#cf5641", wall: "#fde4cc", wallShade: "#f5cba8", window: "#f09a6e", ground: "#f4c3a6", tree: "#a9cf95" },
  mint: { sky: ["#bfe6d6", "#f4efc9"], sun: "#fffbe6", hill: "#acd9c4", roof: "#f29470", roofShade: "#db7656", wall: "#fbebcf", wallShade: "#f1d4a8", window: "#7fc1a6", ground: "#d2e5b9", tree: "#7fbf94" },
} as const;

export type ArtVariant = keyof typeof PALETTES;

const VARIANTS: ArtVariant[] = ["warm", "sky", "rose", "mint"];

export function artVariantFor(key: string): ArtVariant {
  let n = 0;
  for (const c of key) n = (n * 31 + c.charCodeAt(0)) >>> 0;
  return VARIANTS[n % VARIANTS.length] ?? "warm";
}

// An arched window or door.
function arch(x: number, y: number, w: number, h: number): string {
  const r = w / 2;
  return `M${x} ${y + h}V${y + r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h}Z`;
}

// One house: walls with the right half in shade, and a gable roof with
// its right slope in shade.
function House({ x, y, w, h, roofRise, p }: { x: number; y: number; w: number; h: number; roofRise: number; p: (typeof PALETTES)[ArtVariant] }) {
  const mid = x + w / 2;
  const eave = 8;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={p.wall} />
      <rect x={mid} y={y} width={w / 2} height={h} fill={p.wallShade} />
      <polygon points={`${x - eave},${y + 2} ${mid},${y - roofRise} ${x + w + eave},${y + 2}`} fill={p.roof} />
      <polygon points={`${mid},${y - roofRise} ${x + w + eave},${y + 2} ${mid},${y + 2}`} fill={p.roofShade} />
    </g>
  );
}

export function HouseArt({ variant, id }: { variant: ArtVariant; id: string }) {
  const p = PALETTES[variant];
  const sky = `sky-${id.replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg className="art" viewBox="0 0 320 200" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={sky} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.sky[0]} />
          <stop offset="1" stopColor={p.sky[1]} />
        </linearGradient>
      </defs>
      <rect width="320" height="200" fill={`url(#${sky})`} />
      <circle cx="262" cy="46" r="20" fill={p.sun} opacity="0.9" />
      <ellipse cx="72" cy="44" rx="34" ry="9" fill="#ffffff" opacity="0.45" />
      <ellipse cx="200" cy="28" rx="24" ry="7" fill="#ffffff" opacity="0.35" />
      <path d="M0 150 Q80 120 160 140 T320 130 V200 H0Z" fill={p.hill} />
      <House x={128} y={66} w={50} h={114} roofRise={36} p={p} />
      <circle cx="153" cy="92" r="8" fill={p.window} />
      <path d={arch(144, 116, 18, 28)} fill={p.window} />
      <House x={28} y={122} w={88} h={58} roofRise={40} p={p} />
      <path d={arch(44, 140, 16, 22)} fill={p.window} />
      <path d={arch(84, 140, 16, 22)} fill={p.window} />
      <House x={192} y={118} w={102} h={62} roofRise={38} p={p} />
      <path d={arch(208, 136, 16, 22)} fill={p.window} />
      <path d={arch(268, 136, 16, 22)} fill={p.window} />
      <rect x="178" y="150" width="5" height="30" fill={p.roofShade} />
      <circle cx="180" cy="142" r="16" fill={p.tree} />
      <House x={106} y={148} w={60} h={32} roofRise={26} p={p} />
      <path d={arch(128, 158, 16, 22)} fill={p.roofShade} />
      <rect y="178" width="320" height="22" fill={p.ground} />
    </svg>
  );
}
