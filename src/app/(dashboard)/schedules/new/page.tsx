import { createClient } from "@/lib/supabase/server";
import { createSchedule } from "../actions";

export default async function NewSchedulePage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("id, code, client_name, name")
    .neq("status", "lost")
    .order("code");

  const inputCls = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-lg font-semibold text-slate-900">スケジュール作成</h1>
      <form action={createSchedule} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">タイトル</label>
          <input type="text" name="title" required placeholder="例: LP制作スケジュール" className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">関連案件</label>
          <select name="project_id" className={inputCls}>
            <option value="">なし</option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} — {p.client_name}{p.name ? ` / ${p.name}` : ""}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          作成
        </button>
      </form>
    </div>
  );
}
