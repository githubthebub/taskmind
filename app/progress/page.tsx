"use client";

import Link from "next/link";
import { useProgressStats } from "@/lib/progress";
import { getTechniqueById } from "@/lib/techniques";

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function ProgressPage() {
  const stats = useProgressStats();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10 px-4 py-12">
      <div>
        <h1 className="text-2xl font-semibold text-teal-50">Your progress</h1>
        <p className="mt-1 text-sm text-teal-200/60">
          A quiet record of your practice — no pressure, just data for yourself.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Day streak" value={stats.streak} />
        <StatCard label="Sessions" value={stats.totalSessions} />
        <StatCard label="Minutes" value={stats.totalMinutes} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium uppercase tracking-widest text-teal-300/60">
          Recent sessions
        </h2>
        {stats.recent.length === 0 ? (
          <p className="rounded-2xl border border-teal-800/30 bg-teal-950/20 px-5 py-8 text-center text-sm text-teal-200/50">
            No sessions logged yet.{" "}
            <Link href="/" className="text-teal-300 underline underline-offset-4">
              Start your first practice
            </Link>
            .
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {stats.recent.map((entry, i) => {
              const technique = getTechniqueById(entry.techniqueId);
              return (
                <li
                  key={`${entry.techniqueId}-${entry.completedAt}-${i}`}
                  className="flex items-center justify-between rounded-2xl border border-teal-800/30 bg-teal-950/20 px-5 py-3 text-sm"
                >
                  <span className="text-teal-50">{technique?.title ?? entry.techniqueId}</span>
                  <span className="text-teal-300/50">{formatDate(entry.completedAt)}</span>
                  <span className="text-teal-300/50">{entry.durationMinutes} min</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-teal-800/30 bg-teal-950/20 px-4 py-6">
      <span className="text-2xl font-semibold text-teal-100 tabular-nums">{value}</span>
      <span className="text-xs uppercase tracking-widest text-teal-300/50">{label}</span>
    </div>
  );
}
