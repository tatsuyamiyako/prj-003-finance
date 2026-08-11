import { createClient } from "@/lib/supabase/server";
import { formatYen, formatPercent, statusLabel, type ProjectProfit } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: profits }, { data: monthly }] = await Promise.all([
    supabase
      .from("project_profits")
      .select("*")
      .order("revenue_month", { ascending: false }),
    supabase
      .from("monthly_summary")
      .select("*")
      .order("month", { ascending: false })
      .limit(12),
  ]);

  const totalRevenue = (profits ?? []).reduce(
    (s: number, p: ProjectProfit) => s + Number(p.revenue_excl_tax),
    0,
  );
  const totalCost = (profits ?? []).reduce(
    (s: number, p: ProjectProfit) => s + Number(p.cost),
    0,
  );
  const totalProfit = totalRevenue - totalCost;
  const totalMargin = totalRevenue > 0 ? totalProfit / totalRevenue : null;

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">
        利益ダッシュボード
      </h1>

      <div className="mt-4 grid grid-cols-4 gap-4">
        <StatCard label="売上合計" value={formatYen(totalRevenue)} />
        <StatCard label="原価合計" value={formatYen(totalCost)} />
        <StatCard label="粗利合計" value={formatYen(totalProfit)} />
        <StatCard label="粗利率" value={formatPercent(totalMargin)} />
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        案件別利益
      </h2>
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">クライアント</th>
              <th className="px-3 py-2">事業</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2">売上月</th>
              <th className="px-3 py-2 text-right">売上(税抜)</th>
              <th className="px-3 py-2 text-right">原価</th>
              <th className="px-3 py-2 text-right">粗利</th>
              <th className="px-3 py-2 text-right">粗利率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(profits ?? []).map((p: ProjectProfit) => (
              <tr key={p.project_id} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">
                  {p.code}
                </td>
                <td className="px-3 py-2 text-slate-700">{p.client_name}</td>
                <td className="px-3 py-2 text-slate-500">
                  {p.business_name ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">
                  {statusLabel(p.status)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {p.revenue_month?.slice(0, 7) ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(p.revenue_excl_tax)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(p.cost)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(p.gross_profit)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatPercent(p.gross_margin)}
                </td>
              </tr>
            ))}
            {(profits ?? []).length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  案件を登録すると自動で利益が計算されます。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-sm font-semibold text-slate-900">
        月次サマリー
      </h2>
      <div className="mt-2 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="px-3 py-2">月</th>
              <th className="px-3 py-2 text-right">売上</th>
              <th className="px-3 py-2 text-right">原価</th>
              <th className="px-3 py-2 text-right">粗利</th>
              <th className="px-3 py-2 text-right">粗利率</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(monthly ?? []).map((m: Record<string, unknown>) => (
              <tr key={m.month as string} className="hover:bg-slate-50">
                <td className="whitespace-nowrap px-3 py-2 text-slate-700">
                  {(m.month as string)?.slice(0, 7)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(m.revenue as number)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(m.cost as number)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(m.gross_profit as number)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatPercent(m.gross_margin as number | null)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
