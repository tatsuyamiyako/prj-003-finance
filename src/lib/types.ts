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
  is_fixed: boolean;
};

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export const TASK_STATUSES = [
  { value: "todo", label: "未着手" },
  { value: "in_progress", label: "進行中" },
  { value: "done", label: "完了" },
] as const;

export const TASK_PRIORITIES = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
] as const;

export type Task = {
  id: string;
  title: string;
  description: string | null;
  project_id: string | null;
  assigned_to: string | null;
  schedule_item_id: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  ai_comment: string | null;
  created_at: string;
  updated_at: string;
};

export function taskStatusLabel(value: TaskStatus) {
  return TASK_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function taskStatusBadgeClass(value: TaskStatus) {
  switch (value) {
    case "todo": return "bg-slate-100 text-slate-600";
    case "in_progress": return "bg-amber-50 text-amber-700";
    case "done": return "bg-emerald-50 text-emerald-700";
    default: return "bg-slate-100 text-slate-600";
  }
}

export function taskPriorityBadgeClass(value: TaskPriority) {
  switch (value) {
    case "high": return "bg-red-50 text-red-700";
    case "medium": return "bg-yellow-50 text-yellow-700";
    case "low": return "bg-blue-50 text-blue-600";
    default: return "bg-slate-100 text-slate-600";
  }
}

export type DailyTaskPick = {
  id: string;
  task_id: string;
  member_id: string;
  pick_date: string;
  created_at: string;
};

export type Schedule = {
  id: string;
  project_id: string | null;
  title: string;
  created_at: string;
  updated_at: string;
};

export type ScheduleItemSide = "bruscape" | "client";

export type ScheduleItem = {
  id: string;
  schedule_id: string;
  side: ScheduleItemSide;
  title: string;
  start_date: string | null;
  due_date: string | null;
  sort_order: number;
  is_done: boolean;
  assignee_ids: string[];
  google_event_id: string | null;
  created_at: string;
  updated_at: string;
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
