/* ============================================================
   Safe request-body reading for API routes.

   Next.js route handlers buffer the entire body before zod sees
   it — a scripted client could POST hundreds of megabytes and
   pressure the single Node process even though every field is
   length-capped. readJson() enforces a hard byte ceiling first
   and returns null instead of throwing, so each route can map a
   failure to its own friendly 400/413.
   ============================================================ */

const DEFAULT_MAX = 256 * 1024; // 256 KB — generous for lesson payloads

export async function readJson(req: Request, maxBytes = DEFAULT_MAX): Promise<unknown | null> {
  const declared = Number(req.headers.get("content-length") ?? "0");
  if (declared > maxBytes) return null;

  let text = "";
  try {
    text = await req.text();
  } catch {
    return null;
  }
  /* content-length can lie (chunked uploads) — measure the real thing */
  if (text.length > maxBytes) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
