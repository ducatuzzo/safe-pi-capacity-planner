// Export-Utilities: PDF und PNG Export via jsPDF + html2canvas
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Exportiert das Element mit der angegebenen ID als PDF.
 * Weisser Hintergrund, 2x Auflösung, Seitengrösse passend zum Inhalt.
 */
export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Export-Element #${elementId} nicht gefunden`);

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const imgData = canvas.toDataURL('image/png');
  const pxWidth = canvas.width / 2;
  const pxHeight = canvas.height / 2;
  const orientation = pxWidth > pxHeight ? 'landscape' : 'portrait';

  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [pxWidth, pxHeight],
    hotfixes: ['px_scaling'],
  });

  pdf.addImage(imgData, 'PNG', 0, 0, pxWidth, pxHeight);
  pdf.save(filename);
}

/**
 * Exportiert das Element mit der angegebenen ID als PNG.
 * 2x Auflösung, weisser Hintergrund.
 */
export async function exportToPNG(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Export-Element #${elementId} nicht gefunden`);

  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    scrollX: 0,
    scrollY: 0,
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
