import type { ReactNode } from "react";

// The app's icons: simple line drawings at 18px that take the colour of
// the text around them. Always decorative (aria-hidden): the words next
// to an icon say what it means.

function Svg({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <svg
      className={className === undefined ? "icon" : `icon ${className}`}
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

type Props = { className?: string };

export const IconPin = (p: Props) => (
  <Svg {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);
export const IconSearch = (p: Props) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-4-4" />
  </Svg>
);
export const IconBed = (p: Props) => (
  <Svg {...p}>
    <path d="M3 18V6M3 14h18M21 18v-5a3 3 0 0 0-3-3h-7v4" />
    <circle cx="7" cy="11" r="1.6" />
  </Svg>
);
export const IconBath = (p: Props) => (
  <Svg {...p}>
    <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2zM6 12V6a2 2 0 0 1 4 0M7 19l-1 2M17 19l1 2" />
  </Svg>
);
export const IconCar = (p: Props) => (
  <Svg {...p}>
    <path d="M4 16v-3l2-5h12l2 5v3zM6 16v2M18 16v2M4 13h16" />
  </Svg>
);
export const IconHouse = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20V10l8-6 8 6v10zM10 20v-6h4v6" />
  </Svg>
);
export const IconHeart = (p: Props) => (
  <Svg {...p}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  </Svg>
);
export const IconClock = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
    <path d="M12 8v4l3 2" />
  </Svg>
);
export const IconCoffee = (p: Props) => (
  <Svg {...p}>
    <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M12 3v3" />
  </Svg>
);
export const IconCalendar = (p: Props) => (
  <Svg {...p}>
    <rect x="4" y="5" width="16" height="15" rx="2" />
    <path d="M4 10h16M9 3v4M15 3v4" />
  </Svg>
);
export const IconRoute = (p: Props) => (
  <Svg {...p}>
    <path d="M9 4 4 6v14l5-2 6 2 5-2V4l-5 2zM9 4v14M15 6v14" />
  </Svg>
);
export const IconPlus = (p: Props) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);
export const IconCheck = (p: Props) => (
  <Svg {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </Svg>
);
export const IconMoon = (p: Props) => (
  <Svg {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
  </Svg>
);
export const IconSun = (p: Props) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
);
export const IconPencil = (p: Props) => (
  <Svg {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" />
  </Svg>
);
