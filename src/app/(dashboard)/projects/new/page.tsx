import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { createProject } from "../actions";
import type { Business, Member } from "@/lib/types";

export default async function NewProjectPage() {
  const supabase = await createClient();
  const [{ data: businesses }, { data: members }, { data: projects }] =
    await Promise.all([
      supabase.from("businesses").select("*").order("sort_order"),
      supabase.from("members").select("*").eq("is_active", true).order("name"),
      supabase.from("projects").select("code").order("code", { ascending: false }).limit(1),
    ]);

  const lastCode = (projects ?? [])[0]?.code as string | undefined;
  const nextNumber = lastCode
    ? String(Number(lastCode.replace(/^PRJ-/, "")) + 1).padStart(3, "0")
    : "001";

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">新規案件登録</h1>
      <div className="mt-4">
        <ProjectForm
          businesses={(businesses ?? []) as Business[]}
          members={(members ?? []) as Member[]}
          nextCodeNumber={nextNumber}
          action={createProject}
        />
      </div>
    </div>
  );
}
