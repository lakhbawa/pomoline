"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { STAGE_ORDER, STAGE_LABELS, Stage } from "@/lib/types";

interface StageCounts {
  [key: string]: number;
}

export default function Dashboard() {
  const [stageCounts, setStageCounts] = useState<StageCounts>({});
  const [readyCount, setReadyCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/tasks");
        const tasks = await res.json();
        const counts: StageCounts = {};
        for (const stage of STAGE_ORDER) {
          counts[stage] = tasks.filter(
            (t: { stage: string }) => t.stage === stage
          ).length;
        }
        setStageCounts(counts);
        setReadyCount(
          tasks.filter(
            (t: { stage: string }) =>
              t.stage === Stage.POMO_SIZED || t.stage === Stage.READY
          ).length
        );
      } catch {
        // ignore fetch errors on initial load
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalTasks = Object.values(stageCounts).reduce(
    (sum, c) => sum + c,
    0
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-lg space-y-8">
          {/* Logo */}
          <div className="text-center space-y-2">
            <h1 className="font-mono font-bold text-4xl text-primary">
              pomoline
            </h1>
            <p className="text-text-muted text-sm">
              Refine raw thoughts into focused pomodoro blocks
            </p>
          </div>

          {/* Mode Cards */}
          <div className="space-y-4">
            <Link href="/refine" className="block group">
              <div className="bg-surface border border-border rounded-lg p-6 transition-all hover:border-primary/50 hover:bg-surface/80">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-sans font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                      Refine
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                      Work on your backlog
                    </p>
                  </div>
                  <span className="text-text-muted text-2xl">&rarr;</span>
                </div>
                {!loading && totalTasks > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {STAGE_ORDER.map((stage) =>
                      stageCounts[stage] ? (
                        <span
                          key={stage}
                          className="text-xs font-mono px-2 py-1 rounded bg-primary-dim text-primary/80"
                        >
                          {stageCounts[stage]} {STAGE_LABELS[stage]}
                        </span>
                      ) : null
                    )}
                  </div>
                )}
                {!loading && totalTasks === 0 && (
                  <p className="mt-4 text-text-muted text-xs font-mono">
                    No tasks yet — start brain dumping
                  </p>
                )}
              </div>
            </Link>

            <Link href="/plan" className="block group">
              <div className="bg-surface border border-border rounded-lg p-6 transition-all hover:border-primary/50 hover:bg-surface/80">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="font-sans font-bold text-lg text-text-primary group-hover:text-primary transition-colors">
                      Plan
                    </h2>
                    <p className="text-text-muted text-sm mt-1">
                      Plan today
                    </p>
                  </div>
                  <span className="text-text-muted text-2xl">&rarr;</span>
                </div>
                {!loading && readyCount > 0 && (
                  <p className="mt-4 text-xs font-mono text-primary/80">
                    {readyCount} pomo-ready block
                    {readyCount !== 1 ? "s" : ""} available
                  </p>
                )}
                {!loading && readyCount === 0 && (
                  <p className="mt-4 text-text-muted text-xs font-mono">
                    No blocks ready — refine some tasks first
                  </p>
                )}
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
