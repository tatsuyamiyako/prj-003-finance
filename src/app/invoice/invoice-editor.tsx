"use client";

import { useState } from "react";
import Link from "next/link";
import type { Project } from "@/lib/types";

function formatYen(value: number) {
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

function formatDateJa(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function calcDueDate(issueDateStr: string) {
  const d = new Date(issueDateStr);
  d.setMonth(d.getMonth() + 1);
  d.setDate(15);
  return d.toISOString().slice(0, 10);
}

function toDateStr(date: Date) {
  return date.toISOString().slice(0, 10);
}

type LineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  isTaxIncluded: boolean;
};

type Props = { project: Project };

export function InvoiceEditor({ project }: Props) {
  const today = toDateStr(new Date());

  const [clientName, setClientName] = useState(project.client_name);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(calcDueDate(today));
  const [items, setItems] = useState<LineItem[]>([
    {
      name: project.name || `${project.client_name}向け制作業務`,
      quantity: 1,
      unitPrice: project.revenue_excl_tax,
      taxRate: 10,
      isTaxIncluded: false,
    },
  ]);

  function handleIssueDateChange(value: string) {
    setIssueDate(value);
    setDueDate(calcDueDate(value));
  }

  function updateItem(index: number, updates: Partial<LineItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...updates } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { name: "", quantity: 1, unitPrice: 0, taxRate: 10, isTaxIncluded: false }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function calcLine(item: LineItem) {
    if (item.isTaxIncluded) {
      const total = item.quantity * item.unitPrice;
      const excl = item.taxRate > 0 ? Math.round(total / (1 + item.taxRate / 100)) : total;
      const tax = total - excl;
      return { excl, tax, total };
    }
    const excl = item.quantity * item.unitPrice;
    const tax = Math.round(excl * item.taxRate / 100);
    return { excl, tax, total: excl + tax };
  }

  const lines = items.map(calcLine);
  const subtotal = lines.reduce((s, l) => s + l.excl, 0);
  const totalTax = lines.reduce((s, l) => s + l.tax, 0);
  const grandTotal = subtotal + totalTax;

  const inputCls = "mt-1 w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900";
  const labelCls = "block text-xs font-medium text-slate-500";

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <style>{`@media print { @page { margin: 0; } }`}</style>
      <div className="border-b border-slate-200 bg-white print:hidden">
        <div className="mx-auto max-w-[210mm] px-8 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">請求書の編集</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                PDF保存 / 印刷
              </button>
              <Link
                href={`/projects/${project.id}`}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                案件に戻る
              </Link>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div>
              <label className={labelCls}>宛先（顧客名）</label>
              <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>発行日</label>
              <input type="date" value={issueDate} onChange={(e) => handleIssueDateChange(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>入金期限</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
            </div>
          </div>

          <div className="mt-4">
            <p className={labelCls}>品目</p>
            <div className="mt-1 space-y-2">
              {items.map((item, i) => (
                <div key={i} className="flex items-end gap-2 rounded-md border border-slate-200 bg-slate-50 p-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-slate-400">品名</label>
                    <input type="text" value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} className={inputCls} />
                  </div>
                  <div className="w-16">
                    <label className="text-[10px] text-slate-400">数量</label>
                    <input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })} className={inputCls} />
                  </div>
                  <div className="w-28">
                    <label className="text-[10px] text-slate-400">単価</label>
                    <input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) || 0 })} className={inputCls} />
                  </div>
                  <div className="w-20">
                    <label className="text-[10px] text-slate-400">税率(%)</label>
                    <select value={item.taxRate} onChange={(e) => updateItem(i, { taxRate: Number(e.target.value) })} className={inputCls}>
                      <option value={10}>10%</option>
                      <option value={8}>8%</option>
                      <option value={0}>0%（実費）</option>
                    </select>
                  </div>
                  <div className="w-24">
                    <label className="text-[10px] text-slate-400">入力方式</label>
                    <select value={item.isTaxIncluded ? "incl" : "excl"} onChange={(e) => updateItem(i, { isTaxIncluded: e.target.value === "incl" })} className={inputCls}>
                      <option value="excl">税抜</option>
                      <option value="incl">税込</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    disabled={items.length === 1}
                    className="mb-0.5 rounded px-2 py-1.5 text-sm text-red-400 hover:text-red-600 disabled:opacity-30"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addItem} className="mt-2 text-sm text-slate-500 hover:text-slate-900">
              + 品目を追加
            </button>
          </div>
        </div>
      </div>

      {/* Invoice preview */}
      <div className="mx-auto max-w-[210mm] bg-white px-16 py-12 shadow-sm print:shadow-none print:px-12 print:py-10">
        <h1 className="text-center text-3xl font-bold tracking-widest text-slate-900">請 求 書</h1>

        <div className="mt-8 flex justify-between">
          <div className="flex-1">
            <p className="text-xl font-bold text-slate-900">
              {clientName}
              <span className="ml-2 text-base font-normal">御中</span>
            </p>
            <div className="mt-6 text-sm text-slate-700">
              <p>下記の通りご請求申し上げます。</p>
            </div>
            <div className="mt-4 inline-block border-2 border-slate-900 px-6 py-3">
              <p className="text-xs text-slate-500">ご請求金額（税込）</p>
              <p className="text-2xl font-bold text-slate-900">{formatYen(grandTotal)}</p>
            </div>
          </div>
          <div className="text-right text-sm text-slate-700">
            <p className="text-slate-500">請求書番号: {project.code}</p>
            <p className="mt-1">発行日: {formatDateJa(issueDate)}</p>
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
            {items.map((item, i) => (
              <tr key={i} className="border-b border-slate-200">
                <td className="px-3 py-3 text-slate-900">
                  {item.name}
                  {item.taxRate === 0 && <span className="ml-1 text-xs text-slate-400">※</span>}
                </td>
                <td className="px-3 py-3 text-right text-slate-700">{item.quantity}</td>
                <td className="px-3 py-3 text-right text-slate-700">{formatYen(item.isTaxIncluded ? Math.round(item.unitPrice / (1 + item.taxRate / 100)) : item.unitPrice)}</td>
                <td className="px-3 py-3 text-right text-slate-900">{formatYen(lines[i].excl)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <div className="w-64 text-sm">
            <div className="flex justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-slate-500">小計</span>
              <span className="text-slate-900">{formatYen(subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 px-3 py-2">
              <span className="text-slate-500">消費税</span>
              <span className="text-slate-900">{formatYen(totalTax)}</span>
            </div>
            <div className="flex justify-between bg-slate-50 px-3 py-2 font-bold">
              <span className="text-slate-900">合計</span>
              <span className="text-slate-900">{formatYen(grandTotal)}</span>
            </div>
          </div>
        </div>

        {items.some((item) => item.taxRate === 0) && (
          <p className="mt-2 text-right text-xs text-slate-400">※ 実費精算のため消費税対象外</p>
        )}

        <div className="mt-10 border-t border-slate-200 pt-6">
          <p className="text-sm font-medium text-slate-700">お振込先</p>
          <div className="mt-2 text-sm text-slate-700">
            <p>三菱UFJ銀行　田園調布駅前支店</p>
            <p>普通預金　0149848</p>
            <p>ミヤコタツヤ</p>
          </div>
          <p className="mt-4 text-sm text-slate-500">お支払期限: {formatDateJa(dueDate)}</p>
          <p className="mt-1 text-xs text-slate-400">※ 振込手数料はお客様のご負担にてお願いいたします。</p>
        </div>
      </div>
    </div>
  );
}
