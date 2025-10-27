// src/pages/Close.tsx
import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import {
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  PlusIcon,
  InformationCircleIcon,
  SparklesIcon,
  TrashIcon,
  PencilSquareIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

type Task = { id: string; title: string; done: boolean; due_date: string | null };

function toInputDate(d: Date) {
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}
function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}
function isOverdue(t: Task) {
  if (!t.due_date || t.done) return false;
  const today = toInputDate(new Date());
  return t.due_date < today;
}
function isSoon(t: Task) {
  if (!t.due_date || t.done) return false;
  const today = new Date(toInputDate(new Date()));
  const due = new Date(t.due_date);
  const diff = Math.ceil((+due - +today) / (1000 * 60 * 60 * 24));
  return diff >= 0 && diff <= 7;
}

const TEMPLATES = [
  "Send signed purchase agreement",
  "Deposit earnest money",
  "Schedule home inspection",
  "Review inspection report",
  "Apply for mortgage",
  "Order appraisal",
  "Secure home insurance",
  "Schedule final walkthrough",
  "Set up utilities (electric, gas, water, internet)",
  "Confirm closing date & time",
];

export default function Close() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // composer
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState<string>("");

  // edit row
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDue, setEditDue] = useState<string>("");

  // filter tab
  const [tab, setTab] = useState<"open" | "completed" | "all">("open");

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("closing_tasks")
      .select("id, title, done, due_date")
      .eq("user_uid", user.id);

    if (error) setErr(error.message);
    setTasks(((data as Task[]) || []).sort(sorter));
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const sorter = (a: Task, b: Task) => {
    // open first, then earliest due date, nulls last, then title
    if (a.done !== b.done) return a.done ? 1 : -1;
    if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    return a.title.localeCompare(b.title);
  };

  const add = async () => {
    if (!newTitle.trim()) return;
    const payload = {
      user_uid: user?.id ?? null,
      title: newTitle.trim(),
      done: false,
      due_date: newDue || null,
    };
    // optimistic
    const temp: Task = {
      id: "temp-" + Math.random().toString(36).slice(2),
      title: payload.title,
      done: false,
      due_date: payload.due_date,
    };
    setTasks((t) => [temp, ...t].sort(sorter));
    setNewTitle("");
    setNewDue("");

    const { data, error } = await supabase
      .from("closing_tasks")
      .insert(payload)
      .select("id, title, done, due_date")
      .single();

    if (error) {
      setErr(error.message);
      // rollback optimistic
      setTasks((t) => t.filter((x) => x.id !== temp.id));
    } else if (data) {
      // swap temp id
      setTasks((t) => [data as Task, ...t.filter((x) => x.id !== temp.id)].sort(sorter));
    }
  };

  const toggle = async (id: string, done: boolean) => {
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done } : x)).sort(sorter));
    const { error } = await supabase.from("closing_tasks").update({ done }).eq("id", id);
    if (error) {
      setErr(error.message);
      // revert
      setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !done } : x)).sort(sorter));
    }
  };

  const remove = async (id: string) => {
    const prev = tasks;
    setTasks((t) => t.filter((x) => x.id !== id));
    const { error } = await supabase.from("closing_tasks").delete().eq("id", id);
    if (error) {
      setErr(error.message);
      setTasks(prev);
    }
  };

  const startEdit = (t: Task) => {
    setEditingId(t.id);
    setEditTitle(t.title);
    setEditDue(t.due_date || "");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const id = editingId;
    const patch = { title: editTitle.trim() || "Untitled task", due_date: editDue || null };
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, ...patch } : x)).sort(sorter));
    setEditingId(null);

    const { error } = await supabase
      .from("closing_tasks")
      .update(patch)
      .eq("id", id);
    if (error) {
      setErr(error.message);
      // best effort reload
      load();
    }
  };

  const applyTemplates = async () => {
    const rows = TEMPLATES.map((title) => ({
      user_uid: user?.id ?? null,
      title,
      done: false,
      due_date: null,
    }));
    const { data, error } = await supabase
      .from("closing_tasks")
      .insert(rows)
      .select("id, title, done, due_date");

    if (error) setErr(error.message);
    setTasks((t) => ([...(data as Task[]) ?? [], ...t]).sort(sorter));
  };

  const open = tasks.filter((t) => !t.done);
  const completed = tasks.filter((t) => t.done);
  const counts = { open: open.length, completed: completed.length, all: tasks.length };

  const grouped = useMemo(() => {
    const src = tab === "all" ? tasks : tab === "open" ? open : completed;
    const out = {
      overdue: [] as Task[],
      soon: [] as Task[],
      upcoming: [] as Task[],
      nodate: [] as Task[],
      done: [] as Task[],
    };
    for (const t of src) {
      if (t.done) out.done.push(t);
      else if (isOverdue(t)) out.overdue.push(t);
      else if (isSoon(t)) out.soon.push(t);
      else if (t.due_date) out.upcoming.push(t);
      else out.nodate.push(t);
    }
    return out;
  }, [tasks, open, completed, tab]);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="border-b bg-gradient-to-b from-slate-50 to-white">
        <div className="container-7xl px-4 py-10">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 ring-1 ring-indigo-200/60">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Closing Checklist</h1>
              <p className="text-sm text-slate-600">
                Track everything from inspection to keys. We’ll keep it simple and on time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main */}
          <div className="lg:col-span-2 space-y-6">
            {/* Composer */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 text-sm font-medium text-slate-900">Add Task</div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,180px,auto]">
                <input
                  className="input"
                  placeholder="e.g., Schedule final walkthrough"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                />
                <div className="relative">
                  <CalendarDaysIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    type="date"
                    className="input w-full pl-10"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                  />
                </div>
                <button className="btn-primary h-11 px-4 inline-flex items-center gap-2" onClick={add}>
                  <PlusIcon className="h-5 w-5" />
                  Add
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => setNewDue(toInputDate(addDays(new Date(), 7)))}
                >
                  +1 week
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => setNewDue(toInputDate(addDays(new Date(), 14)))}
                >
                  +2 weeks
                </button>
                <button
                  type="button"
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700 hover:bg-slate-50"
                  onClick={() => setNewDue("")}
                >
                  No date
                </button>

                <span className="ml-auto inline-flex items-center gap-2 text-xs text-slate-500">
                  <SparklesIcon className="h-4 w-4" />
                  Need ideas?{" "}
                  <button
                    className="text-indigo-700 hover:underline"
                    onClick={applyTemplates}
                    type="button"
                  >
                    Add template tasks
                  </button>
                </span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 border-b">
              {([
                ["open", `Open (${counts.open})`],
                ["completed", `Completed (${counts.completed})`],
                ["all", `All (${counts.all})`],
              ] as const).map(([key, label]) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    onClick={() => setTab(key)}
                    className={[
                      "px-4 py-2 text-sm font-medium border-b-2 -mb-px",
                      active
                        ? "border-indigo-600 text-indigo-700"
                        : "border-transparent text-slate-600 hover:text-slate-800",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Lists */}
            <TaskGroup
              title="Overdue"
              hint="Due date passed—let’s nudge these forward."
              color="text-rose-700"
              emptyText="No overdue tasks—great job!"
              items={grouped.overdue}
              loading={loading}
              onToggle={toggle}
              onDelete={remove}
              onStartEdit={startEdit}
              editingId={editingId}
              editTitle={editTitle}
              editDue={editDue}
              setEditTitle={setEditTitle}
              setEditDue={setEditDue}
              onSaveEdit={saveEdit}
            />
            <TaskGroup
              title="Due soon"
              hint="Coming up within a week."
              color="text-amber-700"
              emptyText="Nothing due this week."
              items={grouped.soon}
              loading={loading}
              onToggle={toggle}
              onDelete={remove}
              onStartEdit={startEdit}
              editingId={editingId}
              editTitle={editTitle}
              editDue={editDue}
              setEditTitle={setEditTitle}
              setEditDue={setEditDue}
              onSaveEdit={saveEdit}
            />
            <TaskGroup
              title="Upcoming"
              hint="Planned for later."
              color="text-slate-800"
              emptyText="No upcoming tasks."
              items={grouped.upcoming}
              loading={loading}
              onToggle={toggle}
              onDelete={remove}
              onStartEdit={startEdit}
              editingId={editingId}
              editTitle={editTitle}
              editDue={editDue}
              setEditTitle={setEditTitle}
              setEditDue={setEditDue}
              onSaveEdit={saveEdit}
            />
            <TaskGroup
              title="No date"
              hint="Keep these in mind; set a date when ready."
              color="text-slate-800"
              emptyText="Everything is dated—nice."
              items={grouped.nodate}
              loading={loading}
              onToggle={toggle}
              onDelete={remove}
              onStartEdit={startEdit}
              editingId={editingId}
              editTitle={editTitle}
              editDue={editDue}
              setEditTitle={setEditTitle}
              setEditDue={setEditDue}
              onSaveEdit={saveEdit}
            />
            {tab !== "open" && (
              <TaskGroup
                title="Completed"
                hint="All set here."
                color="text-emerald-700"
                emptyText="No completed tasks yet."
                items={grouped.done}
                loading={loading}
                onToggle={toggle}
                onDelete={remove}
                onStartEdit={startEdit}
                editingId={editingId}
                editTitle={editTitle}
                editDue={editDue}
                setEditTitle={setEditTitle}
                setEditDue={setEditDue}
                onSaveEdit={saveEdit}
              />
            )}

            {err && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800">
                {err}
              </div>
            )}
          </div>

          {/* Right: tips & summary */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                <InformationCircleIcon className="h-5 w-5 text-slate-500" />
                What to expect
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Your agent will coordinate inspection and appraisal.</li>
                <li>• You’ll sign closing disclosures ~3 days before closing.</li>
                <li>• On closing day, bring ID and proof of funds if wired same day.</li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-900">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                Pro tips
              </div>
              <ul className="space-y-2 text-sm text-slate-700">
                <li>• Schedule utilities to start the day before closing.</li>
                <li>• Confirm wire instructions directly with the title company.</li>
                <li>• Do a final walkthrough within 24 hours of closing.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ------------ Subcomponents ------------ */

function TaskRow({
  t,
  onToggle,
  onDelete,
  onStartEdit,
  editing,
  editTitle,
  editDue,
  setEditTitle,
  setEditDue,
  onSaveEdit,
}: {
  t: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onStartEdit: (t: Task) => void;
  editing: boolean;
  editTitle: string;
  editDue: string;
  setEditTitle: (v: string) => void;
  setEditDue: (v: string) => void;
  onSaveEdit: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <input
        type="checkbox"
        className="h-5 w-5"
        checked={t.done}
        onChange={(e) => onToggle(t.id, e.target.checked)}
      />

      {editing ? (
        <div className="flex w-full items-center gap-2">
          <input
            className="input flex-1"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />
          <input
            type="date"
            className="input w-[160px]"
            value={editDue}
            onChange={(e) => setEditDue(e.target.value)}
          />
          <button className="btn-primary h-9 px-3" onClick={onSaveEdit} type="button">
            Save
          </button>
        </div>
      ) : (
        <>
          <span className={"flex-1 " + (t.done ? "line-through text-slate-400" : "text-slate-800")}>
            {t.title}
          </span>
          {t.due_date && (
            <span
              className={[
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                isOverdue(t)
                  ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200"
                  : isSoon(t)
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                  : "bg-slate-100 text-slate-700 ring-1 ring-slate-200",
              ].join(" ")}
              title="Due date"
            >
              <CalendarDaysIcon className="mr-1 h-4 w-4" />
              {new Date(t.due_date).toLocaleDateString()}
            </span>
          )}
          <button
            className="ml-2 rounded-md p-1 text-slate-500 hover:bg-slate-100"
            onClick={() => onStartEdit(t)}
            title="Edit"
            type="button"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>
          <button
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100"
            onClick={() => onDelete(t.id)}
            title="Delete"
            type="button"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </>
      )}
    </li>
  );
}

function TaskGroup(props: {
  title: string;
  hint: string;
  color: string;
  emptyText: string;
  items: Task[];
  loading: boolean;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
  onStartEdit: (t: Task) => void;
  editingId: string | null;
  editTitle: string;
  editDue: string;
  setEditTitle: (v: string) => void;
  setEditDue: (v: string) => void;
  onSaveEdit: () => void;
}) {
  const {
    title,
    hint,
    color,
    emptyText,
    items,
    loading,
    onToggle,
    onDelete,
    onStartEdit,
    editingId,
    editTitle,
    editDue,
    setEditTitle,
    setEditDue,
    onSaveEdit,
  } = props;

  return (
    <section aria-label={title}>
      <div className="mb-2 flex items-end justify-between">
        <div>
          <h3 className={`text-sm font-semibold ${color}`}>{title}</h3>
          <p className="text-xs text-slate-500">{hint}</p>
        </div>
      </div>

      {loading ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <TaskRow
              key={t.id}
              t={t}
              onToggle={onToggle}
              onDelete={onDelete}
              onStartEdit={onStartEdit}
              editing={editingId === t.id}
              editTitle={editTitle}
              editDue={editDue}
              setEditTitle={setEditTitle}
              setEditDue={setEditDue}
              onSaveEdit={onSaveEdit}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
