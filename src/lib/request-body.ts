/**
 * Reads a request body with a hard byte cap.
 *
 * Content-Length is advisory: a chunked request carries no length at all, so
 * a cap that only looks at the header can be bypassed. This reader counts the
 * bytes as they arrive and cancels the stream as soon as the cap is exceeded,
 * so the process never buffers more than maxBytes for one request.
 */

export class BodyTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Request body exceeds ${maxBytes} bytes`);
    this.name = "BodyTooLargeError";
  }
}

export async function readBodyWithLimit(
  request: Request,
  maxBytes: number
): Promise<string> {
  const body = request.body;
  if (!body) {
    return "";
  }

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new BodyTooLargeError(maxBytes);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const merged = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(merged);
}

/** JSON.parse that answers null instead of throwing on malformed input. */
export function parseJsonBody(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
