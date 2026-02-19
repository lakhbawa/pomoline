"use client";

import { useEffect, useCallback } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority } from "@/lib/types";

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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; Brain Dump
        </button>
        {!allDone && totalToPrioritize > 0 && (
          <span className="text-text-muted text-sm font-mono">
            {unprioritized.length} of {totalToPrioritize} remaining
          </span>
        )}
      </div>

      {currentTask && !allDone ? (
        <>
          {/* Active Card */}
          <div className="bg-surface border-2 border-border rounded-xl p-8 mb-8 transition-all">
            <p className="font-mono text-xl text-text-primary text-center">
              {currentTask.text}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4 justify-center mb-8">
            <button
              onClick={() => assignPriority(Priority.HIGH)}
              className="flex-1 max-w-[140px] py-4 bg-primary/10 border-2 border-primary/30 rounded-xl text-primary font-bold text-2xl hover:bg-primary/20 hover:border-primary/50 transition-all"
            >
              H
            </button>
            <button
              onClick={() => assignPriority(Priority.LOW)}
              className="flex-1 max-w-[140px] py-4 bg-surface border-2 border-border rounded-xl text-text-muted font-bold text-2xl hover:bg-surface/80 hover:border-text-muted/30 transition-all"
            >
              L
            </button>
          </div>

          <p className="text-center text-text-muted/50 text-xs">
            Press <kbd className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">H</kbd> or{" "}
            <kbd className="font-mono bg-surface px-1.5 py-0.5 rounded border border-border">L</kbd> on keyboard
          </p>

          {/* Queue below */}
          {allRelevant.filter((t) => t.priority !== Priority.UNSET).length >
            0 && (
            <div className="mt-8 space-y-1.5">
              <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">
                Decided
              </h3>
              {allRelevant
                .filter((t) => t.priority !== Priority.UNSET)
                .map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-mono ${
                      t.priority === Priority.LOW
                        ? "text-text-muted/40 line-through"
                        : "text-text-primary/60"
                    }`}
                  >
                    <span
                      className={`text-xs font-bold w-5 ${
                        t.priority === Priority.HIGH
                          ? "text-primary"
                          : "text-text-muted/40"
                      }`}
                    >
                      {t.priority === Priority.HIGH ? "H" : "L"}
                    </span>
                    <span>{t.text}</span>
                    <button
                      onClick={() =>
                        updateTask(t.id, {
                          priority: Priority.UNSET,
                          stage: Stage.RAW,
                        } as Partial<TaskWithRelations>)
                      }
                      className="ml-auto text-text-muted/30 hover:text-text-muted text-xs transition-colors"
                    >
                      undo
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      ) : allDone ? (
        <div className="text-center space-y-6 py-12">
          <div className="space-y-2">
            <p className="font-mono text-2xl text-text-primary">All done</p>
            <div className="flex justify-center gap-6 mt-4">
              <div className="text-center">
                <span className="font-mono font-bold text-3xl text-primary">
                  {highCount}
                </span>
                <p className="text-text-muted text-xs mt-1">High</p>
              </div>
              <div className="text-center">
                <span className="font-mono font-bold text-3xl text-text-muted">
                  {lowCount}
                </span>
                <p className="text-text-muted text-xs mt-1">Low</p>
              </div>
            </div>
          </div>
          <button
            onClick={onNext}
            disabled={highCount === 0}
            className="px-6 py-3 bg-primary text-background font-medium rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Decompose High Priority &rarr;
          </button>
          {highCount === 0 && (
            <p className="text-text-muted text-xs">
              No high priority tasks to decompose
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-muted">No tasks to prioritize.</p>
          <button
            onClick={onBack}
            className="mt-4 text-primary text-sm hover:underline"
          >
            Go back to Brain Dump
          </button>
        </div>
      )}
    </div>
  );
}
