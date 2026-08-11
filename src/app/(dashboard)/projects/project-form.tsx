"use client";

import type { Business, Project } from "@/lib/types";
import { PROJECT_STATUSES, INVOICE_STATUSES, PAYMENT_STATUSES } from "@/lib/types";

type Props = {
  businesses: Business[];
  project?: Project;
  action: (formData: FormData) => Promise<void>;
};

export function ProjectForm({ businesses, project, action }: Props) {
  return (
    <form action={action} className="max-w-2xl space-y-4">
      {project && <input type="hidden" name="id" value={project.id} />}

      <div className="grid grid-cols-2 gap-4">
        <Field label="案件コード" name="code" required defaultValue={project?.code} placeholder="PRJ-001" />
        <Field label="クライアント名" name="client_name" required defaultValue={project?.client_name} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">事業</label>
        <select
          name="business_id"
          defaultValue={project?.business_id ?? ""}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
        >
          <option value="">選択なし</option>
          {businesses.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="案件概要" name="summary" defaultValue={project?.summary ?? ""} textarea />

      <div className="grid grid-cols-2 gap-4">
        <Field label="売上（税抜）" name="revenue_excl_tax" type="number" defaultValue={project?.revenue_excl_tax ?? 0} />
        <Field label="売上（税込）" name="revenue_incl_tax" type="number" defaultValue={project?.revenue_incl_tax ?? 0} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="売上月" name="revenue_month" type="month" defaultValue={project?.revenue_month?.slice(0, 7) ?? ""} />
        <Field label="入金月" name="payment_month" type="month" defaultValue={project?.payment_month?.slice(0, 7) ?? ""} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SelectField label="ステータス" name="status" options={PROJECT_STATUSES} defaultValue={project?.status ?? "won"} />
        <SelectField label="請求書" name="invoice_status" options={INVOICE_STATUSES} defaultValue={project?.invoice_status ?? "not_sent"} />
        <SelectField label="着金" name="payment_status" options={PAYMENT_STATUSES} defaultValue={project?.payment_status ?? "unpaid"} />
      </div>

      <Field label="ネクストアクション" name="next_action" defaultValue={project?.next_action ?? ""} />
      <Field label="備考" name="notes" defaultValue={project?.notes ?? ""} textarea />

      <button
        type="submit"
        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
      >
        {project ? "更新" : "登録"}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  defaultValue,
  placeholder,
  textarea,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  defaultValue?: string | number;
  placeholder?: string;
  textarea?: boolean;
}) {
  const cls =
    "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900";
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          rows={2}
          className={cls}
        />
      ) : (
        <input
          type={type}
          name={name}
          required={required}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: readonly { value: string; label: string }[];
  defaultValue: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
