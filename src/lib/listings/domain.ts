import "server-only";

import { getDomainEnv, type DomainEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { Listing, SearchQuery } from "@/lib/types";
import { parseDomainResults } from "./domain-parse";

// The Domain seam. The only file that calls Domain's API. It reads and
// never writes: one search endpoint and the token endpoint, both fixed
// hosts, so no value from a user ever decides where a request goes.
//
// Domain is the one portal with an API open to developers.
// realestate.com.au and homely.com.au offer none and forbid scraping, so
// they are not read here; a home found there is added by hand instead.
// See docs/data-sources.md.

const SEARCH_URL = "https://api.domain.com.au/v1/listings/residential/_search";
const TOKEN_URL = "https://auth.domain.com.au/v1/connect/token";
const PAGE_SIZE = 100;
const MAX_PAGES = 3;
const TIMEOUT_MS = 12_000;

let token: { value: string; expiresAt: number } | null = null;

// Domain's own words for a refusal, for the log: the reason it gives
// (a missing package, a plan limit) is what says what to fix. Only the
// message field, cut short, with anything but plain text removed. The
// request carries no personal data, so neither can its refusal.
async function domainReason(answer: Response): Promise<string> {
  try {
    const body = (await answer.json()) as Record<string, unknown>;
    const said = [body.message, body.Message, body.error_description, body.error, body.title]
      .find((value) => typeof value === "string" && value.trim() !== "");
    return typeof said === "string" ? said.replace(/[^\w .,:;'()/-]/g, "").slice(0, 160) : "";
  } catch {
    return "";
  }
}

async function authHeaders(env: DomainEnv): Promise<Record<string, string> | null> {
  if (env.kind === "api-key") {
    return { "X-Api-Key": env.apiKey };
  }
  if (token !== null && token.expiresAt > Date.now() + 30_000) {
    return { Authorization: `Bearer ${token.value}` };
  }
  try {
    const answer = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.clientId}:${env.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials&scope=api_listings_read",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!answer.ok) {
      logger.authFailure("domain-token", { status: answer.status, reason: await domainReason(answer) });
      return null;
    }
    const body = (await answer.json()) as { access_token?: unknown; expires_in?: unknown };
    if (typeof body.access_token !== "string") return null;
    const seconds = typeof body.expires_in === "number" ? body.expires_in : 600;
    token = { value: body.access_token, expiresAt: Date.now() + seconds * 1000 };
    return { Authorization: `Bearer ${token.value}` };
  } catch (problem) {
    logger.error("domain_token_failed", { reason: problem instanceof Error ? problem.name : "unknown" });
    return null;
  }
}

export async function searchDomain(
  query: SearchQuery
): Promise<{ data: Listing[] | null; error: string | null }> {
  const { data: env, error } = getDomainEnv();
  if (env === null) {
    return { data: null, error };
  }
  const headers = await authHeaders(env);
  if (headers === null) {
    return { data: null, error: "Domain refused the sign-in. Check the Domain keys, then try again." };
  }

  const found: Listing[] = [];
  try {
    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const answer = await fetch(SEARCH_URL, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          listingType: "Sale",
          minBedrooms: query.minBedrooms,
          maxPrice: query.maxPrice,
          locations: query.suburbs.map((suburb) => ({
            state: query.state,
            suburb,
            includeSurroundingSuburbs: query.includeSurrounding,
          })),
          pageSize: PAGE_SIZE,
          pageNumber: page,
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
        cache: "no-store",
      });
      if (answer.status === 401 || answer.status === 403) {
        logger.authFailure("domain-search", { status: answer.status, reason: await domainReason(answer) });
        return { data: null, error: "Domain refused the search. The sign-in worked, so the project most likely does not have listings access yet: check API Access in the Domain developer portal shows Agents and Listings as approved." };
      }
      if (answer.status === 429) {
        return { data: null, error: "Domain's daily limit has been reached. It resets overnight; try again tomorrow." };
      }
      if (!answer.ok) {
        logger.error("domain_search_failed", { status: answer.status, page, reason: await domainReason(answer) });
        return { data: null, error: "Domain did not answer the search. Try again in a minute." };
      }
      const body: unknown = await answer.json();
      const count = Array.isArray(body) ? body.length : 0;
      found.push(...parseDomainResults(body));
      if (count < PAGE_SIZE) break;
    }
  } catch (problem) {
    logger.error("domain_search_failed", { reason: problem instanceof Error ? problem.name : "unknown" });
    return { data: null, error: "Domain could not be reached. Check the connection, then try again." };
  }
  logger.info("domain_search", { listings: found.length, suburbs: query.suburbs.length });
  return { data: found, error: null };
}
