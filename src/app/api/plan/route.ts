import { answer, readBody } from "@/lib/api";
import { logger } from "@/lib/logger";
import { planDay } from "@/lib/planner";
import { planSchema } from "@/lib/schemas";
import { travelMatrix } from "@/lib/travel";

// The day's order. Drive times come from the travel seam, the order
// from the planner; the answer says which kind of drive time was used.
export async function POST(req: Request) {
  const { body, refusal } = await readBody(req, "plan", 30, planSchema);
  if (refusal !== null) return refusal;
  try {
    const { minutes, source } = await travelMatrix(body.stops.map((s) => ({ lat: s.lat, lng: s.lng })));
    const plan = planDay(body.stops, minutes, body.settings);
    logger.info("plan", { asked: body.stops.length, planned: plan.stops.length, travel: source });
    return answer({ plan, travelSource: source }, null);
  } catch (problem) {
    logger.error("plan_failed", { reason: problem instanceof Error ? problem.name : "unknown" });
    return answer(null, "The day could not be planned. Try again.", 500);
  }
}
