import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/types";

type Project = {
  id: string;
  code: string;
  name: string | null;
  client_name: string;
  revenue_excl_tax: number;
  payment_month: string | null;
  split_member_ids: string[] | null;
};

type Member = {
  id: string;
  name: string;
  is_settlement_participant: boolean;
};

type MemberRevenue = {
  memberId: string;
  memberName: string;
  amount: number;
  projects: { code: string; name: string | null; clientName: string; share: number }[];
};

export default async function RevenueSplitPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;
  const supabase = await createClient();

  const [{ data: projects }, { data: members }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, code, name, client_name, revenue_excl_tax, payment_month, split_member_ids")
      .not("payment_month", "is", null)
      .gt("revenue_excl_tax", 0)
      .order("payment_month", { ascending: false }),
    supabase
      .from("members")
      .select("id, name, is_settlement_participant")
      .eq("is_active", true)
      .order("name"),
  ]);

  const allMembers = (members ?? []) as Member[];
  const settlementIds = allMembers
    .filter((m) => m.is_settlement_participant)
    .map((m) => m.id);

  const allProjects = (projects ?? []) as Project[];

  const paymentMonths = [
    ...new Set(allProjects.map((p) => p.payment_month!.slice(0, 7))),
  ].sort();

  const filtered = month
    ? allProjects.filter((p) => p.payment_month!.startsWith(month))
    : allProjects;

  const revenueByMonth = new Map<string, Map<string, MemberRevenue>>();

  for (const p of filtered) {
    const pm = p.payment_month!.slice(0, 7);
    const splitIds = p.split_member_ids && p.split_member_ids.length > 0
      ? p.split_member_ids
      : settlementIds;
    const share = splitIds.length > 0 ? Math.round(p.revenue_excl_tax / splitIds.length) : 0;

    if (!revenueByMonth.has(pm)) revenueByMonth.set(pm, new Map());
    const monthMap = revenueByMonth.get(pm)!;

    for (const memberId of splitIds) {
      const member = allMembers.find((m) => m.id === memberId);
      if (!member) continue;
      if (!monthMap.has(memberId)) {
        monthMap.set(memberId, {
          memberId,
          memberName: member.name,
          amount: 0,
          projects: [],
        });
      }
      const entry = monthMap.get(memberId)!;
      entry.amount += share;
      entry.projects.push({
        code: p.code,
        name: p.name,
        clientName: p.client_name,
        share,
      });
    }
  }

  const sortedMonths = [...revenueByMonth.keys()].sort().reverse();

  const grandTotals = new Map<string, number>();
  for (const monthMap of revenueByMonth.values()) {
    for (const [memberId, rev] of monthMap) {
      grandTotals.set(memberId, (grandTotals.get(memberId) ?? 0) + rev.amount);
    }
  }

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">個人別売上</h1>
      <p className="mt-1 text-sm text-slate-500">
        入金月ごとに、各メンバーの売上配分を表示します。
      </p>

      <form className="mt-4 flex items-end gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-500">入金月</label>
          <select
            name="month"
            defaultValue={month ?? ""}
            className="mt-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-900"
          >
            <option value="">すべて</option>
            {paymentMonths.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-600"
        >
          絞り込む
        </button>
        {month && (
          <a
            href="/revenue-split"
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            クリア
          </a>
        )}
      </form>

      {!month && grandTotals.size > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-slate-900">累計</h2>
          <div className="mt-2 grid grid-cols-3 gap-4">
            {allMembers
              .filter((m) => grandTotals.has(m.id))
              .map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs text-slate-500">{m.name}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">
                    {formatYen(grandTotals.get(m.id) ?? 0)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}

      {sortedMonths.length === 0 && (
        <p className="mt-8 text-center text-slate-400">
          入金月が設定された案件がありません。
        </p>
      )}

      {sortedMonths.map((pm) => {
        const monthMap = revenueByMonth.get(pm)!;
        const memberRevs = [...monthMap.values()].sort((a, b) => b.amount - a.amount);
        const monthTotal = memberRevs.reduce((s, r) => s + r.amount, 0);

        return (
          <div key={pm} className="mt-6">
            <h2 className="flex items-baseline gap-2 text-sm font-semibold text-slate-700">
              {pm}
              <span className="text-xs font-normal text-slate-400">
                合計 {formatYen(monthTotal)}
              </span>
            </h2>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                    <th className="px-3 py-2">メンバー</th>
                    <th className="px-3 py-2 text-right">売上配分</th>
                    <th className="px-3 py-2">内訳</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {memberRevs.map((r) => (
                    <tr key={r.memberId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-medium text-slate-900">{r.memberName}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                        {formatYen(r.amount)}
                      </td>
                      <td className="px-3 py-2 text-slate-500">
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs">
                          {r.projects.map((p) => (
                            <span key={p.code}>
                              {p.code} {p.name ?? p.clientName}: {formatYen(p.share)}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
