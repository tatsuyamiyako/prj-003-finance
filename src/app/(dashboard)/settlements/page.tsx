import { createClient } from "@/lib/supabase/server";
import { formatYen } from "@/lib/types";

type BalanceRow = {
  month: string;
  member_id: string;
  name: string;
  paid_amount: number;
  fair_share: number;
  balance: number;
  is_settled: boolean;
};

export default async function SettlementsPage() {
  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("advance_balances")
    .select("*")
    .order("month", { ascending: false });

  const months = [
    ...new Set((rows ?? []).map((r: BalanceRow) => r.month)),
  ] as string[];

  return (
    <div>
      <h1 className="text-lg font-semibold text-slate-900">立替精算</h1>
      <p className="mt-1 text-sm text-slate-500">
        チームメンバーの立替額と各自の負担額を自動計算します。balanceが+のメンバーは他から受け取る側、-のメンバーは支払う側です。
      </p>

      {months.length === 0 && (
        <p className="mt-8 text-center text-slate-400">
          経費データが登録されるとここに精算情報が表示されます。
        </p>
      )}

      {months.map((month) => {
        const monthRows = (rows ?? []).filter(
          (r: BalanceRow) => r.month === month,
        ) as BalanceRow[];
        return (
          <div key={month} className="mt-6">
            <h2 className="text-sm font-semibold text-slate-700">
              {month.slice(0, 7)}
            </h2>
            <div className="mt-2 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                    <th className="px-3 py-2">メンバー</th>
                    <th className="px-3 py-2 text-right">立替額</th>
                    <th className="px-3 py-2 text-right">均等負担額</th>
                    <th className="px-3 py-2 text-right">差額</th>
                    <th className="px-3 py-2">精算状況</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthRows.map((r) => (
                    <tr key={r.member_id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-900">{r.name}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                        {formatYen(r.paid_amount)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-right text-slate-700">
                        {formatYen(r.fair_share)}
                      </td>
                      <td
                        className={`whitespace-nowrap px-3 py-2 text-right font-medium ${
                          r.balance > 0
                            ? "text-emerald-600"
                            : r.balance < 0
                              ? "text-red-600"
                              : "text-slate-500"
                        }`}
                      >
                        {formatYen(r.balance)}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs ${
                            r.is_settled
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {r.is_settled ? "精算済" : "未精算"}
                        </span>
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
