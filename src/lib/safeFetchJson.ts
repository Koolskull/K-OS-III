/**
 * fetch() + .json(), but never throws — returns null on any failure
 * (network error, non-2xx, or a non-JSON body). The last case matters
 * specifically for static-export deploys (e.g. an FTP-only host with no
 * /api routes at all) where a fetch to /api/... 404s with an HTML error
 * page instead of JSON; without this, that crashes the caller instead of
 * degrading gracefully to an "unavailable" state.
 */
export async function safeFetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
