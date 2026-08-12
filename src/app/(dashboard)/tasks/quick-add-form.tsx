"use client";

import { useRef } from "react";
import type { Project } from "@/lib/types";

type Props = {
  projects: Pick<Project, "id" | "code" | "client_name" | "name">[];
  action: (formData: FormData) => Promise<void>;
  assignedTo?: string;
};

export function QuickAddForm({ projects, action, assignedTo }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      {assignedTo && <input type="hidden" name="assigned_to" value={assignedTo} />}
      <input
        type="text"
        name="title"
        required
        placeholder="タスクを入力..."
        className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
      />
      <select
        name="project_id"
        className="max-w-48 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
      >
        <option value="">案件なし</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.code} — {p.client_name}{p.name ? ` / ${p.name}` : ""}
          </option>
        ))}
      </select>
      <select
        name="priority"
        defaultValue="medium"
        className="rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
      >
        <option value="high">高</option>
        <option value="medium">中</option>
        <option value="low">低</option>
      </select>
      <button
        type="submit"
        className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        追加
      </button>
    </form>
  );
}
