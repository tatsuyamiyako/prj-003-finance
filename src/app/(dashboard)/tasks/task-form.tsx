"use client";

import type { Member, Project, Task } from "@/lib/types";
import { TASK_STATUSES, TASK_PRIORITIES, clientLabel } from "@/lib/types";

type Props = {
  projects: Pick<Project, "id" | "code" | "client_name" | "name">[];
  members: Member[];
  task?: Task;
  action: (formData: FormData) => Promise<void>;
  onCancel?: () => void;
};

export function TaskForm({ projects, members, task, action, onCancel }: Props) {
  const inputCls = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";

  return (
    <form action={action} className="space-y-3">
      {task && <input type="hidden" name="id" value={task.id} />}

      <div>
        <label className="block text-sm font-medium text-slate-700">タイトル</label>
        <input type="text" name="title" required defaultValue={task?.title ?? ""} placeholder="タスク名を入力" className={inputCls} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">担当者</label>
          <select name="assigned_to" defaultValue={task?.assigned_to ?? ""} className={inputCls}>
            <option value="">未定</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">期限</label>
          <input type="date" name="due_date" defaultValue={task?.due_date ?? ""} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">ステータス</label>
          <select name="status" defaultValue={task?.status ?? "todo"} className={inputCls}>
            {TASK_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">優先度</label>
          <select name="priority" defaultValue={task?.priority ?? "medium"} className={inputCls}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">関連案件</label>
        <select name="project_id" defaultValue={task?.project_id ?? ""} className={inputCls}>
          <option value="">なし</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {clientLabel(p.client_name)}{p.name ? ` / ${p.name}` : ""}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">メモ</label>
        <textarea name="description" defaultValue={task?.description ?? ""} rows={2} className={inputCls} />
      </div>

      {task?.ai_comment && (
        <div className="rounded-md bg-violet-50 px-3 py-2">
          <span className="text-xs font-medium text-violet-500">AI コメント</span>
          <p className="mt-1 text-sm text-violet-700">{task.ai_comment}</p>
        </div>
      )}

      <div className="flex gap-2">
        <button type="submit" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
          {task ? "更新" : "追加"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}
