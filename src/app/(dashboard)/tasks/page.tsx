import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  taskStatusLabel,
  taskStatusBadgeClass,
  taskPriorityBadgeClass,
  type Task,
  type TaskPriority,
  type Project,
} from "@/lib/types";
import { createTask, deleteTask, toggleTaskStatus } from "./actions";
import { DeleteButton } from "../delete-button";
import { QuickAddForm } from "./quick-add-form";

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
    supabase.from("projects").select("id, code, client_name, name").order("code"),
  ]);

  const assignedMember = assigned ? (members ?? []).find((m) => m.id === assigned) : null;

  const allTasks = (tasks ?? []) as unknown as TaskWithRelations[];

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

  function renderTask(task: TaskWithRelations) {
    const isOverdue = task.due_date && task.status !== "done" && task.due_date < new Date().toISOString().slice(0, 10);
    return (
      <div
        key={task.id}
        className={`flex items-center gap-3 rounded-md border border-slate-100 bg-white px-3 py-2 ${task.status === "done" ? "opacity-50" : ""}`}
      >
        <form action={toggleTaskStatus} className="shrink-0">
          <input type="hidden" name="id" value={task.id} />
          <input type="hidden" name="current_status" value={task.status} />
          <button type="submit">
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusBadgeClass(task.status)}`}>
              {taskStatusLabel(task.status)}
            </span>
          </button>
        </form>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${taskPriorityBadgeClass(task.priority)}`}>
          {priorityLabel(task.priority)}
        </span>
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className="text-sm text-slate-900 hover:underline">
            {task.title}
          </Link>
          {task.description && (
            <p className="mt-0.5 truncate text-xs text-slate-400">{task.description}</p>
          )}
        </div>
        {task.member && (
          <span className="shrink-0 text-xs text-slate-500">{task.member.name}</span>
        )}
        {task.due_date && (
          <span className={`shrink-0 text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-400"}`}>
            {task.due_date}
          </span>
        )}
        <div className="flex shrink-0 items-center gap-1">
          <Link href={`/tasks/${task.id}`} className="text-xs text-slate-400 hover:text-slate-700">編集</Link>
          <DeleteButton action={deleteTask} id={task.id} confirmMessage={`「${task.title}」を本当に削除しますか？`} />
        </div>
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

      <div className="mt-4">
        <QuickAddForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name" | "name">[]}
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
                    {group.project.code} — {group.project.client_name}
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
