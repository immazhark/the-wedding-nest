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
import { nextStage, previousStage, stageError } from "../lib/enquiry/flow";
import { DRAFT_STORAGE_KEY, restoreDraft, toDraft } from "../lib/enquiry/draft";
import { summarise } from "../lib/enquiry/summary";
import { FIELD_STAGE, fieldMessage, submitEnquiry } from "../lib/enquiry/submit";

type TurnstileApi = {
  render(el: HTMLElement, opts: Record<string, unknown>): string;
  reset(id?: string): void;
};
declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let turnstileLoading: Promise<TurnstileApi> | null = null;
/** Loads Cloudflare Turnstile only when a visitor reaches the review step with sending on. */
function loadTurnstile(): Promise<TurnstileApi> {
  turnstileLoading ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.onload = () =>
      window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile"));
    script.onerror = () => {
      turnstileLoading = null;
      reject(new Error("turnstile"));
    };
    document.head.append(script);
  });
  return turnstileLoading;
}

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
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  save(s: EnquiryState) {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(toDraft(s, Date.now())));
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
  let current: Panel = "occasion";
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
      form.setAttribute("aria-busy", "true");
      sendLabel.textContent = "Sending…";
      status.textContent = "";
      key ??= crypto.randomUUID();
      const result = await submitEnquiry(readState(form), token, key);
      busy = false;
      sendBtn.disabled = false;
      backBtn.disabled = false;
      resetBtn.disabled = false;
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
          return;
        }
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
      async enterReview() {
        status.textContent = "";
        try {
          const ts = await loadTurnstile();
          if (widgetId === undefined) {
            widgetId = ts.render(widgetEl, {
              sitekey,
              theme: "light",
              callback: (t: string) => {
                token = t;
                status.textContent = "";
              },
              "expired-callback": () => (token = ""),
              "error-callback": () => {
                token = "";
                status.textContent = "The quick check couldn’t load. Please refresh the page.";
              },
            });
          }
        } catch {
          status.textContent =
            "The quick check couldn’t load. Check your connection, or message us on Instagram @twn.events.";
        }
      },
      leaveReview() {
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
      const show = allowed.has(input.value);
      label.hidden = !show;
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
        dd.textContent = row.value; // textContent: user input is never parsed as HTML
        return [dt, dd];
      }),
    );
  }

  const order: Panel[] = [...STAGES.map((s) => s.id), "review"];

  function show(panel: Panel, focus = true) {
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
    nextBtn.hidden = panel === "review" || panel === "sent";
    resetBtn.hidden = panel === "sent";
    resetBtn.closest<HTMLElement>(".planner-nav")!.hidden = panel === "sent";
    nextLabel.textContent = panel === "contact" ? "Review" : "Continue";
    errorEl.textContent = "";
    form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
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

  function markInvalid(stage: StageId, s: EnquiryState) {
    const field =
      stage === "contact"
        ? !s.name.trim()
          ? "name"
          : stageError("contact", { ...s, consent: true })
            ? "phone"
            : null
        : stage === "logistics"
          ? s.date.kind === "date" && stageError("logistics", { ...s, guestCount: "" })
            ? "date"
            : "guestCount"
          : null;
    const el = field ? form.elements.namedItem(field) : null;
    if (el instanceof HTMLElement) {
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", "planner-error-msg");
      el.focus();
    }
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

  form.addEventListener("change", () => {
    syncConditional();
    storage.save(readState(form));
    if (
      current !== "review" &&
      current !== "sent" &&
      errorEl.textContent &&
      !stageError(current, readState(form))
    )
      errorEl.textContent = "";
  });
  form.addEventListener("input", () => storage.save(readState(form)));

  resetBtn.addEventListener("click", () => {
    storage.clear();
    form.reset();
    applyState(form, emptyEnquiry());
    syncConditional();
    show("occasion");
  });

  // Restore a non-sensitive draft if one exists; contact details are never in it.
  applyState(form, restoreDraft(storage.load(), Date.now()) ?? emptyEnquiry());
  syncConditional();
  show("occasion", false);
}
