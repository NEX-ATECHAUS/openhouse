# Branding

The look, written down once. The tokens are at the top of
`src/app/globals.css`; this file says what they are for.

## Where it comes from

The palette, type and shapes follow the reference stylesheets supplied
at the start of the project: deep teal with a bright teal and an amber
accent, Albert Sans headings at regular weight with tight tracking,
Inter for text, Fira Mono for small uppercase labels, 8px corners.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--teal-deep` | #0a4246 | | The brand. Header, ink, the everyday button in light |
| `--teal` | #54b6b9 | | The everyday button in dark |
| `--amber` / `--accent` | #f4b860 | #f4b860 | The one action a screen is for (Plan my day, the route) |
| `--canvas` | #e8f5f6 | #061c1e | The page |
| `--surface` | #ffffff | #0d2f32 | Cards |
| `--surface-soft` | #f1f8f8 | #123a3d | A home, a stop, a total, inside a card |
| `--text` | #0a4246 | #e8f5f6 | Ink |
| `--muted` | #3f6669 | #a5c9cb | Secondary text |
| soft fills | teal, amber, green, red | | Pills and notices, each with its own ink at 4.5:1 or better |

Teal is structure, state and selection. Amber is action and must-see.
Red is for something that failed or is out of range, never decoration.
The theme follows the device; there is no switch.

## Type

- Headings: Albert Sans, weight 400, tracking about minus one percent.
- Text: Inter, 15px, 1.5 line height. 13px for dense secondary text.
- Labels above headings and figures (`.tagline`): Fira Mono, 12px,
  uppercase.
- The fonts are bundled with the build (`@fontsource`), so nothing is
  fetched from another site.

## Shape and spacing

- Cards 16px corners; controls, homes and stops 8px; pills fully round.
- Blocks on a page stand 20px apart, by the page's rule. Parts of a
  card stand 14px apart.
- A box has a full border, a filled tint, or nothing. Never a coloured
  bar down one side.
- Controls are 40px high with a mouse and at least 44px on touch.

## The mark

A house in deep teal on an amber rounded square: `src/app/icon.svg`,
repeated in the header in `src/app/layout.tsx`.

## Voice

Plain and calm. No emojis, no em dashes or en dashes. Written from the
side of the person standing outside a house with a phone: "Open home",
"In my day", "Must-see", "9 min drive", "6 min to spare". A control
says exactly what it does. An error says why and what to do next.
