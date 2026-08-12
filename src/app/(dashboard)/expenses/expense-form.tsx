"use client";

import { useState } from "react";
import type { Expense, ExpenseCategory, Member, Project } from "@/lib/types";

type Props = {
  projects: Pick<Project, "id" | "code" | "client_name" | "name">[];
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
  const [recurring, setRecurring] = useState(false);
  const isEdit = !!expense;
  const settlementMembers = members.filter((m) => m.is_settlement_participant);
  const allIds = settlementMembers.map((m) => m.id);
  const initialSplitIds = expense?.split_member_ids ?? allIds;
  const [splitIds, setSplitIds] = useState<string[]>(initialSplitIds);
  const allSelected = splitIds.length === settlementMembers.length;

  return (
    <form action={action} className="max-w-xl space-y-4">
      {expense && <input type="hidden" name="id" value={expense.id} />}

      {!isEdit && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="rounded border-slate-300"
          />
          定期入力（月を指定して一括登録）
        </label>
      )}

      {recurring && !isEdit ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              開始月
            </label>
            <input
              type="month"
              name="month_from"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              終了月
            </label>
            <input
              type="month"
              name="month_to"
              required
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              日付
            </label>
            <input
              type="date"
              name="incurred_on"
              required={!recurring}
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
      )}

      {recurring && !isEdit && (
        <div>
          <label className="block text-sm font-medium text-slate-700">
            月額
          </label>
          <input
            type="number"
            name="amount"
            required
            min={0}
            placeholder="2000"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
          />
        </div>
      )}

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
              {p.code} — {p.client_name}{p.name ? ` / ${p.name}` : ""}
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
          placeholder="Claude Pro / Canva Pro 等"
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
          割り勘対象
        </label>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
          <label className="flex items-center gap-1.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() => setSplitIds(allSelected ? [] : allIds)}
              className="rounded border-slate-300"
            />
            全員
          </label>
          {settlementMembers.map((m) => (
            <label key={m.id} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="checkbox"
                name="split_member_ids"
                value={m.id}
                checked={splitIds.includes(m.id)}
                onChange={(e) =>
                  setSplitIds((prev) =>
                    e.target.checked ? [...prev, m.id] : prev.filter((id) => id !== m.id),
                  )
                }
                className="rounded border-slate-300"
              />
              {m.name}
            </label>
          ))}
        </div>
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
        {isEdit ? "更新" : recurring ? "一括登録" : "登録"}
      </button>
    </form>
  );
}
