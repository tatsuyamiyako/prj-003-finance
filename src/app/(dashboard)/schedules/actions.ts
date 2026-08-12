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
  const start_date = (formData.get("start_date") as string) || null;
  const due_date = (formData.get("due_date") as string) || null;
  const sort_order = parseInt((formData.get("sort_order") as string) || "0", 10);
  const assignee_ids = formData.getAll("assignee_ids") as string[];

  const { error } = await supabase.from("schedule_items").insert({
    schedule_id,
    side,
    title,
    start_date,
    due_date,
    sort_order,
    assignee_ids: assignee_ids.length > 0 ? assignee_ids : [],
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

export async function updateScheduleItemAssignees(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const id = formData.get("id") as string;
  const schedule_id = formData.get("schedule_id") as string;
  const assignee_ids = formData.getAll("assignee_ids") as string[];

  const { error } = await supabase
    .from("schedule_items")
    .update({ assignee_ids, updated_at: new Date().toISOString() })
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

export async function syncScheduleToTasks(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const schedule_id = formData.get("schedule_id") as string;

  const [{ data: schedule }, { data: items }] = await Promise.all([
    supabase.from("schedules").select("project_id").eq("id", schedule_id).single(),
    supabase.from("schedule_items").select("*").eq("schedule_id", schedule_id),
  ]);
  if (!schedule || !items) throw new Error("Schedule not found");

  const bruscapeItems = items.filter((i: { side: string }) => i.side === "bruscape");

  const { data: existingTasks } = await supabase
    .from("tasks")
    .select("id, schedule_item_id, assigned_to")
    .in("schedule_item_id", bruscapeItems.map((i: { id: string }) => i.id));

  const existingMap = new Map<string, string>();
  for (const t of existingTasks ?? []) {
    existingMap.set(`${t.schedule_item_id}__${t.assigned_to}`, t.id);
  }

  const keepTaskIds = new Set<string>();

  for (const item of bruscapeItems) {
    const assignees: string[] = item.assignee_ids ?? [];
    for (const memberId of assignees) {
      const key = `${item.id}__${memberId}`;
      const existingTaskId = existingMap.get(key);

      if (existingTaskId) {
        await supabase
          .from("tasks")
          .update({
            title: item.title,
            due_date: item.due_date,
            project_id: schedule.project_id,
            status: item.is_done ? "done" : "todo",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingTaskId);
        keepTaskIds.add(existingTaskId);
      } else {
        const { data: newTask } = await supabase
          .from("tasks")
          .insert({
            title: item.title,
            project_id: schedule.project_id,
            assigned_to: memberId,
            schedule_item_id: item.id,
            due_date: item.due_date,
            status: item.is_done ? "done" : "todo",
            priority: "medium",
          })
          .select("id")
          .single();
        if (newTask) keepTaskIds.add(newTask.id);
      }
    }
  }

  const allLinkedIds = (existingTasks ?? []).map((t: { id: string }) => t.id);
  const toDelete = allLinkedIds.filter((id: string) => !keepTaskIds.has(id));
  if (toDelete.length > 0) {
    await supabase.from("tasks").delete().in("id", toDelete);
  }

  revalidatePath(`/schedules/${schedule_id}`);
  revalidatePath("/tasks");
}
