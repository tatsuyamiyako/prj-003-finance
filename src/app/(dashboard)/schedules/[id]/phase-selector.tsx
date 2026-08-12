"use client";

import { useState, useTransition } from "react";
import { PHASE_SUGGESTIONS, phaseBgClass } from "@/lib/types";
import { updateSchedule } from "../actions";

export function PhaseSelector({
  scheduleId,
  title,
  projectId,
  currentPhase,
}: {
  scheduleId: string;
  title: string;
  projectId: string | null;
  currentPhase: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(currentPhase ?? "");

  function save(phase: string) {
    const formData = new FormData();
    formData.set("id", scheduleId);
    formData.set("title", title);
    if (projectId) formData.set("project_id", projectId);
    formData.set("phase", phase);
    startTransition(() => updateSchedule(formData));
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium text-slate-500">フェーズ:</label>
      <input
        type="text"
        list="phase-list-edit"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { if (value !== (currentPhase ?? "")) save(value); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); save(value); } }}
        disabled={isPending}
        placeholder="例: 企画、撮影…"
        className="rounded border border-slate-300 px-2 py-0.5 text-xs text-slate-700 outline-none focus:border-slate-900"
      />
      <datalist id="phase-list-edit">
        {PHASE_SUGGESTIONS.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      {value && (
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-medium text-white ${phaseBgClass(value)}`}
        >
          {value}
        </span>
      )}
      {isPending && (
        <span className="text-[10px] text-slate-400">保存中…</span>
      )}
    </div>
  );
}
