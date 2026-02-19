"use client";

import { useEffect, useCallback } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority } from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

export default function Prioritize({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { tasks, fetchTasks, updateTask } = useTaskStore();

  const unprioritized = tasks.filter(
    (t) =>
      (t.stage === Stage.RAW || t.stage === Stage.PRIORITIZED) &&
      t.priority === Priority.UNSET
  );
  const allRelevant = tasks.filter(
    (t) => t.stage === Stage.RAW || t.stage === Stage.PRIORITIZED
  );
  const highCount = allRelevant.filter(
    (t) => t.priority === Priority.HIGH
  ).length;
  const lowCount = allRelevant.filter(
    (t) => t.priority === Priority.LOW
  ).length;

  const currentTask = unprioritized[0];
  const totalToPrioritize = allRelevant.length;

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const assignPriority = useCallback(
    async (priority: "HIGH" | "LOW") => {
      if (!currentTask) return;
      await updateTask(currentTask.id, {
        priority,
        stage: Stage.PRIORITIZED,
      } as Partial<TaskWithRelations>);
    },
    [currentTask, updateTask]
  );

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key === "h" || e.key === "H") {
        assignPriority(Priority.HIGH);
      } else if (e.key === "l" || e.key === "L") {
        assignPriority(Priority.LOW);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [assignPriority]);

  const allDone = unprioritized.length === 0 && totalToPrioritize > 0;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={2}
        title="PRIORITIZE"
        description="Decide what moves forward today. High (H) items stay in the pipeline for decomposition. Low (L) items are archived for later."
        progress={33}
      />

      {currentTask && !allDone ? (
        <>
          {/* Active Focus Card */}
          <div className="mb-6">
            <div className="inline-flex items-center px-2.5 py-1 mb-3 text-xs font-mono uppercase tracking-widest text-primary border border-dashed border-primary/40 rounded">
              ACTIVE FOCUS
            </div>
            <div className="border-2 border-dashed border-primary/40 rounded-xl p-6 flex items-center justify-between gap-4">
              <p className="font-mono text-base text-text-primary flex-1">
                {currentTask.text}
              </p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => assignPriority(Priority.LOW)}
                  className="w-12 h-12 flex items-center justify-center bg-surface border-2 border-border rounded-lg text-text-muted font-mono font-bold text-lg hover:border-text-muted/40 hover:text-text-primary transition-all"
                >
                  L
                </button>
                <button
                  onClick={() => assignPriority(Priority.HIGH)}
                  className="w-12 h-12 flex items-center justify-center bg-primary/10 border-2 border-primary/40 rounded-lg text-primary font-mono font-bold text-lg hover:bg-primary/20 hover:border-primary/60 transition-all"
                >
                  H
                </button>
              </div>
            </div>
          </div>

          {/* Queue */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-text-muted text-xs font-mono uppercase tracking-widest">
                REMAINING IN QUEUE ({unprioritized.length})
              </p>
              <p className="text-text-muted/40 text-xs font-mono">
                Use [H] or [L] keys
              </p>
            </div>
            <div className="space-y-1.5">
              {/* Show remaining unprioritized (skip current) */}
              {unprioritized.slice(1).map((t) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3"
                >
                  <div className="flex gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        updateTask(t.id, {
                          priority: Priority.LOW,
                          stage: Stage.PRIORITIZED,
                        } as Partial<TaskWithRelations>)
                      }
                      className="w-7 h-7 flex items-center justify-center border border-border rounded text-text-muted/40 font-mono text-xs hover:border-text-muted/40 hover:text-text-muted transition-all"
                    >
                      L
                    </button>
                    <button
                      onClick={() =>
                        updateTask(t.id, {
                          priority: Priority.HIGH,
                          stage: Stage.PRIORITIZED,
                        } as Partial<TaskWithRelations>)
                      }
                      className="w-7 h-7 flex items-center justify-center border border-primary/30 rounded text-primary/50 font-mono text-xs hover:border-primary/50 hover:text-primary transition-all"
                    >
                      H
                    </button>
                  </div>
                  <span className="font-mono text-sm text-text-primary/70">
                    {t.text}
                  </span>
                </div>
              ))}

              {/* Show already-decided items faded */}
              {allRelevant
                .filter((t) => t.priority !== Priority.UNSET)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 bg-surface/50 border border-border/50 rounded-lg px-4 py-3 ${
                      t.priority === Priority.LOW ? "opacity-40" : "opacity-60"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 flex items-center justify-center border rounded font-mono text-xs font-bold ${
                        t.priority === Priority.HIGH
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-border text-text-muted/50 bg-surface"
                      }`}
                    >
                      {t.priority === Priority.HIGH ? "H" : "L"}
                    </span>
                    <span
                      className={`font-mono text-sm flex-1 ${
                        t.priority === Priority.LOW
                          ? "text-text-muted/40 line-through"
                          : "text-text-primary/50"
                      }`}
                    >
                      {t.text}
                    </span>
                    <button
                      onClick={() =>
                        updateTask(t.id, {
                          priority: Priority.UNSET,
                          stage: Stage.RAW,
                        } as Partial<TaskWithRelations>)
                      }
                      className="text-text-muted/30 hover:text-text-muted text-xs font-mono transition-colors"
                    >
                      UNDO
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : allDone ? (
        /* Summary */
        <div className="text-center border-2 border-dashed border-border rounded-xl py-16 px-8">
          <p className="font-mono text-xs text-text-muted uppercase tracking-widest mb-4">
            PRIORITIZATION COMPLETE
          </p>
          <div className="flex justify-center gap-10 mb-8">
            <div className="text-center">
              <span className="font-mono font-bold text-4xl text-primary">
                {highCount}
              </span>
              <p className="text-text-muted text-xs font-mono mt-2 uppercase tracking-wider">
                HIGH
              </p>
            </div>
            <div className="text-center">
              <span className="font-mono font-bold text-4xl text-text-muted/40">
                {lowCount}
              </span>
              <p className="text-text-muted text-xs font-mono mt-2 uppercase tracking-wider">
                LOW
              </p>
            </div>
          </div>
          {highCount === 0 && (
            <p className="text-text-muted text-xs font-mono">
              No high priority tasks to decompose
            </p>
          )}
        </div>
      ) : (
        /* Empty state */
        <div className="text-center border-2 border-dashed border-border rounded-xl py-16 px-8">
          <p className="text-text-muted text-sm font-mono">
            NO TASKS TO PRIORITIZE
          </p>
          <p className="text-text-muted/40 text-xs font-mono mt-2">
            Go back to Brain Dump first
          </p>
        </div>
      )}

      <FooterBar
        stats={[
          { label: "TOTAL ITEMS", value: totalToPrioritize },
          { label: "HIGH PRIORITY", value: highCount },
        ]}
        leftAction={
          <button
            onClick={onBack}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-text-muted font-mono text-xs uppercase tracking-wider hover:border-primary/30 hover:text-text-primary transition-colors"
          >
            &larr; BACK TO BRAIN DUMP
          </button>
        }
        rightAction={
          allDone ? (
            <button
              onClick={onNext}
              disabled={highCount === 0}
              className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              NEXT: DECOMPOSE &rarr;
            </button>
          ) : undefined
        }
      />
    </div>
  );
}
