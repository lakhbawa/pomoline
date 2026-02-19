"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority, StepData } from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

export default function Decompose({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { tasks, fetchTasks, addStep, updateStep, deleteStep, updateTask } =
    useTaskStore();
  const [taskIndex, setTaskIndex] = useState(0);
  const [deletedSteps, setDeletedSteps] = useState<
    { step: StepData; taskId: string }[]
  >([]);
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  const highTasks = tasks.filter(
    (t) =>
      t.priority === Priority.HIGH &&
      (t.stage === Stage.PRIORITIZED || t.stage === Stage.DECOMPOSED)
  );
  const currentTask = highTasks[taskIndex];

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleAddStep = async () => {
    if (!currentTask) return;
    await addStep(currentTask.id, "");
  };

  const handleStepTextChange = (stepId: string, value: string) => {
    const store = useTaskStore.getState();
    useTaskStore.setState({
      tasks: store.tasks.map((t) => ({
        ...t,
        steps: t.steps.map((s) =>
          s.id === stepId ? { ...s, text: value } : s
        ),
      })),
    });
    if (debounceTimers.current[stepId])
      clearTimeout(debounceTimers.current[stepId]);
    debounceTimers.current[stepId] = setTimeout(() => {
      updateStep(stepId, { text: value });
    }, 500);
  };

  const handleDoneConditionChange = (stepId: string, value: string) => {
    const store = useTaskStore.getState();
    useTaskStore.setState({
      tasks: store.tasks.map((t) => ({
        ...t,
        steps: t.steps.map((s) =>
          s.id === stepId ? { ...s, doneCondition: value } : s
        ),
      })),
    });
    const key = `dc-${stepId}`;
    if (debounceTimers.current[key])
      clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      updateStep(stepId, { doneCondition: value || null });
    }, 500);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!currentTask) return;
    const step = currentTask.steps.find((s) => s.id === stepId);
    if (step) {
      setDeletedSteps((prev) => [...prev, { step, taskId: currentTask.id }]);
    }
    await deleteStep(stepId, currentTask.id);
  };

  const handleUndoDelete = async () => {
    const last = deletedSteps[deletedSteps.length - 1];
    if (!last) return;
    await addStep(last.taskId, last.step.text);
    setDeletedSteps((prev) => prev.slice(0, -1));
  };

  const markDecomposed = async () => {
    if (!currentTask) return;
    await updateTask(currentTask.id, {
      stage: Stage.DECOMPOSED,
    } as Partial<TaskWithRelations>);
    if (taskIndex < highTasks.length - 1) {
      setTaskIndex(taskIndex + 1);
    }
  };

  const allDecomposed =
    highTasks.length > 0 &&
    highTasks.every(
      (t) => t.stage === Stage.DECOMPOSED && t.steps.length > 0
    );

  const canAdvance = currentTask && currentTask.steps.length > 0;
  const totalSteps = highTasks.reduce((sum, t) => sum + t.steps.length, 0);

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={3}
        title="DECOMPOSE"
        description="Break each high-priority task into concrete, actionable steps. Define what 'done' looks like for each one."
        progress={50}
      />

      {currentTask ? (
        <>
          {/* Task selector */}
          {highTasks.length > 1 && (
            <div className="flex items-center gap-2 mb-4">
              {highTasks.map((t, i) => (
                <button
                  key={t.id}
                  onClick={() => setTaskIndex(i)}
                  className={`px-3 py-1.5 font-mono text-xs rounded-lg border transition-all ${
                    i === taskIndex
                      ? "border-primary/40 text-primary bg-primary-dim"
                      : t.stage === Stage.DECOMPOSED && t.steps.length > 0
                      ? "border-success/30 text-success/60"
                      : "border-border text-text-muted hover:border-primary/20"
                  }`}
                >
                  TASK {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Active Task Header */}
          <div className="bg-surface border-l-4 border-l-primary border border-border rounded-lg p-5 mb-6">
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-2">
              ACTION NAME
            </p>
            <p className="font-mono text-base text-text-primary">
              {currentTask.text}
            </p>
          </div>

          {/* Steps */}
          <div className="mb-4">
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
              STEPS ({currentTask.steps.length})
            </p>
            <div className="space-y-2">
              {currentTask.steps.map((step, i) => (
                <div
                  key={step.id}
                  className="group bg-surface border border-border rounded-lg p-4 transition-all hover:border-primary/20"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-text-muted/30 font-mono text-xs mt-1.5 select-none w-5 text-right shrink-0">
                      {i + 1}.
                    </span>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-text-muted/40 text-[10px] font-mono uppercase tracking-widest mb-1">
                          STEP DESCRIPTION
                        </p>
                        <input
                          type="text"
                          value={step.text}
                          onChange={(e) =>
                            handleStepTextChange(step.id, e.target.value)
                          }
                          placeholder="What needs to happen..."
                          className="w-full bg-transparent font-mono text-sm text-text-primary placeholder:text-text-muted/20 outline-none"
                        />
                      </div>
                      <div>
                        <p className="text-text-muted/40 text-[10px] font-mono uppercase tracking-widest mb-1">
                          DONE CONDITION
                        </p>
                        <input
                          type="text"
                          value={step.doneCondition || ""}
                          onChange={(e) =>
                            handleDoneConditionChange(step.id, e.target.value)
                          }
                          placeholder="what does done look like?"
                          className="w-full bg-transparent text-sm text-text-muted italic font-mono placeholder:text-text-muted/20 outline-none"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteStep(step.id)}
                      className="opacity-0 group-hover:opacity-100 text-text-muted/40 hover:text-danger transition-all text-xs font-mono mt-1"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Add Step */}
          <button
            onClick={handleAddStep}
            className="w-full py-3.5 border-2 border-dashed border-border rounded-lg text-text-muted font-mono text-xs uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all"
          >
            + ADD STEP
          </button>

          {/* Undo */}
          {deletedSteps.length > 0 && (
            <button
              onClick={handleUndoDelete}
              className="mt-3 text-xs font-mono text-text-muted/50 hover:text-primary transition-colors uppercase tracking-wider"
            >
              UNDO DELETE
            </button>
          )}
        </>
      ) : (
        <div className="text-center border-2 border-dashed border-border rounded-xl py-16 px-8">
          <p className="text-text-muted text-sm font-mono">
            NO HIGH PRIORITY TASKS TO DECOMPOSE
          </p>
          <p className="text-text-muted/40 text-xs font-mono mt-2">
            Go back to Prioritize first
          </p>
        </div>
      )}

      <FooterBar
        stats={[
          {
            label: "TASKS",
            value: `${taskIndex + 1}/${highTasks.length}`,
          },
          { label: "TOTAL STEPS", value: totalSteps },
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
          <>
            {currentTask &&
              currentTask.stage !== Stage.DECOMPOSED &&
              canAdvance && (
                <button
                  onClick={markDecomposed}
                  className="px-4 py-2 bg-surface border border-border rounded-lg text-text-primary font-mono text-xs uppercase tracking-wider hover:border-primary/30 transition-colors"
                >
                  {taskIndex < highTasks.length - 1 ? "SAVE & NEXT" : "SAVE"}
                </button>
              )}
            {currentTask &&
              taskIndex < highTasks.length - 1 &&
              currentTask.stage === Stage.DECOMPOSED && (
                <button
                  onClick={() => setTaskIndex(taskIndex + 1)}
                  className="px-4 py-2 bg-surface border border-border rounded-lg text-text-primary font-mono text-xs uppercase tracking-wider hover:border-primary/30 transition-colors"
                >
                  NEXT TASK &rarr;
                </button>
              )}
            {allDecomposed && (
              <button
                onClick={onNext}
                className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors"
              >
                NEXT: ESTIMATE &rarr;
              </button>
            )}
          </>
        }
      />
    </div>
  );
}
