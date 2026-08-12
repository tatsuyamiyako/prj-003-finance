import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "../task-form";
import { updateTask } from "../actions";
import type { Task, Member, Project } from "@/lib/types";

export default async function EditTaskPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: task }, { data: projects }, { data: members }] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", id).single(),
    supabase.from("projects").select("id, code, client_name, name").neq("status", "lost").order("code"),
    supabase.from("members").select("*").eq("is_active", true).order("name"),
  ]);

  if (!task) notFound();

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">タスク編集</h1>
      <div className="mt-4 max-w-xl">
        <TaskForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name" | "name">[]}
          members={(members ?? []) as Member[]}
          task={task as Task}
          action={updateTask}
        />
      </div>
    </div>
  );
}
