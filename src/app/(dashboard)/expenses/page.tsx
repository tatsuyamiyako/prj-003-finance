import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/types";
import { deleteExpense } from "./actions";

export default async function ExpensesPage() {
  const supabase = await createClient();
  const { data: expenses } = await supabase
    .from("expenses")
    .select(
      "*, project:projects(code, client_name), category:expense_categories(name), paid_by:members(name)",
    )
    .order("incurred_on", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-900">経費一覧</h1>
        <Link
          href="/expenses/new"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          経費を追加
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2">日付</th>
              <th className="px-3 py-2">案件</th>
              <th className="px-3 py-2">カテゴリ</th>
              <th className="px-3 py-2">内容</th>
              <th className="px-3 py-2 text-right">金額</th>
              <th className="px-3 py-2">立替者</th>
              <th className="px-3 py-2">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(expenses ?? []).map((e: Record<string, unknown>) => (
              <tr key={e.id as string} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {e.incurred_on as string}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {e.project
                    ? `${(e.project as Record<string, string>).code}`
                    : "全社共通"}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {(e.category as Record<string, string> | null)?.name ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {e.description as string}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(e.amount as number)}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {(e.paid_by as Record<string, string> | null)?.name ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Link
                    href={`/expenses/${e.id}`}
                    className="text-slate-500 hover:text-slate-900"
                  >
                    編集
                  </Link>
                  <form action={deleteExpense} className="ml-2 inline">
                    <input type="hidden" name="id" value={e.id as string} />
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
            {(expenses ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  経費がまだ登録されていません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
