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
          typeof b.steps === "string" ? JSON.parse(b.steps as string) : b.steps,
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
    // Mark tasks as READY
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
    const windows: Window[] = [Window.MORNING, Window.AFTERNOON, Window.EVENING];
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
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Today's Focus */}
      <div className="mb-8 sticky top-14 z-10 bg-background py-4">
        <input
          type="text"
          value={todayFocus}
          onChange={(e) => setTodayFocus(e.target.value)}
          placeholder="What needs to be true by end of today?"
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-sans text-text-primary placeholder:text-text-muted/40 focus:border-primary/50 transition-colors"
        />
      </div>

      {exported ? (
        /* Export View */
        <div className="space-y-6">
          <div className="bg-surface border border-border rounded-lg p-6">
            <h2 className="font-sans font-bold text-lg text-text-primary mb-4">
              Today&apos;s Plan
            </h2>
            <pre className="font-mono text-sm text-text-primary/80 whitespace-pre-wrap">
              {generateSummary()}
            </pre>
          </div>
          <div className="flex gap-3">
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm hover:bg-primary/90 transition-colors"
            >
              Copy to Clipboard
            </button>
            <button
              onClick={() => setExported(false)}
              className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-primary hover:border-primary/30 transition-colors"
            >
              Back to Editing
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-6 flex-col lg:flex-row">
          {/* Ready to Assign Pool */}
          <div
            className="lg:w-64 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDropOnUnassigned}
          >
            <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold mb-3">
              Ready to Assign
            </h3>
            <div className="space-y-2 min-h-[100px] bg-surface/30 rounded-lg p-2">
              {unassigned.length === 0 && blocks.length > 0 && (
                <p className="text-text-muted/30 text-xs text-center py-4">
                  All blocks assigned
                </p>
              )}
              {unassigned.length === 0 && blocks.length === 0 && (
                <p className="text-text-muted/30 text-xs text-center py-4">
                  No pomo blocks available. Refine some tasks first.
                </p>
              )}
              {unassigned.map((block) => (
                <div
                  key={block.id}
                  draggable
                  onDragStart={() => handleDragStart(block)}
                  className="bg-surface border border-border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
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
            {([Window.MORNING, Window.AFTERNOON, Window.EVENING] as Window[]).map(
              (window) => {
                const windowBlocks = getWindowBlocks(window);
                const totalMins = windowBlocks.reduce(
                  (sum, b) => sum + b.totalMins,
                  0
                );
                const capacity = 75; // 3 pomos
                return (
                  <div
                    key={window}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleDropOnWindow(window)}
                    className="bg-surface/30 rounded-lg p-3 min-h-[200px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold">
                        {WINDOW_LABELS[window]}
                      </h3>
                      <span
                        className={`text-xs font-mono ${
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
                    <div className="space-y-2">
                      {windowBlocks.length === 0 && (
                        <p className="text-text-muted/20 text-xs text-center py-6">
                          Drop blocks here
                        </p>
                      )}
                      {windowBlocks.map((block) => (
                        <div
                          key={block.id}
                          draggable
                          onDragStart={() => handleDragStart(block)}
                          className="bg-surface border border-border rounded-lg px-3 py-2 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
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
                      <p className="text-danger text-xs mt-2">
                        Over capacity
                      </p>
                    )}
                  </div>
                );
              }
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      {!exported && (
        <div className="mt-8 py-4 border-t border-border flex items-center justify-between">
          <span className="text-text-muted text-sm">
            <span className="font-mono font-bold text-text-primary">
              {assignedCount}
            </span>{" "}
            of{" "}
            <span className="font-mono font-bold text-text-primary">
              {blocks.length}
            </span>{" "}
            blocks assigned
          </span>
          <button
            onClick={finishAndExport}
            disabled={assignedCount === 0}
            className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            Finish & Export
          </button>
        </div>
      )}
    </div>
  );
}
