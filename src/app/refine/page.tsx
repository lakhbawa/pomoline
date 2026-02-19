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
  const [dropTarget, setDropTarget] = useState<Stage | null>(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const getTasksForStage = (stage: Stage) =>
    tasks.filter((t) => t.stage === stage);

  const handleDropOnStage = async (stage: Stage) => {
    if (!draggedTask) return;
    await updateTask(draggedTask.id, { stage } as Partial<TaskWithRelations>);
    setDraggedTask(null);
    setDropTarget(null);
  };

  const totalTasks = tasks.length;

  return (
    <div className="min-h-screen">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Title Bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-mono font-bold text-sm uppercase tracking-widest text-text-primary">
              PIPELINE OVERVIEW
            </h1>
            <p className="text-text-muted text-xs font-mono mt-1">
              {totalTasks} TASK{totalTasks !== 1 ? "S" : ""} IN PIPELINE
            </p>
          </div>
          <Link
            href="/refine/new"
            className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-primary/90 transition-colors"
          >
            START REFINEMENT
          </Link>
        </div>

        {/* Kanban */}
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGE_ORDER.map((stage, index) => {
            const stageTasks = getTasksForStage(stage);
            const isDropping = dropTarget === stage;
            return (
              <div
                key={stage}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDropTarget(stage);
                }}
                onDragLeave={() => setDropTarget(null)}
                onDrop={() => handleDropOnStage(stage)}
                className={`flex-shrink-0 w-60 rounded-lg border transition-colors ${
                  isDropping
                    ? "border-primary/50 bg-primary-dim/30"
                    : "border-border bg-surface/30"
                }`}
              >
                {/* Column Header */}
                <div className="p-3 border-b border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-dim text-primary text-xs font-mono font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h3 className="font-mono text-xs uppercase tracking-widest font-bold text-text-primary">
                        {STAGE_LABELS[stage]}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-text-muted bg-surface px-2 py-0.5 rounded">
                      {stageTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Body */}
                <div className="p-2 space-y-2 min-h-[140px]">
                  {stageTasks.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-lg py-8 px-3 flex items-center justify-center">
                      <p className="text-text-muted/30 text-xs font-mono uppercase tracking-wider">
                        EMPTY
                      </p>
                    </div>
                  )}
                  {stageTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => {
                        setDraggedTask(null);
                        setDropTarget(null);
                      }}
                      className="bg-surface border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors"
                    >
                      <p className="font-mono text-xs text-text-primary leading-relaxed">
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {task.priority !== Priority.UNSET && (
                          <span
                            className={`font-mono text-xs font-bold uppercase ${
                              task.priority === Priority.HIGH
                                ? "text-primary"
                                : "text-text-muted/50"
                            }`}
                          >
                            {task.priority}
                          </span>
                        )}
                        {task.steps.length > 0 && (
                          <span className="text-xs font-mono text-text-muted">
                            {task.steps.length} STEP{task.steps.length !== 1 ? "S" : ""}
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
