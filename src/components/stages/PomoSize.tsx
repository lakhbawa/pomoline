"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage, Priority, StepData } from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

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
  const [dragSourceBlockId, setDragSourceBlockId] = useState<string | null>(
    null
  );
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
        autoBlocks.push({
          id: `local-${localBlockId++}`,
          steps: [step],
          totalMins: step.estimateMins || 0,
        });
        used.add(step.id);
      }
    }

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
  const efficiency =
    allSteps.length > 0
      ? Math.round(
          (allSteps.reduce((sum, s) => sum + (s.estimateMins || 0), 0) /
            (blocks.length * 25 || 1)) *
            100
        )
      : 0;

  const canFinish = blocks.length > 0 && unassignedSteps.length === 0;

  const handleFinish = async () => {
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

  const getBlockStatus = (block: PomoBlockLocal) => {
    if (block.totalMins > 25)
      return { border: "border-danger", bar: "bg-danger", label: "OVER" };
    if (block.totalMins >= 20)
      return { border: "border-success", bar: "bg-success", label: "OPTIMAL" };
    return {
      border: "border-primary/40",
      bar: "bg-primary/60",
      label: "ROOM",
    };
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={5}
        title="POMO-SIZE"
        description="Group steps into 25-minute pomodoro blocks. Drag steps between blocks to optimize. Green = optimal, amber = room to add, red = over capacity."
        progress={83}
      />

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Pending Blocks (sidebar) */}
        <div
          className="lg:w-72 shrink-0"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropOnUnassigned}
        >
          <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
            PENDING_BLOCKS ({unassignedSteps.length})
          </p>
          <div className="space-y-1.5 min-h-[120px] border-2 border-dashed border-border rounded-lg p-3">
            {unassignedSteps.length === 0 && (
              <p className="text-text-muted/20 text-xs font-mono text-center py-6">
                ALL STEPS ASSIGNED
              </p>
            )}
            {unassignedSteps.map((step) => (
              <div
                key={step.id}
                draggable
                onDragStart={() => handleDragStart(step, null)}
                className="flex items-center justify-between bg-surface border border-border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
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
          <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
            POMODORO BLOCKS ({blocks.length})
          </p>
          <div className="space-y-4">
            {blocks.map((block, i) => {
              const status = getBlockStatus(block);
              return (
                <div
                  key={block.id}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnBlock(block.id)}
                  className={`bg-surface border-2 rounded-lg p-4 transition-all ${status.border}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-text-muted text-xs font-mono uppercase tracking-wider">
                        BLOCK {i + 1}
                      </span>
                      <span className="font-mono text-sm font-bold text-text-primary">
                        {block.totalMins}/25 min
                      </span>
                      {/* Fill bar */}
                      <div className="w-20 h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${status.bar}`}
                          style={{
                            width: `${Math.min(
                              (block.totalMins / 25) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                      <span
                        className={`text-[10px] font-mono uppercase tracking-wider ${
                          block.totalMins > 25
                            ? "text-danger"
                            : block.totalMins >= 20
                            ? "text-success"
                            : "text-primary/60"
                        }`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteBlock(block.id)}
                      className="text-text-muted/40 hover:text-danger text-xs font-mono transition-colors"
                    >
                      REMOVE
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {block.steps.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-lg py-4 text-center">
                        <p className="text-text-muted/20 text-xs font-mono">
                          DROP STEPS HERE
                        </p>
                      </div>
                    )}
                    {block.steps.map((step) => (
                      <div
                        key={step.id}
                        draggable
                        onDragStart={() => handleDragStart(step, block.id)}
                        className="flex items-center justify-between bg-background/50 border border-border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-primary/20 transition-colors"
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
                            className="text-text-muted/30 hover:text-danger text-xs font-mono"
                          >
                            &times;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  {block.totalMins > 25 && (
                    <p className="text-danger text-[10px] font-mono uppercase tracking-wider mt-2">
                      OVER CAPACITY — REMOVE OR MOVE STEPS
                    </p>
                  )}
                </div>
              );
            })}

            {/* Add Block */}
            <button
              onClick={addNewBlock}
              className="w-full py-3.5 border-2 border-dashed border-border rounded-lg text-text-muted font-mono text-xs uppercase tracking-widest hover:border-primary/30 hover:text-primary transition-all"
            >
              + INITIALIZE NEW BLOCK
            </button>
          </div>
        </div>
      </div>

      <FooterBar
        stats={[
          { label: "BLOCKS", value: blocks.length },
          { label: "TOTAL", value: `${totalBlockMins}m` },
          { label: "EFFICIENCY", value: `${efficiency}%` },
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
            onClick={handleFinish}
            disabled={!canFinish}
            className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            FINISH &rarr;
          </button>
        }
      />
    </div>
  );
}
