import { z } from "zod";
import { isDay } from "./time.ts";

// The shapes the API routes accept. Every value from the browser passes
// one of these before it reaches a seam.

export const STATES = ["VIC", "NSW", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;

const suburbName = z
  .string()
  .trim()
  .min(2, "a suburb needs at least two letters")
  .max(60)
  .regex(/^[A-Za-z][A-Za-z' .-]*$/, "use letters only");

export const searchSchema = z.object({
  suburbs: z.array(suburbName).min(1, "add at least one suburb").max(8, "eight suburbs at most"),
  state: z.enum(STATES),
  minBedrooms: z.number().int().min(0).max(10),
  maxPrice: z.number().int().min(50_000, "the budget is too low to search").max(50_000_000),
  date: z.string().refine(isDay, "pick a day"),
  includeSurrounding: z.boolean(),
  includeUnpriced: z.boolean(),
});

const minuteOfDay = z.number().int().min(0).max(1439);
const latitude = z.number().min(-90).max(90);
const longitude = z.number().min(-180).max(180);

export const planSchema = z.object({
  stops: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        lat: latitude,
        lng: longitude,
        mustSee: z.boolean(),
        windows: z
          .array(z.object({ open: minuteOfDay, close: minuteOfDay }).refine((w) => w.close > w.open, "closes before it opens"))
          .min(1)
          .max(6),
      })
    )
    .min(1, "pick at least one home")
    .max(40, "forty homes at most in one day"),
  settings: z.object({
    visitMinutes: z.number().int().min(5).max(60),
    bufferMinutes: z.number().int().min(0).max(30),
    breakMinutes: z.number().int().min(0).max(120),
    breakAfter: minuteOfDay,
  }),
});

export const geocodeSchema = z.object({
  street: z.string().trim().min(3, "add the street address").max(120).regex(/^[^<>\r\n]*$/, "remove the symbols"),
  suburb: suburbName,
  state: z.enum(STATES),
});
