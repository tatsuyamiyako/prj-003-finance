import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  taskStatusLabel,
  taskStatusBadgeClass,
  clientLabel,
  taskPriorityBadgeClass,
  type Task,
  type TaskPriority,
  type Project,
  type Member,
} from "@/lib/types";
import { createTask, deleteTask, toggleTaskStatus, pickTaskForToday, unpickTaskForToday } from "./actions";
import { DeleteButton } from "../delete-button";
import { QuickAddForm } from "./quick-add-form";
import { TodayTaskPicker } from "./today-task-picker";

type TaskWithRelations = Task & {
  project: { id: string; code: string; client_name: string; name: string | null } | null;
  member: { name: string } | null;
};

type ProjectGroup = {
  project: { id: string; code: string; client_name: string; name: string | null };
  tasks: TaskWithRelations[];
  doneCount: number;
  totalCount: number;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; assigned?: string }>;
}) {
  const { status, assigned } = await searchParams;
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  let query = supabase
    .from("tasks")
    .select("*, project:projects(id, code, client_name, name), member:members!assigned_to(name)")
    .order("priority")
    .order("due_date", { ascending: true, nullsFirst: false });

  if (status) {
    query = query.eq("status", status);
  }
  if (assigned) {
    query = query.eq("assigned_to", assigned);
  }

  const [{ data: tasks }, { data: members }, { data: projects }] = await Promise.all([
    query,
    supabase.from("members").select("id, name").eq("is_active", true).order("name"),
    supabase.from("projects").select("id, code, client_name, name").neq("status", "lost").order("code"),
  ]);

  let todayPicks: { task_id: string }[] = [];
  if (assigned) {
    const { data, error } = await supabase
      .from("daily_task_picks")
      .select("task_id")
      .eq("member_id", assigned)
      .eq("pick_date", today);
    if (!error) todayPicks = data ?? [];
  }

  const assignedMember = assigned ? (members ?? []).find((m) => m.id === assigned) : null;

  const allTasks = (tasks ?? []) as unknown as TaskWithRelations[];
  const pickedTaskIds = new Set(todayPicks.map((p) => p.task_id));

  const pickedTasks = assigned ? allTasks.filter((t) => pickedTaskIds.has(t.id)) : [];
  const unpickedActiveTasks = assigned
    ? allTasks.filter((t) => !pickedTaskIds.has(t.id) && t.status !== "done")
    : [];

  const pickedDone = pickedTasks.filter((t) => t.status === "done").length;
  const pickedTotal = pickedTasks.length;

  const projectMap = new Map<string, ProjectGroup>();
  const ungrouped: TaskWithRelations[] = [];

  for (const t of allTasks) {
    if (t.project) {
      const key = t.project.id;
      if (!projectMap.has(key)) {
        projectMap.set(key, {
          project: t.project,
          tasks: [],
          doneCount: 0,
          totalCount: 0,
        });
      }
      const group = projectMap.get(key)!;
      group.tasks.push(t);
      group.totalCount++;
      if (t.status === "done") group.doneCount++;
    } else {
      ungrouped.push(t);
    }
  }

  const projectGroups = Array.from(projectMap.values()).sort((a, b) =>
    a.project.code.localeCompare(b.project.code)
  );

  const hasFilter = !!(status || assigned);

  function priorityLabel(v: TaskPriority) {
    return v === "high" ? "高" : v === "medium" ? "中" : "低";
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr + "T00:00:00");
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  function renderTask(task: TaskWithRelations) {
    const isOverdue = task.due_date && task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);
    const isDone = task.status === "done";
    const isPicked = pickedTaskIds.has(task.id);
    return (
      <div
        key={task.id}
        className={`rounded-md border border-slate-100 bg-white px-3 py-2 ${isDone ? "opacity-50" : ""}`}
      >
        <div className="flex items-center gap-3">
          <form action={toggleTaskStatus} className="shrink-0">
            <input type="hidden" name="id" value={task.id} />
            <input type="hidden" name="current_status" value={task.status} />
            <button type="submit" className={`flex h-5 w-5 items-center justify-center rounded border ${isDone ? "border-emerald-400 bg-emerald-100 text-emerald-600" : "border-slate-300 text-transparent hover:border-slate-400"}`}>
              {isDone && <span className="text-xs">&#10003;</span>}
            </button>
          </form>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadgeClass(task.status)}`}>
            {taskStatusLabel(task.status)}
          </span>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(task.priority)}`}>
            {priorityLabel(task.priority)}
          </span>
          <div className="min-w-0 flex-1">
            <Link href={`/tasks/${task.id}`} className={`text-sm hover:underline ${isDone ? "text-slate-400 line-through" : "text-slate-900"}`}>
              {task.title}
            </Link>
            {task.description && (
              <p className={`mt-0.5 truncate text-xs ${isDone ? "text-slate-300 line-through" : "text-slate-400"}`}>{task.description}</p>
            )}
          </div>
          {isPicked && (
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              今日
            </span>
          )}
          {task.member && (
            <span className="shrink-0 text-xs text-slate-500">{task.member.name}</span>
          )}
          {task.due_date && (
            <span className={`shrink-0 text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
              〆 {formatDate(task.due_date)}
            </span>
          )}
          <div className="flex shrink-0 items-center gap-1">
            <Link href={`/tasks/${task.id}`} className="text-xs text-slate-400 hover:text-slate-700">編集</Link>
            <DeleteButton action={deleteTask} id={task.id} confirmMessage={`「${task.title}」を本当に削除しますか？`} />
          </div>
        </div>
        {task.ai_comment && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-md bg-violet-50 px-2.5 py-1.5">
            <span className="shrink-0 text-xs text-violet-500">AI</span>
            <p className="text-xs text-violet-700">{task.ai_comment}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">
          {assignedMember ? `${assignedMember.name}のタスク` : "タスク管理"}
        </h1>
        <Link
          href="/tasks/new"
          className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          詳細入力
        </Link>
      </div>

      {/* Today's Tasks Section - only when filtered by member */}
      {assigned && assignedMember && (
        <section className="mt-4 rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-blue-900">
              今日やるタスク
              {pickedTotal > 0 && (
                <span className="ml-2 text-xs font-normal text-blue-600">
                  {pickedDone}/{pickedTotal} 完了
                </span>
              )}
            </h2>
          </div>
          {pickedTotal > 0 && (
            <div className="mt-2 h-1.5 w-full rounded-full bg-blue-200">
              <div
                className="h-1.5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${pickedTotal > 0 ? Math.round((pickedDone / pickedTotal) * 100) : 0}%` }}
              />
            </div>
          )}
          <div className="mt-3 space-y-1.5">
            {pickedTasks.length > 0 ? (
              pickedTasks.map((task) => {
                const done = task.status === "done";
                return (
                <div
                  key={task.id}
                  className={`flex items-center gap-3 rounded-md bg-white px-3 py-2 ${done ? "opacity-50" : ""}`}
                >
                  <form action={toggleTaskStatus} className="shrink-0">
                    <input type="hidden" name="id" value={task.id} />
                    <input type="hidden" name="current_status" value={task.status} />
                    <button type="submit" className={`flex h-5 w-5 items-center justify-center rounded border ${done ? "border-emerald-400 bg-emerald-100 text-emerald-600" : "border-slate-300 text-transparent hover:border-slate-400"}`}>
                      {done && <span className="text-xs">&#10003;</span>}
                    </button>
                  </form>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(task.priority)}`}>
                    {priorityLabel(task.priority)}
                  </span>
                  <Link href={`/tasks/${task.id}`} className={`min-w-0 flex-1 truncate text-sm hover:underline ${done ? "text-slate-400 line-through" : "text-slate-900"}`}>
                    {task.title}
                  </Link>
                  {task.project && (
                    <span className="shrink-0 text-xs text-slate-400">{task.project.code}</span>
                  )}
                  {task.due_date && (
                    <span className="shrink-0 text-xs text-slate-400">〆 {formatDate(task.due_date)}</span>
                  )}
                  <form action={unpickTaskForToday}>
                    <input type="hidden" name="task_id" value={task.id} />
                    <input type="hidden" name="member_id" value={assigned} />
                    <button type="submit" className="text-xs text-slate-400 hover:text-red-500">
                      外す
                    </button>
                  </form>
                </div>
                );
              })
            ) : (
              <p className="py-3 text-center text-sm text-blue-400">
                まだタスクが選ばれていません
              </p>
            )}
          </div>
          {/* Picker to add tasks */}
          {unpickedActiveTasks.length > 0 && (
            <TodayTaskPicker
              tasks={unpickedActiveTasks.map((t) => ({
                id: t.id,
                title: t.title,
                projectCode: t.project?.code ?? null,
                priority: t.priority,
                dueDate: t.due_date,
              }))}
              memberId={assigned}
              pickAction={pickTaskForToday}
            />
          )}
        </section>
      )}

      <div className="mt-4">
        <QuickAddForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name" | "name">[]}
          members={(members ?? []) as Pick<Member, "id" | "name">[]}
          action={createTask}
          assignedTo={assigned}
        />
      </div>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">ステータス</label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            <option value="todo">未着手</option>
            <option value="in_progress">進行中</option>
            <option value="done">完了</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">担当者</label>
          <select
            name="assigned"
            defaultValue={assigned ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            {(members ?? []).map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
        >
          絞り込む
        </button>
        {hasFilter && (
          <Link
            href="/tasks"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            クリア
          </Link>
        )}
      </form>

      <div className="mt-6 space-y-6">
        {projectGroups.map((group) => {
          const pct = group.totalCount > 0 ? Math.round((group.doneCount / group.totalCount) * 100) : 0;
          return (
            <div key={group.project.id} className="rounded-lg border border-slate-200 bg-slate-50">
              <div className="border-b border-slate-200 px-4 py-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-900">
                    {group.project.code} — {clientLabel(group.project.client_name)}
                    {group.project.name ? ` / ${group.project.name}` : ""}
                  </h2>
                  <span className="text-xs text-slate-500">
                    {group.doneCount}/{group.totalCount} 完了
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1 p-2">
                {group.tasks.map(renderTask)}
              </div>
            </div>
          );
        })}

        {ungrouped.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-slate-50">
            <div className="border-b border-slate-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-slate-500">その他（案件未紐付け）</h2>
            </div>
            <div className="space-y-1 p-2">
              {ungrouped.map(renderTask)}
            </div>
          </div>
        )}

        {projectGroups.length === 0 && ungrouped.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            タスクがありません。
          </div>
        )}
      </div>
    </div>
  );
}
