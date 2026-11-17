# Branding

The look, written down once. The tokens are at the top of
`src/app/globals.css`; this file says what they are for.

## Where it comes from

The owner's reference of 17 November 2026: a soft, light property app
with big rounded white cards on a pale grey page, pill-shaped search
and chips, and warm illustrated houses in place of photos. Open House
takes the feel, not the screens: its own layout, its own drawings.

## Colour

| Token | Light | Dark | Use |
|---|---|---|---|
| `--canvas` | #eef0f3 | #111214 | The page, with a faint warm glow at the top |
| `--surface` | #ffffff | #1b1c1f | Cards, homes, stops |
| `--surface-soft` | #f5f6f8 | #232428 | Fields, the day's totals |
| `--text` | #17181a | #f3f3f5 | Ink |
| `--muted` | #5d6169 | #a9adb5 | Secondary text |
| `--primary` | #17181a | #f3f3f5 | The everyday button and a chosen chip |
| `--soft` | #eceef1 | #2a2b30 | Quiet buttons and chips |
| warm gradient | #f9cf8f to #f29a7c | same | The one action a screen is for, and the stop numbers. Ink #2b1710 on it |
| soft fills | grey, amber, green, red | | Pills and notices, each with its own ink at 4.5:1 or better |

Warm is action and must-see. Red is for something that failed or is
out of range, never decoration. The theme follows the device; there is
no switch.

## The pictures

`src/components/house-art.tsx` draws a small street (houses with
two-tone roofs, a tree, the sun) on a gradient sky, in four palettes:
warm, sky, rose and mint. A home always gets the same palette, picked
from its id. The hero uses warm. The drawings are artwork, the same in
both themes, as a photo would be. When Domain photos are read later,
they take the same frame.

## Type

- Inter throughout, bundled with the build so nothing is fetched from
  another site.
- Headings weight 600, tracking minus two percent. The page heading
  scales from 28px on a phone to 40px on a desk.
- Text 15px, 1.5 line height; 13px for dense secondary text.

## Shape and spacing

- Cards 32px corners (24px on a phone); homes, stops and pictures 24px;
  buttons, fields, chips and pills fully round.
- Blocks on a page stand 20px apart, by the page's rule. Parts of a
  card stand 16px apart.
- A box has a full border, a filled tint, or nothing. Never a coloured
  bar down one side.
- Controls are at least 36px with a mouse and 44px on touch.

## The mark

A house in dark ink on a warm gradient rounded square:
`src/app/icon.svg`, repeated in the header in `src/app/layout.tsx`.

## Voice

Plain and calm. No emojis, no em dashes or en dashes. Written from the
side of the person standing outside a house with a phone: "Open home",
"In my day", "Must-see", "9 min drive", "6 min to spare". A control
says exactly what it does. An error says why and what to do next.
