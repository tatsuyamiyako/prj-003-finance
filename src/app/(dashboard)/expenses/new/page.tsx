import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../expense-form";
import { createExpense } from "../actions";
import type { ExpenseCategory, Member, Project } from "@/lib/types";

export default async function NewExpensePage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: categories }, { data: members }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id, code, client_name")
        .order("code"),
      supabase
        .from("expense_categories")
        .select("*")
        .order("sort_order"),
      supabase
        .from("members")
        .select("*")
        .eq("is_active", true)
        .order("name"),
    ]);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">経費を追加</h1>
      <div className="mt-4">
        <ExpenseForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name">[]}
          categories={(categories ?? []) as ExpenseCategory[]}
          members={(members ?? []) as Member[]}
          action={createExpense}
        />
      </div>
    </div>
  );
}
