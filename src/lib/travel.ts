import "server-only";

import { getTravelEnv, isDemoMode } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { TravelSource } from "@/lib/types";
import { estimateMatrix, type Point } from "./travel-estimate";

// The travel seam. Drive minutes between every pair of stops. With
// TRAVEL_PROVIDER=osrm it asks an OSRM server for real road times; in
// demo mode, or when the server does not answer, it falls back to the
// estimate and says which one was used so the screen can say so too.
//
// The only outbound host is the configured OSRM base URL, read and
// checked in src/lib/env.ts. Coordinates are numbers validated by the
// route before they get here, so nothing a user types shapes the URL
// beyond those numbers.

const TIMEOUT_MS = 8_000;

export async function travelMatrix(
  points: Point[]
): Promise<{ minutes: number[][]; source: TravelSource }> {
  const env = getTravelEnv();
  if (isDemoMode() || env.provider !== "osrm" || points.length < 2) {
    return { minutes: estimateMatrix(points), source: "estimate" };
  }
  try {
    const coords = points.map((p) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`).join(";");
    const answer = await fetch(`${env.baseUrl}/table/v1/driving/${coords}?annotations=duration`, {
      headers: { "User-Agent": "openhouse-planner (personal use)" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!answer.ok) {
      throw new Error(`status ${answer.status}`);
    }
    const body = (await answer.json()) as { durations?: unknown };
    const rows = body.durations;
    if (
      !Array.isArray(rows) ||
      rows.length !== points.length ||
      !rows.every(
        (row) =>
          Array.isArray(row) &&
          row.length === points.length &&
          row.every((cell) => typeof cell === "number" && Number.isFinite(cell) && cell >= 0)
      )
    ) {
      throw new Error("unexpected shape");
    }
    return {
      minutes: (rows as number[][]).map((row) => row.map((seconds) => Math.ceil(seconds / 60))),
      source: "osrm",
    };
  } catch (problem) {
    logger.warn("osrm_fallback", { reason: problem instanceof Error ? problem.message.slice(0, 60) : "unknown" });
    return { minutes: estimateMatrix(points), source: "estimate" };
  }
}
