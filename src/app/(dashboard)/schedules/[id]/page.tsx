import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Schedule, ScheduleItem } from "@/lib/types";
import Link from "next/link";
import {
  addScheduleItem,
  toggleScheduleItemDone,
  deleteScheduleItem,
  deleteSchedule,
} from "../actions";
import { DeleteButton } from "../../delete-button";
import { ScheduleItemForm } from "./schedule-item-form";

type ScheduleWithProject = Schedule & {
  project: { code: string; client_name: string; name: string | null } | null;
};

export default async function ScheduleDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: schedule }, { data: items }] = await Promise.all([
    supabase
      .from("schedules")
      .select("*, project:projects(code, client_name, name)")
      .eq("id", id)
      .single(),
    supabase
      .from("schedule_items")
      .select("*")
      .eq("schedule_id", id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("sort_order"),
  ]);

  if (!schedule) notFound();

  const s = schedule as unknown as ScheduleWithProject;
  const allItems = (items ?? []) as ScheduleItem[];
  const bruscapeItems = allItems.filter((i) => i.side === "bruscape");
  const clientItems = allItems.filter((i) => i.side === "client");

  const allDates = allItems
    .filter((i) => i.due_date)
    .map((i) => i.due_date!)
    .sort();
  const minDate = allDates[0] ?? null;
  const maxDate = allDates[allDates.length - 1] ?? null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">{s.title}</h1>
          {s.project && (
            <p className="mt-0.5 text-sm text-slate-500">
              {s.project.code} — {s.project.client_name}
              {s.project.name ? ` / ${s.project.name}` : ""}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/schedules"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            一覧へ
          </Link>
          <DeleteButton action={deleteSchedule} id={s.id} confirmMessage={`「${s.title}」を削除しますか？`} />
        </div>
      </div>

      {/* Schedule Table View */}
      {allItems.length > 0 && minDate && maxDate && (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">スケジュール表</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2 text-left font-medium text-slate-600">項目</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">担当</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">期日</th>
                  <th className="px-3 py-2 text-center font-medium text-slate-600">状態</th>
                </tr>
              </thead>
              <tbody>
                {bruscapeItems.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} className="bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800">
                        BRÜSCAPE
                      </td>
                    </tr>
                    {bruscapeItems.map((item) => (
                      <ItemTableRow key={item.id} item={item} />
                    ))}
                  </>
                )}
                {clientItems.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={4} className="bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800">
                        お客様
                      </td>
                    </tr>
                    {clientItems.map((item) => (
                      <ItemTableRow key={item.id} item={item} />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* BRÜSCAPE Side */}
      <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
        <h2 className="text-sm font-semibold text-blue-900">BRÜSCAPE側のタスク</h2>
        <div className="mt-3 space-y-1.5">
          {bruscapeItems.map((item) => (
            <ItemRow key={item.id} item={item} scheduleId={s.id} />
          ))}
          {bruscapeItems.length === 0 && (
            <p className="py-2 text-center text-xs text-blue-400">まだ項目がありません</p>
          )}
        </div>
        <div className="mt-3">
          <ScheduleItemForm scheduleId={s.id} side="bruscape" nextOrder={bruscapeItems.length} action={addScheduleItem} />
        </div>
      </section>

      {/* Client Side */}
      <section className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4">
        <h2 className="text-sm font-semibold text-amber-900">お客様側のタスク</h2>
        <div className="mt-3 space-y-1.5">
          {clientItems.map((item) => (
            <ItemRow key={item.id} item={item} scheduleId={s.id} />
          ))}
          {clientItems.length === 0 && (
            <p className="py-2 text-center text-xs text-amber-400">まだ項目がありません</p>
          )}
        </div>
        <div className="mt-3">
          <ScheduleItemForm scheduleId={s.id} side="client" nextOrder={clientItems.length} action={addScheduleItem} />
        </div>
      </section>
    </div>
  );
}

function ItemRow({ item, scheduleId }: { item: ScheduleItem; scheduleId: string }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = item.due_date && !item.is_done && item.due_date < today;
  return (
    <div className={`flex items-center gap-3 rounded-md bg-white px-3 py-2 ${item.is_done ? "opacity-50" : ""}`}>
      <form action={toggleScheduleItemDone} className="shrink-0">
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
      <span className={`min-w-0 flex-1 text-sm ${item.is_done ? "text-slate-400 line-through" : "text-slate-900"}`}>
        {item.title}
      </span>
      {item.due_date && (
        <span className={`shrink-0 text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
          {item.due_date}
        </span>
      )}
      <form action={deleteScheduleItem}>
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="schedule_id" value={scheduleId} />
        <button type="submit" className="text-xs text-slate-400 hover:text-red-500">削除</button>
      </form>
    </div>
  );
}

function ItemTableRow({ item }: { item: ScheduleItem }) {
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = item.due_date && !item.is_done && item.due_date < today;
  return (
    <tr className={`border-b border-slate-100 ${item.is_done ? "opacity-50" : ""}`}>
      <td className={`sticky left-0 z-10 bg-white px-3 py-1.5 ${item.is_done ? "text-slate-400 line-through" : "text-slate-900"}`}>
        {item.title}
      </td>
      <td className="px-3 py-1.5 text-slate-500">
        {item.side === "bruscape" ? "BRÜSCAPE" : "お客様"}
      </td>
      <td className={`px-3 py-1.5 ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
        {item.due_date ?? "—"}
      </td>
      <td className="px-3 py-1.5 text-center">
        {item.is_done ? (
          <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">完了</span>
        ) : (
          <span className="inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">未完了</span>
        )}
      </td>
    </tr>
  );
}
