"use client";

import { useState, useRef, useEffect } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import { TaskWithRelations, Stage } from "@/lib/types";

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
      await updateTask(editingId, { text: editText.trim() } as Partial<TaskWithRelations>);
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
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Input */}
      <div className="mb-8">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSubmit}
          placeholder="what's on your mind?"
          className="w-full bg-surface border border-border rounded-lg px-4 py-3 font-mono text-text-primary placeholder:text-text-muted/50 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {rawTasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-3 bg-surface border border-border rounded-lg px-4 py-3 transition-all hover:border-border"
          >
            {editingId === task.id ? (
              <input
                ref={editRef}
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKey}
                onBlur={saveEdit}
                className="flex-1 bg-transparent font-mono text-text-primary outline-none"
              />
            ) : (
              <span
                onClick={() => startEdit(task)}
                className="flex-1 font-mono text-text-primary cursor-text"
              >
                {task.text}
              </span>
            )}
            <button
              onClick={() => deleteTask(task.id)}
              className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all text-sm px-2"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 flex items-center justify-between">
        <span className="text-text-muted text-sm font-mono">
          {rawTasks.length} task{rawTasks.length !== 1 ? "s" : ""} captured
        </span>
        <button
          onClick={onNext}
          disabled={rawTasks.length === 0}
          className="px-4 py-2 bg-primary text-background font-medium rounded-lg text-sm disabled:opacity-30 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
        >
          Next: Prioritize &rarr;
        </button>
      </div>

      {/* Empty State */}
      {rawTasks.length === 0 && !input && (
        <div className="mt-16 text-center">
          <p className="text-text-muted text-sm">
            Start typing to capture your thoughts.
          </p>
          <p className="text-text-muted/50 text-xs mt-2">
            Press Enter to add each one.
          </p>
        </div>
      )}
    </div>
  );
}
