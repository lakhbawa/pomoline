"use client";

import { useState, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import {
  Stage,
  Window,
  WINDOW_LABELS,
  PomoBlockData,
  TaskWithRelations,
} from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

interface BlockWithTask extends PomoBlockData {
  task?: TaskWithRelations;
  taskText?: string;
}

export default function AssignWindows() {
  const { tasks, fetchTasks, updateBlock, updateTask } = useTaskStore();
  const [todayFocus, setTodayFocus] = useState("");
  const [blocks, setBlocks] = useState<BlockWithTask[]>([]);
  const [draggedBlock, setDraggedBlock] = useState<BlockWithTask | null>(null);
  const [exported, setExported] = useState(false);

  const pomoSizedTasks = tasks.filter(
    (t) => t.stage === Stage.POMO_SIZED || t.stage === Stage.READY
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    const allBlocks: BlockWithTask[] = pomoSizedTasks.flatMap((t) =>
      t.pomoBlocks.map((b) => ({
        ...b,
        taskText: t.text,
        steps:
          typeof b.steps === "string"
            ? JSON.parse(b.steps as string)
            : b.steps,
      }))
    );
    setBlocks(allBlocks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const unassigned = blocks.filter((b) => !b.window);
  const getWindowBlocks = (window: Window) =>
    blocks.filter((b) => b.window === window);

  const assignToWindow = async (blockId: string, window: Window | null) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, window } : b))
    );
    await updateBlock(blockId, {
      window,
      date: new Date().toISOString().split("T")[0],
    } as Partial<PomoBlockData>);
  };

  const handleDragStart = (block: BlockWithTask) => {
    setDraggedBlock(block);
  };

  const handleDropOnWindow = (window: Window) => {
    if (!draggedBlock) return;
    assignToWindow(draggedBlock.id, window);
    setDraggedBlock(null);
  };

  const handleDropOnUnassigned = () => {
    if (!draggedBlock) return;
    assignToWindow(draggedBlock.id, null);
    setDraggedBlock(null);
  };

  const finishAndExport = async () => {
    for (const task of pomoSizedTasks) {
      const taskBlocks = blocks.filter((b) => b.taskId === task.id);
      if (taskBlocks.every((b) => b.window)) {
        await updateTask(task.id, {
          stage: Stage.READY,
        } as Partial<TaskWithRelations>);
      }
    }
    setExported(true);
  };

  const generateSummary = () => {
    let summary = "";
    if (todayFocus) {
      summary += `Focus: ${todayFocus}\n\n`;
    }
    const windows: Window[] = [
      Window.MORNING,
      Window.AFTERNOON,
      Window.EVENING,
    ];
    for (const w of windows) {
      const windowBlocks = getWindowBlocks(w);
      if (windowBlocks.length > 0) {
        summary += `${WINDOW_LABELS[w]}:\n`;
        windowBlocks.forEach((b) => {
          summary += `  - ${b.taskText} (${b.totalMins} min)\n`;
          if (Array.isArray(b.steps)) {
            b.steps.forEach((s: { text: string }) => {
              summary += `    - ${s.text}\n`;
            });
          }
        });
        summary += "\n";
      }
    }
    return summary;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateSummary());
  };

  const assignedCount = blocks.filter((b) => b.window).length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={6}
        title="ASSIGN TO WINDOWS"
        description="Drag pomo blocks into your day windows. Each window supports up to 3 deep-focus pomodoros (75 min). Set your daily focus above."
        progress={100}
      />

      {/* Today's Focus */}
      <div className="mb-8">
        <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-2">
          TODAY&apos;S FOCUS
        </p>
        <input
          type="text"
          value={todayFocus}
          onChange={(e) => setTodayFocus(e.target.value)}
          placeholder="What needs to be true by end of today?"
          className="w-full bg-surface border border-border rounded-lg px-4 py-3.5 font-mono text-sm text-text-primary placeholder:text-text-muted/30 focus:border-primary/50 transition-colors"
        />
      </div>

      {exported ? (
        /* Export View */
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-4">
              DAILY PLAN SUMMARY
            </p>
            <pre className="font-mono text-sm text-text-primary/80 whitespace-pre-wrap">
              {generateSummary()}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors"
            >
              COPY TO CLIPBOARD
            </button>
            <button
              onClick={() => setExported(false)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-text-primary font-mono text-xs uppercase tracking-wider hover:border-primary/30 transition-colors"
            >
              BACK TO EDITING
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Ready to Assign Pool */}
          <div
            className="lg:w-72 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnUnassigned}
          >
            <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
              READY TO ASSIGN ({unassigned.length})
            </p>
            <div className="space-y-2 min-h-[120px] border-2 border-dashed border-border rounded-lg p-3">
              {unassigned.length === 0 && blocks.length > 0 && (
                <p className="text-text-muted/20 text-xs font-mono text-center py-6">
                  ALL BLOCKS ASSIGNED
                </p>
              )}
              {unassigned.length === 0 && blocks.length === 0 && (
                <p className="text-text-muted/20 text-xs font-mono text-center py-6">
                  NO POMO BLOCKS AVAILABLE
                </p>
              )}
              {unassigned.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block)}
                  className="bg-surface border border-border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                >
                  <p className="font-mono text-xs text-text-primary truncate">
                    {block.taskText}
                  </p>
                  <p className="font-mono text-xs text-text-muted mt-1">
                    {block.totalMins} min
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Window Columns */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            {(
              [Window.MORNING, Window.AFTERNOON, Window.EVENING] as Window[]
            ).map((window) => {
              const windowBlocks = getWindowBlocks(window);
              const totalMins = windowBlocks.reduce(
                (sum, b) => sum + b.totalMins,
                0
              );
              const capacity = 75;
              return (
                <div
                  key={window}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnWindow(window)}
                  className="border-2 border-dashed border-border rounded-lg p-3 min-h-[200px] transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-text-muted text-xs font-mono uppercase tracking-widest font-bold">
                      {WINDOW_LABELS[window]}
                    </p>
                    <span
                      className={`text-xs font-mono font-bold ${
                        totalMins > capacity
                          ? "text-danger"
                          : totalMins > 50
                          ? "text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      {totalMins}/{capacity}m
                    </span>
                  </div>
                  {/* Capacity bar */}
                  <div className="w-full h-1 bg-border rounded-full mb-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        totalMins > capacity
                          ? "bg-danger"
                          : totalMins > 50
                          ? "bg-primary"
                          : "bg-success"
                      }`}
                      style={{
                        width: `${Math.min(
                          (totalMins / capacity) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    {windowBlocks.length === 0 && (
                      <p className="text-text-muted/15 text-xs font-mono text-center py-8">
                        DROP BLOCKS HERE
                      </p>
                    )}
                    {windowBlocks.map((block) => (
                      <div
                        key={block.id}
                        draggable
                        onDragStart={() => handleDragStart(block)}
                        className="bg-surface border border-border rounded-lg px-3 py-2.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                      >
                        <p className="font-mono text-xs text-text-primary truncate">
                          {block.taskText}
                        </p>
                        <p className="font-mono text-xs text-text-muted mt-1">
                          {block.totalMins} min
                        </p>
                      </div>
                    ))}
                  </div>
                  {totalMins > capacity && (
                    <p className="text-danger text-[10px] font-mono uppercase tracking-wider mt-2">
                      OVER CAPACITY
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!exported && (
        <FooterBar
          stats={[
            {
              label: "ASSIGNED",
              value: `${assignedCount}/${blocks.length}`,
            },
          ]}
          rightAction={
            <button
              onClick={finishAndExport}
              disabled={assignedCount === 0}
              className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
            >
              FINISH & EXPORT
            </button>
          }
        />
      )}
    </div>
  );
}
