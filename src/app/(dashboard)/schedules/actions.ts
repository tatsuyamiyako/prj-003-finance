"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const title = formData.get("title") as string;
  const project_id = (formData.get("project_id") as string) || null;

  const { data, error } = await supabase
    .from("schedules")
    .insert({ title, project_id })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  redirect(`/schedules/${data.id}`);
}

export async function updateSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const project_id = (formData.get("project_id") as string) || null;

  const { error } = await supabase
    .from("schedules")
    .update({ title, project_id, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/schedules/${id}`);
}

export async function deleteSchedule(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const { error } = await supabase.from("schedules").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/schedules");
  redirect("/schedules");
}

export async function addScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const schedule_id = formData.get("schedule_id") as string;
  const side = formData.get("side") as string;
  const title = formData.get("title") as string;
  const due_date = (formData.get("due_date") as string) || null;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);

  const { error } = await supabase.from("schedule_items").insert({
    schedule_id,
    side,
    title,
    due_date,
    sort_order,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/schedules/${schedule_id}`);
}

export async function updateScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const schedule_id = formData.get("schedule_id") as string;
  const title = formData.get("title") as string;
  const due_date = (formData.get("due_date") as string) || null;
  const is_done = formData.get("is_done") === "true";

  const { error } = await supabase
    .from("schedule_items")
    .update({ title, due_date, is_done, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/schedules/${schedule_id}`);
}

export async function toggleScheduleItemDone(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const schedule_id = formData.get("schedule_id") as string;
  const current = formData.get("is_done") === "true";

  const { error } = await supabase
    .from("schedule_items")
    .update({ is_done: !current, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/schedules/${schedule_id}`);
}

export async function deleteScheduleItem(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const schedule_id = formData.get("schedule_id") as string;

  const { error } = await supabase.from("schedule_items").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/schedules/${schedule_id}`);
}
