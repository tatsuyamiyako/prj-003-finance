import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "../expense-form";
import { updateExpense } from "../actions";
import type { Expense, ExpenseCategory, Member, Project } from "@/lib/types";

export default async function EditExpensePage(
  props: { params: Promise<{ id: string }> },
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: expense }, { data: projects }, { data: categories }, { data: members }] =
    await Promise.all([
      supabase.from("expenses").select("*").eq("id", id).single(),
      supabase.from("projects").select("id, code, client_name").order("code"),
      supabase.from("expense_categories").select("*").order("sort_order"),
      supabase.from("members").select("*").eq("is_active", true).order("name"),
    ]);

  if (!expense) notFound();

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">経費編集</h1>
      <div className="mt-4">
        <ExpenseForm
          projects={(projects ?? []) as Pick<Project, "id" | "code" | "client_name">[]}
          categories={(categories ?? []) as ExpenseCategory[]}
          members={(members ?? []) as Member[]}
          expense={expense as Expense}
          action={updateExpense}
        />
      </div>
    </div>
  );
}
