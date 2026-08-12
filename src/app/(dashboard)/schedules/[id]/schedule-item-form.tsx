"use client";

import { useRef } from "react";

type MemberOption = { id: string; name: string };

type Props = {
  scheduleId: string;
  side: "bruscape" | "client";
  nextOrder: number;
  action: (formData: FormData) => Promise<void>;
  members?: MemberOption[];
};

export function ScheduleItemForm({ scheduleId, side, nextOrder, action, members }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleAction(formData: FormData) {
    await action(formData);
    formRef.current?.reset();
  }

  const borderColor = side === "bruscape" ? "border-blue-300" : "border-amber-300";
  const btnColor = side === "bruscape"
    ? "bg-blue-600 hover:bg-blue-700"
    : "bg-amber-600 hover:bg-amber-700";

  return (
    <form ref={formRef} action={handleAction} className="space-y-2">
      <input type="hidden" name="schedule_id" value={scheduleId} />
      <input type="hidden" name="side" value={side} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <div className="flex items-center gap-2">
        <input
          type="text"
          name="title"
          required
          placeholder="項目を入力..."
          className={`min-w-0 flex-1 rounded-md border ${borderColor} bg-white px-3 py-1.5 text-sm text-slate-900 outline-none`}
        />
        <input
          type="date"
          name="start_date"
          className={`rounded-md border ${borderColor} bg-white px-1.5 py-1.5 text-xs text-slate-900 outline-none`}
        />
        <span className="text-xs text-slate-400">〜</span>
        <input
          type="date"
          name="due_date"
          className={`rounded-md border ${borderColor} bg-white px-1.5 py-1.5 text-xs text-slate-900 outline-none`}
        />
        <button
          type="submit"
          className={`shrink-0 rounded-md ${btnColor} px-3 py-1.5 text-xs font-medium text-white`}
        >
          追加
        </button>
      </div>
      {side === "bruscape" && members && members.length > 0 && (
        <div className="flex items-center gap-3 pl-1">
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
