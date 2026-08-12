"use client";

import { useRef, useState } from "react";

type MemberOption = { id: string; name: string };

type Props = {
  scheduleId: string;
  nextOrder: number;
  action: (formData: FormData) => Promise<void>;
  members: MemberOption[];
};

export function ScheduleItemForm({ scheduleId, nextOrder, action, members }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [side, setSide] = useState("bruscape");

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
    setSide("bruscape");
  }

  return (
    <form ref={formRef} action={handleAction} className="space-y-2 rounded-lg border border-slate-200 bg-white p-3">
      <input type="hidden" name="schedule_id" value={scheduleId} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <div className="flex items-center gap-2">
        <select
          name="side"
          value={side}
          onChange={(e) => setSide(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1.5 text-xs font-medium text-slate-700 outline-none"
        >
          <option value="bruscape">BRÜSCAPE</option>
          <option value="client">お客様</option>
        </select>
        <input
          type="text"
          name="title"
          required
          placeholder="項目を入力..."
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none"
        />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-slate-500">期間:</span>
        <input
          type="date"
          name="start_date"
          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 outline-none"
        />
        <span className="text-xs text-slate-400">〜</span>
        <input
          type="date"
          name="due_date"
          className="rounded-md border border-slate-300 bg-white px-1.5 py-1 text-xs text-slate-900 outline-none"
        />
        <button
          type="submit"
          className="ml-auto shrink-0 rounded-md bg-slate-800 px-4 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
        >
          追加
        </button>
      </div>
      {side === "bruscape" && members.length > 0 && (
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-medium text-slate-500">担当:</span>
          {members.map((m) => (
            <label key={m.id} className="flex items-center gap-1 text-[11px] text-slate-600">
              <input type="checkbox" name="assignee_ids" value={m.id} className="h-3.5 w-3.5 rounded border-slate-300" />
              {m.name}
            </label>
          ))}
        </div>
      )}
    </form>
  );
}
