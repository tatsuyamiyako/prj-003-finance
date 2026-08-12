"use client";

type PdfItem = {
  title: string;
  side: string;
  start_date: string | null;
  due_date: string | null;
  is_done: boolean;
};

type MonthInfo = { year: number; month: number };

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function itemsOnDate(list: PdfItem[], dateStr: string) {
  return list.filter((item) => {
    const s = item.start_date ?? item.due_date;
    const e = item.due_date ?? item.start_date;
    if (!s && !e) return false;
    return dateStr >= (s ?? e)! && dateStr <= (e ?? s)!;
  });
}

export function PdfButton({
  scheduleTitle,
  projectLabel,
  items,
  months,
  holidays,
}: {
  scheduleTitle: string;
  projectLabel: string | null;
  items: PdfItem[];
  months: MonthInfo[];
  holidays: string[];
}) {
  const bruItems = items.filter((i) => i.side === "bruscape");
  const clientItems = items.filter((i) => i.side === "client");

  function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const now = new Date();
    const timestamp = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, "0")}/${String(now.getDate()).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const holidaySet = new Set(holidays);

    let tablesHtml = "";

    for (const m of months) {
      const daysCount = getDaysInMonth(m.year, m.month);
      const days = Array.from({ length: daysCount }, (_, i) => i + 1);

      // Weekday header
      let weekdayRow = '<td style="min-width:100px;padding:4px 8px;font-weight:bold;border:1px solid #cbd5e1;background:#1e293b;color:#fff;text-align:center;font-size:11px;">担当</td>';
      let dateRow = '<td style="min-width:100px;padding:4px 8px;border:1px solid #cbd5e1;background:#1e293b;color:#fff;"></td>';

      for (const day of days) {
        const dow = new Date(m.year, m.month, day).getDay();
        const dateStr = fmtDate(m.year, m.month, day);
        const isSun = dow === 0;
        const isSat = dow === 6;
        const isHol = holidaySet.has(dateStr);
        const isOff = isSun || isSat || isHol;

        let wdBg = "#f8fafc";
        let wdColor = "#475569";
        if (isSun || isHol) { wdBg = "#fef2f2"; wdColor = "#ef4444"; }
        else if (isSat) { wdBg = "#eff6ff"; wdColor = "#3b82f6"; }

        weekdayRow += `<td style="min-width:36px;max-width:36px;padding:2px;border:1px solid #cbd5e1;background:${wdBg};color:${wdColor};text-align:center;font-size:10px;font-weight:600;">${WEEKDAY_LABELS[dow]}</td>`;
        dateRow += `<td style="min-width:36px;max-width:36px;padding:2px;border:1px solid #cbd5e1;background:${isOff ? "#f1f5f9" : "#fff"};color:${isOff ? "#94a3b8" : "#334155"};text-align:center;font-size:11px;font-weight:700;">${day}</td>`;
      }

      // BRU row
      let bruRow = '<td style="min-width:100px;padding:6px 8px;border:1px solid #cbd5e1;background:#2563eb;color:#fff;text-align:center;font-size:11px;font-weight:bold;">BRÜSCAPE</td>';
      for (const day of days) {
        const dateStr = fmtDate(m.year, m.month, day);
        const dow = new Date(m.year, m.month, day).getDay();
        const isOff = dow === 0 || dow === 6 || holidaySet.has(dateStr);
        const matched = itemsOnDate(bruItems, dateStr);
        const text = matched.map((t) => t.title).join("／");
        const cellBg = isOff ? "#f1f5f9" : "#fff";
        const textStyle = text ? "writing-mode:vertical-rl;font-size:9px;line-height:1.3;color:#1e293b;font-weight:500;" : "";
        bruRow += `<td style="min-width:36px;max-width:36px;padding:2px;border:1px solid #cbd5e1;background:${cellBg};text-align:center;vertical-align:top;"><span style="${textStyle}">${text}</span></td>`;
      }

      // Client row
      let clientRow = '<td style="min-width:100px;padding:6px 8px;border:1px solid #cbd5e1;background:#f59e0b;color:#fff;text-align:center;font-size:11px;font-weight:bold;">お客様</td>';
      for (const day of days) {
        const dateStr = fmtDate(m.year, m.month, day);
        const dow = new Date(m.year, m.month, day).getDay();
        const isOff = dow === 0 || dow === 6 || holidaySet.has(dateStr);
        const matched = itemsOnDate(clientItems, dateStr);
        const text = matched.map((t) => t.title).join("／");
        const cellBg = isOff ? "#f1f5f9" : "#fff";
        const textStyle = text ? "writing-mode:vertical-rl;font-size:9px;line-height:1.3;color:#1e293b;font-weight:500;" : "";
        clientRow += `<td style="min-width:36px;max-width:36px;padding:2px;border:1px solid #cbd5e1;background:${cellBg};text-align:center;vertical-align:top;"><span style="${textStyle}">${text}</span></td>`;
      }

      tablesHtml += `
        <table style="border-collapse:collapse;margin-bottom:24px;width:100%;">
          <thead>
            <tr>
              <td colspan="${daysCount + 1}" style="padding:6px 8px;font-weight:bold;font-size:14px;background:#1e293b;color:#fff;border:1px solid #1e293b;">${m.month + 1}月</td>
            </tr>
            <tr>${weekdayRow}</tr>
            <tr>${dateRow}</tr>
          </thead>
          <tbody>
            <tr style="height:60px;">${bruRow}</tr>
            <tr style="height:60px;">${clientRow}</tr>
          </tbody>
        </table>
      `;
    }

    const title = projectLabel
      ? `【${projectLabel}】${scheduleTitle}`
      : scheduleTitle;

    printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; padding: 20px; color: #1e293b; }
    @media print {
      body { padding: 0; }
      @page { size: landscape; margin: 8mm; }
    }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:12px;">
    <div>
      <div style="font-size:10px;color:#64748b;">${timestamp}</div>
      <div style="font-size:16px;font-weight:bold;margin-top:2px;">${title}</div>
    </div>
  </div>
  <div style="overflow-x:auto;">
    ${tablesHtml}
  </div>
  <script>window.onload = () => { window.print(); window.close(); }<\/script>
</body>
</html>`);
    printWindow.document.close();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
    >
      PDF出力
    </button>
  );
}
