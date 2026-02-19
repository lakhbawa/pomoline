import { create } from "zustand";
import {
  TaskWithRelations,
  StepData,
  PomoBlockData,
} from "@/lib/types";

interface TaskStore {
  tasks: TaskWithRelations[];
  loading: boolean;

  fetchTasks: (params?: { stage?: string; priority?: string }) => Promise<void>;
  addTask: (text: string) => Promise<TaskWithRelations>;
  updateTask: (
    id: string,
    data: Partial<TaskWithRelations>
  ) => Promise<TaskWithRelations>;
  deleteTask: (id: string) => Promise<void>;

  addStep: (taskId: string, text?: string) => Promise<StepData>;
  updateStep: (stepId: string, data: Partial<StepData>) => Promise<StepData>;
  deleteStep: (stepId: string, taskId: string) => Promise<void>;
  reorderSteps: (steps: { id: string; order: number }[]) => Promise<void>;

  createBlock: (data: {
    taskId: string;
    steps: StepData[];
    totalMins: number;
  }) => Promise<PomoBlockData>;
  updateBlock: (
    blockId: string,
    data: Partial<PomoBlockData>
  ) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  fetchBlocks: (params?: { date?: string }) => Promise<PomoBlockData[]>;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (params) => {
    set({ loading: true });
    const query = new URLSearchParams();
    if (params?.stage) query.set("stage", params.stage);
    if (params?.priority) query.set("priority", params.priority);
    const res = await fetch(`/api/tasks?${query}`);
    const tasks = await res.json();
    set({ tasks, loading: false });
  },

  addTask: async (text: string) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const task = await res.json();
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, data) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
    return updated;
  },

  deleteTask: async (id) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },

  addStep: async (taskId, text = "") => {
    const res = await fetch("/api/steps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, text }),
    });
    const step = await res.json();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId ? { ...t, steps: [...t.steps, step] } : t
      ),
    }));
    return step;
  },

  updateStep: async (stepId, data) => {
    const res = await fetch(`/api/steps/${stepId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        steps: t.steps.map((s) => (s.id === stepId ? updated : s)),
      })),
    }));
    return updated;
  },

  deleteStep: async (stepId, taskId) => {
    await fetch(`/api/steps/${stepId}`, { method: "DELETE" });
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, steps: t.steps.filter((s) => s.id !== stepId) }
          : t
      ),
    }));
  },

  reorderSteps: async (steps) => {
    await fetch("/api/steps/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    // Re-fetch to get updated order
    if (steps.length > 0) {
      const taskId = get().tasks
        .flatMap((t) => t.steps)
        .find((s) => s.id === steps[0].id)?.taskId;
      if (taskId) {
        const res = await fetch(`/api/tasks/${taskId}`);
        const updated = await res.json();
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
        }));
      }
    }
  },

  createBlock: async (data) => {
    const res = await fetch("/api/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const block = await res.json();
    // Update task's pomoBlocks in store
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === data.taskId
          ? { ...t, pomoBlocks: [...t.pomoBlocks, block] }
          : t
      ),
    }));
    return block;
  },

  updateBlock: async (blockId, data) => {
    await fetch(`/api/blocks/${blockId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  },

  deleteBlock: async (blockId) => {
    await fetch(`/api/blocks/${blockId}`, { method: "DELETE" });
    set((state) => ({
      tasks: state.tasks.map((t) => ({
        ...t,
        pomoBlocks: t.pomoBlocks.filter((b) => b.id !== blockId),
      })),
    }));
  },

  fetchBlocks: async (params) => {
    const query = new URLSearchParams();
    if (params?.date) query.set("date", params.date);
    const res = await fetch(`/api/blocks?${query}`);
    return res.json();
  },
}));
