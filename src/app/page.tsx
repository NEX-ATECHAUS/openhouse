import { Planner } from "@/components/planner";
import { isDemoMode } from "@/lib/env";
import { nextSaturday, todayInMelbourne } from "@/lib/time";

export default function HomePage() {
  const today = todayInMelbourne();
  return (
    <>
      <div className="intro">
        <h1>Plan a day of open homes</h1>
        <p className="muted">
          Search once, pick the homes worth seeing, and get them in order with the drive between each and a break in the middle.
        </p>
      </div>
      <Planner defaultDate={nextSaturday(today)} today={today} demo={isDemoMode()} />
    </>
  );
}
