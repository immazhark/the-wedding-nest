/** Also bound slow or stalled upload streams, not just their total byte length. */
export const BODY_READ_TIMEOUT_MS = 10_000;
export class BodyReadTimeout extends Error {}

/** Enforce a total time and byte limit while consuming untrusted body streams. */
export async function readBody(
  request: Request | Response,
  maxBytes: number,
): Promise<string | null> {
  if (!request.body) return "";
  const reader = request.body.getReader();

  // Keep the actual read separate from the deadline: a misbehaving transport
  // can ignore cancellation, but must never delay the handler's 408 response.
  const read = async (): Promise<string | null> => {
    const chunks: Uint8Array[] = [];
    let size = 0;
    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) {
          // Cancellation is best effort, including streams that ignore it.
          void reader.cancel().catch(() => {});
          return null;
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
  };

  let timer: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      // Settle the timeout first: a late successful read must not be accepted.
      reject(new BodyReadTimeout());
      void reader.cancel().catch(() => {});
    }, BODY_READ_TIMEOUT_MS);
  });
  try {
    return await Promise.race([read(), deadline]);
  } finally {
    clearTimeout(timer);
  }
}
