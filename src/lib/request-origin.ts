/**
 * Validate browser mutation origins against the canonical public URL.
 * Production hosts often terminate TLS or rewrite hosts at a reverse proxy,
 * so request.url may describe the internal upstream rather than the browser's
 * public origin. APP_URL is the trusted canonical origin configured by ops.
 * The public site is also served on its www alias, so allow both exact HTTPS
 * origins while keeping APP_URL as the canonical URL for generated links.
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
      const allowedOrigins = new Set([configured.origin]);
      if (configured.hostname === "executiveglobalnannyusa.com") {
        const www = new URL(configured);
        www.hostname = "www.executiveglobalnannyusa.com";
        allowedOrigins.add(www.origin);
      } else if (configured.hostname === "www.executiveglobalnannyusa.com") {
        const apex = new URL(configured);
        apex.hostname = "executiveglobalnannyusa.com";
        allowedOrigins.add(apex.origin);
      }
      return allowedOrigins.has(origin);
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
