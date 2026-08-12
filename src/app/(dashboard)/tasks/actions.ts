"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("tasks").insert({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    project_id: (formData.get("project_id") as string) || null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    status: (formData.get("status") as string) || "todo",
    priority: (formData.get("priority") as string) || "medium",
    due_date: (formData.get("due_date") as string) || null,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function updateTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase.from("tasks").update({
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || null,
    project_id: (formData.get("project_id") as string) || null,
    assigned_to: (formData.get("assigned_to") as string) || null,
    status: (formData.get("status") as string) || "todo",
    priority: (formData.get("priority") as string) || "medium",
    due_date: (formData.get("due_date") as string) || null,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
  redirect("/tasks");
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}

export async function toggleTaskStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const currentStatus = formData.get("current_status") as string;
  const nextStatus = currentStatus === "done" ? "todo" : currentStatus === "todo" ? "in_progress" : "done";

  const { error } = await supabase.from("tasks").update({
    status: nextStatus,
    updated_at: new Date().toISOString(),
  }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/tasks");
}
