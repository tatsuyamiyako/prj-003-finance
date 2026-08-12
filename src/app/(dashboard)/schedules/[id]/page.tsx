import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Schedule, ScheduleItem, Member } from "@/lib/types";
import { getJapaneseHolidays } from "@/lib/holidays";
import Link from "next/link";
import {
  addScheduleItem,
  updateScheduleItem,
  toggleScheduleItemDone,
  deleteScheduleItem,
  deleteSchedule,
  syncScheduleToTasks,
} from "../actions";
import { DeleteButton } from "../../delete-button";
import { ScheduleItemForm } from "./schedule-item-form";
import { EditableItemRow } from "./editable-item-row";
import { PdfButton } from "./pdf-button";
import { SyncButton } from "./sync-button";

type ScheduleWithProject = Schedule & {
  project: { code: string; client_name: string; name: string | null } | null;
};

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMonthRange(items: ScheduleItem[]): { year: number; month: number }[] {
  const dates = items.flatMap((i) => [i.start_date, i.due_date].filter(Boolean) as string[]);
  if (dates.length === 0) return [];

  const sorted = [...dates].sort();
  const start = new Date(sorted[0]);
  const end = new Date(sorted[sorted.length - 1]);

  const months: { year: number; month: number }[] = [];
  let y = start.getFullYear();
  let m = start.getMonth();
  const endY = end.getFullYear();
  const endM = end.getMonth();

  while (y < endY || (y === endY && m <= endM)) {
    months.push({ year: y, month: m });
    m++;
    if (m > 11) { m = 0; y++; }
  }
  return months;
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default async function ScheduleDetailPage(
  props: { params: Promise<{ id: string }> }
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: schedule }, { data: items }, { data: members }] = await Promise.all([
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
    supabase
      .from("members")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
  ]);

  if (!schedule) notFound();

  const s = schedule as unknown as ScheduleWithProject;
  const allItems = (items ?? []) as ScheduleItem[];
  const bruscapeItems = allItems.filter((i) => i.side === "bruscape");
  const clientItems = allItems.filter((i) => i.side === "client");
  const months = getMonthRange(allItems);
  const memberList = (members ?? []) as Pick<Member, "id" | "name">[];
  const memberMap = new Map(memberList.map((m) => [m.id, m.name]));

  const holidayYears = new Set(months.map((m) => m.year));
  const holidays = new Set<string>();
  for (const y of holidayYears) {
    for (const h of getJapaneseHolidays(y)) holidays.add(h);
  }

  function itemsOnDate(list: ScheduleItem[], dateStr: string) {
    return list.filter((item) => {
      const s = item.start_date ?? item.due_date;
      const e = item.due_date ?? item.start_date;
      if (!s && !e) return false;
      return dateStr >= (s ?? e)! && dateStr <= (e ?? s)!;
    });
  }

  function isBarStart(item: ScheduleItem, dateStr: string) {
    return (item.start_date ?? item.due_date) === dateStr;
  }

  function isBarEnd(item: ScheduleItem, dateStr: string) {
    return (item.due_date ?? item.start_date) === dateStr;
  }

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

      {/* Gantt Chart */}
      {months.length > 0 && (
        <section>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">スケジュール表</h2>
            <PdfButton
              scheduleTitle={s.title}
              projectLabel={s.project ? `${s.project.client_name}` : null}
              items={allItems.map((i) => ({
                title: i.title,
                side: i.side,
                start_date: i.start_date,
                due_date: i.due_date,
                is_done: i.is_done,
              }))}
              months={months}
              holidays={[...holidays]}
            />
          </div>
          <div id="gantt-chart" className="mt-2 space-y-4">
            {months.map(({ year, month }) => {
              const daysCount = getDaysInMonth(year, month);
              const days = Array.from({ length: daysCount }, (_, i) => i + 1);

              return (
                <div key={`${year}-${month}`} className="overflow-x-auto rounded-lg border border-slate-300">
                  <table className="w-max border-collapse text-[11px]">
                    <thead>
                      <tr>
                        <th
                          colSpan={daysCount + 1}
                          className="border-b border-slate-300 bg-slate-800 px-3 py-1.5 text-left text-xs font-bold text-white"
                        >
                          {month + 1}月
                        </th>
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 min-w-[80px] border-b border-r border-slate-300 bg-slate-100 px-2 py-1 text-left font-medium text-slate-600">
                          担当
                        </th>
                        {days.map((day) => {
                          const dow = new Date(year, month, day).getDay();
                          const isSat = dow === 6;
                          const isSun = dow === 0;
                          const dateStr = formatDate(year, month, day);
                          const isHoliday = holidays.has(dateStr);
                          return (
                            <th
                              key={day}
                              className={`min-w-[36px] border-b border-r border-slate-200 px-0.5 py-0.5 text-center font-medium ${
                                isSun || isHoliday ? "bg-red-50 text-red-500" : isSat ? "bg-blue-50 text-blue-500" : "bg-slate-50 text-slate-500"
                              }`}
                            >
                              {WEEKDAY_LABELS[dow]}
                            </th>
                          );
                        })}
                      </tr>
                      <tr>
                        <th className="sticky left-0 z-10 border-b border-r border-slate-300 bg-slate-100 px-2 py-0.5 text-left font-medium text-slate-600" />
                        {days.map((day) => {
                          const dow = new Date(year, month, day).getDay();
                          const dateStr = formatDate(year, month, day);
                          const isOff = dow === 0 || dow === 6 || holidays.has(dateStr);
                          return (
                            <th
                              key={day}
                              className={`border-b border-r border-slate-200 px-0.5 py-0.5 text-center font-semibold ${
                                isOff ? "bg-slate-100 text-slate-400" : "bg-white text-slate-700"
                              }`}
                            >
                              {day}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      <GanttRow
                        label="BRU"
                        labelBg="bg-blue-600"
                        barBg="bg-blue-400"
                        barDoneBg="bg-emerald-300"
                        items={bruscapeItems}
                        days={days}
                        year={year}
                        month={month}
                        holidays={holidays}
                        itemsOnDate={itemsOnDate}
                        isBarStart={isBarStart}
                      />
                      <GanttRow
                        label="お客様"
                        labelBg="bg-amber-500"
                        barBg="bg-amber-400"
                        barDoneBg="bg-emerald-300"
                        items={clientItems}
                        days={days}
                        year={year}
                        month={month}
                        holidays={holidays}
                        itemsOnDate={itemsOnDate}
                        isBarStart={isBarStart}
                      />
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Items List */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">タスク一覧</h2>
        <div className="mt-2 space-y-1.5">
          {allItems.map((item) => (
            <EditableItemRow
              key={item.id}
              item={item}
              scheduleId={s.id}
              members={memberList}
              memberMap={Object.fromEntries(memberMap)}
              updateAction={updateScheduleItem}
              toggleAction={toggleScheduleItemDone}
              deleteAction={deleteScheduleItem}
            />
          ))}
          {allItems.length === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">まだ項目がありません</p>
          )}
        </div>
        <div className="mt-3">
          <ScheduleItemForm
            scheduleId={s.id}
            nextOrder={allItems.length}
            action={addScheduleItem}
            members={memberList}
          />
        </div>
      </section>

      {/* Sync Button */}
      {bruscapeItems.length > 0 && (
        <section className="rounded-lg border-2 border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-emerald-900">タスク一覧に反映</h2>
              <p className="mt-0.5 text-xs text-emerald-600">
                BRÜSCAPE側のタスクを担当者のタスク一覧に自動追加・更新します
              </p>
            </div>
            <SyncButton action={syncScheduleToTasks} scheduleId={s.id} />
          </div>
        </section>
      )}
    </div>
  );
}

function GanttRow({
  label,
  labelBg,
  barBg,
  barDoneBg,
  items,
  days,
  year,
  month,
  holidays,
  itemsOnDate,
  isBarStart,
}: {
  label: string;
  labelBg: string;
  barBg: string;
  barDoneBg: string;
  items: ScheduleItem[];
  days: number[];
  year: number;
  month: number;
  holidays: Set<string>;
  itemsOnDate: (list: ScheduleItem[], dateStr: string) => ScheduleItem[];
  isBarStart: (item: ScheduleItem, dateStr: string) => boolean;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <tr>
      <td className={`sticky left-0 z-10 border-b border-r border-slate-300 ${labelBg} px-2 py-3 text-center text-[10px] font-bold text-white`}>
        {label}
      </td>
      {days.map((day) => {
        const dateStr = formatDate(year, month, day);
        const dow = new Date(year, month, day).getDay();
        const isOff = dow === 0 || dow === 6 || holidays.has(dateStr);
        const isToday = dateStr === today;
        const matched = itemsOnDate(items, dateStr);
        return (
          <td
            key={day}
            className={`border-b border-r border-slate-200 p-0 align-top ${
              isOff ? "bg-slate-100" : isToday ? "bg-yellow-50" : "bg-white"
            }`}
          >
            {matched.map((t) => {
              const showLabel = isBarStart(t, dateStr);
              return (
                <div
                  key={t.id}
                  className={`mx-0 h-5 ${t.is_done ? barDoneBg : barBg} ${
                    showLabel ? "rounded-l pl-1" : ""
                  } flex items-center text-[8px] font-medium leading-none text-white`}
                  title={t.title}
                >
                  {showLabel && (
                    <span className="truncate">{t.title}</span>
                  )}
                </div>
              );
            })}
          </td>
        );
      })}
    </tr>
  );
}
