import { z } from "zod";

// Environment access, read and checked in this one file. Nothing else
// touches process.env. A missing value fails at the seam that needs it,
// in plain words, rather than deep inside a call. Demo mode needs none.

export function isDemoMode(): boolean {
  // Demo is the default: with nothing set the app runs on sample data
  // rather than failing. Only an explicit "false" turns it off.
  return process.env.NEXT_PUBLIC_DEMO_MODE !== "false";
}

export function isVisualHarness(): boolean {
  return process.env.VISUAL_HARNESS === "true";
}

export type DomainEnv =
  | { kind: "api-key"; apiKey: string }
  | { kind: "oauth"; clientId: string; clientSecret: string };

// Domain accepts an API key or an OAuth client. Either is enough; the
// key wins when both are present.
export function getDomainEnv(): { data: DomainEnv | null; error: string | null } {
  const apiKey = (process.env.DOMAIN_API_KEY ?? "").trim();
  if (apiKey !== "") {
    return { data: { kind: "api-key", apiKey }, error: null };
  }
  const clientId = (process.env.DOMAIN_CLIENT_ID ?? "").trim();
  const clientSecret = (process.env.DOMAIN_CLIENT_SECRET ?? "").trim();
  if (clientId !== "" && clientSecret !== "") {
    return { data: { kind: "oauth", clientId, clientSecret }, error: null };
  }
  return {
    data: null,
    error:
      "Domain is not connected. Add DOMAIN_API_KEY, or DOMAIN_CLIENT_ID and DOMAIN_CLIENT_SECRET, then try again.",
  };
}

const httpsUrl = z
  .string()
  .url()
  .refine((value) => value.startsWith("https://"), "must be https");

export type TravelEnv = { provider: "estimate" } | { provider: "osrm"; baseUrl: string };

export function getTravelEnv(): TravelEnv {
  if ((process.env.TRAVEL_PROVIDER ?? "estimate") !== "osrm") {
    return { provider: "estimate" };
  }
  const base = httpsUrl.safeParse(process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org");
  // A base URL that does not parse falls back to the estimate rather
  // than sending requests somewhere unintended.
  return base.success
    ? { provider: "osrm", baseUrl: base.data.replace(/\/$/, "") }
    : { provider: "estimate" };
}

export type GeocoderEnv = { provider: "off" } | { provider: "nominatim"; contact: string };

export function getGeocoderEnv(): GeocoderEnv {
  if ((process.env.GEOCODER ?? "nominatim") !== "nominatim") {
    return { provider: "off" };
  }
  return { provider: "nominatim", contact: (process.env.GEOCODER_CONTACT ?? "").trim().slice(0, 120) };
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function isPreviewDeployment(): boolean {
  return process.env.VERCEL_ENV === "preview";
}
