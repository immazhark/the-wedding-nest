/**
 * Minimal structural types for the Cloudflare bindings this Worker uses, so the handler can be
 * unit-tested with in-memory fakes and no extra type packages.
 */
export interface D1PreparedLike {
  bind(...values: unknown[]): D1PreparedLike;
  first<T = unknown>(): Promise<T | null>;
  run(): Promise<{ meta: { changes: number } }>;
}

export interface D1Like {
  prepare(sql: string): D1PreparedLike;
  /** Executes statements in a single transaction (all succeed or none). */
  batch(statements: D1PreparedLike[]): Promise<{ meta: { changes: number } }[]>;
}

export interface FetcherLike {
  fetch(request: Request): Promise<Response>;
}

export interface RateLimiterLike {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}
