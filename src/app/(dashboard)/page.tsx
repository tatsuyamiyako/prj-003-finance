import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatYen,
  formatPercent,
  clientLabel,
  statusLabel,
  statusBadgeClass,
  PROJECT_STATUSES,
  type ProjectProfit,
  type ProjectStatus,
} from "@/lib/types";

function nextMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01-01`
    : `${y}-${String(m + 1).padStart(2, "0")}-01`;
}

const ACTIVE_STATUSES: ProjectStatus[] = ["won", "in_progress", "delivered"];

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    status?: string;
    client?: string;
  }>;
}) {
  const { from, to, status, client } = await searchParams;
  const supabase = await createClient();

  let profitsQuery = supabase
    .from("project_profits")
    .select("*")
    .order("revenue_month", { ascending: false });

  let monthlyQuery = supabase
    .from("monthly_summary")
    .select("*")
    .order("month", { ascending: false });

  if (from) {
    const end = to || from;
    profitsQuery = profitsQuery
      .gte("revenue_month", `${from}-01`)
      .lt("revenue_month", nextMonth(end));
    monthlyQuery = monthlyQuery
      .gte("month", `${from}-01`)
      .lt("month", nextMonth(end));
  } else {
    monthlyQuery = monthlyQuery.limit(12);
  }

  if (status === "all") {
    // no status filter
  } else if (status && status !== "active") {
    profitsQuery = profitsQuery.eq("status", status);
  } else {
    profitsQuery = profitsQuery.in("status", ACTIVE_STATUSES);
  }

  if (client) {
    profitsQuery = profitsQuery.eq("client_name", client);
  }

  const [{ data: profits }, { data: monthly }, { data: allProjects }] =
    await Promise.all([
      profitsQuery,
      monthlyQuery,
      supabase
        .from("project_profits")
        .select("client_name")
        .order("client_name"),
    ]);

  const clients = [
    ...new Set((allProjects ?? []).map((p) => p.client_name as string)),
  ];

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

  const hasFilter = !!(from || (status && status !== "active") || client);

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">
        利益ダッシュボード
      </h1>

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            開始月
          </label>
          <input
            type="month"
            name="from"
            defaultValue={from ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            終了月
          </label>
          <input
            type="month"
            name="to"
            defaultValue={to ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            ステータス
          </label>
          <select
            name="status"
            defaultValue={status ?? "active"}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="active">進行中のみ</option>
            <option value="all">すべて</option>
            {PROJECT_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            クライアント
          </label>
          <select
            name="client"
            defaultValue={client ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {clientLabel(c)}
              </option>
            ))}
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
            href="/"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            クリア
          </Link>
        )}
      </form>

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
              <th className="px-3 py-2">案件名</th>
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
                <td className="px-3 py-2 text-slate-700">
                  {p.project_name ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-700">{clientLabel(p.client_name)}</td>
                <td className="px-3 py-2 text-slate-500">
                  {p.business_name ?? "—"}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status)}`}
                  >
                    {statusLabel(p.status)}
                  </span>
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
                  colSpan={10}
                  className="px-3 py-8 text-center text-slate-400"
                >
                  該当する案件がありません。
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
