import { createClient } from "@/lib/supabase/server";
import { TaskForm } from "../task-form";
import { createTask } from "../actions";
import type { Member, Project } from "@/lib/types";

export default async function NewTaskPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: members }] = await Promise.all([
    supabase.from("projects").select("id, code, client_name, name").order("code"),
    supabase.from("members").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">タスクを追加</h1>
      <div className="mt-4 max-w-xl">
        <TaskForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name" | "name">[]}
          members={(members ?? []) as Member[]}
          action={createTask}
        />
      </div>
    </div>
  );
}
