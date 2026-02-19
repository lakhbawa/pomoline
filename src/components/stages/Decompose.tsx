"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority, StepData } from "@/lib/types";

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
        steps: t.steps.map((s) => (s.id === stepId ? { ...s, text: value } : s)),
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
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key]);
    debounceTimers.current[key] = setTimeout(() => {
      updateStep(stepId, { doneCondition: value || null });
    }, 500);
  };

  const handleDeleteStep = async (stepId: string) => {
    if (!currentTask) return;
    const step = currentTask.steps.find((s) => s.id === stepId);
    if (step) {
      setDeletedSteps((prev) => [
        ...prev,
        { step, taskId: currentTask.id },
      ]);
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

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; Prioritize
        </button>
        {highTasks.length > 0 && (
          <span className="text-text-muted text-sm font-mono">
            Task {taskIndex + 1} of {highTasks.length}
          </span>
        )}
      </div>

      {currentTask ? (
        <>
          {/* Task Header */}
          <div className="bg-surface border-l-4 border-l-primary border border-border rounded-lg p-5 mb-6">
            <p className="font-mono text-lg text-text-primary">
              {currentTask.text}
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3 mb-6">
            {currentTask.steps.map((step, i) => (
              <div
                key={step.id}
                className="group bg-surface border border-border rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <span className="text-text-muted/40 font-mono text-sm mt-1 select-none">
                    {i + 1}.
                  </span>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={step.text}
                      onChange={(e) =>
                        handleStepTextChange(step.id, e.target.value)
                      }
                      placeholder="Step description..."
                      className="w-full bg-transparent font-mono text-text-primary placeholder:text-text-muted/30 outline-none"
                    />
                    <input
                      type="text"
                      value={step.doneCondition || ""}
                      onChange={(e) =>
                        handleDoneConditionChange(step.id, e.target.value)
                      }
                      placeholder="what does done look like?"
                      className="w-full bg-transparent text-sm text-text-muted italic placeholder:text-text-muted/20 outline-none pl-2"
                    />
                  </div>
                  <button
                    onClick={() => handleDeleteStep(step.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-sm px-1 mt-1"
                  >
                    &times;
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Step */}
          <button
            onClick={handleAddStep}
            className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary/30 hover:text-primary transition-all text-sm"
          >
            + Add Step
          </button>

          {/* Undo */}
          {deletedSteps.length > 0 && (
            <button
              onClick={handleUndoDelete}
              className="mt-3 text-xs text-text-muted hover:text-primary transition-colors"
            >
              Undo delete
            </button>
          )}

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {taskIndex > 0 && (
                <button
                  onClick={() => setTaskIndex(taskIndex - 1)}
                  className="px-3 py-2 text-text-muted hover:text-text-primary text-sm transition-colors"
                >
                  &larr; Previous
                </button>
              )}
            </div>
            <div className="flex gap-2">
              {currentTask.stage !== Stage.DECOMPOSED && (
                <button
                  onClick={markDecomposed}
                  disabled={!canAdvance}
                  className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary disabled:opacity-30 disabled:cursor-not-allowed hover:border-primary/30 transition-colors"
                >
                  {taskIndex < highTasks.length - 1
                    ? "Save & Next"
                    : "Save"}
                </button>
              )}
              {taskIndex < highTasks.length - 1 &&
                currentTask.stage === Stage.DECOMPOSED && (
                  <button
                    onClick={() => setTaskIndex(taskIndex + 1)}
                    className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary hover:border-primary/30 transition-colors"
                  >
                    Next &rarr;
                  </button>
                )}
            </div>
          </div>

          {allDecomposed && (
            <div className="mt-6 text-center">
              <button
                onClick={onNext}
                className="px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Next: Estimate &rarr;
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-text-muted">No high priority tasks to decompose.</p>
          <button
            onClick={onBack}
            className="mt-4 text-primary text-sm hover:underline"
          >
            Go back to Prioritize
          </button>
        </div>
      )}
    </div>
  );
}
