import { describe, expect, it } from "vitest";
import { buildOperatorNotice } from "../../src/worker/notification-content";

const ID = "11111111-2222-4333-8444-555555555555";
const enquiry = {
  occasions: ["nikah", "walima"],
  scope: "specific-services",
  services: ["catering", "decor"],
  styles: ["heritage"],
  date: { kind: "undecided" },
  guestCount: "350",
  location: "Mehdipatnam",
  budget: "discuss",
  notes: "Please plan a family-friendly celebration.",
  name: "Sample Customer",
  phone: "+91 98765 43210",
  contactChannel: "whatsapp",
  consent: true,
  marketingConsent: false,
};

describe("dormant owner-only operational notice", () => {
  it("renders a deterministic plain-text operational message from a valid stored enquiry", () => {
    const alert = buildOperatorNotice(ID, enquiry);
    expect(alert.enquiryId).toBe(ID);
    expect(alert.subject).toBe("The Wedding Nest | New enquiry 11111111");
    expect(alert.text).toContain("Reference: " + ID);
    expect(alert.text).toContain("Occasion: Nikah, Walima");
    expect(alert.text).toContain(
      "Help needed: Specific services: Catering & menus, Décor, florals & staging",
    );
    expect(alert.text).toContain("Name: Sample Customer");
    expect(alert.text).toContain("Contact: +91 98765 43210 · WhatsApp");
    expect(alert.text).toContain("Notes: Please plan a family-friendly celebration.");
    expect(alert.text).not.toContain("marketingConsent");
    expect(alert.text).not.toContain("consent:");
    expect(alert).toEqual(buildOperatorNotice(ID, enquiry));
    expect(Object.keys(alert).sort()).toEqual(["enquiryId", "subject", "text"]);
    expect(JSON.stringify(alert)).not.toContain("recipient");
    expect(JSON.stringify(alert)).not.toContain("send");
  });

  it("keeps user text on one display line and never allows header/HTML-like control injection", () => {
    const malicious = {
      ...enquiry,
      name: "Test\r\nBcc: attacker@example.invalid",
      notes: "hi\nFrom: forged@example.invalid\u202e<script>alert(1)</script>",
    };
    const alert = buildOperatorNotice(ID, malicious);
    expect(alert.subject).toBe("The Wedding Nest | New enquiry 11111111");
    expect(alert.text).not.toContain("\r");
    expect(alert.text).not.toMatch(/^Bcc: /m);
    expect(alert.text).not.toMatch(/^From: /m);
    expect(alert.text).not.toContain("<script>");
    expect(alert.text).not.toContain("\u202e");
    expect(alert.text).toContain("Name: Test Bcc: attacker@example.invalid");
    expect(alert.text).toContain("Notes: hi From: forged@example.invalid");
  });

  it("rejects invalid IDs, unconsented enquiries and unsupported service choices", () => {
    expect(() => buildOperatorNotice("not-an-id", enquiry)).toThrow("Invalid enquiry reference");
    expect(() => buildOperatorNotice(ID, { ...enquiry, consent: false })).toThrow(
      "Invalid stored enquiry",
    );
    expect(() => buildOperatorNotice(ID, { ...enquiry, services: ["fake"] })).toThrow(
      "Invalid stored enquiry",
    );
    expect(() => buildOperatorNotice(ID, { ...enquiry, phone: "<script>" })).toThrow(
      "Invalid stored enquiry",
    );
  });

  it("does not include unexpected database JSON properties or transform a notification into marketing", () => {
    const alert = buildOperatorNotice(ID, {
      ...enquiry,
      malicious: "INTERNAL_SECRET_SHOULD_NOT_SEND",
      marketingConsent: true,
    });
    expect(alert.text).not.toContain("INTERNAL_SECRET_SHOULD_NOT_SEND");
    expect(alert.text).not.toMatch(/subscribe|promotion|campaign/i);
  });
});
