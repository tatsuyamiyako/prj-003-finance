"use client";

import Link from "next/link";

export function InvoiceActions({ projectId }: { projectId: string }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-slate-100 px-4 py-3 print:hidden">
      <button
        onClick={() => window.print()}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        PDF保存 / 印刷
      </button>
      <Link
        href={`/projects/${projectId}`}
        className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-white"
      >
        案件に戻る
      </Link>
    </div>
  );
}
