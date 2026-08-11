"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function monthRange(from: string, to: string): string[] {
  const dates: string[] = [];
  const [y1, m1] = from.split("-").map(Number);
  const [y2, m2] = to.split("-").map(Number);
  let y = y1, m = m1;
  while (y < y2 || (y === y2 && m <= m2)) {
    dates.push(`${y}-${String(m).padStart(2, "0")}-01`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return dates;
}

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const projectId = formData.get("project_id") as string;
  const monthFrom = formData.get("month_from") as string | null;
  const monthTo = formData.get("month_to") as string | null;

  const splitIds = formData.getAll("split_member_ids") as string[];

  const base = {
    project_id: projectId === "__common__" ? null : projectId || null,
    category_id: (formData.get("category_id") as string) || null,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount")) || 0,
    paid_by_member_id: (formData.get("paid_by_member_id") as string) || null,
    split_member_ids: splitIds.length > 0 ? splitIds : null,
    notes: (formData.get("notes") as string) || null,
  };

  if (monthFrom && monthTo) {
    const dates = monthRange(monthFrom, monthTo);
    const rows = dates.map((d) => ({ ...base, incurred_on: d }));
    const { error } = await supabase.from("expenses").insert(rows);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase.from("expenses").insert({
      ...base,
      incurred_on: formData.get("incurred_on") as string,
    });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function updateExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const projectId = formData.get("project_id") as string;

  const splitIds = formData.getAll("split_member_ids") as string[];

  const { error } = await supabase
    .from("expenses")
    .update({
      incurred_on: formData.get("incurred_on") as string,
      project_id: projectId === "__common__" ? null : projectId || null,
      category_id: (formData.get("category_id") as string) || null,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")) || 0,
      paid_by_member_id: (formData.get("paid_by_member_id") as string) || null,
      split_member_ids: splitIds.length > 0 ? splitIds : null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function deleteExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase.from("expenses").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/expenses");
}
