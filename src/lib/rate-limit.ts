// A small sliding-window rate limiter, in process memory. Serverless
// instances each carry their own window, so this is a brake against
// abuse rather than a precise quota, which is all an internal platform
// needs: a brute force or a runaway client hits the wall on whichever
// instance it lands on.
//
// No dependency and no shared store on purpose. If the platform ever
// needs an exact global limit, this seam is where a shared store slots
// in without touching any caller.

type Window = { startedAt: number; count: number };

const windows = new Map<string, Window>();

// Entries from finished windows pile up forever unless swept. A sweep
// every few hundred calls keeps the map bounded without a timer, which
// a serverless runtime may never fire.
let callsSinceSweep = 0;
const SWEEP_EVERY = 500;

function sweep(now: number, windowMs: number): void {
  for (const [key, entry] of windows) {
    if (now - entry.startedAt >= windowMs) {
      windows.delete(key);
    }
  }
}

// True when this call is allowed; false when the key has spent its
// limit for the current window. Keys should name the surface and the
// caller, for example "reset:someone@example.com".
export function allowRequest(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now()
): boolean {
  callsSinceSweep += 1;
  if (callsSinceSweep >= SWEEP_EVERY) {
    callsSinceSweep = 0;
    sweep(now, windowMs);
  }
  const entry = windows.get(key);
  if (entry === undefined || now - entry.startedAt >= windowMs) {
    windows.set(key, { startedAt: now, count: 1 });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

// For tests: a clean slate between cases.
export function resetRateLimits(): void {
  windows.clear();
  callsSinceSweep = 0;
}
