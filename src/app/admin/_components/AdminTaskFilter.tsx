"use client";

// Admin filter — multi-select with zero-state-as-ALL, per D7 divergence.
// Public equivalent in src/app/_components/TaskFilter.tsx uses single-select + ALL pill.
// Do not harmonise these without Strategy escalation.

import { useState } from "react";
import {
  MOTION_ORDER,
  type Project,
  type Task,
  type TaskStatus,
} from "@/lib/types";
import { INACTIVE_PILL, ACTIVE_PILL } from "@/lib/filter-pill";
import { AdminTaskCard } from "./AdminTaskCard";

const STATUS_PILLS: TaskStatus[] = [
  "backlog",
  "this_week",
  "in_progress",
  "blocked",
  "done",
  "killed",
];

type ProjectOption = { id: string; name: string; slug: string };

export function AdminTaskFilter({
  projects,
  projectOptions,
}: {
  projects: Project[];
  projectOptions: ProjectOption[];
}) {
  const [statusFilter, setStatusFilter] = useState<Set<TaskStatus>>(new Set());
  const [projectFilter, setProjectFilter] = useState<Set<string>>(new Set());

  function toggleStatus(s: TaskStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  function toggleProject(id: string) {
    setProjectFilter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const matchesStatus = (t: Task) =>
    statusFilter.size === 0 || statusFilter.has(t.status);

  return (
    <>
      <nav className="mt-4 flex flex-wrap gap-2">
        {STATUS_PILLS.map((status) => {
          const active = statusFilter.has(status);
          return (
            <button
              key={status}
              type="button"
              onClick={() => toggleStatus(status)}
              className={active ? ACTIVE_PILL : INACTIVE_PILL}
            >
              {status}
            </button>
          );
        })}
      </nav>

      <nav className="mt-2 flex flex-wrap gap-2">
        {projectOptions.map(({ id, name }) => {
          const active = projectFilter.has(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => toggleProject(id)}
              className={active ? ACTIVE_PILL : INACTIVE_PILL}
            >
              {name}
            </button>
          );
        })}
      </nav>

      <div className="mt-8 space-y-8">
        {projects.map((project) => {
          if (projectFilter.size > 0 && !projectFilter.has(project.id))
            return null;

          const projectTasks = project.tasks ?? [];
          const filteredTasks = projectTasks.filter(matchesStatus);
          if (filteredTasks.length === 0) return null;

          const projectNum = String(project.display_order).padStart(2, "0");
          const heading = (
            <h2 className="flex items-baseline gap-2">
              <span className="font-mono text-text-3">{projectNum} ·</span>
              <span className="font-sans text-lg font-semibold uppercase tracking-wide text-text">
                {project.name}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
                {project.visibility}
              </span>
            </h2>
          );

          if (project.slug === "career") {
            const orderedKeys = MOTION_ORDER.map((m) => m.key);
            const unmotioned = projectTasks.filter(
              (t) =>
                (!t.motion || !orderedKeys.includes(t.motion)) &&
                matchesStatus(t)
            );
            return (
              <section key={project.id}>
                {heading}
                <div className="mt-3 space-y-6">
                  {MOTION_ORDER.map(({ key, label }) => {
                    const subset = projectTasks.filter(
                      (t) => t.motion === key && matchesStatus(t)
                    );
                    if (subset.length === 0) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-text-2">
                          {label}
                        </h3>
                        <div className="mt-2 space-y-3">
                          {subset.map((task) => (
                            <AdminTaskCard key={task.id} task={task} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  {unmotioned.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-text-2">
                        Unassigned
                      </h3>
                      <div className="mt-2 space-y-3">
                        {unmotioned.map((task) => (
                          <AdminTaskCard key={task.id} task={task} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            );
          }

          return (
            <section key={project.id}>
              {heading}
              <div className="mt-3 space-y-3">
                {filteredTasks.map((task) => (
                  <AdminTaskCard key={task.id} task={task} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
