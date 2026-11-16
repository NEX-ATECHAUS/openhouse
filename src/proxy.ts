import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDevelopment, isPreviewDeployment, isVisualHarness } from "@/lib/env";

// Proxy (the Next 16 name for middleware). Open House has no accounts
// yet, so there is no session to refresh and no route to gate by role:
// what every response gets here is the content security policy, with a
// fresh nonce, and noindex. When accounts arrive, the session refresh
// and the route gate go in this file, above the headers.

function buildCsp(nonce: string): string {
  const isDev = isDevelopment();
  // Vercel preview deployments inject the Live toolbar. Allow it on
  // previews only; production keeps the strict policy.
  const live = isPreviewDeployment() ? " https://vercel.live" : "";
  const liveConnect = isPreviewDeployment() ? " https://vercel.live wss://*.pusher.com" : "";
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}${live}`,
    `style-src 'self' 'unsafe-inline'${live}`,
    `img-src 'self' blob: data:${live}`,
    `font-src 'self' data:${live}`,
    // The browser talks only to this app. Domain, the router and the
    // geocoder are called from the server, through their seams.
    `connect-src 'self'${isDev ? " ws:" : ""}${liveConnect}`,
    `frame-src 'none'${live}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    `upgrade-insecure-requests`,
  ].join("; ");
}

export default function proxy(req: NextRequest): NextResponse {
  // The visual harness gallery exists only when VISUAL_HARNESS is set,
  // which nothing but scripts/visual/run.mjs sets and no deployment ever
  // does. Without it the route is refused here, before the page runs.
  if (req.nextUrl.pathname === "/visual" && !isVisualHarness()) {
    return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain" } });
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce);
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  // Next reads the nonce for its own scripts from this request header.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  // A personal tool: keep every page out of search engines.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)",
  ],
};
