import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { createProject } from "../actions";
import type { Business, Member } from "@/lib/types";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const [{ data: businesses }, { data: members }] = await Promise.all([
    supabase.from("businesses").select("*").order("sort_order"),
    supabase.from("members").select("*").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">新規案件登録</h1>
      <div className="mt-4">
        <ProjectForm
          businesses={(businesses ?? []) as Business[]}
          members={(members ?? []) as Member[]}
          action={createProject}
        />
      </div>
    </div>
  );
}
