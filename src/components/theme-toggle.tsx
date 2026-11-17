"use client";

import { useSyncExternalStore } from "react";
import { IconMoon, IconSun } from "@/components/icons";
import { THEME_KEY } from "@/lib/theme";

// The light and dark switch in the header. Until it is used the page
// follows the device; once used, the choice is kept in this browser and
// set on the page before it paints (the script in src/app/layout.tsx),
// so a dark choice never flashes light first.

type Theme = "light" | "dark";

function current(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  window.addEventListener(THEME_KEY, onChange);
  return () => {
    media.removeEventListener("change", onChange);
    window.removeEventListener(THEME_KEY, onChange);
  };
}

export function ThemeToggle() {
  // Null on the server, which cannot know the device's theme.
  const theme = useSyncExternalStore<Theme | null>(subscribe, current, () => null);
  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="button ghost small"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => {
        const next: Theme = current() === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        try {
          window.localStorage.setItem(THEME_KEY, next);
        } catch {
          // A browser that refuses storage still switches, for this visit.
        }
        window.dispatchEvent(new Event(THEME_KEY));
      }}
    >
      {dark ? <IconSun /> : <IconMoon />}
      {dark ? "Light mode" : "Dark mode"}
    </button>
  );
}
