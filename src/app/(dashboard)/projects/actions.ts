"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("projects").insert({
    code: formData.get("code") as string,
    client_name: formData.get("client_name") as string,
    business_id: (formData.get("business_id") as string) || null,
    summary: (formData.get("summary") as string) || null,
    revenue_excl_tax: Number(formData.get("revenue_excl_tax")) || 0,
    revenue_incl_tax: Number(formData.get("revenue_incl_tax")) || 0,
    revenue_month: (formData.get("revenue_month") as string) || null,
    payment_month: (formData.get("payment_month") as string) || null,
    status: (formData.get("status") as string) || "won",
    invoice_status: (formData.get("invoice_status") as string) || "not_sent",
    payment_status: (formData.get("payment_status") as string) || "unpaid",
    next_action: (formData.get("next_action") as string) || null,
    notes: (formData.get("notes") as string) || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/projects");
  redirect("/projects");
}

export async function updateProject(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase
    .from("projects")
    .update({
      code: formData.get("code") as string,
      client_name: formData.get("client_name") as string,
      business_id: (formData.get("business_id") as string) || null,
      summary: (formData.get("summary") as string) || null,
      revenue_excl_tax: Number(formData.get("revenue_excl_tax")) || 0,
      revenue_incl_tax: Number(formData.get("revenue_incl_tax")) || 0,
      revenue_month: (formData.get("revenue_month") as string) || null,
      payment_month: (formData.get("payment_month") as string) || null,
      status: (formData.get("status") as string) || "won",
      invoice_status: (formData.get("invoice_status") as string) || "not_sent",
      payment_status: (formData.get("payment_status") as string) || "unpaid",
      next_action: (formData.get("next_action") as string) || null,
      notes: (formData.get("notes") as string) || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
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
