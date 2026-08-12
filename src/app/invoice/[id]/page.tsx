import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { InvoiceActions } from "./invoice-actions";

function formatDate(date: Date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export default async function InvoicePage(
  props: { params: Promise<{ id: string }>; searchParams: Promise<{ date?: string; due?: string; item?: string }> },
) {
  const { id } = await props.params;
  const { date, due, item } = await props.searchParams;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();
  const p = project as Project;

  const issueDate = date ? new Date(date) : new Date();
  const dueDate = due ? new Date(due) : (() => {
    const d = new Date(issueDate);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  })();

  const itemName = item || p.name || `${p.client_name}向け制作業務`;
  const tax = p.revenue_incl_tax - p.revenue_excl_tax;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <InvoiceActions projectId={p.id} />

      <div className="mx-auto max-w-[210mm] bg-white px-16 py-12 shadow-sm print:shadow-none print:px-0 print:py-0">
        <h1 className="text-center text-3xl font-bold tracking-widest text-slate-900">
          請 求 書
        </h1>

        <div className="mt-8 flex justify-between">
          <div className="flex-1">
            <p className="text-xl font-bold text-slate-900">
              {p.client_name}
              <span className="ml-2 text-base font-normal">御中</span>
            </p>
            <div className="mt-6 space-y-1 text-sm text-slate-700">
              <p>下記の通りご請求申し上げます。</p>
            </div>
            <div className="mt-4 inline-block border-2 border-slate-900 px-6 py-3">
              <p className="text-xs text-slate-500">ご請求金額（税込）</p>
              <p className="text-2xl font-bold text-slate-900">
                {formatYen(p.revenue_incl_tax)}
              </p>
            </div>
          </div>

          <div className="text-right text-sm text-slate-700">
            <p className="text-slate-500">請求書番号: {p.code}</p>
            <p className="mt-1">発行日: {formatDate(issueDate)}</p>
            <div className="mt-6 space-y-0.5">
              <p className="font-bold text-slate-900">都 達哉</p>
              <p>studiobrew.info@gmail.com</p>
            </div>
          </div>
        </div>

        <table className="mt-10 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-slate-900 text-left">
              <th className="px-3 py-2 font-medium text-slate-700">品目</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">数量</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">単価</th>
              <th className="px-3 py-2 text-right font-medium text-slate-700">金額</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="px-3 py-3 text-slate-900">{itemName}</td>
              <td className="px-3 py-3 text-right text-slate-700">1</td>
              <td className="px-3 py-3 text-right text-slate-700">{formatYen(p.revenue_excl_tax)}</td>
              <td className="px-3 py-3 text-right text-slate-900">{formatYen(p.revenue_excl_tax)}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-slate-500">小計</span>
              <span className="text-slate-900">{formatYen(p.revenue_excl_tax)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-slate-500">消費税（10%）</span>
              <span className="text-slate-900">{formatYen(tax)}</span>
            </div>
            <div className="flex justify-between bg-slate-50 px-3 py-2 font-bold">
              <span className="text-slate-900">合計</span>
              <span className="text-slate-900">{formatYen(p.revenue_incl_tax)}</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-700">お振込先</p>
          <div className="mt-2 text-sm text-slate-700">
            <p>三菱UFJ銀行　田園調布駅前支店</p>
            <p>普通預金　0149848</p>
            <p>ミヤコタツヤ</p>
          </div>
          <p className="mt-4 text-sm text-slate-500">
            お支払期限: {formatDate(dueDate)}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            ※ 振込手数料はお客様のご負担にてお願いいたします。
          </p>
        </div>
      </div>
    </div>
  );
}
