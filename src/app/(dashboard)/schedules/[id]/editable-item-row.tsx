"use client";

import { useState } from "react";

type Member = { id: string; name: string };

type Props = {
  item: {
    id: string;
    title: string;
    side: string;
    start_date: string | null;
    due_date: string | null;
    is_done: boolean;
    assignee_ids: string[];
  };
  scheduleId: string;
  members: Member[];
  memberMap: Record<string, string>;
  updateAction: (formData: FormData) => Promise<void>;
  toggleAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
};

export function EditableItemRow({
  item,
  scheduleId,
  members,
  memberMap,
  updateAction,
  toggleAction,
  deleteAction,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [side, setSide] = useState(item.side);
  const [startDate, setStartDate] = useState(item.start_date ?? "");
  const [dueDate, setDueDate] = useState(item.due_date ?? "");
  const [assigneeIds, setAssigneeIds] = useState<Set<string>>(new Set(item.assignee_ids ?? []));

  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = item.due_date && !item.is_done && item.due_date < today;
  const assigneeNames = (item.assignee_ids ?? [])
    .map((id) => memberMap[id])
    .filter(Boolean);

  function toggleAssignee(id: string) {
    setAssigneeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("schedule_id", scheduleId);
    fd.set("title", title);
    fd.set("side", side);
    fd.set("start_date", startDate);
    fd.set("due_date", dueDate);
    if (side === "bruscape") {
      for (const id of assigneeIds) fd.append("assignee_ids", id);
    }
    await updateAction(fd);
    setEditing(false);
  }

  function handleCancel() {
    setTitle(item.title);
    setSide(item.side);
    setStartDate(item.start_date ?? "");
    setDueDate(item.due_date ?? "");
    setAssigneeIds(new Set(item.assignee_ids ?? []));
    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-md border border-slate-300 bg-white px-3 py-2 space-y-2">
        <div className="flex items-center gap-2">
          <select
            value={side}
            onChange={(e) => setSide(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs text-slate-700 outline-none"
          >
            <option value="bruscape">BRÜSCAPE</option>
            <option value="client">お客様</option>
          </select>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-sm text-slate-900 outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500">期間:</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 outline-none"
          />
          <span className="text-xs text-slate-400">〜</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="rounded border border-slate-300 px-1.5 py-0.5 text-xs text-slate-700 outline-none"
          />
        </div>
        {side === "bruscape" && (
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500">担当:</span>
            {members.map((m) => (
              <label key={m.id} className="flex items-center gap-1 text-[11px] text-slate-600">
                <input
                  type="checkbox"
                  checked={assigneeIds.has(m.id)}
                  onChange={() => toggleAssignee(m.id)}
                  className="h-3.5 w-3.5 rounded border-slate-300"
                />
                {m.name}
              </label>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
          >
            保存
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="text-xs text-slate-400 hover:text-slate-600"
          >
            キャンセル
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-md bg-white px-3 py-2 ${item.is_done ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-3">
        <form action={toggleAction} className="shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="schedule_id" value={scheduleId} />
          <input type="hidden" name="is_done" value={String(item.is_done)} />
          <button
            type="submit"
            className={`flex h-5 w-5 items-center justify-center rounded border ${
              item.is_done
                ? "border-emerald-400 bg-emerald-100 text-emerald-600"
                : "border-slate-300 text-transparent hover:border-slate-400"
            }`}
          >
            {item.is_done && <span className="text-xs">&#10003;</span>}
          </button>
        </form>
        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
          {item.side === "bruscape" ? "BRU" : "お客様"}
        </span>
        <span className={`min-w-0 flex-1 text-sm ${item.is_done ? "text-slate-400 line-through" : "text-slate-900"}`}>
          {item.title}
        </span>
        {(item.start_date || item.due_date) && (
          <span className={`shrink-0 text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
            {item.start_date && item.due_date && item.start_date !== item.due_date
              ? `${item.start_date} 〜 ${item.due_date}`
              : item.due_date ?? item.start_date}
          </span>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 text-xs text-blue-500 hover:text-blue-700"
        >
          編集
        </button>
        <form action={deleteAction}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="schedule_id" value={scheduleId} />
          <button type="submit" className="text-xs text-slate-400 hover:text-red-500">削除</button>
        </form>
      </div>
      {item.side === "bruscape" && assigneeNames.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1 pl-8">
          {assigneeNames.map((name, i) => (
            <span key={i} className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">
              {name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
