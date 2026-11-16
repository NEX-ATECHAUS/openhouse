import "server-only";

import { NextResponse } from "next/server";
import type { z } from "zod";
import { logger } from "@/lib/logger";
import { allowRequest } from "@/lib/rate-limit";

// What every API route does before its own work: refuse a request from
// another site, throttle the caller, cap the body and check its shape.
// Routes answer in one shape, { data, error }.

const MAX_BODY_BYTES = 64 * 1024;

export function answer<T>(data: T | null, error: string | null, status = 200): NextResponse {
  return NextResponse.json({ data, error }, { status, headers: { "Cache-Control": "no-store" } });
}

function callerKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for") ?? "";
  return forwarded.split(",")[0]?.trim() || "local";
}

export async function readBody<S extends z.ZodType>(
  req: Request,
  surface: string,
  limitPerMinute: number,
  schema: S
): Promise<{ body: z.infer<S>; refusal: null } | { body: null; refusal: NextResponse }> {
  // Same-origin only. A browser sends Origin on every POST; a request
  // whose Origin is another site is not from this app's own pages.
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (origin !== null && host !== null) {
    let originHost = "";
    try {
      originHost = new URL(origin).host;
    } catch {
      originHost = "";
    }
    if (originHost !== host) {
      logger.warn("cross_origin_refused", { surface });
      return { body: null, refusal: answer(null, "That request was not allowed.", 403) };
    }
  }
  if (!allowRequest(`${surface}:${callerKey(req)}`, limitPerMinute, 60_000)) {
    logger.warn("rate_limited", { surface });
    return {
      body: null,
      refusal: answer(null, "Too many requests. Wait a minute, then try again.", 429),
    };
  }
  let parsed: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return { body: null, refusal: answer(null, "That request was too large.", 413) };
    }
    parsed = JSON.parse(text);
  } catch {
    return { body: null, refusal: answer(null, "That request could not be read.", 400) };
  }
  const checked = schema.safeParse(parsed);
  if (!checked.success) {
    const first = checked.error.issues[0];
    // The field, not its position in a list: "suburbs", not "suburbs.0".
    const where = String(first?.path[0] ?? "");
    return {
      body: null,
      refusal: answer(null, `Check ${where === "" ? "the form" : where}: ${first?.message ?? "not valid"}.`, 400),
    };
  }
  return { body: checked.data as z.infer<S>, refusal: null };
}
