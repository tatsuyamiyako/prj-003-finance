import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectForm } from "../project-form";
import { updateProject } from "../actions";
import type { Business, Member, Project } from "@/lib/types";

export default async function EditProjectPage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: project }, { data: businesses }, { data: members }] =
    await Promise.all([
      supabase.from("projects").select("*").eq("id", id).single(),
      supabase.from("businesses").select("*").order("sort_order"),
      supabase.from("members").select("*").eq("is_active", true).order("name"),
    ]);

  if (!project) notFound();

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">案件編集</h1>
      <div className="mt-4">
        <ProjectForm
          businesses={(businesses ?? []) as Business[]}
          members={(members ?? []) as Member[]}
          project={project as Project}
          action={updateProject}
        />
      </div>
    </div>
  );
}
