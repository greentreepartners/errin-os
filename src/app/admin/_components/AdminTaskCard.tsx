"use client";

import {
  useEffect,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { TASK_STATUSES, type Task, type TaskStatus, type Visibility } from "@/lib/types";

type TaskPatch = Partial<
  Pick<Task, "title" | "description" | "status" | "visibility">
>;

function cycleStatus(current: TaskStatus): TaskStatus {
  const idx = TASK_STATUSES.indexOf(current);
  return TASK_STATUSES[(idx + 1) % TASK_STATUSES.length];
}

async function patchTask(id: string, patch: TaskPatch) {
  const res = await fetch(`/admin/api/tasks/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

export function AdminTaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [optimisticTask, applyOptimistic] = useOptimistic(
    task,
    (state: Task, patch: TaskPatch) => ({ ...state, ...patch })
  );

  const [editingField, setEditingField] = useState<
    null | "title" | "description"
  >(null);
  const [fieldValue, setFieldValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editingField === "title" && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    } else if (editingField === "description" && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editingField]);

  function runPatch(patch: TaskPatch) {
    startTransition(async () => {
      setError(null);
      applyOptimistic(patch);
      try {
        await patchTask(task.id, patch);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "write failed");
      }
    });
  }

  function toggleVisibility() {
    const next: Visibility =
      optimisticTask.visibility === "public" ? "private" : "public";
    runPatch({ visibility: next });
  }

  function cycleTaskStatus() {
    runPatch({ status: cycleStatus(optimisticTask.status) });
  }

  function beginEdit(field: "title" | "description") {
    setFieldValue(
      field === "title"
        ? optimisticTask.title
        : optimisticTask.description ?? ""
    );
    setEditingField(field);
  }

  function commitEdit() {
    if (editingField === "title") {
      const trimmed = fieldValue.trim();
      if (trimmed && trimmed !== optimisticTask.title) {
        runPatch({ title: trimmed });
      }
    } else if (editingField === "description") {
      const next = fieldValue.trim() === "" ? null : fieldValue;
      if (next !== optimisticTask.description) {
        runPatch({ description: next });
      }
    }
    setEditingField(null);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  const borderStyle =
    optimisticTask.visibility === "public" ? "border-solid" : "border-dashed";

  const visibleBlockers = (optimisticTask.blocked_by ?? [])
    .map((b) => b.blocking_task?.short_id)
    .filter((s): s is string => Boolean(s));

  return (
    <article
      className={`relative border ${borderStyle} border-rule bg-bg-card px-4 pt-8 pb-4 ${isPending ? "opacity-70" : ""}`}
    >
      <button
        type="button"
        onClick={toggleVisibility}
        aria-label="Toggle visibility"
        className="absolute top-2 right-2 border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3 hover:border-text hover:text-text"
      >
        {optimisticTask.visibility === "public" ? "PUBLIC" : "PRIVATE"}
      </button>

      <div className="flex items-start gap-3">
        <input type="checkbox" disabled className="mt-1" />

        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            {optimisticTask.short_id && (
              <span className="font-mono text-xs text-text-3">
                {optimisticTask.short_id}
              </span>
            )}
            {optimisticTask.status === "in_progress" && (
              <span className="border border-solid border-accent-line bg-accent-soft px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-accent">
                in progress
              </span>
            )}
            {editingField === "title" ? (
              <input
                ref={inputRef}
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commitEdit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    cancelEdit();
                  }
                }}
                className="flex-1 border border-solid border-accent bg-bg-card px-1 font-sans font-semibold text-text"
              />
            ) : (
              <h3
                onClick={() => beginEdit("title")}
                className="cursor-text font-sans font-semibold text-text hover:underline"
              >
                {optimisticTask.title}
              </h3>
            )}
          </div>

          {editingField === "description" ? (
            <textarea
              ref={textareaRef}
              value={fieldValue}
              onChange={(e) => setFieldValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              rows={2}
              className="mt-1 w-full border border-solid border-accent bg-bg-card px-1 text-xs text-text-2"
            />
          ) : (
            <p
              onClick={() => beginEdit("description")}
              className="mt-1 cursor-text text-xs text-text-2 hover:underline"
            >
              {optimisticTask.description || (
                <span className="italic text-text-4">add description…</span>
              )}
            </p>
          )}

          {visibleBlockers.length > 0 && (
            <p className="mt-2 inline-block border border-solid border-rule px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider text-text-3">
              Blocked by {visibleBlockers.join(", ")}
            </p>
          )}

          {error && (
            <p className="mt-2 inline-block border border-solid border-red-700 bg-red-950 px-2 py-0.5 text-[10px] font-mono text-red-300">
              error: {error}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1 text-[10px] text-text-3">
          <button
            type="button"
            onClick={cycleTaskStatus}
            aria-label="Cycle status"
            className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider hover:border-text hover:text-text"
          >
            {optimisticTask.status.replace("_", " ")}
          </button>
          {optimisticTask.horizon && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              {optimisticTask.horizon}
            </span>
          )}
          {optimisticTask.effort && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              effort: {optimisticTask.effort}
            </span>
          )}
          {optimisticTask.impact && (
            <span className="border border-solid border-rule px-2 py-0.5 font-mono uppercase tracking-wider">
              impact: {optimisticTask.impact}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
