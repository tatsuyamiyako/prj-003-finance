"use client";

import { useState } from "react";
import { taskPriorityBadgeClass, type TaskPriority } from "@/lib/types";

type PickableTask = {
  id: string;
  title: string;
  projectCode: string | null;
  priority: TaskPriority;
  dueDate: string | null;
};

type Props = {
  tasks: PickableTask[];
  memberId: string;
  pickAction: (formData: FormData) => Promise<void>;
};

export function TodayTaskPicker({ tasks, memberId, pickAction }: Props) {
  const [open, setOpen] = useState(false);

  function priorityLabel(v: TaskPriority) {
    return v === "high" ? "高" : v === "medium" ? "中" : "低";
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="rounded-md border border-blue-300 bg-white px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
      >
        {open ? "閉じる" : "+ タスクを追加"}
      </button>
      {open && (
        <div className="mt-2 max-h-60 space-y-1 overflow-y-auto rounded-md border border-blue-200 bg-white p-2">
          {tasks.map((t) => (
            <form key={t.id} action={pickAction} className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-blue-50">
              <input type="hidden" name="task_id" value={t.id} />
              <input type="hidden" name="member_id" value={memberId} />
              <button type="submit" className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800">
                追加
              </button>
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(t.priority)}`}>
                {priorityLabel(t.priority)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{t.title}</span>
              {t.projectCode && (
                <span className="shrink-0 text-xs text-slate-400">{t.projectCode}</span>
              )}
              {t.dueDate && (
                <span className="shrink-0 text-xs text-slate-400">{t.dueDate}</span>
              )}
            </form>
          ))}
        </div>
      )}
    </div>
  );
}
