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
      meta.textContent = `${when(e.createdAt)} · ${e.occasions.join(", ")}`;
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
    field(dl, "Preferred contact", p.contactChannel);
    field(dl, "Occasions", p.occasions);
    field(dl, "Services", p.services);
    field(dl, "Date", p.date);
    field(dl, "Guests", p.guestCount);
    field(dl, "Location", p.location);
    field(dl, "Notes", p.notes);
    field(dl, "Marketing consent", e.marketingConsent ? "Yes" : "No");
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
      !confirm("Mark unsuccessful? Its details will be deleted 90 days from now.")
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
