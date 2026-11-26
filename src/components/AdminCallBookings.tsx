"use client";

import { useEffect, useState } from "react";
import {
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Phone,
  Save,
  Send,
  Settings2,
  XCircle,
} from "lucide-react";

const days = [
  ["0", "Sunday"],
  ["1", "Monday"],
  ["2", "Tuesday"],
  ["3", "Wednesday"],
  ["4", "Thursday"],
  ["5", "Friday"],
  ["6", "Saturday"],
];

type Booking = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  startsAt: string;
  endsAt: string;
  timezone: string;
  message: string | null;
  status: string;
  meetingDetails: string | null;
  adminReply: string | null;
};

type Draft = { details: string; reply: string };

export function AdminCallBookings() {
  const [settings, setSettings] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState("requests");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "warning">("success");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});

  async function load() {
    const response = await fetch("/api/admin/call-bookings", { cache: "no-store" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setSettings(data.settings);
    setBookings(data.bookings);
  }

  useEffect(() => {
    void load().catch((cause) => setError(cause instanceof Error ? cause.message : "Unable to load call requests."));
  }, []);

  async function post(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/call-bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setMessage(data.message ?? "Changes saved.");
      setMessageTone(data.emailDelivery && data.emailDelivery !== "sent" ? "warning" : "success");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save changes.");
    } finally {
      setBusy(false);
    }
  }

  function editHours(day: string, key: "start" | "end", value: string) {
    setSettings((old: any) => ({
      ...old,
      hours: {
        ...old.hours,
        [day]: { ...(old.hours[day] ?? { start: "09:00", end: "17:00" }), [key]: value },
      },
    }));
  }

  function editDraft(id: string, key: keyof Draft, value: string) {
    setDrafts((old) => ({
      ...old,
      [id]: {
        details: old[id]?.details ?? "",
        reply: old[id]?.reply ?? "",
        [key]: value,
      },
    }));
  }

  const pendingCount = bookings.filter((booking) => booking.status === "pending").length;

  return (
    <div>
      <div className="flex flex-wrap gap-2 rounded-2xl border border-cream-300 bg-white p-2 shadow-sm">
        <button
          type="button"
          onClick={() => setTab("requests")}
          aria-pressed={tab === "requests"}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === "requests" ? "bg-ink-900 text-white shadow-sm" : "text-slate-600 hover:bg-cream-50 hover:text-ink-900"}`}
        >
          <CalendarClock size={17} aria-hidden="true" />
          Requests
          <span className={`rounded-full px-2 py-0.5 text-xs ${tab === "requests" ? "bg-white/15 text-white" : "bg-cream-100 text-slate-600"}`}>
            {pendingCount} pending
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("availability")}
          aria-pressed={tab === "availability"}
          className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${tab === "availability" ? "bg-ink-900 text-white shadow-sm" : "text-slate-600 hover:bg-cream-50 hover:text-ink-900"}`}
        >
          <Settings2 size={17} aria-hidden="true" />
          Calendar availability
        </button>
      </div>

      {tab === "availability" && settings && (
        <form
          className="mt-6 space-y-6 rounded-3xl border border-cream-300 bg-white p-5 shadow-sm sm:p-7"
          onSubmit={(event) => {
            event.preventDefault();
            void post({
              action: "settings",
              durationMinutes: settings.durationMinutes,
              bufferMinutes: settings.bufferMinutes,
              leadHours: settings.leadHours,
              maxDaysAhead: settings.maxDaysAhead,
              hours: settings.hours,
              blocked: settings.blocked,
            });
          }}
        >
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-pale text-teal-brand">
              <CalendarDays size={21} aria-hidden="true" />
            </span>
            <div>
              <h2 className="text-xl font-bold text-ink-900">Set your booking hours</h2>
              <p className="mt-1 text-sm leading-6 text-slate-500">Visitors will see available times in America/New_York (Eastern Time).</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-semibold text-ink-900">
              Call length
              <select className="application-input mt-2" value={settings.durationMinutes} onChange={(event) => setSettings({ ...settings, durationMinutes: +event.target.value })}>
                {[15, 20, 30, 45, 60, 90, 120].map((value) => <option key={value} value={value}>{value} minutes</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink-900">
              Buffer between calls (minutes)
              <select className="application-input mt-2" value={settings.bufferMinutes} onChange={(event) => setSettings({ ...settings, bufferMinutes: +event.target.value })}>
                {[0, 5, 10, 15, 30, 45, 60].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
            <label className="text-sm font-semibold text-ink-900">
              Minimum notice (hours)
              <input className="application-input mt-2" type="number" min="0" max="720" value={settings.leadHours} onChange={(event) => setSettings({ ...settings, leadHours: +event.target.value })} />
            </label>
            <label className="text-sm font-semibold text-ink-900">
              Book up to (days ahead)
              <input className="application-input mt-2" type="number" min="1" max="365" value={settings.maxDaysAhead} onChange={(event) => setSettings({ ...settings, maxDaysAhead: +event.target.value })} />
            </label>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-cream-200 p-3 sm:p-4">
            <table className="w-full min-w-[560px] text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wide text-slate-500"><th className="py-2">Day</th><th>Available</th><th>From</th><th>Until</th></tr></thead>
              <tbody>
                {days.map(([id, label]) => {
                  const span = settings.hours[id];
                  return (
                    <tr key={id} className="border-t border-cream-200">
                      <td className="py-3 font-semibold text-ink-900">{label}</td>
                      <td><input type="checkbox" checked={!!span} onChange={(event) => setSettings({ ...settings, hours: { ...settings.hours, [id]: event.target.checked ? { start: "09:00", end: "17:00" } : null } })} aria-label={`${label} available`} /></td>
                      <td><input type="time" disabled={!span} className="application-input max-w-36" value={span?.start ?? "09:00"} onChange={(event) => editHours(id, "start", event.target.value)} /></td>
                      <td><input type="time" disabled={!span} className="application-input max-w-36" value={span?.end ?? "17:00"} onChange={(event) => editHours(id, "end", event.target.value)} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <label className="block text-sm font-semibold text-ink-900">
            Blocked dates <span className="font-normal text-slate-500">(one per line, YYYY-MM-DD)</span>
            <textarea className="application-input mt-2 min-h-24" value={(settings.blocked ?? []).join("\n")} onChange={(event) => setSettings({ ...settings, blocked: event.target.value.split(/\r?\n/).map((value: string) => value.trim()).filter(Boolean) })} placeholder="2026-12-25" />
          </label>
          <button type="submit" disabled={busy} className="application-submit"><Save size={16} aria-hidden="true" />Save availability</button>
        </form>
      )}

      {tab === "requests" && (
        <div className="mt-6 space-y-5">
          {bookings.length === 0 && (
            <div className="rounded-3xl border border-dashed border-cream-300 bg-white px-6 py-14 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-pale text-teal-brand"><CalendarClock size={22} aria-hidden="true" /></span>
              <h2 className="mt-4 text-lg font-bold text-ink-900">No call requests yet</h2>
              <p className="mt-1 text-sm text-slate-500">New requests will appear here when visitors book a time.</p>
            </div>
          )}

          {bookings.map((booking) => {
            const duration = Math.round((new Date(booking.endsAt).getTime() - new Date(booking.startsAt).getTime()) / 60000);
            const statusStyle = booking.status === "pending"
              ? "bg-orange-100 text-orange-900 ring-orange-200"
              : booking.status === "confirmed"
                ? "bg-teal-pale text-teal-brand ring-teal-border"
                : "bg-slate-100 text-slate-600 ring-slate-200";
            const draft = drafts[booking.id] ?? { details: booking.meetingDetails ?? "", reply: booking.adminReply ?? "" };

            return (
              <article key={booking.id} className="overflow-hidden rounded-3xl border border-cream-300 bg-white shadow-[0_12px_35px_rgba(7,54,64,.07)] transition-shadow hover:shadow-[0_18px_45px_rgba(7,54,64,.11)]">
                <header className="flex flex-wrap items-start justify-between gap-4 border-b border-cream-200 bg-gradient-to-r from-cream-50 via-white to-teal-pale/40 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex min-w-0 items-start gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-teal-brand shadow-sm ring-1 ring-cream-200">
                      <CalendarDays size={22} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h2 className="text-xl font-extrabold tracking-tight text-ink-900">{booking.name}</h2>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusStyle}`}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{booking.status}
                        </span>
                      </div>
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                        <a className="inline-flex items-center gap-2 transition hover:text-teal-brand" href={`mailto:${booking.email}`}><Mail size={15} className="text-teal-brand" aria-hidden="true" />{booking.email}</a>
                        {booking.phone && <a className="inline-flex items-center gap-2 transition hover:text-teal-brand" href={`tel:${booking.phone}`}><Phone size={15} className="text-teal-brand" aria-hidden="true" />{booking.phone}</a>}
                      </div>
                    </div>
                  </div>
                  {booking.status !== "cancelled" && (
                    <button type="button" onClick={() => { if (confirm("Cancel this call request and release its time slot?")) void post({ action: "cancel", id: booking.id }); }} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 text-sm font-semibold text-red-700 transition hover:border-red-300 hover:bg-red-50 disabled:opacity-50">
                      <XCircle size={16} aria-hidden="true" />Cancel request
                    </button>
                  )}
                </header>

                <div className="space-y-5 px-5 py-5 sm:px-7 sm:py-6">
                  <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-teal-border/70 bg-teal-pale/50 p-4 sm:p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-teal-brand shadow-sm"><Clock3 size={19} aria-hidden="true" /></span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-[.13em] text-teal-brand">Requested call time</p>
                      <p className="mt-1 text-sm font-bold leading-6 text-ink-900 sm:text-base">
                        {new Intl.DateTimeFormat("en-US", { timeZone: booking.timezone, dateStyle: "full", timeStyle: "short" }).format(new Date(booking.startsAt))}
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-cream-300">{duration} minutes</span>
                  </div>

                  {booking.message && (
                    <div className="flex gap-3 rounded-2xl bg-cream-50 p-4 sm:px-5">
                      <MessageSquareText size={18} className="mt-0.5 shrink-0 text-ember-600" aria-hidden="true" />
                      <div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">What they’d like to discuss</p><p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{booking.message}</p></div>
                    </div>
                  )}

                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <section className="border-t border-cream-200 pt-5">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-ember-600"><Send size={17} aria-hidden="true" /></span>
                        <div><h3 className="font-bold text-ink-900">Send meeting details</h3><p className="mt-0.5 text-xs text-slate-500">We’ll email your meeting information and reply to {booking.name.split(" ")[0]}.</p></div>
                      </div>
                      <div className="grid gap-4 lg:grid-cols-2">
                        <label className="block text-sm font-semibold text-ink-900">
                          Meeting details
                          <textarea className="application-input mt-2 min-h-28 resize-y rounded-2xl border-slate-200 bg-slate-50/50 px-4 py-3 leading-6 transition focus:border-teal-brand focus:bg-white focus:ring-4 focus:ring-teal-brand/10" value={draft.details} onChange={(event) => editDraft(booking.id, "details", event.target.value)} placeholder="Add the phone number or video meeting link…" />
                          <span className="mt-1.5 block text-xs font-normal text-slate-500">Include the details they need to join the call.</span>
                        </label>
                        <label className="block text-sm font-semibold text-ink-900">
                          Message to visitor
                          <textarea className="application-input mt-2 min-h-28 resize-y rounded-2xl border-slate-200 bg-slate-50/50 px-4 py-3 leading-6 transition focus:border-teal-brand focus:bg-white focus:ring-4 focus:ring-teal-brand/10" value={draft.reply} onChange={(event) => editDraft(booking.id, "reply", event.target.value)} placeholder="Hi, we look forward to speaking with you…" />
                          <span className="mt-1.5 block text-xs font-normal text-slate-500">A warm note to accompany the meeting details.</span>
                        </label>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs text-slate-500">The visitor will receive this by email.</p>
                        <button type="button" disabled={busy} onClick={() => void post({ action: "confirm", id: booking.id, meetingDetails: draft.details, reply: draft.reply })} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-ember-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-ember-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember-600 disabled:cursor-not-allowed disabled:opacity-60">
                          {busy ? <LoaderCircle size={17} className="animate-spin" aria-hidden="true" /> : booking.status === "pending" ? <Send size={17} aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}
                          {busy ? "Sending…" : booking.status === "pending" ? "Confirm and email" : "Send updated details"}
                        </button>
                      </div>
                    </section>
                  )}

                  {booking.status === "cancelled" && <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">This request was cancelled and its time slot is available again.</p>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {(error || message) && <p role={error || messageTone === "warning" ? "alert" : "status"} className={`mt-5 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-800" : messageTone === "warning" ? "border border-amber-200 bg-amber-50 text-amber-950" : "bg-teal-pale text-ink-900"}`}>{busy ? <LoaderCircle className="mr-2 inline animate-spin" size={15} aria-hidden="true" /> : null}{error || message}</p>}
    </div>
  );
}
