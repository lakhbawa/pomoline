export const Stage = {
  RAW: "RAW",
  PRIORITIZED: "PRIORITIZED",
  DECOMPOSED: "DECOMPOSED",
  ESTIMATED: "ESTIMATED",
  POMO_SIZED: "POMO_SIZED",
  READY: "READY",
} as const;

export type Stage = (typeof Stage)[keyof typeof Stage];

export const STAGE_ORDER: Stage[] = [
  Stage.RAW,
  Stage.PRIORITIZED,
  Stage.DECOMPOSED,
  Stage.ESTIMATED,
  Stage.POMO_SIZED,
  Stage.READY,
];

export const STAGE_LABELS: Record<Stage, string> = {
  RAW: "Brain Dump",
  PRIORITIZED: "Prioritized",
  DECOMPOSED: "Decomposed",
  ESTIMATED: "Estimated",
  POMO_SIZED: "Pomo-sized",
  READY: "Ready",
};

export const Priority = {
  UNSET: "UNSET",
  HIGH: "HIGH",
  LOW: "LOW",
} as const;

export type Priority = (typeof Priority)[keyof typeof Priority];

export const Window = {
  MORNING: "MORNING",
  AFTERNOON: "AFTERNOON",
  EVENING: "EVENING",
} as const;

export type Window = (typeof Window)[keyof typeof Window];

export const WINDOW_LABELS: Record<Window, string> = {
  MORNING: "Morning",
  AFTERNOON: "Afternoon",
  EVENING: "Evening",
};

export interface TaskWithRelations {
  id: string;
  text: string;
  stage: Stage;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  steps: StepData[];
  pomoBlocks: PomoBlockData[];
}

export interface StepData {
  id: string;
  taskId: string;
  text: string;
  doneCondition: string | null;
  estimateMins: number | null;
  order: number;
}

export interface PomoBlockData {
  id: string;
  taskId: string;
  steps: StepData[];
  totalMins: number;
  window: Window | null;
  assignedAt: string | null;
  date: string | null;
}
