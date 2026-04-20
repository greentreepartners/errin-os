import type { TaskStatus } from "@/lib/types";

const STATUS_CLASSES: Record<
  TaskStatus,
  { base: string; hover: string }
> = {
  backlog: {
    base: "border-rule bg-bg-raised text-text",
    hover: "hover:bg-bg-deep hover:border-text",
  },
  this_week: {
    base: "border-rule bg-bg-raised text-text",
    hover: "hover:bg-bg-deep hover:border-text",
  },
  in_progress: {
    base: "border-accent-line bg-accent-soft text-accent",
    hover: "hover:bg-accent-glow",
  },
  blocked: {
    base: "border-accent-line bg-accent-soft text-accent-hot",
    hover: "hover:bg-accent-glow",
  },
  done: {
    base: "border-rule bg-bg-raised text-text-3",
    hover: "hover:bg-bg-deep hover:text-text-2",
  },
  killed: {
    base: "border-rule bg-bg-raised text-text-4 line-through",
    hover: "hover:bg-bg-deep hover:text-text-3",
  },
};

export function statusPillClasses(
  status: TaskStatus,
  { interactive }: { interactive: boolean }
): string {
  const { base, hover } = STATUS_CLASSES[status];
  return interactive ? `${base} ${hover}` : base;
}
