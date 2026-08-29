/**
 * Rejection handlers for the verbs an API route does not implement.
 *
 * A route file that exports a single handler gets Next's auto generated
 * fallback for every other method: the status is right, but the response
 * carries no Allow header, which RFC 9110 section 15.5.6 requires on a 405.
 * A client then has to guess what the resource accepts.
 *
 * The body stays empty on purpose. These are machine facing endpoints, and a
 * 405 says everything a caller needs; a JSON error object would only add a
 * second shape to parse.
 */
export function methodNotAllowed(allow: string): () => Response {
  return () =>
    new Response(null, {
      status: 405,
      headers: { Allow: allow, "Cache-Control": "no-store" },
    });
}
