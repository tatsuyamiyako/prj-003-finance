"use client";

import { useTransition, useState, useEffect } from "react";

export function SyncButton({
  action,
  scheduleId,
}: {
  action: (formData: FormData) => Promise<void>;
  scheduleId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  function handleSubmit() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("schedule_id", scheduleId);
      await action(fd);
      setShowSuccess(true);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending}
        className="rounded-md bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {isPending ? "更新中..." : "スケジュールを更新する"}
      </button>
      {showSuccess && (
        <div className="absolute right-0 top-full mt-2 whitespace-nowrap rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white shadow-lg">
          更新が完了しました
        </div>
      )}
    </div>
  );
}
