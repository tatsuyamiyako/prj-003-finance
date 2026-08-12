"use client";

import { useRef, useState } from "react";

type Props = {
  itemId: string;
  scheduleId: string;
  members: { id: string; name: string }[];
  currentIds: string[];
  action: (formData: FormData) => Promise<void>;
};

export function AssigneeSelector({ itemId, scheduleId, members, currentIds, action }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(currentIds));
  const formRef = useRef<HTMLFormElement>(null);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    const fd = new FormData();
    fd.set("id", itemId);
    fd.set("schedule_id", scheduleId);
    for (const id of selected) fd.append("assignee_ids", id);
    await action(fd);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[10px] text-blue-500 hover:text-blue-700"
      >
        変更
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-2 py-1">
      {members.map((m) => (
        <label key={m.id} className="flex items-center gap-1 text-[11px] text-slate-700">
          <input
            type="checkbox"
            checked={selected.has(m.id)}
            onChange={() => toggle(m.id)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          {m.name}
        </label>
      ))}
      <button
        type="button"
        onClick={handleSave}
        className="rounded bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-blue-700"
      >
        保存
      </button>
      <button
        type="button"
        onClick={() => { setSelected(new Set(currentIds)); setOpen(false); }}
        className="text-[10px] text-slate-400 hover:text-slate-600"
      >
        取消
      </button>
    </div>
  );
}
