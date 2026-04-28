import { saveToDiskUtility } from './fileSystem.js';

const toSafeFilePart = (value = "") => value.replace(/[/\\?*|"<>\:]/g, "").trim();
const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    const clean = value.replace(/\s/g, '').replace(',', '.');
    const n = Number(clean);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const parsePanelPowerW = (name = '') => {
  const text = String(name || '').toLowerCase();
  const wpMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:wp|w|вт)\b/i);
  if (!wpMatch) return null;
  const value = Number(String(wpMatch[1]).replace(',', '.'));
  return Number.isFinite(value) ? value : null;
};
const calcInstalledPowerW = (groups = {}, fallbackModulePower = 0) => {
  const rows = Array.isArray(groups?.['Основне обладнання']) ? groups['Основне обладнання'] : [];
  let total = 0;
  rows.forEach((item) => {
    const type = String(item?.type || '').toLowerCase();
    if (type !== 'феп') return;
    const qty = Math.max(0, toNumber(item?.quantity, 0));
    if (qty <= 0) return;
    const parsedWp = parsePanelPowerW(item?.name);
    const perPanel = parsedWp === null ? Math.max(0, toNumber(fallbackModulePower, 0)) : parsedWp;
    total += qty * perPanel;
  });
  return total;
};
const detectPanelPowerW = (groups = {}, fallbackModulePower = 0) => {
  const rows = Array.isArray(groups?.['Основне обладнання']) ? groups['Основне обладнання'] : [];
  for (const item of rows) {
    const type = String(item?.type || '').toLowerCase();
    if (type !== 'феп') continue;
    const qty = Math.max(0, toNumber(item?.quantity, 0));
    if (qty <= 0) continue;
    const parsedWp = parsePanelPowerW(item?.name);
    if (parsedWp && parsedWp > 0) return parsedWp;
  }
  return Math.max(0, toNumber(fallbackModulePower, 0));
};

const buildDocumentBaseName = (clientInfo, stationPowerW) => {
  const safeClient = toSafeFilePart(clientInfo?.name || 'Клієнт').replace(/\s+/g, '_');
  const safeAddress = toSafeFilePart(clientInfo?.address || 'Адреса').replace(/\s+/g, '_');
  const powerKw = (Number(stationPowerW) || 0) / 1000;
  const safePower = powerKw > 0 ? `${powerKw.toFixed(2)}кВт` : '0кВт';
  const dateCode = new Date().toLocaleDateString('uk-UA').replace(/\./g, '-');
  return [safeClient || 'Клієнт', safeAddress || 'Адреса', safePower, dateCode].join('_');
};

const addHeader = (sheet, headers, headerRowIdx) => {
  const headerRow = sheet.getRow(headerRowIdx);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = h;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
    cell.font = { bold: true, size: 9 };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
};

const styleDataRow = (row, isOffer, rowColor = 'FFFFFFFF') => {
  row.eachCell((cell, i) => {
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
      bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
      right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
    };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowColor } };

    if (i === 1) cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    else if (i === 2 || i === 3) cell.alignment = { horizontal: 'center', vertical: 'middle' };
    else cell.alignment = { horizontal: 'right', vertical: 'middle' };

    if (isOffer) {
      if (i === 8) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF0B3' } };
      if (i === 9) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE8B0' } };
      if (i === 10) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6FFED' } };
      if (i === 11 || i === 12) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9F2FF' } };
    }

    cell.numFmt = '#,##0.00';
    cell.font = { size: 10 };
  });
};

const writeRow = ({ sheet, rowNumber, isOffer, name, unit, qty, priceUsd, totalUsd, totalUah, incomingUsd, markupPercent = 0, totalCostUsd, totalMarginUsd, rowColor }) => {
  const row = sheet.getRow(rowNumber);
  const r = row.number;
  row.height = 20;

  row.getCell(1).value = name;
  row.getCell(2).value = unit;
  row.getCell(3).value = qty;
  row.getCell(4).value = isOffer
    ? { formula: `IF(H${r}>0,H${r}*(1+I${r}/100),${toNumber(priceUsd, 0)})`, result: toNumber(priceUsd, 0) }
    : priceUsd;
  row.getCell(5).value = { formula: `D${r}*B$4`, result: toNumber(priceUsd, 0) * (sheet.getCell('B4').value || 1) };
  row.getCell(6).value = { formula: `C${r}*D${r}`, result: toNumber(totalUsd, 0) || (toNumber(qty, 0) * toNumber(priceUsd, 0)) };
  row.getCell(7).value = { formula: `F${r}*B$4`, result: (toNumber(totalUsd, 0) || (toNumber(qty, 0) * toNumber(priceUsd, 0))) * (sheet.getCell('B4').value || 1) };

  if (isOffer) {
    row.getCell(8).value = incomingUsd;
    row.getCell(9).value = toNumber(markupPercent, 0);
    row.getCell(10).value = { formula: `C${r}*H${r}`, result: toNumber(totalCostUsd, 0) || (toNumber(qty, 0) * toNumber(incomingUsd, 0)) };
    row.getCell(11).value = { formula: `F${r}-J${r}`, result: toNumber(totalMarginUsd, 0) || ((toNumber(totalUsd, 0) || (toNumber(qty, 0) * toNumber(priceUsd, 0))) - (toNumber(totalCostUsd, 0) || (toNumber(qty, 0) * toNumber(incomingUsd, 0)))) };
    row.getCell(12).value = { formula: `K${r}*B$4`, result: (toNumber(totalMarginUsd, 0) || ((toNumber(totalUsd, 0) || (toNumber(qty, 0) * toNumber(priceUsd, 0))) - (toNumber(totalCostUsd, 0) || (toNumber(qty, 0) * toNumber(incomingUsd, 0))))) * (sheet.getCell('B4').value || 1) };
  }

  styleDataRow(row, isOffer, rowColor);
};

const buildExportGroupOrder = (groups = {}) => {
  const allKeys = Object.keys(groups || {});
  const ordered = [];
  const pushIfExists = (key) => {
    if (key && allKeys.includes(key) && !ordered.includes(key)) ordered.push(key);
  };

  pushIfExists('Основне обладнання');
  allKeys.filter((k) => k.startsWith('Захист')).forEach(pushIfExists);
  allKeys.filter((k) => k.startsWith('Кріплення')).forEach(pushIfExists);
  pushIfExists('Кабельна продукція');
  pushIfExists('Заземлення');
  allKeys.forEach(pushIfExists);

  return ordered;
};

export async function exportToExcelFile({
  mode,
  clientInfo,
  rates,
  modulePower,
  calculations,
  installPercent,
  managerCommissionRate,
  workspaceHandle,
  projectFolderName,
  groupSettings = {},
  detailLevel = 'summary'
}) {
  const isOffer = mode === 'offer';
  const isFullSpec = detailLevel === 'full';
  const orderedGroupKeys = buildExportGroupOrder(calculations?.groups || {});

  const workbook = new window.ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(isOffer ? 'КП' : 'Накладна');



  if (!isOffer) {
    sheet.getColumn(1).width = 5;
    sheet.getColumn(2).width = 46;
    sheet.getColumn(3).width = 8;
    sheet.getColumn(4).width = 9;
    sheet.getColumn(5).width = 13;
    sheet.getColumn(6).width = 14;
    sheet.getColumn(7).width = 13;
    sheet.getColumn(8).width = 14;

    const tryAddLogo = async () => {
      const paths = ['./SolarLogo3.png', './SolarLogo2.png'];
      for (const src of paths) {
        try {
          const resp = await fetch(src, { cache: 'no-store' });
          if (!resp.ok) continue;
          const buffer = await resp.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i += 1) binary += String.fromCharCode(bytes[i]);
          const base64 = `data:image/png;base64,${btoa(binary)}`;
          const imgId = workbook.addImage({ base64, extension: 'png' });
          sheet.addImage(imgId, {
            tl: { col: 0, row: 0.25 },
            ext: { width: 250, height: 95 }
          });
          return;
        } catch (_) {}
      }
    };

    await tryAddLogo();

    sheet.mergeCells('D2:H2');
    sheet.getCell('D2').value = 'СПЕЦИФІКАЦІЯ ЗАМОВЛЕННЯ';
    sheet.getCell('D2').font = { name: 'Arial', size: 18, bold: false, color: { argb: 'FF153772' } };
    sheet.getCell('D2').alignment = { horizontal: 'left', vertical: 'middle' };

    sheet.mergeCells('D3:H3');
    sheet.getCell('D3').value = `№ _______     від  ${new Date().toLocaleDateString('uk-UA')} р.`;
    sheet.getCell('D3').font = { name: 'Arial', size: 10, color: { argb: 'FF666666' } };
    sheet.getCell('D3').alignment = { horizontal: 'left', vertical: 'bottom' };

    sheet.getCell('A5').value = 'Замовник:';
    sheet.getCell('A5').font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF153772' } };
    sheet.mergeCells('B5:H5');
    const customerInfo = [clientInfo?.name || '', clientInfo?.address || ''].filter(Boolean).join(' / ');
    sheet.getCell('B5').value = customerInfo;
    sheet.getCell('B5').font = { name: 'Arial', size: 10 };

    const headerRow = 7;
    const headers = ['№', 'Найменування товару / послуги', 'Од.', 'Кіл-ть', 'Ціна, $', 'Ціна, грн', 'Сума, $', 'Сума, грн'];

    headers.forEach((h, idx) => {
      const cell = sheet.getRow(headerRow).getCell(idx + 1);
      cell.value = h;
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF153772' } };
      cell.alignment = { horizontal: idx === 1 ? 'left' : 'center', vertical: 'middle', wrapText: true };
      cell.border = {
        left: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        right: { style: 'thin', color: { argb: 'FF9CA3AF' } },
        top: { style: 'thin', color: { argb: 'FF153772' } },
        bottom: { style: 'thin', color: { argb: 'FF153772' } }
      };
    });

    const goodsRows = [];
    orderedGroupKeys.forEach((groupKey) => {
      const items = Array.isArray(calculations.groups[groupKey]) ? calculations.groups[groupKey] : [];
      items.forEach((item) => {
        const name = (item?.name || '').trim();
        const qty = toNumber(item?.quantity, 0);
        if (!name || qty <= 0) return;

        const sumUsd = toNumber(item?.sumUsd, 0);
        const sumUah = toNumber(item?.sumUah, 0);
        const unitPriceUsd = qty > 0 ? toNumber(item?.priceNormalizedUsd, sumUsd / qty) : 0;
        const unitPriceUah = qty > 0 ? toNumber(item?.priceUah, sumUah / qty) : 0;

        goodsRows.push({
          name,
          unit: item?.unit || 'шт.',
          qty,
          unitPriceUsd,
          unitPriceUah,
          sumUsd,
          sumUah
        });
      });
    });

    const workRows = [];
    (calculations.processedWorkItems || []).forEach((it) => {
      const qty = toNumber(it?.quantity, 0);
      if (!it?.name || qty <= 0) return;
      workRows.push({
        name: it.name,
        unit: 'посл.',
        qty,
        unitPriceUsd: toNumber(it?.priceNormalizedUsd, 0),
        unitPriceUah: toNumber(it?.priceUah, 0),
        sumUsd: toNumber(it?.sumUsd, 0),
        sumUah: toNumber(it?.sumUah, 0)
      });
    });

    (calculations.processedOtherExpenses || []).forEach((it) => {
      const qty = toNumber(it?.quantity, 0);
      if (!it?.name || qty <= 0) return;
      workRows.push({
        name: it.name,
        unit: 'посл.',
        qty,
        unitPriceUsd: toNumber(it?.priceNormalizedUsd, 0),
        unitPriceUah: toNumber(it?.priceUah, 0),
        sumUsd: toNumber(it?.sumUsd, 0),
        sumUah: toNumber(it?.sumUah, 0)
      });
    });

    const installPercentValue = toNumber(installPercent, 0);
    const installPercentUsd = toNumber(calculations.sums?.materialsSumUsd, 0) * (installPercentValue / 100);
    const usdRate = toNumber(rates?.usd, 0);
    const installPercentUah = installPercentUsd * (usdRate > 0 ? usdRate : 1);
    if (installPercentUsd > 0) {
      workRows.push({
        name: `Додатковий % за монтажні роботи (${installPercentValue}%)`,
        unit: 'посл.',
        qty: 1,
        unitPriceUsd: installPercentUsd,
        unitPriceUah: installPercentUah,
        sumUsd: installPercentUsd,
        sumUah: installPercentUah
      });
    }

    const paintSection = (rowIdx, title) => {
      sheet.mergeCells(`A${rowIdx}:H${rowIdx}`);
      const cell = sheet.getCell(`A${rowIdx}`);
      cell.value = title;
      cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF2F7' } };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
      for (let c = 1; c <= 8; c += 1) {
        const secCell = sheet.getRow(rowIdx).getCell(c);
        secCell.border = {
          left: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          right: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          top: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          bottom: { style: 'thin', color: { argb: 'FFBFC7D5' } }
        };
      }
    };

    const paintDataRow = (rowIdx, values, dark = false) => {
      const row = sheet.getRow(rowIdx);
      const rowFill = dark ? 'FFF7F7F7' : 'FFFFFFFF';
      values.forEach((v, idx) => {
        const cell = row.getCell(idx + 1);
        cell.value = v;
        cell.font = { name: 'Arial', size: 10, color: { argb: 'FF1F2937' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
        cell.alignment = {
          horizontal: idx === 1 ? 'left' : (idx >= 4 ? 'right' : 'center'),
          vertical: 'middle',
          wrapText: idx === 1
        };
        cell.border = {
          left: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          right: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          top: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          bottom: { style: 'thin', color: { argb: 'FFBFC7D5' } }
        };
        if (idx >= 4) cell.numFmt = '#,##0.00';
      });
      row.height = 24;
    };

    let rowNum = headerRow + 1;
    let index = 1;

    if (goodsRows.length > 0) {
      paintSection(rowNum++, 'Товари');
      goodsRows.forEach((it, i) => {
        paintDataRow(rowNum++, [
          index++,
          it.name,
          it.unit,
          it.qty,
          it.unitPriceUsd,
          it.unitPriceUah,
          it.sumUsd,
          it.sumUah
        ], i % 2 === 1);
      });
    }

    if (workRows.length > 0) {
      paintSection(rowNum++, 'Монтажні та інші витрати');
      workRows.forEach((it, i) => {
        paintDataRow(rowNum++, [
          index++,
          it.name,
          it.unit,
          it.qty,
          it.unitPriceUsd,
          it.unitPriceUah,
          it.sumUsd,
          it.sumUah
        ], i % 2 === 1);
      });
    }

    const totalUsd = toNumber(calculations.sums?.finalTotalUsd, 0);
    const totalUah = toNumber(calculations.sums?.finalTotalUah, 0);

    const totalRowIdx = rowNum + 1;
    sheet.mergeCells(`A${totalRowIdx}:F${totalRowIdx}`);
    const totalLabel = sheet.getCell(`A${totalRowIdx}`);
    totalLabel.value = 'ЗАГАЛЬНА СУМА РОЗДРІБУ:';
    totalLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
    totalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    const totalUsdCell = sheet.getCell(`G${totalRowIdx}`);
    totalUsdCell.value = totalUsd;
    totalUsdCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
    totalUsdCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalUsdCell.numFmt = '#,##0.00';
    totalUsdCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    const totalUahCell = sheet.getCell(`H${totalRowIdx}`);
    totalUahCell.value = totalUah;
    totalUahCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
    totalUahCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalUahCell.numFmt = '#,##0.00';
    totalUahCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    for (let c = 1; c <= 8; c += 1) {
      const cell = sheet.getRow(totalRowIdx).getCell(c);
      cell.border = {
        left: { style: 'thin', color: { argb: 'FFBFC7D5' } },
        right: { style: 'thin', color: { argb: 'FFBFC7D5' } },
        top: { style: 'medium', color: { argb: 'FF153772' } },
        bottom: { style: 'medium', color: { argb: 'FF153772' } }
      };
    }

    const signRow = totalRowIdx + 3;
    sheet.getCell(`A${signRow}`).value = 'Менеджер:';
    sheet.getCell(`E${signRow}`).value = 'Замовник:';
    sheet.getCell(`A${signRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF153772' } };
    sheet.getCell(`E${signRow}`).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF153772' } };

    sheet.mergeCells(`B${signRow + 1}:D${signRow + 1}`);
    sheet.mergeCells(`F${signRow + 1}:H${signRow + 1}`);
    sheet.getCell(`B${signRow + 1}`).value = 'підпис / П.І.Б.';
    sheet.getCell(`F${signRow + 1}`).value = 'підпис / П.І.Б.';
    sheet.getCell(`B${signRow + 1}`).font = { name: 'Arial', size: 8, color: { argb: 'FF6B7280' } };
    sheet.getCell(`F${signRow + 1}`).font = { name: 'Arial', size: 8, color: { argb: 'FF6B7280' } };
    sheet.getCell(`B${signRow + 1}`).alignment = { horizontal: 'center', vertical: 'bottom' };
    sheet.getCell(`F${signRow + 1}`).alignment = { horizontal: 'center', vertical: 'bottom' };

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const baseDocName = buildDocumentBaseName(clientInfo, calculations.stationPowerW);
    const fileName = `${baseDocName}_Накладна.xlsx`;

    await saveToDiskUtility(
      workspaceHandle,
      clientInfo,
      calculations,
      fileName,
      blob,
      'Excel Накладна',
      projectFolderName
    );
    return;
  }

  sheet.getCell('A1').value = (isOffer ? 'Комерційна пропозиція: ' : 'ВИДАТКОВА НАКЛАДНА: ') + (clientInfo.address || 'Проєкт');
  sheet.getCell('A1').font = { bold: true, size: 14 };

  sheet.getCell('A2').value = 'курс валют:';
  sheet.getCell('A2').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
  sheet.getCell('A2').font = { bold: true };

  sheet.getCell('A3').value = 'євро';
  sheet.getCell('B3').value = rates.eur;
  sheet.getCell('A4').value = 'долар';
  sheet.getCell('B4').value = rates.usd;
  sheet.getCell('A5').value = 'євро/долар';
  sheet.getCell('B5').value = { formula: 'B3/B4' };

  sheet.getCell('A6').value = 'Потужність одного модуля, вт:';
  const panelPowerW = detectPanelPowerW(calculations?.groups || {}, modulePower);
  sheet.getCell('C6').value = panelPowerW;
  sheet.getCell('E6').value = 'Встановлена потужність, вт:';

  const headerRowIdx = 8;
  const baseHeaders = [
    'Найменування устаткування / Модель',
    'од',
    'Кіл-',
    'Ціна, $',
    'Ціна, грн',
    'Сума, $',
    'Сума, грн'
  ];
  const internalHeaders = ['Вхідна ціна, $', 'Націнка, %', 'Собівартість, $', 'Маржа, $', 'Маржа, грн'];
  const headers = isOffer ? [...baseHeaders, ...internalHeaders] : baseHeaders;

  addHeader(sheet, headers, headerRowIdx);

  sheet.getColumn(1).width = 45;
  for (let i = 2; i <= headers.length; i += 1) sheet.getColumn(i).width = 13;

  let currentRow = headerRowIdx + 1;
  let stripeIdx = 0;

  const subtotalUsdRows = [];
  const subtotalUahRows = [];
  const costUsdRows = [];
  const marginUsdRows = [];

  const addRowRefs = (rowNum) => {
    subtotalUsdRows.push(`F${rowNum}`);
    subtotalUahRows.push(`G${rowNum}`);
    if (isOffer) {
      costUsdRows.push(`J${rowNum}`);
      marginUsdRows.push(`K${rowNum}`);
    }
  };

  const writeItemLine = (displayName, item, rowColorOverride = null, includeInTotals = true) => {
    const itemQty = toNumber(item.quantity, 0);
    const itemSumUsd = toNumber(item.sumUsd, 0);
    const itemSumUah = toNumber(item.sumUah, 0);
    const itemCostUsd = toNumber(item.costUsd, 0);

    if (!displayName || itemQty <= 0) return false;

    // Export always uses normalized USD values regardless of source item currency.
    const unitPriceUsd = itemQty > 0
      ? toNumber(item.priceNormalizedUsd, itemSumUsd / itemQty)
      : toNumber(item.priceNormalizedUsd, 0);
    const unitIncomingUsd = itemQty > 0
      ? toNumber(item.incomingPriceNormalizedUsd, itemCostUsd / itemQty)
      : toNumber(item.incomingPriceNormalizedUsd, 0);

    const rowColor = rowColorOverride || (stripeIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9');
    writeRow({
      sheet,
      rowNumber: currentRow,
      isOffer,
      name: displayName,
      unit: item.unit || 'шт.',
      qty: itemQty,
      priceUsd: unitPriceUsd,
      totalUsd: itemSumUsd,
      totalUah: itemSumUah,
      incomingUsd: unitIncomingUsd,
      markupPercent: toNumber(item.markupPercent, unitIncomingUsd > 0 ? ((unitPriceUsd - unitIncomingUsd) / unitIncomingUsd) * 100 : 0),
      totalCostUsd: itemCostUsd,
      totalMarginUsd: itemSumUsd - itemCostUsd,
      rowColor
    });
    if (includeInTotals) addRowRefs(currentRow);
    currentRow += 1;
    stripeIdx += 1;
    return true;
  };

  const isExpandableByType = (groupKey) => {
    if (!groupKey || groupKey === 'Основне обладнання') return false;
    const normalized = String(groupKey).toLowerCase().replace(/\s+/g, ' ').trim();
    return normalized.startsWith('захист') || normalized.startsWith('кріплення');
  };

  orderedGroupKeys.forEach((groupKey) => {
    const items = Array.isArray(calculations.groups[groupKey]) ? calculations.groups[groupKey] : [];
    const totalUsd = toNumber(calculations.groupTotalsUsd[groupKey], 0);
    const totalUah = toNumber(calculations.groupTotalsUah[groupKey], 0);
    const totalCostUsd = items.reduce((acc, it) => acc + toNumber(it?.costUsd, 0), 0);

    const settings = groupSettings[groupKey] || {};
    const isExpandableGroup = isExpandableByType(groupKey);

    const hasNamedItems = items.some((it) => (it?.name || '').trim() && toNumber(it?.quantity, 0) > 0);
    if (!hasNamedItems && totalUsd === 0 && totalUah === 0 && totalCostUsd === 0) return;

    if (isFullSpec && isExpandableGroup) {
      if (totalUsd !== 0 || totalCostUsd !== 0) {
        const qty = toNumber(settings.quantity, 1) || 1;
        const unit = settings.unit || 'компл';
        const priceUsd = qty > 0 ? (totalUsd / qty) : totalUsd;
        const incomingUsd = qty > 0 ? (totalCostUsd / qty) : totalCostUsd;
        const groupRowColor = stripeIdx % 2 === 0 ? 'FFEAF1FF' : 'FFE3ECFF';

        writeRow({
          sheet,
          rowNumber: currentRow,
          isOffer,
          name: settings.name || groupKey,
          unit,
          qty,
          priceUsd,
          totalUsd,
          totalUah,
          incomingUsd,
          markupPercent: toNumber(settings.markupPercent, incomingUsd > 0 ? ((priceUsd - incomingUsd) / incomingUsd) * 100 : 0),
          totalCostUsd,
          totalMarginUsd: totalUsd - totalCostUsd,
          rowColor: groupRowColor
        });

        addRowRefs(currentRow);
        currentRow += 1;
        stripeIdx += 1;
      }

      items.forEach((item) => {
        const rawName = (item.name || '').trim();
        if (!rawName) return;
        // In full spec, we show items even if they are 'fixed' to provide the breakdown
        writeItemLine(`   • ${rawName}`, item, 'FFF6FAFF', false);
      });
      return;
    }

    const shouldUseItemLines = groupKey === 'Основне обладнання' || !isExpandableGroup;

    if (shouldUseItemLines) {
      items.forEach((item) => {
        const rawName = (item.name || '').trim();
        if (!rawName) return;
        writeItemLine(rawName, item);
      });
      return;
    }

    if (totalUsd === 0 && totalCostUsd === 0) return;

    const qty = toNumber(settings.quantity, 1) || 1;
    const unit = settings.unit || 'компл';
    const priceUsd = qty > 0 ? (totalUsd / qty) : totalUsd;
    const incomingUsd = qty > 0 ? (totalCostUsd / qty) : totalCostUsd;

    const effectiveMarkup = (settings.mode === 'detailed' || groupKey.startsWith('Захист') || groupKey.startsWith('Кріплення'))
      ? (totalCostUsd > 0 ? ((totalUsd - totalCostUsd) / totalCostUsd) * 100 : toNumber(settings.markupPercent, 0))
      : toNumber(settings.markupPercent, 0);

    const rowColor = stripeIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9';
    writeRow({
      sheet,
      rowNumber: currentRow,
      isOffer,
      name: settings.name || groupKey,
      unit,
      qty,
      priceUsd,
      totalUsd,
      totalUah,
      incomingUsd,
      markupPercent: effectiveMarkup,
      totalCostUsd,
      totalMarginUsd: totalUsd - totalCostUsd,
      rowColor
    });

    addRowRefs(currentRow);
    currentRow += 1;
    stripeIdx += 1;
  });

  const installedPowerW = calcInstalledPowerW(calculations?.groups || {}, modulePower);
  if (installedPowerW > 0) {
    sheet.getCell('H6').value = installedPowerW;
    sheet.getCell('H6').numFmt = '#,##0.00';
  } else if (Number.isFinite(calculations.stationPowerW)) {
    sheet.getCell('H6').value = calculations.stationPowerW;
    sheet.getCell('H6').numFmt = '#,##0.00';
  }

  currentRow += 1;
  const summaryStartRow = currentRow;

  const matRow = sheet.getRow(currentRow++);
  matRow.height = 25;
  matRow.getCell(1).value = 'Всього матеріали:';
  matRow.getCell(6).value = { formula: subtotalUsdRows.length ? subtotalUsdRows.join('+') : '0' };
  matRow.getCell(7).value = { formula: subtotalUahRows.length ? subtotalUahRows.join('+') : '0' };

  const matCols = isOffer ? [6, 7, 10, 11, 12] : [6, 7];
  if (isOffer) {
    matRow.getCell(10).value = { formula: costUsdRows.length ? costUsdRows.join('+') : '0' };
    matRow.getCell(11).value = { formula: marginUsdRows.length ? marginUsdRows.join('+') : '0' };
    matRow.getCell(12).value = { formula: `K${currentRow - 1}*B$4` };
  }

  matCols.forEach(i => {
    const c = matRow.getCell(i);
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    c.font = { bold: true };
    c.numFmt = '#,##0.00';
    c.alignment = { vertical: 'middle' };
  });
  for (let i = 1; i <= headers.length; i += 1) {
    const c = matRow.getCell(i);
    if (!matCols.includes(i)) {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F4DA' } };
    }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  }

  const paintSummaryLine = (row, label, fill = 'FFE9F4DA') => {
    row.getCell(1).value = label;
    const sumCols = isOffer ? [6, 7, 9, 10, 11] : [6, 7];
    for (let i = 1; i <= headers.length; i += 1) {
      const c = row.getCell(i);
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: sumCols.includes(i) ? 'FF92D050' : fill }
      };
      c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
      c.font = { size: 10, bold: i === 1 || i === 6 || i === 7 || (isOffer && (i === 10 || i === 11 || i === 12)) };
      if (i >= 6) c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'right' };
    }
    row.height = 22;
  };
  const enforceTotalsGreen = (row) => {
    const sumCols = isOffer ? [6, 7, 10, 11, 12] : [6, 7];
    sumCols.forEach((i) => {
      const c = row.getCell(i);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
      c.font = { ...(c.font || {}), bold: true, color: { argb: 'FF000000' } };
      c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle', horizontal: 'right' };
      c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
    });
  };

  const addSectionHeader = (title) => {
    const row = sheet.getRow(currentRow++);
    row.getCell(1).value = title;
    for (let i = 1; i <= headers.length; i += 1) {
      const c = row.getCell(i);
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF8' } };
      c.font = { bold: true, size: 10, color: { argb: 'FF1F3A68' } };
      c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      c.alignment = { vertical: 'middle', horizontal: i === 1 ? 'left' : 'right' };
    }
    row.height = 20;
  };

  // Деталізована логістика / інші витрати (кожна позиція окремим рядком)
  addSectionHeader('Транспорт / Логістика');
  const logisticsStartRow = currentRow;
  (calculations.processedOtherExpenses || []).forEach((item) => {
    const name = (item?.name || '').trim();
    const qty = toNumber(item?.quantity, 0);
    if (!name || qty <= 0) return;
    writeRow({
      sheet,
      rowNumber: currentRow,
      isOffer,
      name,
      unit: item.unit || 'посл.',
      qty,
      priceUsd: toNumber(item?.priceNormalizedUsd, 0),
      incomingUsd: toNumber(item?.incomingPriceNormalizedUsd, 0),
      markupPercent: toNumber(item?.markupPercent, 0),
      rowColor: stripeIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
    });
    currentRow += 1;
    stripeIdx += 1;
  });
  const logisticsEndRow = currentRow - 1;

  const logRow = sheet.getRow(currentRow++);
  paintSummaryLine(logRow, 'Всього логістика:');
  if (logisticsEndRow >= logisticsStartRow) {
    logRow.getCell(6).value = { formula: `SUM(F${logisticsStartRow}:F${logisticsEndRow})` };
    logRow.getCell(7).value = { formula: `SUM(G${logisticsStartRow}:G${logisticsEndRow})` };
    if (isOffer) {
      logRow.getCell(10).value = { formula: `SUM(J${logisticsStartRow}:J${logisticsEndRow})` };
      logRow.getCell(11).value = { formula: `SUM(K${logisticsStartRow}:K${logisticsEndRow})` };
      logRow.getCell(12).value = { formula: `SUM(L${logisticsStartRow}:L${logisticsEndRow})` };
    }
  } else {
    logRow.getCell(6).value = 0;
    logRow.getCell(7).value = 0;
    if (isOffer) {
      logRow.getCell(10).value = 0;
      logRow.getCell(11).value = 0;
      logRow.getCell(12).value = 0;
    }
  }
  enforceTotalsGreen(logRow);

  // Деталізовані монтажні роботи (кожна позиція окремим рядком)
  addSectionHeader('Монтажні та пусконалагоджувальні роботи');
  const worksStartRow = currentRow;
  (calculations.processedWorkItems || []).forEach((item) => {
    const name = (item?.name || '').trim();
    const qty = toNumber(item?.quantity, 0);
    if (!name || qty <= 0) return;
    writeRow({
      sheet,
      rowNumber: currentRow,
      isOffer,
      name,
      unit: item.unit || 'посл.',
      qty,
      priceUsd: toNumber(item?.priceNormalizedUsd, 0),
      incomingUsd: toNumber(item?.incomingPriceNormalizedUsd, 0),
      markupPercent: toNumber(item?.markupPercent, 0),
      rowColor: stripeIdx % 2 === 0 ? 'FFFFFFFF' : 'FFF9F9F9'
    });
    currentRow += 1;
    stripeIdx += 1;
  });

  const installPercentValue = toNumber(installPercent, 0);
  const installPercentUsd = toNumber(calculations.sums?.materialsSumUsd, 0) * (installPercentValue / 100);
  const installPercentCostUsd = 0;
  if (installPercentUsd > 0) {
    writeRow({
      sheet,
      rowNumber: currentRow,
      isOffer,
      name: 'Монтажні роботи',
      unit: 'посл.',
      qty: 1,
      priceUsd: installPercentUsd,
      incomingUsd: installPercentCostUsd,
      markupPercent: 0,
      rowColor: 'FFEFF6FF'
    });
    currentRow += 1;
  }
  const worksEndRow = currentRow - 1;

  const insRow = sheet.getRow(currentRow++);
  paintSummaryLine(insRow, 'Всього монтаж та запуск:');
  if (worksEndRow >= worksStartRow) {
    insRow.getCell(6).value = { formula: `SUM(F${worksStartRow}:F${worksEndRow})` };
    insRow.getCell(7).value = { formula: `SUM(G${worksStartRow}:G${worksEndRow})` };
    if (isOffer) {
      insRow.getCell(10).value = { formula: `SUM(J${worksStartRow}:J${worksEndRow})` };
      insRow.getCell(11).value = { formula: `SUM(K${worksStartRow}:K${worksEndRow})` };
      insRow.getCell(12).value = { formula: `SUM(L${worksStartRow}:L${worksEndRow})` };
    }
  } else {
    insRow.getCell(6).value = 0;
    insRow.getCell(7).value = 0;
    if (isOffer) {
      insRow.getCell(10).value = 0;
      insRow.getCell(11).value = 0;
      insRow.getCell(12).value = 0;
    }
  }
  enforceTotalsGreen(insRow);

  currentRow += 1;
  const finalRow = sheet.getRow(currentRow++);
  finalRow.height = 35;
  finalRow.getCell(1).value = 'РАЗОМ ДО СПЛАТИ:';
  finalRow.getCell(6).value = { formula: `F${summaryStartRow}+F${logRow.number}+F${insRow.number}` };
  finalRow.getCell(7).value = { formula: `G${summaryStartRow}+G${logRow.number}+G${insRow.number}` };
  finalRow.eachCell((c, i) => {
    if (i === 1 || i === 6 || i === 7) {
      c.font = { bold: true, size: 14 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
    }
  });
  for (let i = 1; i <= headers.length; i += 1) {
    const c = finalRow.getCell(i);
    if (i !== 1 && i !== 6 && i !== 7 && !(isOffer && (i === 9 || i === 10 || i === 11))) {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7A8' } };
    }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  }

  if (isOffer) {
    finalRow.getCell(10).value = { formula: `J${summaryStartRow}+J${logRow.number}+J${insRow.number}` };
    finalRow.getCell(11).value = { formula: `K${summaryStartRow}+K${logRow.number}+K${insRow.number}` };
    finalRow.getCell(12).value = { formula: `L${summaryStartRow}+L${logRow.number}+L${insRow.number}` };
    [10, 11, 12].forEach((i) => {
      const c = finalRow.getCell(i);
      c.font = { bold: true, size: 14 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
    });

    currentRow += 2;
    sheet.getRow(currentRow).getCell(1).value = 'Розрахунок маржі:';
    sheet.getRow(currentRow).getCell(11).value = { formula: `K${finalRow.number}` };
    sheet.getRow(currentRow).getCell(11).font = { bold: true };
    sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';

    currentRow += 1;
    sheet.getRow(currentRow).getCell(1).value = `Комісія менеджера (${managerCommissionRate}%):`;
    sheet.getRow(currentRow).getCell(11).value = { formula: `K${currentRow - 1}*${managerCommissionRate / 100}` };
    sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';

    currentRow += 1;
    const netRow = sheet.getRow(currentRow);
    netRow.getCell(1).value = 'ЧИСТИЙ ПРИБУТОК:';
    netRow.getCell(11).value = { formula: `K${currentRow - 2}-K${currentRow - 1}` };
    netRow.getCell(11).font = { bold: true };
    netRow.getCell(11).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    netRow.getCell(11).numFmt = '#,##0.00';
  } else {
    currentRow += 4;
    sheet.getCell(`A${currentRow}`).value = 'Здав: ___________________';
    sheet.getCell(`F${currentRow}`).value = 'Прийняв: ___________________';
    sheet.getRow(currentRow).font = { italic: true };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const baseDocName = buildDocumentBaseName(clientInfo, calculations.stationPowerW);
  const suffix = isFullSpec ? '_Повна_специфікація' : '_Зведено';
  const fileName = isOffer ? `${baseDocName}_КП${suffix}.xlsx` : `${baseDocName}_Накладна${suffix}.xlsx`;

  await saveToDiskUtility(
    workspaceHandle,
    clientInfo,
    calculations,
    fileName,
    blob,
    isOffer ? 'Excel КП' : 'Excel Накладна',
    projectFolderName
  );
}
