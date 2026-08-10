// Section names and their display labels
export const SECTIONS = {
  ITHACA: "ithaca",
  VOYAGE: "voyage",
  MIRROR: "mirror",
  ATLAS: "atlas",
  FORKS: "forks",
} as const;

export const SECTION_LABELS: Record<string, string> = {
  [SECTIONS.ITHACA]: "Ithaca",
  [SECTIONS.VOYAGE]: "Voyage",
  [SECTIONS.MIRROR]: "Mirror",
  [SECTIONS.ATLAS]: "Atlas",
  [SECTIONS.FORKS]: "Forks",
};

export const PRIORITY_OPTIONS = ["high", "medium", "low"] as const;
export const TASK_STATUS_OPTIONS = ["pending", "in_progress", "completed", "skipped"] as const;
export const FOCUS_STATUS_OPTIONS = ["planned", "in_progress", "completed", "missed"] as const;
export const MILESTONE_STATUS_OPTIONS = ["not_started", "in_progress", "completed"] as const;
export const HABIT_FREQ_OPTIONS = ["daily", "weekly", "weekdays", "custom"] as const;
export const MEMORY_TYPE_OPTIONS = ["pattern", "preference", "insight", "routine_success", "routine_failure"] as const;
export const RELATIONSHIP_TYPE_OPTIONS = ["positive", "negative", "neutral"] as const;
export const CHANGE_TYPE_OPTIONS = ["increase", "decrease"] as const;