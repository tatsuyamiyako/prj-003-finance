"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function toDate(v: string | null): string | null {
  if (!v) return null;
  return v.length === 7 ? `${v}-01` : v;
}

export type ActionState = { error?: string } | undefined;

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };

  const code = `PRJ-${formData.get("code_number") as string}`;
  const splitIds = formData.getAll("split_member_ids") as string[];
  const { error } = await supabase.from("projects").insert({
    code,
    name: (formData.get("name") as string) || null,
    client_name: formData.get("client_name") as string,
    business_id: (formData.get("business_id") as string) || null,
    summary: (formData.get("summary") as string) || null,
    revenue_excl_tax: Number(formData.get("revenue_excl_tax")) || 0,
    revenue_incl_tax: Number(formData.get("revenue_incl_tax")) || 0,
    revenue_month: toDate((formData.get("revenue_month") as string) || null),
    payment_month: toDate((formData.get("payment_month") as string) || null),
    status: (formData.get("status") as string) || "won",
    invoice_status: (formData.get("invoice_status") as string) || "not_sent",
    payment_status: (formData.get("payment_status") as string) || "unpaid",
    split_member_ids: splitIds.length > 0 ? splitIds : null,
    next_action: (formData.get("next_action") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: `案件コード ${code} は既に使われています` };
    }
    return { error: error.message };
  }
  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインしてください" };

  const id = formData.get("id") as string;
  const code = `PRJ-${formData.get("code_number") as string}`;
  const splitIds = formData.getAll("split_member_ids") as string[];
  const { error } = await supabase
    .from("projects")
    .update({
      code,
      name: (formData.get("name") as string) || null,
      client_name: formData.get("client_name") as string,
      business_id: (formData.get("business_id") as string) || null,
      summary: (formData.get("summary") as string) || null,
      revenue_excl_tax: Number(formData.get("revenue_excl_tax")) || 0,
      revenue_incl_tax: Number(formData.get("revenue_incl_tax")) || 0,
      revenue_month: toDate((formData.get("revenue_month") as string) || null),
      payment_month: toDate((formData.get("payment_month") as string) || null),
      status: (formData.get("status") as string) || "won",
      invoice_status: (formData.get("invoice_status") as string) || "not_sent",
      payment_status: (formData.get("payment_status") as string) || "unpaid",
      split_member_ids: splitIds.length > 0 ? splitIds : null,
      next_action: (formData.get("next_action") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) {
    if (error.code === "23505") {
      return { error: `案件コード ${code} は既に使われています` };
    }
    return { error: error.message };
  }
  revalidatePath("/projects");
  redirect("/projects");
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/projects");
}
