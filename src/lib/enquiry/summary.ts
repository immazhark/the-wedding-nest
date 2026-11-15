import {
  BUDGETS,
  CONTACT_CHANNELS,
  OCCASIONS,
  SCOPES,
  SERVICES,
  STYLES,
  type EnquiryState,
} from "./schema";

const labelOf = (list: readonly { id: string; label: string }[], id: string) =>
  list.find((item) => item.id === id)?.label ?? id;

const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export type SummaryRow = { label: string; value: string };

/** Human-readable review of an enquiry, shown before sending. */
export function summarise(s: EnquiryState): SummaryRow[] {
  const scope =
    s.scope === "specific-services"
      ? `Specific services: ${s.services.map((id) => labelOf(SERVICES, id)).join(", ")}`
      : s.scope
        ? labelOf(SCOPES, s.scope)
        : "—";
  return [
    { label: "Occasion", value: s.occasions.map((id) => labelOf(OCCASIONS, id)).join(", ") || "—" },
    { label: "Help needed", value: scope },
    {
      label: "Style",
      value: s.styles.map((id) => labelOf(STYLES, id)).join(", ") || "No preference yet",
    },
    { label: "Date", value: s.date.kind === "date" ? formatDate(s.date.value) : "Not decided yet" },
    { label: "Guests", value: s.guestCount.trim() || "Not sure yet" },
    { label: "Location", value: s.location.trim() || "Not decided yet" },
    { label: "Budget", value: s.budget ? labelOf(BUDGETS, s.budget) : "Not shared" },
    ...(s.notes.trim() ? [{ label: "Notes", value: s.notes.trim() }] : []),
    { label: "Name", value: s.name.trim() || "—" },
    {
      label: "Contact",
      value: `${s.phone.trim() || "—"} · ${labelOf(CONTACT_CHANNELS, s.contactChannel)}`,
    },
  ];
}
