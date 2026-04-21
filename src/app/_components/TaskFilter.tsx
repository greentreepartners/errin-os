"use client";

import { useState } from "react";
import {
  MOTION_ORDER,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { statusPillClasses } from "@/lib/task-status";
import { INACTIVE_PILL, ACTIVE_PILL } from "@/lib/filter-pill";

type FilterStatus = TaskStatus | null;

const PILLS: Array<{ label: string; status: FilterStatus }> = [
  { label: "All", status: null },
  { label: "This Week", status: "this_week" },
  { label: "In Progress", status: "in_progress" },
  { label: "Blocked", status: "blocked" },
  { label: "Done", status: "done" },
];

function TaskCard({ task }: { task: Task }) {
  const visibleBlockers = (task.blocked_by ?? [])
    .map((b) => b.blocking_task?.short_id)
    .filter((s): s is string => Boolean(s));

  return (
    <article
      style={{
        borderStyle: task.visibility === "public" ? "solid" : "dashed",
      }}
      className="relative border border-rule bg-bg-card p-3"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {task.short_id && (
              <span className="font-mono text-xs text-text-3">
                {task.short_id}
              </span>
            )}
            <span
              className={`border border-solid px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider ${statusPillClasses(task.status, { interactive: false })}`}
            >
              {task.status.replace("_", " ")}
            </span>
            <h3 className="font-sans font-semibold text-text">{task.title}</h3>
            <span className="ml-auto border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
              {task.visibility === "public" ? "PUBLIC" : "PRIVATE"}
            </span>
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-text-2">{task.description}</p>
          )}

          {visibleBlockers.length > 0 && (
            <p className="mt-2 inline-block border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
              Blocked by {visibleBlockers.join(", ")}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-text-3">
          {task.horizon && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              {task.horizon}
            </span>
          )}
          {task.effort && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              effort: {task.effort}
            </span>
          )}
          {task.impact && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              impact: {task.impact}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

export function TaskFilter({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<FilterStatus>(null);
  const matches = (t: Task) => filter === null || t.status === filter;

  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2">
        {PILLS.map(({ label, status }) => {
          const active = status !== null && filter === status;
          return (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(status)}
              className={active ? ACTIVE_PILL : INACTIVE_PILL}
            >
              {label}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 space-y-8">
        {projects.map((project) => {
          const projectTasks = project.tasks ?? [];
          const matchingTasks = projectTasks.filter(matches);
          if (matchingTasks.length === 0) return null;

          const projectNum = String(project.display_order).padStart(2, "0");
          const heading = (
            <h2 className="flex items-baseline gap-2">
              <span className="font-mono text-text-3">{projectNum} ·</span>
              <span className="font-sans text-lg font-semibold uppercase tracking-wide text-text">
                {project.name}
              </span>
            </h2>
          );

          if (project.slug === "career") {
            return (
              <section key={project.id}>
                {heading}
                <div className="mt-3 space-y-6">
                  {MOTION_ORDER.map(({ key, label }) => {
                    const subset = projectTasks.filter(
                      (t) => t.motion === key && matches(t)
                    );
                    if (subset.length === 0) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-text-2">
                          {label}
                        </h3>
                        <div className="mt-2 space-y-3">
                          {subset.map((task) => (
                            <TaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          }

          return (
            <section key={project.id}>
              {heading}
              <div className="mt-3 space-y-3">
                {matchingTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
