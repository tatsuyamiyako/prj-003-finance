"use client";

import { useRef } from "react";
import type { Member, Project } from "@/lib/types";

type Props = {
  projects: Pick<Project, "id" | "code" | "client_name" | "name">[];
  members: Pick<Member, "id" | "name">[];
  action: (formData: FormData) => Promise<void>;
  assignedTo?: string;
};

export function QuickAddForm({ projects, members, action, assignedTo }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const selectCls = "rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900";

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="title"
          required
          placeholder="タスクを入力..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          追加
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <select name="project_id" className={`max-w-48 ${selectCls}`}>
          <option value="">案件なし</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.client_name}{p.name ? ` / ${p.name}` : ""}
            </option>
          ))}
        </select>
        {!assignedTo ? (
          <select name="assigned_to" className={selectCls}>
            <option value="">担当未定</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        ) : (
          <input type="hidden" name="assigned_to" value={assignedTo} />
        )}
        <input
          type="date"
          name="due_date"
          className={selectCls}
        />
        <select name="priority" defaultValue="medium" className={selectCls}>
          <option value="high">高</option>
          <option value="medium">中</option>
          <option value="low">低</option>
        </select>
        <select name="status" defaultValue="todo" className={selectCls}>
          <option value="todo">未着手</option>
          <option value="in_progress">進行中</option>
        </select>
      </div>
    </form>
  );
}
