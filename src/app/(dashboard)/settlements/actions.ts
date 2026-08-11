"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleSettlement(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const month = formData.get("month") as string;
  const memberId = formData.get("member_id") as string;
  const isSettled = formData.get("is_settled") === "true";

  if (isSettled) {
    await supabase
      .from("settlements")
      .delete()
      .eq("period_month", month)
      .eq("member_id", memberId);
  } else {
    await supabase.from("settlements").insert({
      period_month: month,
      member_id: memberId,
      settled_amount: Number(formData.get("balance")) || 0,
    });
  }

  revalidatePath("/settlements");
}
