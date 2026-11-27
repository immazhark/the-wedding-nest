/** Resend retains keys for 24h; stop at 23h even before a first send. Not a retention policy. */
export const MAX_EMAIL_EVENT_AGE_MS = 23 * 60 * 60_000;

export function isCanonicalInstant(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString() === value
  );
}

export type NotificationWindow = "within_window" | "expired" | "invalid_clock";

export function notificationWindow(createdAt: string, now: string): NotificationWindow {
  if (!isCanonicalInstant(createdAt) || !isCanonicalInstant(now)) return "invalid_clock";
  const age = Date.parse(now) - Date.parse(createdAt);
  if (age < 0) return "invalid_clock";
  return age >= MAX_EMAIL_EVENT_AGE_MS ? "expired" : "within_window";
}
