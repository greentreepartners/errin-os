"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { EffortLevel, Horizon, ImpactLevel } from "@/lib/types";

type ProjectOption = { id: string; name: string; slug: string };

export function AddTaskForm({ projects }: { projects: ProjectOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [shortId, setShortId] = useState("");
  const [description, setDescription] = useState("");
  const [motion, setMotion] = useState("");
  const [horizon, setHorizon] = useState<Horizon | "">("this_week");
  const [effort, setEffort] = useState<EffortLevel | "">("");
  const [impact, setImpact] = useState<ImpactLevel | "">("");
  const [isGate, setIsGate] = useState(false);

  const isCareer =
    projects.find((p) => p.id === projectId)?.slug === "career";

  function reset() {
    setTitle("");
    setShortId("");
    setDescription("");
    setMotion("");
    setHorizon("this_week");
    setEffort("");
    setImpact("");
    setIsGate(false);
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
        short_id: shortId.trim() || null,
        description: description.trim() || null,
        motion: isCareer && motion ? motion : null,
        horizon: horizon || null,
        effort: effort || null,
        impact: impact || null,
        is_gate: isGate,
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
          onChange={(e) => {
            setProjectId(e.target.value);
            const next = projects.find((p) => p.id === e.target.value);
            if (next?.slug !== "career") setMotion("");
          }}
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
          Short ID (optional)
        </span>
        <input
          type="text"
          value={shortId}
          onChange={(e) => setShortId(e.target.value)}
          placeholder="e.g. B3"
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
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
      {isCareer && (
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
            Motion (optional)
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
      )}
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Horizon
        </span>
        <select
          value={horizon}
          onChange={(e) => setHorizon(e.target.value as Horizon | "")}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
        >
          <option value="this_week">this_week</option>
          <option value="next_2_weeks">next_2_weeks</option>
          <option value="ongoing">ongoing</option>
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Effort (optional)
        </span>
        <select
          value={effort}
          onChange={(e) => setEffort(e.target.value as EffortLevel | "")}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
        >
          <option value="">none</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </label>
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Impact (optional)
        </span>
        <select
          value={impact}
          onChange={(e) => setImpact(e.target.value as ImpactLevel | "")}
          className="mt-1 w-full border border-solid border-rule bg-bg px-2 py-1 font-mono text-xs text-text"
        >
          <option value="">none</option>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={isGate}
          onChange={(e) => setIsGate(e.target.checked)}
          className="border border-solid border-rule bg-bg"
        />
        <span className="font-mono text-[10px] uppercase tracking-wider text-text-3">
          Gate item
        </span>
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
