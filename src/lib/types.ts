export type Visibility = "public" | "private";

export type TaskStatus =
  | "backlog"
  | "this_week"
  | "in_progress"
  | "blocked"
  | "done"
  | "killed";

export type EffortLevel = "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";
export type Horizon = "this_week" | "next_2_weeks" | "ongoing";

export type BlockedBy = {
  blocking_task: { short_id: string | null } | null;
};

export type Task = {
  id: string;
  short_id: string | null;
  title: string;
  description: string | null;
  motion: string | null;
  motion_subtitle: string | null;
  status: TaskStatus;
  visibility: Visibility;
  effort: EffortLevel | null;
  impact: ImpactLevel | null;
  horizon: Horizon | null;
  is_gate: boolean;
  blocked_by: BlockedBy[] | null;
};

export type Project = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
  visibility: Visibility;
  tasks: Task[] | null;
};

export const MOTION_ORDER: Array<{ key: string; label: string }> = [
  { key: "gate", label: "Gate" },
  { key: "motion_a", label: "Motion A" },
  { key: "motion_b", label: "Motion B" },
  { key: "motion_c", label: "Motion C" },
];

export const TASK_STATUSES: TaskStatus[] = [
  "backlog",
  "this_week",
  "in_progress",
  "blocked",
  "done",
  "killed",
];
