import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

export default function Account() {
  const { user, role, updatePassword, signOut } = useAuth();
  const [p1,setP1]=useState(""); const [p2,setP2]=useState(""); const [msg,setMsg]=useState<string|null>(null);

  async function change(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (p1 !== p2) { setMsg("Passwords do not match"); return; }
    try { await updatePassword(p1); setMsg("Password updated"); setP1(""); setP2(""); }
    catch(e:any){ setMsg(e.message||"Failed to update password"); }
  }

  return (
    <main className="container-7xl section-pad">
      <div className="mx-auto max-w-xl grid gap-6">
        <div className="card p-5">
          <div className="font-semibold">My Account</div>
          <div className="mt-2 text-sm text-slate-600">Signed in as <b>{user?.email}</b> · role: <b>{role}</b></div>
          <button className="btn-outline mt-3" onClick={signOut}>Sign out</button>
        </div>
        <div className="card p-5">
          <div className="font-semibold">Change password</div>
          <form className="mt-3 space-y-3" onSubmit={change}>
            <input className="input w-full rounded border border-slate-300 px-3 py-2" type="password" placeholder="New password" value={p1} onChange={e=>setP1(e.target.value)} required />
            <input className="input w-full rounded border border-slate-300 px-3 py-2" type="password" placeholder="Confirm new password" value={p2} onChange={e=>setP2(e.target.value)} required />
            {msg && <div className="text-sm">{msg}</div>}
            <button className="btn-primary">Save</button>
          </form>
        </div>
      </div>
    </main>
  );
}
