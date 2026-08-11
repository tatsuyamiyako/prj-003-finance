"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createExpense(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const projectId = formData.get("project_id") as string;

  const { error } = await supabase.from("expenses").insert({
    incurred_on: formData.get("incurred_on") as string,
    project_id: projectId === "__common__" ? null : projectId || null,
    category_id: (formData.get("category_id") as string) || null,
    description: formData.get("description") as string,
    amount: Number(formData.get("amount")) || 0,
    paid_by_member_id: (formData.get("paid_by_member_id") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw new Error(error.message);
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

  const { error } = await supabase
    .from("expenses")
    .update({
      incurred_on: formData.get("incurred_on") as string,
      project_id: projectId === "__common__" ? null : projectId || null,
      category_id: (formData.get("category_id") as string) || null,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")) || 0,
      paid_by_member_id: (formData.get("paid_by_member_id") as string) || null,
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
