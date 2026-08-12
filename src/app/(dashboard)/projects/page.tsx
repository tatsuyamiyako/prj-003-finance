import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  formatYen,
  statusLabel,
  statusBadgeClass,
  PROJECT_STATUSES,
  type Project,
  type ProjectStatus,
  clientLabel,
} from "@/lib/types";
import { deleteProject } from "./actions";
import { DeleteButton } from "../delete-button";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; client?: string; invoice?: string; code?: string; revenue_month?: string; payment_month?: string }>;
}) {
  const { status, client, invoice, code, revenue_month, payment_month } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  if (code) {
    query = query.ilike("code", `%${code}%`);
  }
  if (status) {
    query = query.eq("status", status);
  }
  if (client) {
    query = query.eq("client_name", client);
  }
  if (invoice) {
    query = query.eq("invoice_status", invoice);
  }
  if (revenue_month) {
    query = query.eq("revenue_month", `${revenue_month}-01`);
  }
  if (payment_month) {
    query = query.eq("payment_month", `${payment_month}-01`);
  }

  const [{ data: projects }, { data: allProjects }] = await Promise.all([
    query,
    supabase.from("projects").select("client_name").order("client_name"),
  ]);

  const clients = [
    ...new Set((allProjects ?? []).map((p) => p.client_name as string)),
  ];

  const hasFilter = !!(status || client || invoice || code || revenue_month || payment_month);

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

      <form className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">
            コード
          </label>
          <input
            type="text"
            name="code"
            defaultValue={code ?? ""}
            placeholder="PRJ-001"
            className="mt-1 w-28 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            ステータス
          </label>
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
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
        <div>
          <label className="block text-xs font-medium text-slate-500">
            請求書
          </label>
          <select
            name="invoice"
            defaultValue={invoice ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            <option value="sent">送付済</option>
            <option value="not_sent">未送付</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            売上月
          </label>
          <input
            type="month"
            name="revenue_month"
            defaultValue={revenue_month ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500">
            入金月
          </label>
          <input
            type="month"
            name="payment_month"
            defaultValue={payment_month ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
        >
          絞り込む
        </button>
        {hasFilter && (
          <Link
            href="/projects"
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
              <th className="px-3 py-2">コード</th>
              <th className="px-3 py-2">案件名</th>
              <th className="px-3 py-2">クライアント</th>
              <th className="px-3 py-2">ステータス</th>
              <th className="px-3 py-2 text-right">売上(税抜)</th>
              <th className="px-3 py-2">売上月</th>
              <th className="px-3 py-2">入金月</th>
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
                <td className="px-3 py-2 text-slate-700">{p.name ?? "—"}</td>
                <td className="px-3 py-2 text-slate-700">{clientLabel(p.client_name)}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(p.status as ProjectStatus)}`}
                  >
                    {statusLabel(p.status as ProjectStatus)}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                  {formatYen(p.revenue_excl_tax)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {p.revenue_month?.slice(0, 7) ?? "—"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-slate-500">
                  {p.payment_month?.slice(0, 7) ?? "—"}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {p.invoice_status === "sent" ? "送付済" : "未送付"}
                </td>
                <td className="px-3 py-2 text-slate-500">
                  {p.payment_status === "paid" ? "済" : "未"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <Link
                    href={`/invoice/${p.id}`}
                    className="text-slate-500 hover:text-slate-900"
                    target="_blank"
                  >
                    請求書
                  </Link>
                  <Link
                    href={`/projects/${p.id}`}
                    className="ml-2 text-slate-500 hover:text-slate-900"
                  >
                    編集
                  </Link>
                  <DeleteButton
                    action={deleteProject}
                    id={p.id}
                    confirmMessage={`「${p.name ?? p.code}」を本当に削除しますか？`}
                  />
                </td>
              </tr>
            ))}
            {(projects ?? []).length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-slate-400">
                  該当する案件がありません。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
