import React, { useState } from "react";

function toIcsStamp(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(
    d.getUTCMinutes()
  )}${pad(d.getUTCSeconds())}Z`;
}
function downloadIcs(filename: string, body: string) {
  const blob = new Blob([body], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".ics") ? filename : `${filename}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function OpenHouseCalendar({
  mlsId,
  address,
}: {
  mlsId?: string | null;
  address?: string | null;
}) {
  const [date, setDate] = useState("");
  const [start, setStart] = useState("13:00");
  const [end, setEnd] = useState("15:00");

  const gcalHref = (() => {
    if (!date) return "#";
    const s = new Date(`${date}T${start || "13:00"}:00`);
    const e = new Date(`${date}T${end || "15:00"}:00`);
    const dates = `${toIcsStamp(s)}/${toIcsStamp(e)}`;
    const text = `Open House - ${encodeURIComponent(address || "Property")}`;
    const details = encodeURIComponent(`MLS ${mlsId || ""} • ${window.location.href}`);
    const loc = encodeURIComponent(address || "");
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${loc}`;
  })();

  const outlookHref = (() => {
    if (!date) return "#";
    const s = new Date(`${date}T${start || "13:00"}:00`);
    const e = new Date(`${date}T${end || "15:00"}:00`);
    const subject = encodeURIComponent(`Open House - ${address || "Property"}`);
    const body = encodeURIComponent(`MLS ${mlsId || ""} • ${window.location.href}`);
    const loc = encodeURIComponent(address || "");
    return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${subject}&startdt=${s.toISOString()}&enddt=${e.toISOString()}&body=${body}&location=${loc}`;
  })();

  return (
    <section className="glass-card rounded-3xl border border-slate-200 p-5">
      <h3 className="text-lg font-bold text-slate-800 mb-3">Open-House Calendar</h3>
      <div className="grid grid-cols-2 gap-3">
        <L label="Date">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-9 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </L>
        <L label="Start">
          <input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="h-9 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </L>
        <L label="End">
          <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="h-9 rounded-xl border border-slate-300 bg-white px-3 py-1 text-sm shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-400" />
        </L>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="rounded-full px-3 py-1.5 text-sm bg-slate-900 text-white shadow focus-visible:ring-2 focus-visible:ring-slate-400"
          onClick={() => {
            if (!date) return alert("Pick a date");
            const s = new Date(`${date}T${start || "13:00"}:00`);
            const e = new Date(`${date}T${end || "15:00"}:00`);
            const ics = [
              "BEGIN:VCALENDAR",
              "VERSION:2.0",
              "PRODID:-//EcoListing//Open-House//EN",
              "BEGIN:VEVENT",
              `UID:${(mlsId || Math.random().toString(36)).replace(/[^a-zA-Z0-9]/g, "")}@ecolisting`,
              `DTSTAMP:${toIcsStamp(new Date())}`,
              `DTSTART:${toIcsStamp(s)}`,
              `DTEND:${toIcsStamp(e)}`,
              `SUMMARY:Open House - ${address || "Property"}`,
              `LOCATION:${address || ""}`,
              `DESCRIPTION:MLS ${mlsId || ""} • ${window.location.href}`,
              "END:VEVENT",
              "END:VCALENDAR",
            ].join("\r\n");
            downloadIcs(`OpenHouse-${mlsId || "property"}.ics`, ics);
          }}
        >
          Download .ics
        </button>
        <a className="rounded-full px-3 py-1.5 text-sm bg-emerald-600 text-white shadow focus-visible:ring-2 focus-visible:ring-emerald-400" href={gcalHref} target="_blank" rel="noreferrer">
          Add to Google
        </a>
        <a className="rounded-full px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-slate-400" href={outlookHref} target="_blank" rel="noreferrer">
          Add to Outlook
        </a>
      </div>
    </section>
  );
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      {children}
    </label>
  );
}
