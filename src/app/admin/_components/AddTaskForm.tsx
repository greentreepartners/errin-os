"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type ProjectOption = { id: string; name: string; slug: string };

export function AddTaskForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [motion, setMotion] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setMotion("");
    setError(null);
  }

  function closeAndReset() {
    setOpen(false);
    reset();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!projectId || !trimmed) {
      setError("project and title required");
      return;
    }
    startTransition(async () => {
      setError(null);
      const body = {
        project_id: projectId,
        title: trimmed,
        description: description.trim() || null,
        motion: motion || null,
      };
      const res = await fetch("/admin/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ?? `HTTP ${res.status}`);
        return;
      }
      reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full border border-dashed border-rule bg-bg-card py-2 font-mono text-xs uppercase tracking-wider text-text-3 hover:border-text hover:text-text"
      >
        + add task (private by default)
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 border border-dashed border-rule bg-bg-card p-4"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          New task · private by default
        </span>
        <button
          type="button"
          onClick={closeAndReset}
          className="font-mono text-[10px] uppercase tracking-wider text-text-3 hover:text-text"
        >
          cancel
        </button>
      </div>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Project
        </span>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Title
        </span>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-sans text-sm text-text"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Description
        </span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 text-xs text-text-2"
        />
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Motion (Career only · optional)
        </span>
        <select
          value={motion}
          onChange={(e) => setMotion(e.target.value)}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
        >
          <option value="">none</option>
          <option value="gate">gate</option>
          <option value="motion_a">motion_a</option>
          <option value="motion_b">motion_b</option>
          <option value="motion_c">motion_c</option>
        </select>
      </label>
      {error && <p className="text-xs text-red-400">error: {error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full border border-solid border-text bg-text px-3 py-2 font-mono text-xs uppercase tracking-wider text-bg disabled:opacity-50"
      >
        {isPending ? "saving…" : "create task (private)"}
      </button>
    </form>
  );
}
