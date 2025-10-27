import React, { useEffect, useMemo, useState } from "react";

type Repo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  license: { key: string; name: string } | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  archived: boolean;
  fork: boolean;
  mirror_url: string | null;
  topics?: string[];
  updated_at: string;
};

const GITHUB_API =
  "https://api.github.com/orgs/Repliers-io/repos?type=sources&sort=updated&per_page=100";

// Optional: use a token to avoid 60/h rate limits
const TOKEN = import.meta.env.VITE_GITHUB_TOKEN || "";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function RepoCard({ r }: { r: Repo }) {
  return (
    <article className="card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <a
          href={r.html_url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-slate-900 hover:underline"
        >
          {r.name}
        </a>
        <a
          href={r.html_url}
          target="_blank"
          rel="noreferrer"
          className="hf-small px-2 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
          aria-label={`Open ${r.name} on GitHub`}
        >
          GitHub ↗
        </a>
      </div>

      <p className="hf-body text-slate-600 min-h-[2.25rem]">
        {r.description || "No description provided."}
      </p>

      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-600">
        {r.language && (
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-slate-400" />
            {r.language}
          </span>
        )}
        {r.license?.name && <span>{r.license.name}</span>}
        <span>★ {r.stargazers_count}</span>
        <span>⑂ {r.forks_count}</span>
        <span className="text-slate-500">Updated {timeAgo(r.updated_at)}</span>
      </div>
    </article>
  );
}

function LoadingCard() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="skeleton h-5 w-44 mb-3 rounded" />
      <div className="skeleton h-4 w-4/5 mb-2 rounded" />
      <div className="skeleton h-4 w-2/3 mb-4 rounded" />
      <div className="flex gap-2">
        <div className="skeleton h-4 w-16 rounded" />
        <div className="skeleton h-4 w-12 rounded" />
        <div className="skeleton h-4 w-14 rounded" />
      </div>
    </div>
  );
}

export default function DeveloperHub() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "apis" | "portal" | "play" | "pocs">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
        if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

        const res = await fetch(GITHUB_API, { headers });
        if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
        const data: Repo[] = await res.json();

        const clean = data
          .filter((r) => !r.fork && !r.archived && !r.mirror_url) // mirror:false fork:false archived:false
          .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at));

        if (!abort) setRepos(clean);
      } catch (e: any) {
        if (!abort) setError(e.message || "Failed to load repositories.");
      }
    })();
    return () => {
      abort = true;
    };
  }, []);

  const filtered = useMemo(() => {
    if (!repos) return null;

    const ql = q.trim().toLowerCase();
    let list = repos;

    if (ql) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(ql) ||
          r.description?.toLowerCase().includes(ql) ||
          r.language?.toLowerCase().includes(ql) ||
          r.topics?.some((t) => t.toLowerCase().includes(ql))
      );
    }

    if (filter === "apis") {
      list = list.filter((r) => /api|types|openapi|sdk|mcp/.test(r.name));
    } else if (filter === "portal") {
      list = list.filter((r) => /portal/.test(r.name));
    } else if (filter === "play") {
      list = list.filter((r) => /play|demo/.test(r.name));
    } else if (filter === "pocs") {
      list = list.filter((r) => /poc|pocs|experiment/.test(r.name));
    }
    return list;
  }, [repos, q, filter]);

  return (
    <main className="section-pad bg-surface-50 min-h-[60vh]">
      <div className="container-7xl">
        <header className="mb-8">
          <h1 className="hf-subheadline text-slate-900">Developer Hub</h1>
          <p className="hf-body-lg text-slate-600">
            Open-source components and docs from Repliers, grouped for quick scanning.
          </p>
        </header>

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative">
            <input
              className="h-11 w-72 max-w-full rounded-xl border border-slate-200 bg-white px-4 pr-10 placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-[color:var(--brand)/.25] focus:border-[color:var(--brand)]"
              placeholder="Search repos (name, desc, language)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">⌘K</span>
          </div>

          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1">
            {([
              ["all", "All"],
              ["apis", "APIs & SDKs"],
              ["portal", "Portal"],
              ["play", "Playgrounds"],
              ["pocs", "PoCs"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={[
                  "px-3 h-9 rounded-full text-sm font-medium transition-all",
                  filter === key ? "bg-white shadow-sm text-slate-900" : "text-slate-600 hover:text-slate-800",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="card p-4 text-rose-700 bg-rose-50 border-rose-200 mb-6">
            {error}
          </div>
        )}

        {!filtered ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-slate-600">No repositories match your filters.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((r) => (
              <RepoCard key={r.id} r={r} />
            ))}
          </div>
        )}

        <p className="mt-8 hf-small text-slate-500">
          Data live from GitHub org{" "}
          <a
            className="text-[color:var(--brand)] hover:underline"
            href="https://github.com/orgs/Repliers-io/repositories?q=mirror%3Afalse+fork%3Afalse+archived%3Afalse"
            target="_blank"
            rel="noreferrer"
          >
            Repliers-io
          </a>
          .
        </p>
      </div>
    </main>
  );
}
