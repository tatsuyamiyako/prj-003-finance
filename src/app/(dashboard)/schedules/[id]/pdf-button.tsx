"use client";

export function PdfButton() {
  function handlePrint() {
    const gantt = document.getElementById("gantt-chart");
    if (!gantt) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>スケジュール表</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: sans-serif; padding: 16px; }
          @media print {
            body { padding: 0; }
            @page { size: landscape; margin: 10mm; }
          }
        </style>
      </head>
      <body>
        ${gantt.innerHTML}
        <script>window.onload = () => { window.print(); window.close(); }<\/script>
      </body>
      </html>
    `);
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
