// Saving reports in the browser. The phone version is exporter.native.ts.
import { fileName, Report, reportCsv, reportHtml, reportText } from './report';

/** Opens the report in a new tab and the browser's print window, where it can be saved as PDF. */
export async function exportPdf(r: Report): Promise<string | null> {
  const w = window.open('', '_blank');
  if (!w) return 'Allow pop-ups for this page to save the PDF.';
  w.document.write(reportHtml(r));
  w.document.close();
  w.focus();
  w.print();
  return null;
}

export async function exportExcel(r: Report): Promise<string | null> {
  const blob = new Blob([reportCsv(r)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${fileName(r)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  return null;
}

export async function shareReport(r: Report): Promise<string | null> {
  const text = reportText(r);
  try {
    if (navigator.share) {
      await navigator.share({ text });
      return null;
    }
    await navigator.clipboard.writeText(text);
    return 'Copied. Paste it into WhatsApp.';
  } catch {
    return null;
  }
}
