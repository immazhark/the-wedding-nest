/**
 * Plan Your Event — client controller. All rules live in src/lib/enquiry (unit tested);
 * this file only maps the form to EnquiryState, steps between panels and stores a
 * non-sensitive draft. Submission is enabled only by the explicit build-time gate.
 */
import {
  STAGES,
  emptyEnquiry,
  serviceOptionsFor,
  type EnquiryState,
  type StageId,
} from "../lib/enquiry/schema";
import { firstIncompleteStage, nextStage, previousStage, stageError } from "../lib/enquiry/flow";
import { DRAFT_STORAGE_KEY, restoreDraft, toDraft } from "../lib/enquiry/draft";
import { applyPlannerIntent, readPlannerIntent } from "../lib/enquiry/intent";
import { summarise } from "../lib/enquiry/summary";
import { FIELD_STAGE, fieldMessage, submitEnquiry } from "../lib/enquiry/submit";
import { createTurnstileLoader } from "../lib/enquiry/turnstile";

// Loaded only when a visitor reaches review with sending on.
const loadTurnstile = createTurnstileLoader();

type Panel = StageId | "review" | "sent";

const values = (fd: FormData, name: string) => fd.getAll(name).map(String);

export function readState(form: HTMLFormElement): EnquiryState {
  const fd = new FormData(form);
  const base = emptyEnquiry();
  const dateValue = String(fd.get("date") ?? "");
  return {
    ...base,
    occasions: values(fd, "occasions") as EnquiryState["occasions"],
    scope: (fd.get("scope") as EnquiryState["scope"]) ?? null,
    services: values(fd, "services") as EnquiryState["services"],
    styles: values(fd, "styles") as EnquiryState["styles"],
    date:
      fd.get("dateKind") === "date" ? { kind: "date", value: dateValue } : { kind: "undecided" },
    guestCount: String(fd.get("guestCount") ?? ""),
    location: String(fd.get("location") ?? ""),
    budget: (fd.get("budget") || null) as EnquiryState["budget"],
    notes: String(fd.get("notes") ?? ""),
    name: String(fd.get("name") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    contactChannel: (fd.get("contactChannel") ?? "whatsapp") as EnquiryState["contactChannel"],
    consent: fd.get("consent") === "yes",
    marketingConsent: fd.get("marketingConsent") === "yes",
  };
}

function check(form: HTMLFormElement, name: string, wanted: readonly string[]) {
  form.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`).forEach((input) => {
    input.checked = wanted.includes(input.value);
  });
}

function applyState(form: HTMLFormElement, s: EnquiryState) {
  check(form, "occasions", s.occasions);
  check(form, "scope", s.scope ? [s.scope] : []);
  check(form, "services", s.services);
  check(form, "styles", s.styles);
  check(form, "dateKind", [s.date.kind]);
  check(form, "budget", s.budget ? [s.budget] : []);
  check(form, "contactChannel", [s.contactChannel]);
  const set = (name: string, v: string) => {
    const el = form.elements.namedItem(name);
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.value = v;
  };
  set("date", s.date.kind === "date" ? s.date.value : "");
  set("guestCount", s.guestCount);
  set("location", s.location);
}

const storage = {
  load(): unknown {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (parsed === null) this.clear();
      return parsed;
    } catch {
      // A corrupt legacy value must not persist indefinitely in browser storage.
      this.clear();
      return null;
    }
  },
  save(s: EnquiryState, now = Date.now()) {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toDraft(s, now)));
    } catch {
      /* storage unavailable: the planner still works without a draft */
    }
  },
  clear() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },
};

export function initPlanner(form: HTMLFormElement) {
  const root = form.closest<HTMLElement>("[data-planner]") ?? document.body;
  const panels = [...form.querySelectorAll<HTMLElement>("[data-stage]")];
  const errorEl = form.querySelector<HTMLElement>("[data-error]")!;
  const backBtn = form.querySelector<HTMLButtonElement>("[data-back]")!;
  const nextBtn = form.querySelector<HTMLButtonElement>("[data-next]")!;
  const nextLabel = form.querySelector<HTMLElement>("[data-next-label]")!;
  const servicesBox = form.querySelector<HTMLElement>("[data-services]")!;
  const dateField = form.querySelector<HTMLElement>("[data-date-field]")!;
  const summaryEl = form.querySelector<HTMLElement>("[data-summary]")!;
  const stepCount = root.querySelector<HTMLElement>("[data-step-count]");
  const progressBar = root.querySelector<HTMLElement>("[data-progress-bar]");
  const resetBtn = form.querySelector<HTMLButtonElement>("[data-reset]")!;
  const reviewReturnBtn = form.querySelector<HTMLButtonElement>("[data-review-return]")!;
  let current: Panel = "occasion";
  let editingReview = false;
  const sending = form.dataset["submit"] === "on" ? initSending() : null;

  /** Live submission (only when the build enables it). */
  function initSending() {
    const sendBtn = form.querySelector<HTMLButtonElement>("[data-send]")!;
    const sendLabel = form.querySelector<HTMLElement>("[data-send-label]")!;
    const status = form.querySelector<HTMLElement>("[data-send-status]")!;
    const widgetEl = form.querySelector<HTMLElement>("[data-turnstile]")!;
    const reference = form.querySelector<HTMLElement>("[data-reference]")!;
    const sitekey = form.dataset["sitekey"] ?? "";
    let key: string | null = null; // one key per reviewed payload: retries reuse it
    let token = "";
    let widgetId: string | undefined;
    let busy = false;
    let reviewing = false;
    let reviewAttempt = 0;

    const resetCheck = () => {
      token = "";
      if (widgetId !== undefined) window.turnstile?.reset(widgetId);
    };

    sendBtn.addEventListener("click", async () => {
      if (busy) return;
      if (!token) {
        status.textContent = "Please wait for the quick check above to finish, then send.";
        return;
      }
      busy = true;
      sendBtn.disabled = true;
      backBtn.disabled = true;
      resetBtn.disabled = true;
      summaryEl.querySelectorAll<HTMLButtonElement>("[data-edit-stage]").forEach((button) => {
        button.disabled = true;
      });
      form.setAttribute("aria-busy", "true");
      sendLabel.textContent = "Sending…";
      status.textContent = "";
      key ??= crypto.randomUUID();
      const result = await submitEnquiry(readState(form), token, key);
      busy = false;
      sendBtn.disabled = false;
      backBtn.disabled = false;
      resetBtn.disabled = false;
      summaryEl.querySelectorAll<HTMLButtonElement>("[data-edit-stage]").forEach((button) => {
        button.disabled = false;
      });
      form.removeAttribute("aria-busy");
      sendLabel.textContent = "Send enquiry";
      switch (result.kind) {
        case "accepted":
          storage.clear();
          reference.textContent = result.id.slice(0, 8).toUpperCase();
          show("sent");
          return;
        case "invalid": {
          const [field, code] = Object.entries(result.errors)[0] as [
            keyof EnquiryState,
            NonNullable<(typeof result.errors)[keyof EnquiryState]>,
          ];
          key = null; // the payload will change
          show(FIELD_STAGE[field]);
          errorEl.textContent = fieldMessage(field, code);
          const input = [...form.querySelectorAll<HTMLElement>(`[name="${field}"]`)].find(
            (el) => !el.closest("[hidden]"),
          );
          focusInvalid(input);
          return;
        }
        case "conflict":
          // The previous key refers to another stored payload. Never claim
          // changes were saved, and never auto-send a second enquiry.
          key = null;
          resetCheck();
          status.textContent =
            "An earlier enquiry may already be saved under this reference, but these answers differ. Please review your details and send again to create a separate enquiry.";
          return;
        case "verification":
          resetCheck();
          status.textContent = "The quick check expired. Please let it finish again, then send.";
          return;
        case "retryable":
          resetCheck();
          status.textContent =
            "We couldn’t send your enquiry just now. Your answers are still here — please try again in a moment.";
          return;
        case "rejected":
          status.textContent =
            "Something went wrong with this enquiry. Please message us on Instagram @twn.events instead.";
          return;
      }
    });

    return {
      isBusy: () => busy,
      async enterReview() {
        reviewing = true;
        const attempt = ++reviewAttempt;
        token = "";
        status.textContent = "";
        try {
          const ts = await loadTurnstile();
          // A visitor may have gone back (and returned) while the external script loaded.
          if (!reviewing || attempt !== reviewAttempt) return;
          if (widgetId === undefined) {
            widgetId = ts.render(widgetEl, {
              sitekey,
              theme: "light",
              callback: (t: string) => {
                if (!reviewing) return;
                token = t;
                status.textContent = "";
              },
              "expired-callback": () => (token = ""),
              "error-callback": () => {
                if (!reviewing) return;
                token = "";
                status.textContent = "The quick check couldn’t load. Please refresh the page.";
              },
            });
          } else resetCheck();
        } catch {
          if (!reviewing || attempt !== reviewAttempt) return;
          status.textContent =
            "The quick check couldn’t load. Go back and return to review to try again, or message us on Instagram @twn.events.";
        }
      },
      leaveReview() {
        reviewing = false;
        reviewAttempt++;
        token = "";
        key = null;
      },
    };
  }

  function syncConditional() {
    const s = readState(form);
    servicesBox.hidden = s.scope !== "specific-services";
    const allowed = new Set<string>(serviceOptionsFor(s.occasions).map((o) => o.id));
    servicesBox.querySelectorAll<HTMLElement>(".choice").forEach((label) => {
      const input = label.querySelector<HTMLInputElement>("input")!;
      const show = s.scope === "specific-services" && allowed.has(input.value);
      label.hidden = !allowed.has(input.value);
      if (!show) input.checked = false;
    });
    dateField.hidden = s.date.kind !== "date";
  }

  function renderSummary() {
    summaryEl.replaceChildren(
      ...summarise(readState(form)).flatMap((row) => {
        const dt = document.createElement("dt");
        dt.textContent = row.label;
        const dd = document.createElement("dd");
        const value = document.createElement("span");
        value.className = "summary-value";
        value.textContent = row.value; // Never interpret user-supplied answers as HTML.
        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "summary-edit link-underline";
        edit.dataset["editStage"] = row.stage;
        edit.setAttribute("aria-label", `Edit ${row.label.toLowerCase()}`);
        edit.textContent = "Edit";
        dd.append(value, edit);
        return [dt, dd];
      }),
    );
  }

  const order: Panel[] = [...STAGES.map((s) => s.id), "review"];

  function show(panel: Panel, focus = true) {
    if (panel === "review" || panel === "sent") editingReview = false;
    // Only real navigation animates; the initial render stays still.
    if (focus)
      form.dataset["direction"] =
        order.indexOf(panel) < order.indexOf(current) ? "back" : "forward";
    current = panel;
    panels.forEach((p) => (p.hidden = p.dataset["stage"] !== panel));
    const index =
      panel === "review" || panel === "sent"
        ? STAGES.length
        : STAGES.findIndex((s) => s.id === panel);
    if (stepCount)
      stepCount.textContent =
        panel === "sent"
          ? "Sent"
          : panel === "review"
            ? "Review"
            : `Step ${index + 1} of ${STAGES.length}`;
    // CSSOM writes are allowed by the CSP (inline style attributes in markup are not).
    progressBar?.style.setProperty(
      "width",
      `${(Math.min(index + 1, STAGES.length) / STAGES.length) * 100}%`,
    );
    root.querySelectorAll<HTMLElement>("[data-progress-item]").forEach((item, i) => {
      item.toggleAttribute("data-done", i < index);
      if (i === index) item.setAttribute("aria-current", "step");
      else item.removeAttribute("aria-current");
    });
    backBtn.hidden = panel === "occasion" || panel === "sent";
    reviewReturnBtn.hidden = !editingReview || panel === "review" || panel === "sent";
    nextBtn.hidden = panel === "review" || panel === "sent";
    resetBtn.hidden = panel === "sent";
    resetBtn.closest<HTMLElement>(".planner-nav")!.hidden = panel === "sent";
    nextLabel.textContent = panel === "contact" ? "Review" : "Continue";
    errorEl.textContent = "";
    form.querySelectorAll("[aria-invalid]").forEach((el) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute("aria-describedby");
    });
    if (panel === "review") {
      renderSummary();
      sending?.enterReview();
    } else sending?.leaveReview();
    if (focus) {
      const heading = panels
        .find((p) => p.dataset["stage"] === panel)
        ?.querySelector<HTMLElement>(".stage-title");
      heading?.focus({ preventScroll: true });
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      root.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  function focusInvalid(el: HTMLElement | undefined | null) {
    if (!el) return;
    form.querySelectorAll<HTMLElement>("[aria-invalid]").forEach((input) => {
      input.removeAttribute("aria-invalid");
      input.removeAttribute("aria-describedby");
    });
    el.setAttribute("aria-invalid", "true");
    el.setAttribute("aria-describedby", "planner-error-msg");
    el.focus();
  }

  function markInvalid(stage: StageId, s: EnquiryState) {
    const field =
      stage === "contact"
        ? !s.name.trim()
          ? "name"
          : stageError("contact", { ...s, consent: true })
            ? "phone"
            : s.consent
              ? null
              : "consent"
        : stage === "logistics"
          ? s.date.kind === "date" && stageError("logistics", { ...s, guestCount: "" })
            ? "date"
            : "guestCount"
          : null;

    // Grouped checkboxes/radios return a RadioNodeList from form.elements,
    // so find a real input to focus when a selection stage is incomplete.
    const choice =
      stage === "occasion"
        ? form.querySelector<HTMLInputElement>('input[name="occasions"]')
        : stage === "scope"
          ? s.scope === "specific-services"
            ? [...form.querySelectorAll<HTMLInputElement>('input[name="services"]')].find(
                (input) => !input.closest<HTMLElement>(".choice")?.hidden,
              )
            : form.querySelector<HTMLInputElement>('input[name="scope"]')
          : null;
    const el = choice ?? (field ? form.elements.namedItem(field) : null);
    if (el instanceof HTMLElement) focusInvalid(el);
  }

  errorEl.id = "planner-error-msg";

  form.addEventListener("submit", (e) => {
    e.preventDefault(); // stages advance in place; sending (if enabled) has its own button
    if (current === "review" || current === "sent") return;
    const s = readState(form);
    const error = stageError(current, s);
    if (error) {
      errorEl.textContent = error;
      markInvalid(current, s);
      return;
    }
    show(nextStage(current) ?? "review");
  });

  backBtn.addEventListener("click", () => {
    if (current === "sent") return;
    if (current === "review") return show("contact");
    const prev = previousStage(current);
    if (prev) show(prev);
  });

  // localStorage is synchronous. Only persistent planning choices should trigger
  // writes; typing a name, phone, venue or notes never touches browser storage.
  const draftFields = new Set([
    "occasions",
    "scope",
    "services",
    "styles",
    "dateKind",
    "date",
    "guestCount",
    "budget",
  ]);
  // Clear resolved validation feedback as soon as typed answers become valid,
  // without waiting for blur/change on mobile keyboards.
  function clearResolvedError() {
    if (
      current !== "review" &&
      current !== "sent" &&
      errorEl.textContent &&
      !stageError(current, readState(form))
    ) {
      errorEl.textContent = "";
      form.querySelectorAll<HTMLElement>("[aria-invalid]").forEach((field) => {
        field.removeAttribute("aria-invalid");
        field.removeAttribute("aria-describedby");
      });
    }
  }

  form.addEventListener("change", (event) => {
    syncConditional();
    const target = event.target;
    if (target instanceof HTMLInputElement && draftFields.has(target.name))
      storage.save(readState(form));
    clearResolvedError();
  });
  form.addEventListener("input", (event) => {
    const target = event.target;
    // Keep free-form count/date edits resumable before they lose focus.
    if (target instanceof HTMLInputElement && ["guestCount", "date"].includes(target.name))
      storage.save(readState(form));
    clearResolvedError();
  });

  summaryEl.addEventListener("click", (event) => {
    if (current !== "review" || sending?.isBusy()) return;
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>("[data-edit-stage]");
    const target = button?.dataset["editStage"];
    if (!STAGES.some((stage) => stage.id === target)) return;
    editingReview = true;
    show(target as StageId);
  });

  reviewReturnBtn.addEventListener("click", () => {
    if (!editingReview || current === "review" || current === "sent") return;
    const state = readState(form);
    const incomplete = firstIncompleteStage(state);
    if (incomplete) {
      show(incomplete);
      errorEl.textContent = stageError(incomplete, state) ?? "Please review this step.";
      markInvalid(incomplete, state);
      return;
    }
    show("review");
  });

  resetBtn.addEventListener("click", () => {
    editingReview = false;
    storage.clear();
    form.reset();
    applyState(form, emptyEnquiry());
    syncConditional();
    // A reset must remain a reset after reload, even if the visitor arrived
    // through a preselected occasion/service link. Keep unrelated URL context.
    const url = new URL(window.location.href);
    if (url.searchParams.has("occasion") || url.searchParams.has("service")) {
      url.searchParams.delete("occasion");
      url.searchParams.delete("service");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    show("occasion");
  });

  // Restore only valid selections. Purge stale/corrupt drafts, and rewrite any
  // valid legacy draft through the allow-listed serializer so stray personal
  // fields cannot remain in localStorage. Preserve the original expiry time.
  const rawDraft = storage.load();
  const restored = restoreDraft(rawDraft, Date.now());
  if (rawDraft !== null) {
    storage.clear();
    if (restored) storage.save(restored, (rawDraft as { savedAt: number }).savedAt);
  }
  const restoredState = restored ?? emptyEnquiry();
  const initialState = applyPlannerIntent(restoredState, readPlannerIntent(window.location.search));
  applyState(form, initialState);
  syncConditional();
  if (initialState !== restoredState) storage.save(readState(form));
  show("occasion", false);
}
