import { createClient } from "@/lib/supabase/server";
import {
  PHASE_SUGGESTIONS,
  phaseBgClass,
} from "@/lib/types";

type ScheduleRow = {
  id: string;
  title: string;
  phase: string | null;
  project_id: string | null;
  project: { code: string; client_name: string; name: string | null } | null;
  items: { start_date: string | null; due_date: string | null }[];
};

type GanttBar = {
  scheduleId: string;
  scheduleTitle: string;
  phase: string;
  startDate: string;
  endDate: string;
};

type ProjectRow = {
  projectId: string;
  code: string;
  clientName: string;
  projectName: string | null;
  bars: GanttBar[];
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function addMonths(year: number, month: number, n: number) {
  let y = year;
  let m = month + n;
  while (m > 11) { m -= 12; y++; }
  while (m < 0) { m += 12; y--; }
  return { year: y, month: m };
}

function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default async function GanttPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const supabase = await createClient();

  const { data: schedules } = await supabase
    .from("schedules")
    .select("id, title, phase, project_id, project:projects(code, client_name, name), items:schedule_items(start_date, due_date)")
    .not("phase", "is", null)
    .not("project_id", "is", null)
    .order("title");

  const allSchedules = (schedules ?? []) as unknown as ScheduleRow[];

  // Build bars from schedules
  const projectMap = new Map<string, ProjectRow>();

  for (const s of allSchedules) {
    if (!s.project || !s.phase || !s.project_id) continue;

    const dates = s.items
      .flatMap((i) => [i.start_date, i.due_date].filter(Boolean) as string[]);
    if (dates.length === 0) continue;

    const sorted = [...dates].sort();
    const startDate = sorted[0];
    const endDate = sorted[sorted.length - 1];

    if (!projectMap.has(s.project_id)) {
      projectMap.set(s.project_id, {
        projectId: s.project_id,
        code: s.project.code,
        clientName: s.project.client_name,
        projectName: s.project.name,
        bars: [],
      });
    }

    projectMap.get(s.project_id)!.bars.push({
      scheduleId: s.id,
      scheduleTitle: s.title,
      phase: s.phase!,
      startDate,
      endDate,
    });
  }

  const projectRows = [...projectMap.values()].sort((a, b) =>
    a.code.localeCompare(b.code),
  );

  // Date range: 4 months
  const now = new Date();
  let baseYear = now.getFullYear();
  let baseMonth = now.getMonth();
  if (from) {
    const [y, m] = from.split("-").map(Number);
    baseYear = y;
    baseMonth = m - 1;
  }

  const prev = addMonths(baseYear, baseMonth, -1);
  const MONTHS = Array.from({ length: 4 }, (_, i) => addMonths(prev.year, prev.month, i));
  const totalDays = MONTHS.reduce((sum, m) => sum + getDaysInMonth(m.year, m.month), 0);

  const rangeStart = fmtDate(MONTHS[0].year, MONTHS[0].month, 1);
  const lastMonth = MONTHS[MONTHS.length - 1];
  const rangeEnd = fmtDate(lastMonth.year, lastMonth.month, getDaysInMonth(lastMonth.year, lastMonth.month));

  function dayOffset(dateStr: string): number {
    let offset = 0;
    const d = new Date(dateStr + "T00:00:00");
    for (const m of MONTHS) {
      const mStart = new Date(m.year, m.month, 1);
      const mEnd = new Date(m.year, m.month + 1, 0);
      if (d < mStart) return offset;
      if (d <= mEnd) return offset + d.getDate() - 1;
      offset += getDaysInMonth(m.year, m.month);
    }
    return totalDays;
  }

  const prevFrom = `${prev.year}-${String(prev.month + 1).padStart(2, "0")}`;
  const next = addMonths(baseYear, baseMonth, 1);
  const nextFrom = `${next.year}-${String(next.month + 1).padStart(2, "0")}`;
  const today = now.toISOString().slice(0, 10);
  const todayOffset = dayOffset(today);

  // Filter to projects that have bars in visible range
  const visibleProjects = projectRows.filter((p) =>
    p.bars.some((b) => b.endDate >= rangeStart && b.startDate <= rangeEnd),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-slate-900">ガントチャート</h1>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {PHASE_SUGGESTIONS.map((p) => (
          <div key={p} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-sm ${phaseBgClass(p)}`} />
            <span className="text-xs text-slate-600">{p}</span>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <a
          href={`/gantt?from=${prevFrom}`}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
        >
          ← 前月
        </a>
        <span className="text-sm font-medium text-slate-700">
          {MONTHS[0].year}年{MONTHS[0].month + 1}月 〜 {lastMonth.year}年{lastMonth.month + 1}月
        </span>
        <a
          href={`/gantt?from=${nextFrom}`}
          className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
        >
          次月 →
        </a>
        {from && (
          <a
            href="/gantt"
            className="rounded-md border border-slate-300 px-3 py-1 text-sm text-slate-600 hover:bg-slate-50"
          >
            今月
          </a>
        )}
      </div>

      {/* Gantt Chart */}
      <div className="overflow-x-auto rounded-lg border border-slate-300">
        <div className="min-w-[900px]">
          {/* Month headers */}
          <div className="flex border-b border-slate-300 bg-slate-800">
            <div className="w-48 shrink-0 border-r border-slate-600 px-3 py-2 text-xs font-bold text-white">
              案件
            </div>
            <div className="flex flex-1">
              {MONTHS.map((m) => {
                const days = getDaysInMonth(m.year, m.month);
                const widthPct = (days / totalDays) * 100;
                return (
                  <div
                    key={`${m.year}-${m.month}`}
                    className="border-r border-slate-600 px-2 py-2 text-center text-xs font-bold text-white"
                    style={{ width: `${widthPct}%` }}
                  >
                    {m.month + 1}月
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day numbers */}
          <div className="flex border-b border-slate-200 bg-slate-50">
            <div className="w-48 shrink-0 border-r border-slate-200" />
            <div className="flex flex-1">
              {MONTHS.map((m) => {
                const days = getDaysInMonth(m.year, m.month);
                const widthPct = (days / totalDays) * 100;
                return (
                  <div
                    key={`d-${m.year}-${m.month}`}
                    className="flex border-r border-slate-200"
                    style={{ width: `${widthPct}%` }}
                  >
                    {Array.from({ length: days }, (_, i) => {
                      const dateStr = fmtDate(m.year, m.month, i + 1);
                      const dow = new Date(m.year, m.month, i + 1).getDay();
                      const isWeekend = dow === 0 || dow === 6;
                      const show = (i + 1) % 5 === 1 || i === 0;
                      return (
                        <div
                          key={i}
                          className={`flex-1 text-center text-[9px] ${
                            isWeekend ? "bg-slate-100 text-slate-400" : "text-slate-500"
                          } ${dateStr === today ? "bg-yellow-100 font-bold text-yellow-700" : ""}`}
                        >
                          {show ? i + 1 : ""}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Project rows */}
          {visibleProjects.map((project) => {
            const barCount = project.bars.length;
            const rowHeight = Math.max(48, barCount * 28 + 8);
            return (
              <div
                key={project.projectId}
                className="flex border-b border-slate-100 hover:bg-slate-50"
              >
                <div className="w-48 shrink-0 border-r border-slate-200 px-3 py-2">
                  <div className="text-xs font-semibold text-slate-900">
                    {project.code}
                  </div>
                  <div className="mt-0.5 truncate text-[10px] text-slate-500">
                    {project.clientName}
                    {project.projectName ? ` / ${project.projectName}` : ""}
                  </div>
                </div>
                <div className="relative flex-1" style={{ minHeight: `${rowHeight}px` }}>
                  {/* Today line */}
                  {todayOffset >= 0 && todayOffset <= totalDays && (
                    <div
                      className="absolute top-0 bottom-0 w-px bg-red-400 opacity-40"
                      style={{ left: `${(todayOffset / totalDays) * 100}%` }}
                    />
                  )}
                  {project.bars.map((bar, idx) => {
                    const start = Math.max(0, dayOffset(bar.startDate));
                    const end = Math.min(totalDays, dayOffset(bar.endDate) + 1);
                    if (end <= start) return null;
                    const leftPct = (start / totalDays) * 100;
                    const widthPct = ((end - start) / totalDays) * 100;
                    return (
                      <div
                        key={bar.scheduleId}
                        className={`absolute flex items-center rounded px-1.5 text-[10px] font-medium text-white shadow-sm ${phaseBgClass(bar.phase)}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          top: `${4 + idx * 28}px`,
                          height: "22px",
                        }}
                        title={`${bar.phase}: ${bar.startDate} 〜 ${bar.endDate}\n${bar.scheduleTitle}`}
                      >
                        <span className="truncate">{bar.phase}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {visibleProjects.length === 0 && (
            <div className="px-4 py-12 text-center text-sm text-slate-400">
              表示するスケジュールがありません。スケジュール作成時にフェーズを設定してください。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
