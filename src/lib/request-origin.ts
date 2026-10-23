/**
 * Validate browser mutation origins against the canonical public URL.
 * Production hosts often terminate TLS or rewrite hosts at a reverse proxy,
 * so request.url may describe the internal upstream rather than the browser's
 * public origin. APP_URL is the trusted canonical origin configured by ops.
 */
export function isAllowedRequestOrigin(request: Request): boolean {
  const rawOrigin = request.headers.get("origin");
  if (!rawOrigin) return true;

  let origin: string;
  try {
    const parsed = new URL(rawOrigin);
    if ((parsed.protocol !== "https:" && parsed.protocol !== "http:") || parsed.origin !== rawOrigin) return false;
    origin = parsed.origin;
  } catch {
    return false;
  }

  const appUrl = process.env.APP_URL?.trim();
  if (appUrl) {
    try {
      const configured = new URL(appUrl);
      if (configured.protocol !== "https:" && configured.protocol !== "http:") return false;
      return origin === configured.origin;
    } catch {
      return false;
    }
  }

  // Local development may not have APP_URL set. Never fall back to forwarded
  // headers or the request URL in production, where either can be proxy-owned.
  if (process.env.NODE_ENV === "production") return false;
  try {
    return origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}
