import { Planner } from "@/components/planner";
import { isDemoMode } from "@/lib/env";
import { nextSaturday, todayInMelbourne } from "@/lib/time";

export default function HomePage() {
  const today = todayInMelbourne();
  return <Planner defaultDate={nextSaturday(today)} today={today} demo={isDemoMode()} />;
}
