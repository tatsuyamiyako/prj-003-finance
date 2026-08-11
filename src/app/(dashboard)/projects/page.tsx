import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatYen, statusLabel, type Project, type ProjectStatus } from "@/lib/types";
import { deleteProject } from "./actions";

export default async function ProjectsPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">案件管理</h1>
        <Link
          href="/projects/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          新規案件
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">クライアント</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2 text-right">売上(税抜)</th>
              <th className="px-3 py-2">請求書</th>
              <th className="px-3 py-2">着金</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(projects ?? []).map((p: Project) => (
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">
                  <Link href={`/projects/${p.id}`} className="hover:underline">
                    {p.code}
                  </Link>
                </td>
                <td className="px-3 py-2 text-slate-700">{p.client_name}</td>
                <td className="px-3 py-2 text-slate-700">
                  {statusLabel(p.status as ProjectStatus)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(p.revenue_excl_tax)}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {p.invoice_status === "sent" ? "送付済" : "未送付"}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {p.payment_status === "paid" ? "済" : "未"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    編集
                  </Link>
                  <form action={deleteProject} className="ml-2 inline">
                    <input type="hidden" name="id" value={p.id} />
                    <button
                      type="submit"
                      className="text-red-400 hover:text-red-600"
                    >
                      削除
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {(projects ?? []).length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-400">
                  案件がまだ登録されていません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
