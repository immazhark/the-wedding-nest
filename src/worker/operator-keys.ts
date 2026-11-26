/** Cache only validated Access key data, never a cross-request I/O promise. */
import { readBody } from "./request-body";

type AccessKey = JsonWebKey & { kid: string };
const KEY_TTL_MS = 10 * 60_000;
const KEY_TIMEOUT_MS = 10_000;
const MAX_KEY_BYTES = 64 * 1024;
const TEAM_DOMAIN = /^[a-z0-9-]+\.cloudflareaccess\.com$/;

function isAccessKey(value: unknown): value is AccessKey {
  if (!value || typeof value !== "object") return false;
  const key = value as Record<string, unknown>;
  return (
    key.kty === "RSA" &&
    typeof key.kid === "string" &&
    key.kid.length > 0 &&
    typeof key.n === "string" &&
    key.n.length > 0 &&
    typeof key.e === "string" &&
    key.e.length > 0
  );
}

export function createAccessKeyReader(fetcher: typeof fetch = fetch) {
  let cache: { team: string; at: number; keys: AccessKey[] } | undefined;
  return async (team: string): Promise<AccessKey[]> => {
    if (!TEAM_DOMAIN.test(team)) throw new Error("Invalid Access team");
    if (cache?.team === team && Date.now() - cache.at < KEY_TTL_MS) return cache.keys;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => {
      timer = setTimeout(() => {
        reject(new Error("Access key deadline"));
        controller.abort();
      }, KEY_TIMEOUT_MS);
    });
    const retrieve = async (): Promise<AccessKey[]> => {
      const response = await fetcher(`https://${team}/cdn-cgi/access/certs`, {
        redirect: "error",
        signal: controller.signal,
      });
      if (controller.signal.aborted || !response.ok) {
        void response.body?.cancel().catch(() => {});
        throw new Error("Access keys unavailable");
      }
      const text = await readBody(response, MAX_KEY_BYTES);
      if (text === null) throw new Error("Access keys too large");
      const data: unknown = JSON.parse(text);
      const keys = data && typeof data === "object" && "keys" in data ? data.keys : null;
      if (!Array.isArray(keys) || !keys.length || !keys.every(isAccessKey)) {
        throw new Error("Invalid Access keys");
      }
      return keys;
    };
    try {
      const keys = await Promise.race([retrieve(), deadline]);
      cache = { team, at: Date.now(), keys };
      return keys;
    } finally {
      clearTimeout(timer);
    }
  };
}
