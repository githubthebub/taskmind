"use client";

import Link from "next/link";
import { getTechniquesByCategory, CATEGORY_LABELS, type Technique } from "@/lib/techniques";
import { useProgressStats } from "@/lib/progress";

const CATEGORY_ORDER: Technique["category"][] = [
  "piti",
  "jhana",
  "somatic-build",
  "breathwork",
  "integration",
];

export default function Home() {
  const { streak } = useProgressStats();
  const grouped = getTechniquesByCategory();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-12 px-4 py-12">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-semibold tracking-tight text-teal-50">taskmind</h1>
        <p className="max-w-md text-teal-200/60">
          Techniques for cultivating piti, approaching jhana absorption, and working with the
          body&apos;s own energy — drawn from breath, taoist internal alchemy, and somatic
          awareness practice.
        </p>
      </header>

      <section className="rounded-3xl border border-teal-800/30 bg-teal-950/20 px-6 py-5">
        <p className="text-xs uppercase tracking-widest text-teal-300/50">Today&apos;s streak</p>
        <p className="mt-1 text-2xl font-semibold text-teal-100">
          {streak} day{streak === 1 ? "" : "s"}
        </p>
        <Link href="/progress" className="mt-2 inline-block text-sm text-teal-300 underline underline-offset-4">
          View full progress
        </Link>
      </section>

      {CATEGORY_ORDER.map((category) => {
        const items = grouped[category];
        if (!items || items.length === 0) return null;
        return (
          <section key={category} className="flex flex-col gap-4">
            <h2 className="text-sm font-medium uppercase tracking-widest text-teal-300/60">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {items.map((technique) => (
                <TechniqueCard key={technique.id} technique={technique} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function TechniqueCard({ technique }: { technique: Technique }) {
  return (
    <Link
      href={`/session/${technique.id}`}
      className="group flex flex-col gap-3 rounded-3xl border border-teal-800/30 bg-teal-950/20 px-5 py-5 transition hover:border-teal-600/50 hover:bg-teal-900/30"
    >
      <div className="flex items-center justify-between">
        <span className="rounded-full border border-teal-700/40 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-teal-300/70">
          {CATEGORY_LABELS[technique.category]}
        </span>
        <span className="text-xs text-teal-300/50">{technique.durationMinutes} min</span>
      </div>
      <h3 className="text-lg font-medium text-teal-50 group-hover:text-teal-100">
        {technique.title}
      </h3>
      <p className="text-sm leading-relaxed text-teal-200/60">{technique.summary}</p>
    </Link>
  );
}
