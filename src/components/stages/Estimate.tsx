"use client";

import { useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority } from "@/lib/types";

export default function Estimate({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { tasks, fetchTasks, updateStep, updateTask } = useTaskStore();
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const eligibleTasks = tasks.filter(
    (t) =>
      t.priority === Priority.HIGH &&
      (t.stage === Stage.DECOMPOSED || t.stage === Stage.ESTIMATED)
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleEstimateChange = (stepId: string, value: string) => {
    const mins = value === "" ? null : parseInt(value, 10);
    if (value !== "" && isNaN(mins as number)) return;

    const store = useTaskStore.getState();
    useTaskStore.setState({
      tasks: store.tasks.map((t) => ({
        ...t,
        steps: t.steps.map((s) =>
          s.id === stepId ? { ...s, estimateMins: mins } : s
        ),
      })),
    });

    const key = `est-${stepId}`;
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      updateStep(stepId, { estimateMins: mins });
    }, 500);
  };

  const markEstimated = async (task: TaskWithRelations) => {
    await updateTask(task.id, {
      stage: Stage.ESTIMATED,
    } as Partial<TaskWithRelations>);
  };

  const allEstimated =
    eligibleTasks.length > 0 &&
    eligibleTasks.every(
      (t) =>
        t.steps.length > 0 &&
        t.steps.every((s) => s.estimateMins !== null && s.estimateMins > 0)
    );

  const totalMins = eligibleTasks
    .flatMap((t) => t.steps)
    .reduce((sum, s) => sum + (s.estimateMins || 0), 0);
  const pomoCount = Math.ceil(totalMins / 25);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; Decompose
        </button>
      </div>

      {eligibleTasks.length > 0 ? (
        <>
          <div className="space-y-6">
            {eligibleTasks.map((task) => (
              <div key={task.id}>
                <div className="bg-surface border-l-4 border-l-primary border border-border rounded-lg p-4 mb-3">
                  <p className="font-mono text-text-primary">{task.text}</p>
                </div>

                <div className="space-y-2 ml-4">
                  {task.steps.map((step) => (
                    <div
                      key={step.id}
                      className={`flex items-center gap-3 bg-surface border rounded-lg px-4 py-3 transition-all ${
                        step.estimateMins && step.estimateMins > 25
                          ? "border-l-4 border-l-primary border-primary/30"
                          : "border-border"
                      }`}
                    >
                      <span className="flex-1 font-mono text-sm text-text-primary">
                        {step.text}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <input
                          type="number"
                          min="1"
                          max="120"
                          value={step.estimateMins ?? ""}
                          onChange={(e) =>
                            handleEstimateChange(step.id, e.target.value)
                          }
                          placeholder="min"
                          className="w-16 bg-background border border-border rounded px-2 py-1 font-mono text-sm text-text-primary text-right placeholder:text-text-muted/30 focus:border-primary/50 transition-colors"
                        />
                        <span className="text-text-muted text-xs">min</span>
                      </div>
                      {step.estimateMins && step.estimateMins > 25 && (
                        <span className="text-primary text-xs whitespace-nowrap">
                          consider splitting
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 py-4 border-t border-border flex items-center justify-between">
            <span className="text-text-muted text-sm">
              Total:{" "}
              <span className="font-mono font-bold text-text-primary">
                {totalMins} mins
              </span>{" "}
              <span className="text-text-muted/60">
                (~{pomoCount} pomodoro{pomoCount !== 1 ? "s" : ""})
              </span>
            </span>
            <button
              onClick={() => {
                eligibleTasks.forEach((t) => {
                  if (
                    t.steps.every(
                      (s) => s.estimateMins !== null && s.estimateMins > 0
                    )
                  ) {
                    markEstimated(t);
                  }
                });
                if (allEstimated) onNext();
              }}
              disabled={!allEstimated}
              className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              Next: Pomo-size &rarr;
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-muted">No tasks to estimate.</p>
          <button
            onClick={onBack}
            className="mt-4 text-primary text-sm hover:underline"
          >
            Go back to Decompose
          </button>
        </div>
      )}
    </div>
  );
}
