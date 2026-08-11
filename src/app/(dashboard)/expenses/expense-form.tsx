"use client";

import type { Expense, ExpenseCategory, Member, Project } from "@/lib/types";

type Props = {
  projects: Pick<Project, "id" | "code" | "client_name">[];
  categories: ExpenseCategory[];
  members: Member[];
  expense?: Expense;
  action: (formData: FormData) => Promise<void>;
};

export function ExpenseForm({
  projects,
  categories,
  members,
  expense,
  action,
}: Props) {
  return (
    <form action={action} className="max-w-xl space-y-4">
      {expense && <input type="hidden" name="id" value={expense.id} />}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">
            日付
          </label>
          <input
            type="date"
            name="incurred_on"
            required
            defaultValue={expense?.incurred_on ?? new Date().toISOString().slice(0, 10)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            金額
          </label>
          <input
            type="number"
            name="amount"
            required
            min={0}
            defaultValue={expense?.amount ?? ""}
            placeholder="10000"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          案件 <span className="text-xs text-slate-400">（全社共通費用は「全社共通」を選択）</span>
        </label>
        <select
          name="project_id"
          required
          defaultValue={expense?.project_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        >
          <option value="" disabled>
            案件を選択してください
          </option>
          <option value="__common__">全社共通</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} — {p.client_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          カテゴリ
        </label>
        <select
          name="category_id"
          defaultValue={expense?.category_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        >
          <option value="">未分類</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          内容
        </label>
        <input
          type="text"
          name="description"
          required
          defaultValue={expense?.description ?? ""}
          placeholder="高納商店　シャツ"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          立替者
        </label>
        <select
          name="paid_by_member_id"
          defaultValue={expense?.paid_by_member_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        >
          <option value="">選択なし</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">
          備考
        </label>
        <textarea
          name="notes"
          defaultValue={expense?.notes ?? ""}
          rows={2}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        />
      </div>

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {expense ? "更新" : "登録"}
      </button>
    </form>
  );
}
