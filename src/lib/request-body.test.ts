import { describe, expect, it } from "vitest";

import {
  BodyTooLargeError,
  parseJsonBody,
  readBodyWithLimit,
} from "./request-body";

function streamingRequest(
  chunks: Uint8Array[],
  onCancel: () => void = () => {}
): Request {
  let index = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index < chunks.length) {
        controller.enqueue(chunks[index]);
        index += 1;
      } else {
        controller.close();
      }
    },
    cancel() {
      onCancel();
    },
  });
  // Streaming bodies need duplex: "half" in Node's fetch implementation.
  const init = { method: "POST", body: stream, duplex: "half" } as RequestInit;
  return new Request("http://localhost/api/contact", init);
}

describe("readBodyWithLimit", () => {
  it("returns the body text when it fits inside the cap", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
      body: '{"name":"Doğan"}',
    });
    await expect(readBodyWithLimit(request, 1024)).resolves.toBe(
      '{"name":"Doğan"}'
    );
  });

  it("returns an empty string when the request has no body", async () => {
    const request = new Request("http://localhost/api/contact", {
      method: "POST",
    });
    await expect(readBodyWithLimit(request, 1024)).resolves.toBe("");
  });

  it("accepts a body that sits exactly on the cap", async () => {
    const chunk = new TextEncoder().encode("x".repeat(64));
    const request = streamingRequest([chunk, chunk]);
    await expect(readBodyWithLimit(request, 128)).resolves.toHaveLength(128);
  });

  it("rejects and cancels a chunked body that grows past the cap", async () => {
    let cancelled = false;
    const chunk = new TextEncoder().encode("x".repeat(64));
    const request = streamingRequest([chunk, chunk, chunk], () => {
      cancelled = true;
    });
    await expect(readBodyWithLimit(request, 100)).rejects.toBeInstanceOf(
      BodyTooLargeError
    );
    expect(cancelled).toBe(true);
  });
});

describe("parseJsonBody", () => {
  it("parses valid json", () => {
    expect(parseJsonBody('{"ok":true}')).toEqual({ ok: true });
  });

  it("answers null for malformed json", () => {
    expect(parseJsonBody("{not json")).toBeNull();
    expect(parseJsonBody("")).toBeNull();
  });
});
