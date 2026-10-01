// Saving reports on Android and iPhone: the file is made on the phone, then the
// share sheet opens so it can go to WhatsApp, email, Google Drive, and so on.
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Share } from 'react-native';

import { fileName, Report, reportCsv, reportHtml, reportText } from './report';

export async function exportPdf(r: Report): Promise<string | null> {
  try {
    const { uri } = await Print.printToFileAsync({ html: reportHtml(r) });
    const named = new File(Paths.cache, `${fileName(r)}.pdf`);
    if (named.exists) named.delete();
    new File(uri).move(named);
    await Sharing.shareAsync(named.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    return null;
  } catch {
    return 'Could not make the PDF. Please try again.';
  }
}

export async function exportExcel(r: Report): Promise<string | null> {
  try {
    const file = new File(Paths.cache, `${fileName(r)}.csv`);
    if (file.exists) file.delete();
    file.create();
    file.write(reportCsv(r));
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
    return null;
  } catch {
    return 'Could not make the Excel file. Please try again.';
  }
}

export async function shareReport(r: Report): Promise<string | null> {
  await Share.share({ message: reportText(r) });
  return null;
}
