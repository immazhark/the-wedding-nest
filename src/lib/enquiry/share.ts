/**
 * Safe, explicit manual sharing from the non-sending design preview.
 * Construct from the allow-listed draft snapshot, not the form's raw values.
 * Never include name, phone, preferred contact channel, venue, notes or consent.
 */
import { toDraft } from "./draft";
import { emptyEnquiry, type EnquiryState } from "./schema";
import { summarise } from "./summary";

export function previewPlanText(state: EnquiryState): string {
  const selections = toDraft(state, 0).data;
  const rows = summarise({ ...emptyEnquiry(), ...selections }).filter(
    (row) => row.stage !== "contact" && row.label !== "Location",
  );
  return [
    "The Wedding Nest — Planning choices",
    ...rows.map((row) => `${row.label}: ${row.value}`),
  ].join("\n");
}
