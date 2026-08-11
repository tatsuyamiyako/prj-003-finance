import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { createProject } from "../actions";
import type { Business } from "@/lib/types";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const { data: businesses } = await supabase
    .from("businesses")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">新規案件登録</h1>
      <div className="mt-4">
        <ProjectForm
          businesses={(businesses ?? []) as Business[]}
          action={createProject}
        />
      </div>
    </div>
  );
}
