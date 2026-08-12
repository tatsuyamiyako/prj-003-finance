import { createClient } from "@/lib/supabase/server";
import {
  taskStatusLabel,
  taskStatusBadgeClass,
  taskPriorityBadgeClass,
  type Task,
  type TaskPriority,
} from "@/lib/types";
import Link from "next/link";

type TaskWithRelations = Task & {
  project: { id: string; code: string; client_name: string; name: string | null } | null;
  member: { name: string } | null;
};

export default async function ReportPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today;
  const isToday = targetDate === today;
  const isPast = targetDate < today;

  const prevDate = addDays(targetDate, -1);
  const nextDate = addDays(targetDate, 1);
  const canGoNext = nextDate <= today;

  const archiveDays = Array.from({ length: 7 }, (_, i) => addDays(today, -(i + 1)));

  const [{ data: tasks }, { data: members }, { data: dailyPicks }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, project:projects(id, code, client_name, name), member:members!assigned_to(name)")
      .order("priority")
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase.from("members").select("id, name").eq("is_active", true).order("name"),
    supabase
      .from("daily_task_picks")
      .select("task_id, member_id")
      .eq("pick_date", targetDate),
  ]);

  const allTasks = (tasks ?? []) as unknown as TaskWithRelations[];

  const doneTasks = allTasks.filter((t) => t.status === "done");
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress");
  const todoTasks = allTasks.filter((t) => t.status === "todo");
  const overdueTasks = allTasks.filter(
    (t) => t.due_date && t.status !== "done" && t.due_date < targetDate
  );
  const dueSoonTasks = allTasks.filter(
    (t) =>
      t.due_date &&
      t.status !== "done" &&
      t.due_date >= targetDate &&
      t.due_date <= addDays(targetDate, 3)
  );

  const completedOnDate = doneTasks.filter(
    (t) => t.updated_at && t.updated_at.slice(0, 10) === targetDate
  );

  const nextTasks = [...inProgressTasks, ...todoTasks]
    .sort((a, b) => {
      const pa = priorityWeight(a.priority);
      const pb = priorityWeight(b.priority);
      if (pa !== pb) return pa - pb;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 5);

  const totalActive = inProgressTasks.length + todoTasks.length;
  const totalAll = allTasks.length;
  const doneRate = totalAll > 0 ? Math.round((doneTasks.length / totalAll) * 100) : 0;

  const memberStats = (members ?? []).map((m) => {
    const memberTasks = allTasks.filter((t) => t.assigned_to === m.id);
    const done = memberTasks.filter((t) => t.status === "done").length;
    const active = memberTasks.filter((t) => t.status !== "done").length;
    const doneOnDate = memberTasks.filter(
      (t) => t.status === "done" && t.updated_at?.slice(0, 10) === targetDate
    ).length;
    return { name: m.name, total: memberTasks.length, done, active, doneOnDate };
  });

  const pickedTaskIds = new Set((dailyPicks ?? []).map((p) => p.task_id));
  const pickedTasks = allTasks.filter((t) => pickedTaskIds.has(t.id));
  const pickedDone = pickedTasks.filter((t) => t.status === "done").length;
  const pickedTotal = pickedTasks.length;

  const memberDailyStats = (members ?? []).map((m) => {
    const memberPicks = (dailyPicks ?? []).filter((p) => p.member_id === m.id);
    const memberPickedIds = new Set(memberPicks.map((p) => p.task_id));
    const memberPickedTasks = allTasks.filter((t) => memberPickedIds.has(t.id));
    const done = memberPickedTasks.filter((t) => t.status === "done").length;
    return { name: m.name, picked: memberPickedTasks.length, done, remaining: memberPickedTasks.length - done };
  });

  const aiComments = allTasks
    .filter((t) => t.ai_comment && t.status !== "done")
    .map((t) => ({
      title: t.title,
      project: t.project ? `${t.project.code} ${t.project.client_name}` : null,
      comment: t.ai_comment!,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            デイリーレポート
            {isPast && <span className="ml-2 text-sm font-normal text-slate-400">(アーカイブ)</span>}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{formatDate(targetDate)}</p>
        </div>
        <Link
          href="/tasks"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          タスク一覧へ
        </Link>
      </div>

      {/* Date Navigation */}
      <div className="flex items-center gap-3">
        <Link
          href={`/tasks/report?date=${prevDate}`}
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          &larr; 前日
        </Link>
        {!isToday && (
          <Link
            href="/tasks/report"
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            今日
          </Link>
        )}
        {canGoNext ? (
          <Link
            href={`/tasks/report?date=${nextDate}`}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            翌日 &rarr;
          </Link>
        ) : (
          <span className="rounded-md border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-300">
            翌日 &rarr;
          </span>
        )}
      </div>

      {/* Past Week Archive */}
      <section>
        <h2 className="text-xs font-medium text-slate-500">過去1週間</h2>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <Link
            href="/tasks/report"
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              isToday
                ? "bg-slate-900 text-white"
                : "border border-slate-200 text-slate-600 hover:bg-slate-100"
            }`}
          >
            今日
          </Link>
          {archiveDays.map((d) => (
            <Link
              key={d}
              href={`/tasks/report?date=${d}`}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                targetDate === d
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {formatShortDate(d)}
            </Link>
          ))}
        </div>
      </section>

      {/* Today's Picked Tasks Progress */}
      {pickedTotal > 0 && (
        <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-blue-900">
              {isToday ? "今日" : formatShortDate(targetDate)}やるタスクの進捗
            </h2>
            <span className="text-xs font-medium text-blue-600">
              {pickedDone}/{pickedTotal} 完了 ({pickedTotal > 0 ? Math.round((pickedDone / pickedTotal) * 100) : 0}%)
            </span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-blue-200">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${pickedTotal > 0 ? Math.round((pickedDone / pickedTotal) * 100) : 0}%` }}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {pickedTasks.map((t) => (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-md bg-white px-3 py-1.5 ${t.status === "done" ? "opacity-50" : ""}`}
              >
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadgeClass(t.status)}`}>
                  {taskStatusLabel(t.status)}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(t.priority)}`}>
                  {priorityLabel(t.priority)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-slate-900">{t.title}</span>
                {t.project && <span className="shrink-0 text-xs text-slate-400">{t.project.code}</span>}
                {t.member && <span className="shrink-0 text-xs text-slate-500">{t.member.name}</span>}
              </div>
            ))}
          </div>
          {/* Per-member daily progress */}
          {memberDailyStats.some((m) => m.picked > 0) && (
            <div className="mt-3 border-t border-blue-200 pt-3">
              <h3 className="text-xs font-medium text-blue-700">メンバー別</h3>
              <div className="mt-1.5 space-y-1">
                {memberDailyStats.filter((m) => m.picked > 0).map((m) => (
                  <div key={m.name} className="flex items-center gap-2 text-xs">
                    <span className="w-16 font-medium text-slate-700">{m.name}</span>
                    <div className="h-1.5 flex-1 rounded-full bg-blue-200">
                      <div
                        className="h-1.5 rounded-full bg-blue-500"
                        style={{ width: `${m.picked > 0 ? Math.round((m.done / m.picked) * 100) : 0}%` }}
                      />
                    </div>
                    <span className="text-slate-500">{m.done}/{m.picked}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
      {pickedTotal === 0 && isToday && (
        <section className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <p className="text-center text-sm text-blue-400">
            今日やるタスクがまだ選ばれていません。各メンバーのタスク一覧から選んでください。
          </p>
        </section>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="全タスク" value={totalAll} />
        <StatCard label="完了" value={doneTasks.length} sub={`${doneRate}%`} color="emerald" />
        <StatCard label="進行中" value={inProgressTasks.length} color="amber" />
        <StatCard label="未着手" value={todoTasks.length} color="slate" />
      </div>

      {/* Overdue Alert */}
      {overdueTasks.length > 0 && (
        <section className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h2 className="text-sm font-semibold text-red-800">
            期限超過 ({overdueTasks.length}件)
          </h2>
          <div className="mt-2 space-y-1.5">
            {overdueTasks.map((t) => (
              <TaskRow key={t.id} task={t} highlight="overdue" />
            ))}
          </div>
        </section>
      )}

      {/* Due Soon */}
      {dueSoonTasks.length > 0 && (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h2 className="text-sm font-semibold text-amber-800">
            3日以内に期限 ({dueSoonTasks.length}件)
          </h2>
          <div className="mt-2 space-y-1.5">
            {dueSoonTasks.map((t) => (
              <TaskRow key={t.id} task={t} highlight="soon" />
            ))}
          </div>
        </section>
      )}

      {/* Next Recommended Tasks */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">次にやるべきタスク（優先度順）</h2>
        <div className="mt-2 space-y-1.5">
          {nextTasks.length > 0 ? (
            nextTasks.map((t, i) => (
              <div key={t.id} className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(t.priority)}`}>
                  {priorityLabel(t.priority)}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadgeClass(t.status)}`}>
                  {taskStatusLabel(t.status)}
                </span>
                <Link href={`/tasks/${t.id}`} className="min-w-0 flex-1 truncate text-sm text-slate-900 hover:underline">
                  {t.title}
                </Link>
                {t.project && (
                  <span className="shrink-0 text-xs text-slate-400">{t.project.code}</span>
                )}
                {t.member && (
                  <span className="shrink-0 text-xs text-slate-500">{t.member.name}</span>
                )}
                {t.due_date && (
                  <span className="shrink-0 text-xs text-slate-400">{t.due_date}</span>
                )}
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-sm text-slate-400">残タスクなし</p>
          )}
        </div>
      </section>

      {/* Completed on Target Date */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          {isToday ? "本日" : formatShortDate(targetDate)}完了したタスク
          {completedOnDate.length > 0 && (
            <span className="ml-1 text-xs font-normal text-slate-400">({completedOnDate.length}件)</span>
          )}
        </h2>
        <div className="mt-2">
          {completedOnDate.length > 0 ? (
            <div className="space-y-1.5">
              {completedOnDate.map((t) => (
                <TaskRow key={t.id} task={t} />
              ))}
            </div>
          ) : (
            <p className="rounded-md border border-slate-100 bg-slate-50 py-4 text-center text-sm text-slate-400">
              {isToday ? "本日完了したタスクはまだありません" : "この日に完了したタスクはありません"}
            </p>
          )}
        </div>
      </section>

      {/* Member Stats */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">メンバー別タスク状況</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-2 text-left font-medium text-slate-600">メンバー</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">担当数</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">完了</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">当日完了</th>
                <th className="px-4 py-2 text-right font-medium text-slate-600">残り</th>
                <th className="px-4 py-2 text-left font-medium text-slate-600">進捗</th>
              </tr>
            </thead>
            <tbody>
              {memberStats.map((m) => {
                const pct = m.total > 0 ? Math.round((m.done / m.total) * 100) : 0;
                return (
                  <tr key={m.name} className="border-b border-slate-100 last:border-b-0">
                    <td className="px-4 py-2 font-medium text-slate-900">{m.name}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{m.total}</td>
                    <td className="px-4 py-2 text-right text-emerald-600">{m.done}</td>
                    <td className="px-4 py-2 text-right text-blue-600">{m.doneOnDate}</td>
                    <td className="px-4 py-2 text-right text-slate-600">{m.active}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-full max-w-[100px] rounded-full bg-slate-200">
                          <div
                            className="h-1.5 rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* AI Feedback */}
      {aiComments.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-900">AI フィードバック</h2>
          <div className="mt-2 space-y-2">
            {aiComments.map((c, i) => (
              <div key={i} className="rounded-md border border-violet-200 bg-violet-50 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-violet-500">AI</span>
                  <span className="text-xs font-medium text-slate-700">{c.title}</span>
                  {c.project && (
                    <span className="text-xs text-slate-400">({c.project})</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-violet-700">{c.comment}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Remaining Tasks List */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900">
          全残タスク ({totalActive}件)
        </h2>
        <div className="mt-2 space-y-1">
          {[...inProgressTasks, ...todoTasks].map((t) => (
            <TaskRow key={t.id} task={t} />
          ))}
          {totalActive === 0 && (
            <p className="py-4 text-center text-sm text-slate-400">残タスクなし</p>
          )}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color = "slate",
}: {
  label: string;
  value: number;
  sub?: string;
  color?: "slate" | "emerald" | "amber";
}) {
  const border = {
    slate: "border-slate-200",
    emerald: "border-emerald-200",
    amber: "border-amber-200",
  }[color];
  const text = {
    slate: "text-slate-900",
    emerald: "text-emerald-600",
    amber: "text-amber-600",
  }[color];
  return (
    <div className={`rounded-lg border ${border} bg-white px-4 py-3`}>
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className={`text-2xl font-bold ${text}`}>{value}</span>
        {sub && <span className="text-xs text-slate-400">{sub}</span>}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  highlight,
}: {
  task: TaskWithRelations;
  highlight?: "overdue" | "soon";
}) {
  return (
    <div className="flex items-center gap-3 rounded-md bg-white px-3 py-1.5">
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadgeClass(task.status)}`}>
        {taskStatusLabel(task.status)}
      </span>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(task.priority)}`}>
        {priorityLabel(task.priority)}
      </span>
      <Link href={`/tasks/${task.id}`} className="min-w-0 flex-1 truncate text-sm text-slate-900 hover:underline">
        {task.title}
      </Link>
      {task.project && (
        <span className="shrink-0 text-xs text-slate-400">{task.project.code}</span>
      )}
      {task.member && (
        <span className="shrink-0 text-xs text-slate-500">{task.member.name}</span>
      )}
      {task.due_date && (
        <span
          className={`shrink-0 text-xs ${
            highlight === "overdue"
              ? "font-medium text-red-600"
              : highlight === "soon"
                ? "font-medium text-amber-600"
                : "text-slate-400"
          }`}
        >
          {task.due_date}
        </span>
      )}
    </div>
  );
}

function priorityWeight(p: TaskPriority) {
  return p === "high" ? 0 : p === "medium" ? 1 : 2;
}

function priorityLabel(v: TaskPriority) {
  return v === "high" ? "高" : v === "medium" ? "中" : "低";
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${weekdays[d.getDay()]}）`;
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${d.getMonth() + 1}/${d.getDate()}(${weekdays[d.getDay()]})`;
}
