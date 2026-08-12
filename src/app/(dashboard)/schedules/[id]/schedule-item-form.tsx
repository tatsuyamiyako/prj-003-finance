"use client";

import { useRef } from "react";

type Props = {
  scheduleId: string;
  side: "bruscape" | "client";
  nextOrder: number;
  action: (formData: FormData) => Promise<void>;
};

export function ScheduleItemForm({ scheduleId, side, nextOrder, action }: Props) {
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
    <form ref={formRef} action={handleAction} className="flex items-center gap-2">
      <input type="hidden" name="schedule_id" value={scheduleId} />
      <input type="hidden" name="side" value={side} />
      <input type="hidden" name="sort_order" value={nextOrder} />
      <input
        type="text"
        name="title"
        required
        placeholder="項目を入力..."
        className={`min-w-0 flex-1 rounded-md border ${borderColor} bg-white px-3 py-1.5 text-sm text-slate-900 outline-none`}
      />
      <input
        type="date"
        name="due_date"
        className={`rounded-md border ${borderColor} bg-white px-2 py-1.5 text-sm text-slate-900 outline-none`}
      />
      <button
        type="submit"
        className={`shrink-0 rounded-md ${btnColor} px-3 py-1.5 text-xs font-medium text-white`}
      >
        追加
      </button>
    </form>
  );
}
