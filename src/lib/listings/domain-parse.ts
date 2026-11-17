import { z } from "zod";
import type { InspectionWindow, Listing } from "../types.ts";
import { priceFromText } from "../price.ts";
import { DEFAULT_OPEN_MINUTES, splitLocalDateTime } from "../time.ts";

// Turning Domain's search answer into our Listing. Kept apart from the
// network call so it can be tested against saved answers.
//
// Read defensively. Each result is either a single listing or a project
// (a development) with its listings nested; coordinates have appeared
// under propertyDetails and under geoLocation; an inspection sometimes
// carries no closing time. Anything that cannot be placed on a map or
// has no inspection time is left out rather than guessed.

const timeSchema = z.object({
  openingTime: z.string(),
  closingTime: z.string().optional().nullable(),
});

const listingSchema = z.object({
  id: z.union([z.number(), z.string()]),
  listingSlug: z.string().optional().nullable(),
  priceDetails: z
    .object({ displayPrice: z.string().optional().nullable() })
    .partial()
    .optional()
    .nullable(),
  propertyDetails: z
    .object({
      displayableAddress: z.string().optional().nullable(),
      suburb: z.string().optional().nullable(),
      propertyType: z.string().optional().nullable(),
      bedrooms: z.number().optional().nullable(),
      bathrooms: z.number().optional().nullable(),
      carspaces: z.number().optional().nullable(),
      latitude: z.number().optional().nullable(),
      longitude: z.number().optional().nullable(),
    })
    .optional()
    .nullable(),
  geoLocation: z
    .object({ latitude: z.number().optional().nullable(), longitude: z.number().optional().nullable() })
    .optional()
    .nullable(),
  inspectionSchedule: z
    .object({ times: z.array(timeSchema).optional().nullable() })
    .optional()
    .nullable(),
});

const resultSchema = z.object({
  type: z.string().optional().nullable(),
  listing: listingSchema.optional().nullable(),
  listings: z.array(listingSchema).optional().nullable(),
});


function clean(text: string, max: number): string {
  return text.replace(/\s+/g, " ").trim().slice(0, max);
}

function toListing(raw: z.infer<typeof listingSchema>): Listing | null {
  const details = raw.propertyDetails ?? null;
  const lat = details?.latitude ?? raw.geoLocation?.latitude ?? null;
  const lng = details?.longitude ?? raw.geoLocation?.longitude ?? null;
  const address = clean(details?.displayableAddress ?? "", 200);
  if (lat === null || lng === null || address === "") return null;

  const inspections: InspectionWindow[] = [];
  for (const time of raw.inspectionSchedule?.times ?? []) {
    const opens = splitLocalDateTime(time.openingTime);
    if (opens === null) continue;
    const closes = time.closingTime ? splitLocalDateTime(time.closingTime) : null;
    const close =
      closes !== null && closes.date === opens.date && closes.minutes > opens.minutes
        ? closes.minutes
        : Math.min(opens.minutes + DEFAULT_OPEN_MINUTES, 1439);
    inspections.push({ date: opens.date, open: opens.minutes, close });
  }
  if (inspections.length === 0) return null;

  const priceText = clean(raw.priceDetails?.displayPrice ?? "", 120);
  const id = String(raw.id);
  const slug = raw.listingSlug ?? "";
  return {
    id: `domain-${id}`,
    source: "domain",
    address,
    suburb: clean(details?.suburb ?? "", 80),
    lat,
    lng,
    approximate: false,
    bedrooms: details?.bedrooms ?? null,
    bathrooms: details?.bathrooms ?? null,
    carSpaces: details?.carspaces ?? null,
    propertyType: details?.propertyType ? clean(details.propertyType, 40) : null,
    priceText,
    priceFrom: priceFromText(priceText),
    // Only ever a link to domain.com.au, built here, never taken whole
    // from the answer.
    url: /^[a-z0-9-]+$/i.test(slug)
      ? `https://www.domain.com.au/${slug}`
      : /^\d+$/.test(id)
        ? `https://www.domain.com.au/${id}`
        : null,
    inspections,
  };
}

export function parseDomainResults(body: unknown): Listing[] {
  if (!Array.isArray(body)) return [];
  const out = new Map<string, Listing>();
  for (const item of body) {
    const parsed = resultSchema.safeParse(item);
    if (!parsed.success) continue;
    const raws = [
      ...(parsed.data.listing ? [parsed.data.listing] : []),
      ...(parsed.data.listings ?? []),
    ];
    for (const raw of raws) {
      const listing = toListing(raw);
      if (listing !== null) out.set(listing.id, listing);
    }
  }
  return [...out.values()];
}
