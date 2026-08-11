export const PROJECT_STATUSES = [
  { value: "lost", label: "0. 失注" },
  { value: "won", label: "2. 受注" },
  { value: "in_progress", label: "3. 進行中" },
  { value: "delivered", label: "4. 納品完了" },
  { value: "paid", label: "5. 入金済み" },
] as const;

export const INVOICE_STATUSES = [
  { value: "not_sent", label: "未送付" },
  { value: "sent", label: "送付済" },
] as const;

export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "未" },
  { value: "paid", label: "済" },
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["value"];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number]["value"];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]["value"];

export type Business = {
  id: string;
  name: string;
  sort_order: number;
};

export type ExpenseCategory = {
  id: string;
  name: string;
  sort_order: number;
};

export type Member = {
  id: string;
  name: string;
  email: string | null;
  is_settlement_participant: boolean;
  is_active: boolean;
};

export type Project = {
  id: string;
  code: string;
  name: string | null;
  client_name: string;
  business_id: string | null;
  summary: string | null;
  revenue_excl_tax: number;
  revenue_incl_tax: number;
  revenue_month: string | null;
  payment_month: string | null;
  status: ProjectStatus;
  invoice_status: InvoiceStatus;
  payment_status: PaymentStatus;
  next_action: string | null;
  notes: string | null;
  split_member_ids: string[] | null;
  needs_review: boolean;
};

export type Expense = {
  id: string;
  incurred_on: string;
  project_id: string | null;
  category_id: string | null;
  description: string;
  amount: number;
  paid_by_member_id: string | null;
  split_member_ids: string[] | null;
  notes: string | null;
  needs_review: boolean;
};

export type ProjectProfit = {
  project_id: string;
  code: string;
  project_name: string | null;
  client_name: string;
  business_name: string | null;
  status: ProjectStatus;
  revenue_month: string | null;
  revenue_excl_tax: number;
  cost: number;
  gross_profit: number;
  gross_margin: number | null;
};

export function statusLabel(value: ProjectStatus) {
  return PROJECT_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function statusBadgeClass(value: ProjectStatus) {
  switch (value) {
    case "lost":
      return "bg-slate-100 text-slate-500";
    case "won":
      return "bg-blue-50 text-blue-700";
    case "in_progress":
      return "bg-amber-50 text-amber-700";
    case "delivered":
      return "bg-violet-50 text-violet-700";
    case "paid":
      return "bg-emerald-50 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

export function formatYen(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `¥${Math.round(value).toLocaleString("ja-JP")}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${(value * 100).toFixed(1)}%`;
}
