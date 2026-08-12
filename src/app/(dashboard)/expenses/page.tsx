import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/types";
import { deleteExpense } from "./actions";
import { DeleteButton } from "../delete-button";

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; type?: string }>;
}) {
  const { month, type } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("expenses")
    .select(
      "*, project:projects(code, client_name), category:expense_categories(name), paid_by:members(name)",
    )
    .order("incurred_on", { ascending: false });

  if (month) {
    query = query
      .gte("incurred_on", `${month}-01`)
      .lt("incurred_on", nextMonth(month));
  }

  if (type === "fixed") {
    query = query.eq("is_fixed", true);
  } else if (type === "variable") {
    query = query.eq("is_fixed", false);
  }

  const { data: expenses } = await query;
  const hasFilter = !!(month || type);

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

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">月で絞り込み</label>
          <input
            type="month"
            name="month"
            defaultValue={month ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">種別</label>
          <select
            name="type"
            defaultValue={type ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            <option value="fixed">固定費</option>
            <option value="variable">変動費</option>
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
        >
          絞り込む
        </button>
        {hasFilter && (
          <Link
            href="/expenses"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            クリア
          </Link>
        )}
      </form>

      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2">種別</th>
              <th className="px-3 py-2">日付</th>
              <th className="px-3 py-2">案件</th>
              <th className="px-3 py-2">カテゴリ</th>
              <th className="px-3 py-2">内容</th>
              <th className="px-3 py-2 text-right">金額</th>
              <th className="px-3 py-2">立替者</th>
              <th className="px-3 py-2 w-0">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(expenses ?? []).map((e: Record<string, unknown>) => (
              <tr key={e.id as string} className="hover:bg-slate-50">
                <td className="px-3 py-2">
                  {(e.is_fixed as boolean) ? (
                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">固定</span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">変動</span>
                  )}
                </td>
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
                  <DeleteButton
                    action={deleteExpense}
                    id={e.id as string}
                    confirmMessage={`「${e.description as string}」を本当に削除しますか？`}
                  />
                </td>
              </tr>
            ))}
            {(expenses ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={8}
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
