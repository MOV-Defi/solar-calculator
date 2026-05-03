// Uses global saveToDiskUtility from fileSystem.js

async function exportToPdfFile({
  printMode,
  clientInfo,
  calculations,
  workspaceHandle,
  projectFolderName
}) {
  const { jsPDF } = window.jspdf;
  const element = document.querySelector('.print-container');
  if (!element) return;
  const overlay = document.querySelector('.print-overlay');
  
  // hide elements temporarily
  const btns = element.querySelectorAll('.no-print');
  const prevDisplay = [];
  const prevOverlay = overlay ? {
    position: overlay.style.position,
    height: overlay.style.height,
    overflow: overlay.style.overflow,
    padding: overlay.style.padding
  } : null;

  if (printMode === 'invoice') {
    document.body.classList.add('pdf-capture-invoice');
    if (overlay) {
      overlay.style.position = 'static';
      overlay.style.height = 'auto';
      overlay.style.overflow = 'visible';
      overlay.style.padding = '0';
    }
  } else if (printMode === 'offer') {
    document.body.classList.add('pdf-capture-offer');
    if (overlay) {
      overlay.style.position = 'static';
      overlay.style.height = 'auto';
      overlay.style.overflow = 'visible';
      overlay.style.padding = '0';
    }
  }

  btns.forEach((b, i) => {
    prevDisplay[i] = b.style.display;
    b.style.display = 'none';
  });
  
  const canvas = await window.html2canvas(element, { scale: 2, useCORS: true });
  
  // show elements back
  btns.forEach((b, i) => {
    b.style.display = prevDisplay[i] || '';
  });
  if (printMode === 'invoice' || printMode === 'offer') {
    if (printMode === 'invoice') document.body.classList.remove('pdf-capture-invoice');
    if (printMode === 'offer') document.body.classList.remove('pdf-capture-offer');
    if (overlay && prevOverlay) {
      overlay.style.position = prevOverlay.position || '';
      overlay.style.height = prevOverlay.height || '';
      overlay.style.overflow = prevOverlay.overflow || '';
      overlay.style.padding = prevOverlay.padding || '';
    }
  }

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  // Invoice must be максимум 1 сторінка A4.
  // Offer can stay multipage when needed.
  if (printMode === 'invoice') {
    // Keep aspect ratio and fit into exactly one A4 page without distortion.
    const scale = Math.min(pdfWidth / canvas.width, pageHeight / canvas.height);
    const drawWidth = canvas.width * scale;
    const drawHeight = canvas.height * scale;
    const offsetX = (pdfWidth - drawWidth) / 2;
    const offsetY = 0;
    pdf.addImage(imgData, 'PNG', offsetX, offsetY, drawWidth, drawHeight);
  } else if (printMode === 'offer') {
    // For offer use page-by-page capture to avoid right clipping / top offsets.
    const sheets = Array.from(element.querySelectorAll('.offer-cover-page, .offer-proposal-sheet, .offer-station-sheet-new-page'));
    if (sheets.length > 0) {
      // Recreate document so we don't keep the initial full-canvas image.
      const offerPdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < sheets.length; i++) {
        const sheet = sheets[i];
        const pageCanvas = await window.html2canvas(sheet, {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          scrollX: 0,
          scrollY: 0
        });
        const pageImg = pageCanvas.toDataURL('image/png');
        const pageScale = Math.min(pdfWidth / pageCanvas.width, pageHeight / pageCanvas.height);
        const drawW = pageCanvas.width * pageScale;
        const drawH = pageCanvas.height * pageScale;
        const drawX = (pdfWidth - drawW) / 2;
        const drawY = 0;
        if (i > 0) offerPdf.addPage();
        offerPdf.addImage(pageImg, 'PNG', drawX, drawY, drawW, drawH);
      }

      const pdfBlob = offerPdf.output('blob');
      const typeLabel = 'КП';
      const fileName = `${typeLabel}_${clientInfo.name || 'UNNAMED'}.pdf`;
      await saveToDiskUtility(workspaceHandle, clientInfo, calculations, fileName, pdfBlob, typeLabel, projectFolderName);
      return;
    }
  } else if (imgHeight <= pageHeight * 1.08) {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pageHeight);
  } else {
    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pageHeight;
    }
  }
  
  const pdfBlob = pdf.output('blob');
  const typeLabel = printMode === 'offer' ? 'КП' : 'Накладна';
  const fileName = `${typeLabel}_${clientInfo.name || 'UNNAMED'}.pdf`;
  
  await saveToDiskUtility(workspaceHandle, clientInfo, calculations, fileName, pdfBlob, typeLabel, projectFolderName);
}

window.exportToPdfFile = exportToPdfFile;
