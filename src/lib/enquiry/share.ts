/**
 * Safe, explicit manual sharing from the non-sending design preview.
 * Construct from the allow-listed draft snapshot, not the form's raw values.
 * Never include name, phone, preferred contact channel, venue, notes or consent.
 */
import { toDraft } from "./draft";
import { emptyEnquiry, type EnquiryState } from "./schema";
import { summarise } from "./summary";
import { ENQUIRY_CONTACT } from "../site/config";

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

/** Prepare a draft only. Opening these links never confirms sending or enquiry receipt. */
export function previewPlanLinks(state: EnquiryState): { whatsapp: string; email: string } {
  const text = encodeURIComponent(previewPlanText(state));
  return {
    whatsapp: `${ENQUIRY_CONTACT.whatsapp}?text=${text}`,
    email:
      `mailto:${ENQUIRY_CONTACT.email}?subject=` +
      `${encodeURIComponent("The Wedding Nest — Planning enquiry")}&body=${text}`,
  };
}
