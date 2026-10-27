import { visitorCountry } from "@/lib/visitor";

/**
 * The visitor's country, for a pre-built page that starts a choice on it (the
 * pricing currency). Answered per request and never cached: the answer is
 * this visitor's. Coarse (a country from the IP address), and not stored.
 */
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return Response.json(
    { country: await visitorCountry() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
