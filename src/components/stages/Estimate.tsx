"use client";

import { useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority } from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

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
    if (debounceTimers.current[key])
      clearTimeout(debounceTimers.current[key]);
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
  const totalSteps = eligibleTasks.flatMap((t) => t.steps).length;
  const estimatedSteps = eligibleTasks
    .flatMap((t) => t.steps)
    .filter((s) => s.estimateMins !== null && s.estimateMins > 0).length;

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={4}
        title="ESTIMATE"
        description="Add time estimates to each step. Steps over 25 minutes should be split — they won't fit in a single pomodoro."
        progress={66}
      />

      {eligibleTasks.length > 0 ? (
        <div className="space-y-6">
          {eligibleTasks.map((task) => (
            <div key={task.id}>
              {/* Task Header */}
              <div className="bg-surface border-l-4 border-l-primary border border-border rounded-lg p-4 mb-3">
                <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-1">
                  ACTION
                </p>
                <p className="font-mono text-sm text-text-primary">
                  {task.text}
                </p>
              </div>

              {/* Steps */}
              <div className="space-y-1.5 ml-3">
                {task.steps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center gap-3 bg-surface border rounded-lg px-4 py-3 transition-all ${
                      step.estimateMins && step.estimateMins > 25
                        ? "border-l-4 border-l-primary border-primary/30"
                        : "border-border"
                    }`}
                  >
                    <span className="flex-1 font-mono text-xs text-text-primary">
                      {step.text || "Untitled step"}
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
                        placeholder="--"
                        className="w-14 bg-background border border-border rounded px-2 py-1.5 font-mono text-xs text-text-primary text-right placeholder:text-text-muted/30 focus:border-primary/50 transition-colors"
                      />
                      <span className="text-text-muted text-xs font-mono">
                        MIN
                      </span>
                    </div>
                    {step.estimateMins && step.estimateMins > 25 && (
                      <span className="text-primary text-[10px] font-mono uppercase tracking-wider whitespace-nowrap">
                        SPLIT
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Summary bar */}
          <div className="bg-surface border border-border rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest">
                  TOTAL TIME
                </p>
                <p className="font-mono font-bold text-text-primary">
                  {totalMins} min
                </p>
              </div>
              <div>
                <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest">
                  POMODOROS
                </p>
                <p className="font-mono font-bold text-primary">
                  ~{pomoCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center border-2 border-dashed border-border rounded-xl py-16 px-8">
          <p className="text-text-muted text-sm font-mono">
            NO TASKS TO ESTIMATE
          </p>
          <p className="text-text-muted/40 text-xs font-mono mt-2">
            Go back to Decompose first
          </p>
        </div>
      )}

      <FooterBar
        stats={[
          {
            label: "ESTIMATED",
            value: `${estimatedSteps}/${totalSteps}`,
          },
          { label: "TOTAL", value: `${totalMins} min` },
        ]}
        leftAction={
          <button
            onClick={onBack}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-text-muted font-mono text-xs uppercase tracking-wider hover:border-primary/30 hover:text-text-primary transition-colors"
          >
            &larr; BACK
          </button>
        }
        rightAction={
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
            className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            NEXT: POMO-SIZE &rarr;
          </button>
        }
      />
    </div>
  );
}
