import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Schedule } from "@/lib/types";
import { deleteSchedule } from "./actions";
import { DeleteButton } from "../delete-button";

type ScheduleWithProject = Schedule & {
  project: { code: string; client_name: string; name: string | null } | null;
};

export default async function SchedulesPage() {
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("*, project:projects(code, client_name, name)")
    .order("updated_at", { ascending: false });

  const allSchedules = (schedules ?? []) as unknown as ScheduleWithProject[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">スケジュール管理</h1>
        <Link
          href="/schedules/new"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          新規作成
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {allSchedules.length > 0 ? (
          allSchedules.map((s) => (
            <div key={s.id} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
              <div className="min-w-0 flex-1">
                <Link href={`/schedules/${s.id}`} className="text-sm font-medium text-slate-900 hover:underline">
                  {s.title}
                </Link>
                {s.project && (
                  <p className="mt-0.5 text-xs text-slate-400">
                    {s.project.code} — {s.project.client_name}
                    {s.project.name ? ` / ${s.project.name}` : ""}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {s.updated_at.slice(0, 10)}
              </span>
              <Link href={`/schedules/${s.id}`} className="shrink-0 text-xs text-slate-400 hover:text-slate-700">
                編集
              </Link>
              <DeleteButton action={deleteSchedule} id={s.id} confirmMessage={`「${s.title}」を削除しますか？`} />
            </div>
          ))
        ) : (
          <div className="py-12 text-center text-sm text-slate-400">
            スケジュールがありません。「新規作成」から作成してください。
          </div>
        )}
      </div>
    </div>
  );
}
