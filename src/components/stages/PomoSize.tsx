"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority, StepData } from "@/lib/types";

interface PomoBlockLocal {
  id: string;
  steps: StepData[];
  totalMins: number;
}

let localBlockId = 0;

export default function PomoSize({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const { tasks, fetchTasks, updateTask, createBlock } = useTaskStore();
  const [blocks, setBlocks] = useState<PomoBlockLocal[]>([]);
  const [unassignedSteps, setUnassignedSteps] = useState<StepData[]>([]);
  const [draggedStep, setDraggedStep] = useState<StepData | null>(null);
  const [dragSourceBlockId, setDragSourceBlockId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const eligibleTasks = tasks.filter(
    (t) =>
      t.priority === Priority.HIGH &&
      (t.stage === Stage.ESTIMATED || t.stage === Stage.POMO_SIZED)
  );

  const allSteps = eligibleTasks.flatMap((t) => t.steps);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Auto-suggest grouping on load
  useEffect(() => {
    if (initialized || allSteps.length === 0) return;

    const sorted = [...allSteps].sort(
      (a, b) => (b.estimateMins || 0) - (a.estimateMins || 0)
    );
    const autoBlocks: PomoBlockLocal[] = [];
    const used = new Set<string>();

    for (const step of sorted) {
      if (used.has(step.id)) continue;

      // Find a block that has room
      let placed = false;
      for (const block of autoBlocks) {
        if (block.totalMins + (step.estimateMins || 0) <= 25) {
          block.steps.push(step);
          block.totalMins += step.estimateMins || 0;
          used.add(step.id);
          placed = true;
          break;
        }
      }

      if (!placed) {
        const newBlock: PomoBlockLocal = {
          id: `local-${localBlockId++}`,
          steps: [step],
          totalMins: step.estimateMins || 0,
        };
        autoBlocks.push(newBlock);
        used.add(step.id);
      }
    }

    // Any unassigned steps
    const remaining = allSteps.filter((s) => !used.has(s.id));

    setBlocks(autoBlocks);
    setUnassignedSteps(remaining);
    setInitialized(true);
  }, [allSteps, initialized]);

  const addNewBlock = () => {
    setBlocks((prev) => [
      ...prev,
      { id: `local-${localBlockId++}`, steps: [], totalMins: 0 },
    ]);
  };

  const handleDragStart = (step: StepData, sourceBlockId: string | null) => {
    setDraggedStep(step);
    setDragSourceBlockId(sourceBlockId);
  };

  const handleDropOnBlock = (targetBlockId: string) => {
    if (!draggedStep) return;

    // Remove from source
    if (dragSourceBlockId) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === dragSourceBlockId
            ? {
                ...b,
                steps: b.steps.filter((s) => s.id !== draggedStep.id),
                totalMins: b.totalMins - (draggedStep.estimateMins || 0),
              }
            : b
        )
      );
    } else {
      setUnassignedSteps((prev) =>
        prev.filter((s) => s.id !== draggedStep.id)
      );
    }

    // Add to target
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === targetBlockId
          ? {
              ...b,
              steps: [...b.steps, draggedStep],
              totalMins: b.totalMins + (draggedStep.estimateMins || 0),
            }
          : b
      )
    );

    setDraggedStep(null);
    setDragSourceBlockId(null);
  };

  const handleDropOnUnassigned = () => {
    if (!draggedStep) return;

    if (dragSourceBlockId) {
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === dragSourceBlockId
            ? {
                ...b,
                steps: b.steps.filter((s) => s.id !== draggedStep.id),
                totalMins: b.totalMins - (draggedStep.estimateMins || 0),
              }
            : b
        )
      );
    }

    setUnassignedSteps((prev) => [...prev, draggedStep]);
    setDraggedStep(null);
    setDragSourceBlockId(null);
  };

  const removeStepFromBlock = (blockId: string, step: StepData) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? {
              ...b,
              steps: b.steps.filter((s) => s.id !== step.id),
              totalMins: b.totalMins - (step.estimateMins || 0),
            }
          : b
      )
    );
    setUnassignedSteps((prev) => [...prev, step]);
  };

  const deleteBlock = (blockId: string) => {
    const block = blocks.find((b) => b.id === blockId);
    if (block) {
      setUnassignedSteps((prev) => [...prev, ...block.steps]);
    }
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  };

  const totalBlockMins = blocks.reduce((sum, b) => sum + b.totalMins, 0);
  const efficiency = allSteps.length > 0
    ? Math.round(
        (allSteps.reduce((sum, s) => sum + (s.estimateMins || 0), 0) /
          (blocks.length * 25 || 1)) *
          100
      )
    : 0;

  const canFinish = blocks.length > 0 && unassignedSteps.length === 0;

  const handleFinish = async () => {
    // Save blocks to DB and update task stages
    for (const task of eligibleTasks) {
      const taskStepIds = new Set(task.steps.map((s) => s.id));
      const taskBlocks = blocks.filter((b) =>
        b.steps.some((s) => taskStepIds.has(s.id))
      );
      for (const block of taskBlocks) {
        const blockSteps = block.steps.filter((s) => taskStepIds.has(s.id));
        await createBlock({
          taskId: task.id,
          steps: blockSteps,
          totalMins: blockSteps.reduce(
            (sum, s) => sum + (s.estimateMins || 0),
            0
          ),
        });
      }
      await updateTask(task.id, {
        stage: Stage.POMO_SIZED,
      } as Partial<TaskWithRelations>);
    }
    onNext();
  };

  const getBlockBorderColor = (block: PomoBlockLocal) => {
    if (block.totalMins > 25) return "border-danger";
    if (block.totalMins >= 20) return "border-success";
    return "border-primary/40";
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-text-muted hover:text-text-primary text-sm transition-colors"
        >
          &larr; Estimate
        </button>
      </div>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Unassigned Steps */}
        <div
          className="lg:w-64 shrink-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnUnassigned}
        >
          <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">
            Unassigned Steps
          </h3>
          <div className="space-y-1.5 min-h-[100px] bg-surface/30 rounded-lg p-2">
            {unassignedSteps.length === 0 && (
              <p className="text-text-muted/30 text-xs text-center py-4">
                All steps assigned
              </p>
            )}
            {unassignedSteps.map((step) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(step, null)}
                className="flex items-center justify-between bg-surface border border-border rounded px-3 py-2 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
              >
                <span className="font-mono text-xs text-text-primary truncate">
                  {step.text}
                </span>
                <span className="font-mono text-xs text-text-muted ml-2 shrink-0">
                  {step.estimateMins}m
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Blocks Area */}
        <div className="flex-1">
          <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">
            Pomodoro Blocks (25 min)
          </h3>
          <div className="space-y-4">
            {blocks.map((block) => (
              <div
                key={block.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnBlock(block.id)}
                className={`bg-surface border-2 rounded-lg p-4 transition-all ${getBlockBorderColor(
                  block
                )}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-text-primary">
                      {block.totalMins} / 25 min
                    </span>
                    {/* Fill bar */}
                    <div className="w-24 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          block.totalMins > 25
                            ? "bg-danger"
                            : block.totalMins >= 20
                            ? "bg-success"
                            : "bg-primary/60"
                        }`}
                        style={{
                          width: `${Math.min(
                            (block.totalMins / 25) * 100,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => deleteBlock(block.id)}
                    className="text-text-muted hover:text-danger text-xs transition-colors"
                  >
                    remove
                  </button>
                </div>
                <div className="space-y-1.5">
                  {block.steps.length === 0 && (
                    <p className="text-text-muted/30 text-xs text-center py-3">
                      Drop steps here
                    </p>
                  )}
                  {block.steps.map((step) => (
                    <div
                      key={step.id}
                      draggable
                      onDragStart={() => handleDragStart(step, block.id)}
                      className="flex items-center justify-between bg-background/50 border border-border rounded px-3 py-2 cursor-grab active:cursor-grabbing"
                    >
                      <span className="font-mono text-xs text-text-primary truncate">
                        {step.text}
                      </span>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="font-mono text-xs text-text-muted">
                          {step.estimateMins}m
                        </span>
                        <button
                          onClick={() => removeStepFromBlock(block.id, step)}
                          className="text-text-muted/50 hover:text-danger text-xs"
                        >
                          &times;
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {block.totalMins > 25 && (
                  <p className="text-danger text-xs mt-2">
                    Over capacity — remove or move steps
                  </p>
                )}
              </div>
            ))}

            {/* Add Block */}
            <button
              onClick={addNewBlock}
              className="w-full py-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary/30 hover:text-primary transition-all text-sm"
            >
              + Initialize New Block
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 py-4 border-t border-border flex items-center justify-between">
        <div className="text-text-muted text-sm space-x-4">
          <span>
            <span className="font-mono font-bold text-text-primary">
              {blocks.length}
            </span>{" "}
            blocks
          </span>
          <span>
            <span className="font-mono font-bold text-text-primary">
              {totalBlockMins}
            </span>{" "}
            min total
          </span>
          {blocks.length > 0 && (
            <span>
              <span className="font-mono font-bold text-text-primary">
                {efficiency}%
              </span>{" "}
              efficiency
            </span>
          )}
        </div>
        <button
          onClick={handleFinish}
          disabled={!canFinish}
          className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Finish &rarr;
        </button>
      </div>
    </div>
  );
}
