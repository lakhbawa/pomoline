"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage } from "@/lib/types";
import StageHeader from "@/components/ui/StageHeader";
import FooterBar from "@/components/ui/FooterBar";

export default function BrainDump({
  onNext,
}: {
  onNext: () => void;
}) {
  const { tasks, fetchTasks, addTask, updateTask, deleteTask } =
    useTaskStore();
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  const rawTasks = tasks.filter((t) => t.stage === Stage.RAW);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingId]);

  const handleSubmit = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && input.trim()) {
      await addTask(input.trim());
      setInput("");
    }
  };

  const startEdit = (task: TaskWithRelations) => {
    setEditingId(task.id);
    setEditText(task.text);
  };

  const saveEdit = async () => {
    if (editingId && editText.trim()) {
      await updateTask(editingId, {
        text: editText.trim(),
      } as Partial<TaskWithRelations>);
    }
    setEditingId(null);
    setEditText("");
  };

  const handleEditKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") {
      setEditingId(null);
      setEditText("");
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 pb-24">
      <StageHeader
        stageNumber={1}
        title="BRAIN DUMP"
        description="Capture everything on your mind. Don't filter, don't organize — just get it out. Press Enter after each thought."
        progress={16}
      />

      {/* Input */}
      <div className="mb-6">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSubmit}
          placeholder="what's on your mind?"
          className="w-full bg-surface border border-border rounded-lg px-4 py-3.5 font-mono text-sm text-text-primary placeholder:text-text-muted/40 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Task List */}
      {rawTasks.length > 0 && (
        <div className="mb-4">
          <p className="text-text-muted text-xs font-mono uppercase tracking-widest mb-3">
            CAPTURED ({rawTasks.length})
          </p>
          <div className="space-y-1.5">
            {rawTasks.map((task) => (
              <div
                key={task.id}
                className="group flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 transition-all hover:border-primary/20"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 shrink-0" />
                {editingId === task.id ? (
                  <input
                    ref={editRef}
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={handleEditKey}
                    onBlur={saveEdit}
                    className="flex-1 bg-transparent font-mono text-sm text-text-primary outline-none"
                  />
                ) : (
                  <span
                    onClick={() => startEdit(task)}
                    className="flex-1 font-mono text-sm text-text-primary cursor-text"
                  >
                    {task.text}
                  </span>
                )}
                <button
                  onClick={() => deleteTask(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-xs font-mono"
                >
                  DELETE
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {rawTasks.length === 0 && !input && (
        <div className="mt-16 text-center border-2 border-dashed border-border rounded-xl py-16 px-8">
          <p className="text-text-muted text-sm font-mono">
            START TYPING TO CAPTURE YOUR THOUGHTS
          </p>
          <p className="text-text-muted/40 text-xs font-mono mt-2">
            Press Enter to add each one
          </p>
        </div>
      )}

      <FooterBar
        stats={[
          { label: "TOTAL ITEMS", value: rawTasks.length },
        ]}
        rightAction={
          <button
            onClick={onNext}
            disabled={rawTasks.length === 0}
            className="px-5 py-2 bg-primary text-background font-mono font-bold text-xs uppercase tracking-wider rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
          >
            NEXT: PRIORITIZE &rarr;
          </button>
        }
      />
    </div>
  );
}
