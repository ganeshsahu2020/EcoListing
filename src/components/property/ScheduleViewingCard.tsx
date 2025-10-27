import React, { useEffect, useState } from "react";

type Props = {
  mlsId?: string | null;
  addressLine?: string | undefined;
  onSchedule?: () => void;
  onContact?: () => void;
  onChat?: () => void;
  className?: string;
};

export default function ScheduleViewingCard({ mlsId, addressLine, onSchedule, onContact, onChat, className = "" }: Props) {
  const [name, setName] = useState(""); const [email, setEmail] = useState(""); const [phone, setPhone] = useState(""); const [msg, setMsg] = useState("");
  useEffect(() => { setMsg(`I want to book an appointment to view: [${mlsId ?? ""}], ${addressLine ?? ""}`.trim()); }, [mlsId, addressLine]);

  return (
    <section className={`glass-card rounded-3xl border border-slate-200 p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-800 mb-3">Schedule Viewing</h3>
      <div className="space-y-3">
        <input className="w-full h-11 rounded-xl border border-slate-300 px-3" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="w-full h-11 rounded-xl border border-slate-300 px-3" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full h-11 rounded-xl border border-slate-300 px-3" placeholder="Your contact number" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <textarea className="w-full rounded-xl border border-slate-300 px-3 py-2 min-h-[100px]" value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700" onClick={onSchedule}>Schedule Viewing</button>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        <button className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold shadow" onClick={onContact ?? onSchedule}>Contact to Agent</button>
        <button className="w-full h-11 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold shadow" onClick={onChat}>Open Chat</button>
      </div>
    </section>
  );
}
