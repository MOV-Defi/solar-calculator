import { saveToDiskUtility } from './fileSystem.js';

export async function exportToPdfFile({
  printMode,
  clientInfo,
  calculations,
  workspaceHandle,
  projectFolderName
}) {
  const { jsPDF } = window.jspdf;
  const element = document.querySelector('.print-container');
  if (!element) return;
  
  // hide elements temporarily
  const btns = element.querySelectorAll('.no-print');
  btns.forEach(b => b.style.opacity = '0');
  
  const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
  
  // show elements back
  btns.forEach(b => b.style.opacity = '1');

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
  
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  
  const pdfBlob = pdf.output('blob');
  const typeLabel = printMode === 'offer' ? 'КП' : 'Накладна';
  const fileName = `${typeLabel}_${clientInfo.name || 'UNNAMED'}.pdf`;
  
  await saveToDiskUtility(workspaceHandle, clientInfo, calculations, fileName, pdfBlob, typeLabel, projectFolderName);
}
