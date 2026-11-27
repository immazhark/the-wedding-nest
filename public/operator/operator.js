// Plain DOM + textContent only: enquiry text is untrusted and is never parsed as HTML.
const $ = (id) => document.getElementById(id);
const NEXT = {
  new: ["contacted", "in_progress", "booked"],
  contacted: ["in_progress", "booked"],
  in_progress: ["booked"],
};
const LABEL = {
  new: "New",
  contacted: "Contacted",
  in_progress: "In progress",
  booked: "Booked",
  unsuccessful: "Unsuccessful",
};
const labels = globalThis.TWN_ENQUIRY_LABELS || {};
// Own-property lookup avoids inherited object keys masquerading as legacy labels.
const answer = (key, value) => {
  const values = Array.isArray(value) ? value : [value];
  return values
    .filter((v) => typeof v === "string" && v)
    .map((v) =>
      Object.hasOwn(labels[key] || {}, v)
        ? labels[key][v]
        : /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/i.test(v)
          ? v.replace(/[-_]+/g, " ")
          : v,
    );
};
const PAGE = 25;
let cursor = null;
let listRequest = 0;
let listLoading = false;
let detailRequest = 0;

const say = (t) => {
  $("message").textContent = t;
};
async function api(path, init) {
  const r = await fetch(path, { credentials: "same-origin", ...init });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(body.error || "error"), { status: r.status });
  return body;
}
const when = (iso) =>
  new Date(iso).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

async function load(reset) {
  if (!reset && (listLoading || !cursor)) return;
  const request = ++listRequest;
  listLoading = true;
  $("more").disabled = true;
  if (reset) {
    $("more").hidden = true;
    $("list").replaceChildren();
    cursor = null;
  }
  say("Loading…");
  try {
    const q = new URLSearchParams({ limit: String(PAGE) });
    if ($("filter").value) q.set("status", $("filter").value);
    if (cursor) {
      q.set("before", cursor.createdAt);
      q.set("beforeId", cursor.id);
    }
    const { enquiries, nextCursor } = await api(`/api/operator/enquiries?${q}`);
    if (request !== listRequest) return;
    for (const e of enquiries) {
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      const name = document.createElement("strong");
      name.textContent = e.name || "(no name)";
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = LABEL[e.status] || e.status;
      const meta = document.createElement("span");
      meta.className = "meta";
      meta.textContent = `${when(e.createdAt)} · ${answer("occasions", e.occasions).join(", ")}`;
      b.append(name, badge, meta);
      b.addEventListener("click", () => show(e.id));
      li.append(b);
      $("list").append(li);
    }
    cursor = nextCursor || null;
    $("more").hidden = !cursor || !$("detail").hidden;
    if ($("detail").hidden) say($("list").children.length ? "" : "No enquiries.");
  } catch (e) {
    if (request === listRequest && $("detail").hidden) {
      say(`Could not load enquiries (${e.status || "network"}).`);
    }
  } finally {
    if (request === listRequest) {
      listLoading = false;
      $("more").disabled = false;
    }
  }
}

function field(dl, k, v) {
  if (v === undefined || v === null || v === "" || (Array.isArray(v) && !v.length)) return;
  const dt = document.createElement("dt");
  dt.textContent = k;
  const dd = document.createElement("dd");
  dd.textContent =
    typeof v === "object" && !Array.isArray(v)
      ? Object.values(v).join(" ")
      : [].concat(v).join(", ");
  dl.append(dt, dd);
}

async function show(id, note) {
  const request = ++detailRequest;
  const title = $("detail-title");
  title.textContent = "Enquiry details";
  $("fields").replaceChildren();
  $("actions").replaceChildren();
  $("detail").hidden = false;
  $("list").hidden = true;
  $("more").hidden = true;
  document.querySelector("header").hidden = true;
  title.focus();
  say("Loading…");
  try {
    const { enquiry: e, history } = await api(`/api/operator/enquiries/${id}`);
    if (request !== detailRequest) return;
    const p = e.payload;
    $("detail-title").textContent = p.name || "(no name)";
    const dl = $("fields");
    dl.replaceChildren();
    field(dl, "Status", LABEL[e.status] || e.status);
    field(dl, "Received", when(e.createdAt));
    field(dl, "Phone", p.phone);
    field(dl, "Preferred contact", answer("contactChannel", p.contactChannel));
    field(dl, "Occasions", answer("occasions", p.occasions));
    field(dl, "Scope", answer("scope", p.scope));
    field(dl, "Services", answer("services", p.services));
    field(dl, "Styles", answer("styles", p.styles));
    field(dl, "Budget", answer("budget", p.budget));
    field(dl, "Date", p.date?.kind === "undecided" ? "Undecided" : p.date?.value);
    field(dl, "Guests", p.guestCount);
    field(dl, "Location", p.location);
    field(dl, "Notes", p.notes);
    field(dl, "Consent recorded", e.consentAt ? when(e.consentAt) : "Not recorded");
    field(
      dl,
      "Marketing consent",
      e.marketingConsent === true ? "Yes" : e.marketingConsent === false ? "No" : "Not recorded",
    );
    if (e.unsuccessfulAt) field(dl, "Marked unsuccessful", when(e.unsuccessfulAt));
    const historyAvailable = Array.isArray(history);
    field(
      dl,
      "History",
      !historyAvailable
        ? "Audit history unavailable. Return to the list and reopen before updating."
        : history.length
          ? history.map((h) => `${when(h.at)}: ${h.operator} · ${LABEL[h.from]} → ${LABEL[h.to]}`)
          : "No recorded status changes.",
    );
    const actions = $("actions");
    actions.replaceChildren();
    if (!historyAvailable) {
      say(note || "");
      return;
    }
    const state = { request, pending: false };
    for (const to of NEXT[e.status] || [])
      actions.append(button(`Mark ${LABEL[to].toLowerCase()}`, e, to, state));
    if (NEXT[e.status]) actions.append(button("Mark unsuccessful", e, "unsuccessful", state, true));
    say(note || "");
  } catch (e) {
    if (request === detailRequest) say(`Could not open enquiry (${e.status || "network"}).`);
  }
}

function button(text, e, to, state, danger) {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = text;
  if (danger) b.className = "danger";
  b.addEventListener("click", async () => {
    if (state.pending || state.request !== detailRequest) return;
    if (
      to === "unsuccessful" &&
      !confirm(
        "Mark unsuccessful? Details become eligible for deletion after 90 days. Pending deliveries hold deletion. Automatic cleanup is not active.",
      )
    )
      return;
    state.pending = true;
    for (const action of $("actions").querySelectorAll("button")) action.disabled = true;
    try {
      await api(`/api/operator/enquiries/${e.id}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: e.status, to }),
      });
      if (state.request === detailRequest) await show(e.id, "Updated.");
    } catch (err) {
      if (state.request !== detailRequest) return;
      await show(
        e.id,
        err.status === 409
          ? "Someone else changed this enquiry. Showing the latest."
          : "Could not update.",
      );
    }
  });
  return b;
}

$("back").addEventListener("click", () => {
  detailRequest++;
  $("detail-title").textContent = "";
  $("fields").replaceChildren();
  $("actions").replaceChildren();
  $("detail").hidden = true;
  $("list").hidden = false;
  document.querySelector("header").hidden = false;
  load(true);
});
$("filter").addEventListener("change", () => load(true));
$("more").addEventListener("click", () => load(false));
load(true);

const DELIVERY_KEYS = ["accepted", "held", "unconfirmed", "leased", "retry", "ready"];
let deliveryLoading = false;

async function loadDeliveryOverview() {
  if (deliveryLoading) return;
  deliveryLoading = true;
  const refresh = $("delivery-refresh");
  refresh.disabled = true;
  $("delivery-message").textContent = "Loading delivery overview…";
  for (const key of DELIVERY_KEYS) $(`delivery-${key}`).textContent = "—";
  try {
    const data = await api("/api/operator/delivery-overview");
    const counts = DELIVERY_KEYS.map((key) => data[key]);
    if (
      ![data.total, ...counts].every((count) => Number.isSafeInteger(count) && count >= 0) ||
      counts.reduce((sum, count) => sum + count, 0) !== data.total
    ) {
      throw new Error("Invalid delivery overview");
    }
    for (const key of DELIVERY_KEYS) $(`delivery-${key}`).textContent = String(data[key]);
    $("delivery-message").textContent = `${data.total} events in the current overview.`;
  } catch {
    $("delivery-message").textContent = "Delivery overview unavailable. Refresh to try again.";
  } finally {
    deliveryLoading = false;
    refresh.disabled = false;
  }
}

$("delivery").addEventListener("toggle", () => {
  if ($("delivery").open) loadDeliveryOverview();
});
$("delivery-refresh").addEventListener("click", loadDeliveryOverview);

const HELD_REASONS = {
  invalid_event: "Event data requires review",
  provider: "Provider blocked delivery",
  attempts_exhausted: "Attempt limit reached",
  unknown: "Reason requires review",
};
const HELD_WINDOWS = {
  within_window: "Within the age window; hold still applies",
  expired: "Outside the automatic send window",
  invalid_clock: "Event clock requires review",
};
const uuid = (value) =>
  typeof value === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const instant = (value) =>
  typeof value === "string" &&
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;
let heldCursor = null;
let heldRequest = 0;
let heldLoading = false;

async function loadHeld(reset) {
  if (!reset && (heldLoading || !heldCursor)) return;
  const request = ++heldRequest;
  heldLoading = true;
  $("held-refresh").disabled = true;
  $("held-more").disabled = true;
  if (reset) {
    heldCursor = null;
    $("held-list").replaceChildren();
    $("held-more").hidden = true;
  }
  $("held-message").textContent = "Loading held notifications…";
  try {
    const q = new URLSearchParams({ limit: "25" });
    if (heldCursor) {
      q.set("after", heldCursor.createdAt);
      q.set("afterId", heldCursor.id);
    }
    const data = await api(`/api/operator/delivery-held?${q}`);
    if (request !== heldRequest) return;
    if (
      !Array.isArray(data.events) ||
      data.events.length > 100 ||
      !data.events.every(
        (e) =>
          e &&
          uuid(e.id) &&
          instant(e.createdAt) &&
          Number.isSafeInteger(e.attempts) &&
          e.attempts >= 0 &&
          Object.hasOwn(HELD_REASONS, e.reason) &&
          Object.hasOwn(HELD_WINDOWS, e.window),
      ) ||
      (data.nextCursor !== null &&
        (!data.nextCursor ||
          !uuid(data.nextCursor.id) ||
          !instant(data.nextCursor.createdAt) ||
          data.events.at(-1)?.id !== data.nextCursor.id ||
          data.events.at(-1)?.createdAt !== data.nextCursor.createdAt))
    ) {
      throw new Error("Invalid held metadata");
    }
    for (const event of data.events) {
      const li = document.createElement("li");
      const ref = document.createElement("code");
      ref.textContent = `Event ${event.id}`;
      const dl = document.createElement("dl");
      field(dl, "Created", when(event.createdAt));
      field(dl, "Attempts", event.attempts);
      field(dl, "Hold", HELD_REASONS[event.reason]);
      field(dl, "Age check", HELD_WINDOWS[event.window]);
      li.append(ref, dl);
      $("held-list").append(li);
    }
    heldCursor = data.nextCursor;
    $("held-more").hidden = !heldCursor;
    const shown = $("held-list").children.length;
    $("held-message").textContent = shown
      ? `${shown} held notifications shown.`
      : "No held notifications.";
  } catch {
    if (request === heldRequest)
      $("held-message").textContent = "Could not load held notifications. Refresh to try again.";
  } finally {
    if (request === heldRequest) {
      heldLoading = false;
      $("held-refresh").disabled = false;
      $("held-more").disabled = false;
    }
  }
}
$("held-events").addEventListener("toggle", () => {
  if ($("held-events").open) loadHeld(true);
  else {
    heldRequest++;
    heldLoading = false;
    $("held-refresh").disabled = false;
    $("held-more").disabled = false;
  }
});
$("held-refresh").addEventListener("click", () => loadHeld(true));
$("held-more").addEventListener("click", () => loadHeld(false));
