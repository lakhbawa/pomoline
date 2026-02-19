"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/layout/Header";
import { useTaskStore } from "@/store/useTaskStore";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  Stage,
  Priority,
  TaskWithRelations,
} from "@/lib/types";

export default function RefinePage() {
  const { tasks, fetchTasks, updateTask } = useTaskStore();
  const [draggedTask, setDraggedTask] = useState<TaskWithRelations | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTasksForStage = (stage: Stage) =>
    tasks.filter((t) => t.stage === stage);

  const handleDropOnStage = async (stage: Stage) => {
    if (!draggedTask) return;
    await updateTask(draggedTask.id, { stage } as Partial<TaskWithRelations>);
    setDraggedTask(null);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-sans font-bold text-xl text-text-primary">
            Refine
          </h1>
          <Link
            href="/refine/new"
            className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm hover:bg-primary/90 transition-colors"
          >
            Start Refinement Flow
          </Link>
        </div>

        {/* Kanban */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage) => {
            const stageTasks = getTasksForStage(stage);
            return (
              <div
                key={stage}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDropOnStage(stage)}
                className="flex-shrink-0 w-64 bg-surface/30 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs text-text-muted uppercase tracking-wider font-bold">
                    {STAGE_LABELS[stage]}
                  </h3>
                  <span className="text-xs font-mono text-text-muted">
                    {stageTasks.length}
                  </span>
                </div>
                <div className="space-y-2 min-h-[120px]">
                  {stageTasks.length === 0 && (
                    <p className="text-text-muted/20 text-xs text-center py-6">
                      No tasks
                    </p>
                  )}
                  {stageTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      className="bg-surface border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                    >
                      <p className="font-mono text-sm text-text-primary truncate">
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {task.priority !== Priority.UNSET && (
                          <span
                            className={`text-xs font-bold ${
                              task.priority === Priority.HIGH
                                ? "text-primary"
                                : "text-text-muted/50"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.steps.length > 0 && (
                          <span className="text-xs text-text-muted">
                            {task.steps.length} step
                            {task.steps.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
