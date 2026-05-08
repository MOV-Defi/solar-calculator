// Uses global saveToDiskUtility from fileSystem.js

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
      if (i === 11 || i === 12 || i === 13) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9F2FF' } };
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
    ? { formula: `IF(H${r}>0;H${r}*(1+I${r}/100);${toNumber(priceUsd, 0)})`, result: toNumber(priceUsd, 0) }
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
    row.getCell(13).value = { formula: `IF(F${r}>0;K${r}/F${r}*100;0)` };
    row.getCell(13).numFmt = '0.0';
    row.getCell(9).numFmt = '0.0';
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

const normalizeItemForExport = (item = {}, rates = {}) => {
  const usdRate = Math.max(0.000001, toNumber(rates?.usd, 1));
  const eurRate = Math.max(0, toNumber(rates?.eur, 0));
  const eurUsdRate = eurRate > 0 ? (eurRate / usdRate) : 0;
  const qty = Math.max(0, toNumber(item?.quantity, 0));
  const price = toNumber(item?.price, 0);
  const incoming = toNumber(item?.incomingPrice, 0);
  const currency = String(item?.currency || 'USD').toUpperCase();

  let priceNormalizedUsd = price;
  let incomingPriceNormalizedUsd = incoming;
  if (currency === 'EUR') {
    priceNormalizedUsd = price * eurUsdRate;
    incomingPriceNormalizedUsd = incoming * eurUsdRate;
  } else if (currency === 'UAH') {
    priceNormalizedUsd = price / usdRate;
    incomingPriceNormalizedUsd = incoming / usdRate;
  }

  const sumUsd = priceNormalizedUsd * qty;
  const sumUah = sumUsd * usdRate;
  const priceUah = priceNormalizedUsd * usdRate;
  const costUsd = incomingPriceNormalizedUsd * qty;
  const marginUsd = sumUsd - costUsd;
  const markupPercent = incomingPriceNormalizedUsd > 0 ? ((priceNormalizedUsd - incomingPriceNormalizedUsd) / incomingPriceNormalizedUsd) * 100 : 0;

  return {
    ...item,
    quantity: qty,
    price,
    incomingPrice: incoming,
    priceNormalizedUsd,
    incomingPriceNormalizedUsd,
    sumUsd,
    sumUah,
    priceUah,
    costUsd,
    marginUsd,
    markupPercent: Number.isFinite(toNumber(item?.markupPercent, NaN)) ? toNumber(item?.markupPercent, 0) : markupPercent
  };
};

const buildCalculationsForOfferSheetExport = (snap = {}, summary = {}) => {
  const rates = snap?.rates && typeof snap.rates === 'object' ? snap.rates : { usd: 1, eur: 0 };
  const groupsRaw = snap?.equipmentGroups && typeof snap.equipmentGroups === 'object' ? snap.equipmentGroups : {};
  const groupSettingsRaw = snap?.groupSettings && typeof snap.groupSettings === 'object' ? snap.groupSettings : {};
  const protectionDefaults = {
    "Захист PV": { mode: 'fixed', name: 'Захист PV', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
    "Захист AC": { mode: 'fixed', name: 'Захист AC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
    "Захист DC": { mode: 'fixed', name: 'Захист DC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 }
  };
  const groupSettings = { ...protectionDefaults, ...groupSettingsRaw };
  const groups = {};
  const groupTotalsUsd = {};
  const groupTotalsUah = {};
  const groupCostTotalsUsd = {};

  const groupKeys = Array.from(new Set([
    ...Object.keys(groupsRaw),
    ...Object.keys(groupSettings)
  ]));

  groupKeys.forEach((groupKey) => {
    const normalizedRows = (Array.isArray(groupsRaw[groupKey]) ? groupsRaw[groupKey] : []).map((row) => normalizeItemForExport(row, rates));
    const settings = groupSettings[groupKey] || {};
    const hasDetailedRows = normalizedRows.some((row) => (
      (String(row?.name || '').trim().length > 0) && (
        toNumber(row?.sumUsd, 0) !== 0 ||
        toNumber(row?.sumUah, 0) !== 0 ||
        toNumber(row?.priceNormalizedUsd, 0) !== 0 ||
        toNumber(row?.incomingPriceNormalizedUsd, 0) !== 0 ||
        toNumber(row?.costUsd, 0) !== 0
      )
    ));
    const isDetailedMode = settings.mode === 'detailed' || hasDetailedRows;

    groups[groupKey] = normalizedRows;
    if (!isDetailedMode) {
      // Collapsed groups in UI use fixed group settings totals, not detailed row sums.
      const syntheticGroup = normalizeItemForExport({
        quantity: toNumber(settings.quantity, 0),
        price: toNumber(settings.price, 0),
        incomingPrice: toNumber(settings.incomingPrice, 0),
        currency: settings.currency || 'USD'
      }, rates);
      groupTotalsUsd[groupKey] = toNumber(syntheticGroup.sumUsd, 0);
      groupTotalsUah[groupKey] = toNumber(syntheticGroup.sumUah, 0);
      groupCostTotalsUsd[groupKey] = toNumber(syntheticGroup.costUsd, 0);
    } else {
      groupTotalsUsd[groupKey] = normalizedRows.reduce((acc, row) => acc + toNumber(row?.sumUsd, 0), 0);
      groupTotalsUah[groupKey] = normalizedRows.reduce((acc, row) => acc + toNumber(row?.sumUah, 0), 0);
      groupCostTotalsUsd[groupKey] = normalizedRows.reduce((acc, row) => acc + toNumber(row?.costUsd, 0), 0);
    }
  });

  const processedWorkItems = (Array.isArray(snap?.workItems) ? snap.workItems : []).map((row) => normalizeItemForExport(row, rates));
  const processedOtherExpenses = (Array.isArray(snap?.otherExpenses) ? snap.otherExpenses : []).map((row) => normalizeItemForExport(row, rates));

  const materialsSumUsd = Object.values(groupTotalsUsd).reduce((acc, value) => acc + toNumber(value, 0), 0);
  const materialsCostUsd = Object.values(groupCostTotalsUsd).reduce((acc, value) => acc + toNumber(value, 0), 0);
  const workItemsSumUsd = processedWorkItems.reduce((acc, row) => acc + toNumber(row?.sumUsd, 0), 0);
  const workItemsCostUsd = processedWorkItems.reduce((acc, row) => acc + toNumber(row?.costUsd, 0), 0);
  const otherCostsUsd = processedOtherExpenses.reduce((acc, row) => acc + toNumber(row?.sumUsd, 0), 0);
  const otherCostsCostUsd = processedOtherExpenses.reduce((acc, row) => acc + toNumber(row?.costUsd, 0), 0);
  const installPercentAmountUsd = materialsSumUsd * (Math.max(0, toNumber(snap?.installPercent, 0)) / 100);
  const finalTotalUsd = materialsSumUsd + workItemsSumUsd + otherCostsUsd + installPercentAmountUsd;
  const discountPercent = Math.max(0, toNumber(snap?.clientDiscountPercent, 0));
  const discountUsd = finalTotalUsd * (discountPercent / 100);
  const finalTotalWithDiscountUsd = Math.max(0, finalTotalUsd - discountUsd);
  const orderCostUsd = materialsCostUsd + workItemsCostUsd + otherCostsCostUsd;
  const usdRate = Math.max(0.000001, toNumber(rates?.usd, 1));

  return {
    groups,
    groupTotalsUsd,
    groupTotalsUah,
    groupCostTotalsUsd,
    processedWorkItems,
    processedOtherExpenses,
    workItemsSumUsd,
    otherCostsUsd,
    stationPowerW: toNumber(summary?.stationPowerW, calcInstalledPowerW(groups, toNumber(snap?.modulePower, 0))),
    taxMode: snap?.taxMode || 'none',
    sums: {
      materialsSumUsd,
      installPercentAmountUsd,
      finalTotalUsd,
      finalTotalUah: finalTotalUsd * usdRate,
      discountPercent,
      discountUsd,
      finalTotalWithDiscountUsd,
      finalTotalWithDiscountUah: finalTotalWithDiscountUsd * usdRate,
      orderCostUsd,
      grossMarginBeforeTaxesUsd: toNumber(summary?.grossMarginBeforeTaxesUsd, Math.max(0, finalTotalWithDiscountUsd - orderCostUsd)),
      taxesUsd: toNumber(summary?.taxesUsd, 0),
      taxesUah: toNumber(summary?.taxesUsd, 0) * usdRate,
      marginAfterTaxesUsd: toNumber(summary?.marginAfterTaxUsd, 0),
      marginAfterTaxesUah: toNumber(summary?.marginAfterTaxUsd, 0) * usdRate,
      marginAfterTaxUsd: toNumber(summary?.marginAfterTaxUsd, 0),
      marginAfterTaxUah: toNumber(summary?.marginAfterTaxUsd, 0) * usdRate,
      managerCommissionAfterTaxesUsd: toNumber(summary?.managerCommissionAfterTaxesUsd, 0),
      managerCommissionAfterTaxesUah: toNumber(summary?.managerCommissionAfterTaxesUsd, 0) * usdRate,
      netMarginUsd: toNumber(summary?.netProfitUsd, 0),
      netMarginUah: toNumber(summary?.netProfitUsd, 0) * usdRate
    }
  };
};

async function exportToExcelFile({
  mode,
  projectType = 'project',
  clientInfo,
  rates,
  modulePower,
  calculations,
  installPercent,
  managerCommissionRate,
  workspaceHandle,
  projectFolderName,
  groupSettings = {},
  detailLevel = 'summary',
  workbookOverride = null,
  sheetNameOverride = ''
}) {
  try {
    const isOffer = mode === 'offer';
    const isFullSpec = detailLevel === 'full';
    const safeGroups = (calculations?.groups && typeof calculations.groups === 'object') ? calculations.groups : {};
    const safeGroupTotalsUsd = (calculations?.groupTotalsUsd && typeof calculations.groupTotalsUsd === 'object') ? calculations.groupTotalsUsd : {};
    const safeGroupTotalsUah = (calculations?.groupTotalsUah && typeof calculations.groupTotalsUah === 'object') ? calculations.groupTotalsUah : {};
    const safeGroupCostTotalsUsd = (calculations?.groupCostTotalsUsd && typeof calculations.groupCostTotalsUsd === 'object') ? calculations.groupCostTotalsUsd : {};
    const safeProcessedWorkItems = Array.isArray(calculations?.processedWorkItems) ? calculations.processedWorkItems : [];
    const safeProcessedOtherExpenses = Array.isArray(calculations?.processedOtherExpenses) ? calculations.processedOtherExpenses : [];
    const orderedGroupKeys = buildExportGroupOrder(safeGroups);

    if (typeof window.ExcelJS === 'undefined') {
      throw new Error('Бібліотека ExcelJS не завантажена. Спробуйте оновити сторінку.');
    }

    const workbook = workbookOverride || new window.ExcelJS.Workbook();
    // Force Excel to recalculate all formulas on file open.
    workbook.calcProperties = { fullCalcOnLoad: true };
    const sheet = workbook.addWorksheet(
      String(sheetNameOverride || (isOffer ? 'КП' : 'Накладна')).slice(0, 31)
    );

    if (!isOffer) {
      // Налаштування ширини колонок
      sheet.getColumn(1).width = 5;
      sheet.getColumn(2).width = 46;
      sheet.getColumn(3).width = 8;
      sheet.getColumn(4).width = 9;
      sheet.getColumn(5).width = 13;
      sheet.getColumn(6).width = 14;
      sheet.getColumn(7).width = 13;
      sheet.getColumn(8).width = 14;
    const tryAddLogo = async () => {
      const paths = ['./SolarLogo3.png', './SolarLogo2.png', 'SolarLogo3.png'];
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
          return true;
        } catch (e) {
          console.warn('Logo load skip:', src);
        }
      }
      return false;
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
      const items = Array.isArray(safeGroups[groupKey]) ? safeGroups[groupKey] : [];
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
    safeProcessedWorkItems.forEach((it) => {
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

    safeProcessedOtherExpenses.forEach((it) => {
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

    const installPercentValue = Math.max(0, toNumber(installPercent, 0));
    workRows.push({
      name: 'Монтажні і пусконалагоджувальні роботи',
      unit: 'посл.',
      qty: 1,
      unitPriceUsd: 0,
      unitPriceUah: 0,
      sumUsd: 0,
      sumUah: 0,
      isInstallPercent: true
    });
    sheet.getCell('A6').value = 'Монтаж, % від суми обладнання:';
    sheet.getCell('B6').value = installPercentValue;
    sheet.getCell('B6').numFmt = '0.0';

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

    let goodsDataStartRow = null;
    let goodsDataEndRow = null;
    if (goodsRows.length > 0) {
      paintSection(rowNum++, 'Товари');
      goodsDataStartRow = rowNum;
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
      goodsDataEndRow = rowNum - 1;
    }

    if (workRows.length > 0) {
      paintSection(rowNum++, 'Монтажні та інші витрати');
      workRows.forEach((it, i) => {
        const dataRowNumber = rowNum;
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
        if (it.isInstallPercent) {
          const goodsSumFormula = (goodsDataStartRow && goodsDataEndRow && goodsDataEndRow >= goodsDataStartRow)
            ? `SUM(G${goodsDataStartRow}:G${goodsDataEndRow})`
            : '0';
          sheet.getCell(`E${dataRowNumber}`).value = { formula: `${goodsSumFormula}*$B$6/100` };
          sheet.getCell(`G${dataRowNumber}`).value = { formula: `D${dataRowNumber}*E${dataRowNumber}` };
          sheet.getCell(`F${dataRowNumber}`).value = { formula: `E${dataRowNumber}*B$4` };
          sheet.getCell(`H${dataRowNumber}`).value = { formula: `G${dataRowNumber}*B$4` };
        }
      });
    }

    const totalUsd = toNumber(calculations.sums?.finalTotalUsd, 0);
    const totalUah = toNumber(calculations.sums?.finalTotalUah, 0);
    const totalDataStartRow = headerRow + 1;
    const totalDataEndRow = Math.max(totalDataStartRow, rowNum - 1);

    const totalRowIdx = rowNum + 1;
    sheet.mergeCells(`A${totalRowIdx}:F${totalRowIdx}`);
    const totalLabel = sheet.getCell(`A${totalRowIdx}`);
    totalLabel.value = 'ЗАГАЛЬНА СУМА РОЗДРІБУ:';
    totalLabel.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
    totalLabel.alignment = { horizontal: 'right', vertical: 'middle' };
    totalLabel.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    const totalUsdCell = sheet.getCell(`G${totalRowIdx}`);
    totalUsdCell.value = { formula: `SUM(G${totalDataStartRow}:G${totalDataEndRow})`, result: totalUsd };
    totalUsdCell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FF153772' } };
    totalUsdCell.alignment = { horizontal: 'right', vertical: 'middle' };
    totalUsdCell.numFmt = '#,##0.00';
    totalUsdCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFDE68A' } };

    const totalUahCell = sheet.getCell(`H${totalRowIdx}`);
    totalUahCell.value = { formula: `SUM(H${totalDataStartRow}:H${totalDataEndRow})`, result: totalUah };
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

    let summaryRow = totalRowIdx + 2;
    const addInvoiceSummaryLine = (label, usd, uah, highlight = false) => {
      const row = sheet.getRow(summaryRow++);
      sheet.mergeCells(`A${row.number}:F${row.number}`);
      row.getCell(1).value = label;
      row.getCell(7).value = toNumber(usd, 0);
      row.getCell(8).value = toNumber(uah, 0);
      row.getCell(7).numFmt = '#,##0.00';
      row.getCell(8).numFmt = '#,##0.00';
      for (let c = 1; c <= 8; c += 1) {
        const cell = row.getCell(c);
        cell.border = {
          left: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          right: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          top: { style: 'thin', color: { argb: 'FFBFC7D5' } },
          bottom: { style: 'thin', color: { argb: 'FFBFC7D5' } }
        };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: highlight ? 'FFE9F4DA' : 'FFFFFFFF' } };
      }
      row.getCell(1).font = { name: 'Arial', size: 10, bold: true, color: { argb: 'FF153772' } };
      row.getCell(7).font = { name: 'Arial', size: 10, bold: true };
      row.getCell(8).font = { name: 'Arial', size: 10, bold: true };
    };

    addInvoiceSummaryLine('Загальна маржа (до податків):', calculations?.sums?.grossMarginBeforeTaxesUsd, toNumber(calculations?.sums?.grossMarginBeforeTaxesUsd, 0) * toNumber(rates?.usd, 1), true);
    addInvoiceSummaryLine(`Комісія менеджера до податків (${toNumber(managerCommissionRate, 0)}%):`, calculations?.sums?.managerCommissionBeforeTaxesUsd, toNumber(calculations?.sums?.managerCommissionBeforeTaxesUsd, 0) * toNumber(rates?.usd, 1));
    addInvoiceSummaryLine('Чиста маржа до податків:', calculations?.sums?.netMarginBeforeTaxesUsd, toNumber(calculations?.sums?.netMarginBeforeTaxesUsd, 0) * toNumber(rates?.usd, 1), true);
    addInvoiceSummaryLine('Разом податки:', calculations?.sums?.taxesUsd, calculations?.sums?.taxesUah);
    if ((calculations?.taxMode || 'none') === 'vat') {
      addInvoiceSummaryLine('ПДВ товари 20%:', calculations?.sums?.vatGoodsUsd, calculations?.sums?.vatGoodsUah);
      addInvoiceSummaryLine('ПДВ роботи 20%:', calculations?.sums?.vatWorksUsd, calculations?.sums?.vatWorksUah);
      addInvoiceSummaryLine('Податок на чек 2%:', calculations?.sums?.vatReceiptUsd, calculations?.sums?.vatReceiptUah);
    }
    addInvoiceSummaryLine('Маржа після податків:', calculations?.sums?.marginAfterTaxesUsd, calculations?.sums?.marginAfterTaxesUah, true);
    addInvoiceSummaryLine('Комісія менеджера після податків:', calculations?.sums?.managerCommissionAfterTaxesUsd, calculations?.sums?.managerCommissionAfterTaxesUah);
    addInvoiceSummaryLine('Чистий прибуток:', calculations?.sums?.netMarginUsd, calculations?.sums?.netMarginUah, true);

    const signRow = summaryRow + 1;
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

  sheet.getCell('A6').value = 'Монтаж, % від обладнання:';
  sheet.getCell('B6').value = Math.max(0, toNumber(installPercent, 0));
  sheet.getCell('B6').numFmt = '0.0';
  sheet.getCell('A7').value = 'Потужність одного модуля, вт:';
  const panelPowerW = detectPanelPowerW(calculations?.groups || {}, modulePower);
  sheet.getCell('C7').value = panelPowerW;
  sheet.getCell('E7').value = 'Встановлена потужність, вт:';

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
  const internalHeaders = ['Вхідна ціна, $', 'Націнка, %', 'Собівартість, $', 'Маржа, $', 'Маржа, грн', 'Маржа, %'];
  const outHeaders = isOffer ? [...baseHeaders, ...internalHeaders] : baseHeaders;
  const taxMode = calculations?.taxMode || 'none';

  addHeader(sheet, outHeaders, headerRowIdx);

  sheet.getColumn(1).width = 45;
  for (let i = 2; i <= outHeaders.length; i += 1) sheet.getColumn(i).width = 13;

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
  return normalized.startsWith('захист');
};

  orderedGroupKeys.forEach((groupKey) => {
    const items = Array.isArray(safeGroups[groupKey]) ? safeGroups[groupKey] : [];
    const totalUsd = toNumber(safeGroupTotalsUsd[groupKey], 0);
    const totalUah = toNumber(safeGroupTotalsUah[groupKey], 0);
    const totalCostUsd = toNumber(safeGroupCostTotalsUsd[groupKey], items.reduce((acc, it) => acc + toNumber(it?.costUsd, 0), 0));
    const settings = groupSettings[groupKey] || {};
    const isExpandableGroup = isExpandableByType(groupKey);

    const hasNamedItems = items.some((it) => (it?.name || '').trim() && toNumber(it?.quantity, 0) > 0);
    if (!hasNamedItems && totalUsd === 0 && totalUah === 0 && totalCostUsd === 0) return;

    if (isFullSpec && isExpandableGroup) {
      const isDetailedMode = settings.mode === 'detailed';
      const qty = toNumber(settings.quantity, 1) || 1;
      const unit = settings.unit || 'компл';
      const priceUsd = qty > 0 ? (totalUsd / qty) : totalUsd;
      const incomingUsd = qty > 0 ? (totalCostUsd / qty) : totalCostUsd;
      const groupRowColor = stripeIdx % 2 === 0 ? 'FFEAF1FF' : 'FFE3ECFF';

      // Keep protection categories separate in full export exactly like in UI:
      // one category row always, detailed items only for expanded mode.
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

      if (isDetailedMode) {
        items.forEach((item) => {
          const rawName = (item.name || '').trim();
          if (!rawName) return;
          writeItemLine(`   • ${rawName}`, item, 'FFF6FAFF', false);
        });
      }
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

    const effectiveMarkup = (settings.mode === 'detailed' || groupKey.startsWith('Захист'))
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
    sheet.getCell('H7').value = installedPowerW;
    sheet.getCell('H7').numFmt = '#,##0.00';
  } else if (Number.isFinite(calculations.stationPowerW)) {
    sheet.getCell('H7').value = calculations.stationPowerW;
    sheet.getCell('H7').numFmt = '#,##0.00';
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
  for (let i = 1; i <= outHeaders.length; i += 1) {
    const c = matRow.getCell(i);
    if (!matCols.includes(i)) {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9F4DA' } };
    }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  }

  const paintSummaryLine = (row, label, fill = 'FFE9F4DA') => {
    row.getCell(1).value = label;
    const sumCols = isOffer ? [6, 7, 9, 10, 11] : [6, 7];
    for (let i = 1; i <= outHeaders.length; i += 1) {
      const c = row.getCell(i);
      c.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: sumCols.includes(i) ? 'FF92D050' : fill }
      };
      c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
      c.font = { size: 10, bold: i === 1 || i === 6 || i === 7 || (isOffer && (i === 10 || i === 11 || i === 12 || i === 13)) };
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
    for (let i = 1; i <= outHeaders.length; i += 1) {
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
  safeProcessedOtherExpenses.forEach((item) => {
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
  const hasWorks = projectType !== 'product';
  let insRow = null;
  
  if (hasWorks) {
    addSectionHeader('Монтажні та пусконалагоджувальні роботи');
    const worksStartRow = currentRow;
    safeProcessedWorkItems.forEach((item) => {
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

    const installWorkRowNumber = currentRow;
    writeRow({
      sheet,
      rowNumber: installWorkRowNumber,
      isOffer,
      name: 'Монтажні і пусконалагоджувальні роботи',
      unit: 'посл.',
      qty: 1,
      priceUsd: 0,
      incomingUsd: 0,
      markupPercent: 0,
      rowColor: 'FFEFF6FF'
    });
    sheet.getCell(`D${installWorkRowNumber}`).value = { formula: `F${summaryStartRow}*$B$6/100` };
    sheet.getCell(`F${installWorkRowNumber}`).value = { formula: `C${installWorkRowNumber}*D${installWorkRowNumber}` };
    sheet.getCell(`G${installWorkRowNumber}`).value = { formula: `F${installWorkRowNumber}*B$4` };
    if (isOffer) {
      sheet.getCell(`H${installWorkRowNumber}`).value = 0;
      sheet.getCell(`I${installWorkRowNumber}`).value = 0;
      sheet.getCell(`J${installWorkRowNumber}`).value = 0;
      sheet.getCell(`K${installWorkRowNumber}`).value = { formula: `F${installWorkRowNumber}-J${installWorkRowNumber}` };
      sheet.getCell(`L${installWorkRowNumber}`).value = { formula: `K${installWorkRowNumber}*B$4` };
      sheet.getCell(`M${installWorkRowNumber}`).value = { formula: `IF(F${installWorkRowNumber}>0;K${installWorkRowNumber}/F${installWorkRowNumber}*100;0)` };
      sheet.getCell(`M${installWorkRowNumber}`).numFmt = '0.0';
    }
    currentRow += 1;
    const worksEndRow = currentRow - 1;

    insRow = sheet.getRow(currentRow++);
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
    // Show dynamic % of works from materials directly in the row label.
    insRow.getCell(1).value = {
      formula: `CONCAT("Всього монтаж та запуск (";TEXT(IF(F${summaryStartRow}>0;F${insRow.number}/F${summaryStartRow}*100;0);"0.0");"% від суми товарів):")`
    };
    enforceTotalsGreen(insRow);
  }

  currentRow += 1;
  const finalRow = sheet.getRow(currentRow++);
  finalRow.height = 35;
  finalRow.getCell(1).value = 'РАЗОМ ДО СПЛАТИ:';
  
  if (insRow) {
    finalRow.getCell(6).value = { formula: `F${summaryStartRow}+F${logRow.number}+F${insRow.number}` };
    finalRow.getCell(7).value = { formula: `G${summaryStartRow}+G${logRow.number}+G${insRow.number}` };
  } else {
    finalRow.getCell(6).value = { formula: `F${summaryStartRow}+F${logRow.number}` };
    finalRow.getCell(7).value = { formula: `G${summaryStartRow}+G${logRow.number}` };
  }
  finalRow.eachCell((c, i) => {
    if (i === 1 || i === 6 || i === 7) {
      c.font = { bold: true, size: 14 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
    }
  });
  for (let i = 1; i <= outHeaders.length; i += 1) {
    const c = finalRow.getCell(i);
    if (i !== 1 && i !== 6 && i !== 7 && !(isOffer && (i === 9 || i === 10 || i === 11 || i === 12 || i === 13))) {
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF7A8' } };
    }
    c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
  }

  if (isOffer) {
    if (insRow) {
      finalRow.getCell(10).value = { formula: `J${summaryStartRow}+J${logRow.number}+J${insRow.number}` };
      finalRow.getCell(11).value = { formula: `K${summaryStartRow}+K${logRow.number}+K${insRow.number}` };
      finalRow.getCell(12).value = { formula: `L${summaryStartRow}+L${logRow.number}+L${insRow.number}` };
    } else {
      finalRow.getCell(10).value = { formula: `J${summaryStartRow}+J${logRow.number}` };
      finalRow.getCell(11).value = { formula: `K${summaryStartRow}+K${logRow.number}` };
      finalRow.getCell(12).value = { formula: `L${summaryStartRow}+L${logRow.number}` };
    }
    finalRow.getCell(13).value = { formula: `IF(F${finalRow.number}>0;K${finalRow.number}/F${finalRow.number}*100;0)` };
    finalRow.getCell(13).numFmt = '0.0';
    [10, 11, 12, 13].forEach((i) => {
      const c = finalRow.getCell(i);
      c.font = { bold: true, size: 14 };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } };
      if (i !== 13) c.numFmt = '#,##0.00';
      c.alignment = { vertical: 'middle' };
      c.border = { top: { style: 'medium' }, bottom: { style: 'medium' } };
    });

    const discountPercent = toNumber(calculations?.sums?.discountPercent, 0);
    if (discountPercent > 0) {
      const withoutDiscountRow = sheet.getRow(currentRow++);
      withoutDiscountRow.getCell(1).value = 'РАЗОМ ДО СПЛАТИ (без знижки):';
      withoutDiscountRow.getCell(6).value = toNumber(calculations?.sums?.finalTotalUsd, 0);
      withoutDiscountRow.getCell(7).value = toNumber(calculations?.sums?.finalTotalUah, 0);
      withoutDiscountRow.getCell(10).value = toNumber(calculations?.sums?.orderCostUsd, 0);
      withoutDiscountRow.getCell(11).value = toNumber(calculations?.sums?.finalTotalUsd, 0) - toNumber(calculations?.sums?.orderCostUsd, 0);
      withoutDiscountRow.getCell(12).value = (toNumber(calculations?.sums?.finalTotalUsd, 0) - toNumber(calculations?.sums?.orderCostUsd, 0)) * toNumber(rates?.usd, 1);
      withoutDiscountRow.getCell(13).value = { formula: `IF(F${withoutDiscountRow.number}>0;K${withoutDiscountRow.number}/F${withoutDiscountRow.number}*100;0)` };
      withoutDiscountRow.getCell(13).numFmt = '0.0';
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = withoutDiscountRow.getCell(i);
        c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (i === 1 || i === 6 || i === 7 || i === 10 || i === 11 || i === 12 || i === 13) ? 'FFE8F0FF' : 'FFFFFFFF' } };
        c.font = { bold: true, size: 12 };
        if (i !== 13 && i >= 6) c.numFmt = '#,##0.00';
      }

      const discountRow = sheet.getRow(currentRow++);
      discountRow.getCell(1).value = `Знижка клієнту (${discountPercent}%):`;
      discountRow.getCell(6).value = toNumber(calculations?.sums?.discountUsd, 0);
      discountRow.getCell(7).value = toNumber(calculations?.sums?.discountUsd, 0) * toNumber(rates?.usd, 1);
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = discountRow.getCell(i);
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i >= 6 && i <= 7 ? 'FFFFE8B0' : 'FFFFFFFF' } };
      }

      const withDiscountRow = sheet.getRow(currentRow++);
      withDiscountRow.getCell(1).value = 'РАЗОМ ДО СПЛАТИ (зі знижкою):';
      withDiscountRow.getCell(6).value = toNumber(calculations?.sums?.finalTotalWithDiscountUsd, 0);
      withDiscountRow.getCell(7).value = toNumber(calculations?.sums?.finalTotalWithDiscountUah, 0);
      withDiscountRow.getCell(10).value = toNumber(calculations?.sums?.orderCostUsd, 0);
      withDiscountRow.getCell(11).value = toNumber(calculations?.sums?.finalTotalWithDiscountUsd, 0) - toNumber(calculations?.sums?.orderCostUsd, 0);
      withDiscountRow.getCell(12).value = (toNumber(calculations?.sums?.finalTotalWithDiscountUsd, 0) - toNumber(calculations?.sums?.orderCostUsd, 0)) * toNumber(rates?.usd, 1);
      withDiscountRow.getCell(13).value = { formula: `IF(F${withDiscountRow.number}>0;K${withDiscountRow.number}/F${withDiscountRow.number}*100;0)` };
      withDiscountRow.getCell(13).numFmt = '0.0';
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = withDiscountRow.getCell(i);
        c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: (i === 1 || i === 6 || i === 7 || i === 10 || i === 11 || i === 12 || i === 13) ? 'FFFFFF00' : 'FFFFF7A8' } };
        c.font = { bold: true, size: 12 };
        if (i !== 13 && i >= 6) c.numFmt = '#,##0.00';
      }
    }

    if (!isFullSpec) {
      currentRow += 2;
      sheet.getRow(currentRow).getCell(1).value = 'Загальна маржа (до податків):';
      sheet.getRow(currentRow).getCell(11).value = { formula: `K${finalRow.number}` };
      sheet.getRow(currentRow).getCell(11).font = { bold: true };
      sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';

      currentRow += 1;
      sheet.getRow(currentRow).getCell(1).value = `Комісія менеджера до податків (${managerCommissionRate}%):`;
      sheet.getRow(currentRow).getCell(11).value = { formula: `K${currentRow - 1}*${managerCommissionRate / 100}` };
      sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';

      currentRow += 1;
      sheet.getRow(currentRow).getCell(1).value = 'Чиста маржа до податків:';
      sheet.getRow(currentRow).getCell(11).value = { formula: `K${currentRow - 2}-K${currentRow - 1}` };
      sheet.getRow(currentRow).getCell(11).font = { bold: true };
      sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';

      // Податки у зведеній версії (обов'язково для всіх режимів)
      currentRow += 1;
      sheet.getRow(currentRow).getCell(1).value = 'Разом податки:';
      sheet.getRow(currentRow).getCell(11).value = toNumber(calculations?.sums?.taxesUsd, 0);
      sheet.getRow(currentRow).getCell(12).value = toNumber(calculations?.sums?.taxesUah, 0);
      sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';
      sheet.getRow(currentRow).getCell(12).numFmt = '#,##0.00';
      sheet.getRow(currentRow).getCell(11).font = { bold: true };
      sheet.getRow(currentRow).getCell(12).font = { bold: true };

      // Деталізація ПДВ у зведеній версії
      if (taxMode === 'vat') {
        currentRow += 1;
        sheet.getRow(currentRow).getCell(1).value = 'ПДВ товари 20%:';
        sheet.getRow(currentRow).getCell(11).value = toNumber(calculations?.sums?.vatGoodsUsd, 0);
        sheet.getRow(currentRow).getCell(12).value = toNumber(calculations?.sums?.vatGoodsUah, 0);
        sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';
        sheet.getRow(currentRow).getCell(12).numFmt = '#,##0.00';

        currentRow += 1;
        sheet.getRow(currentRow).getCell(1).value = 'ПДВ роботи 20%:';
        sheet.getRow(currentRow).getCell(11).value = toNumber(calculations?.sums?.vatWorksUsd, 0);
        sheet.getRow(currentRow).getCell(12).value = toNumber(calculations?.sums?.vatWorksUah, 0);
        sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';
        sheet.getRow(currentRow).getCell(12).numFmt = '#,##0.00';

        currentRow += 1;
        sheet.getRow(currentRow).getCell(1).value = 'Податок на чек 2%:';
        sheet.getRow(currentRow).getCell(11).value = toNumber(calculations?.sums?.vatReceiptUsd, 0);
        sheet.getRow(currentRow).getCell(12).value = toNumber(calculations?.sums?.vatReceiptUah, 0);
        sheet.getRow(currentRow).getCell(11).numFmt = '#,##0.00';
        sheet.getRow(currentRow).getCell(12).numFmt = '#,##0.00';
      }
    }

    if (isFullSpec) {
      const addPctLabel = (label) => label;
      currentRow += 2;
      const financeHeaderRow = sheet.getRow(currentRow++);
      financeHeaderRow.getCell(1).value = 'Маржинальність та прибутковість';
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = financeHeaderRow.getCell(i);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF8' } };
        c.font = { bold: true, size: 10, color: { argb: 'FF1F3A68' } };
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }

      const writeFinanceLine = (label, usdValue, uahValue = null) => {
        const row = sheet.getRow(currentRow++);
        row.getCell(1).value = label;
        row.getCell(11).value = usdValue;
        row.getCell(12).value = uahValue === null ? { formula: `K${row.number}*B$4` } : uahValue;
        for (let i = 1; i <= outHeaders.length; i += 1) {
          const c = row.getCell(i);
          c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          if (i === 11 || i === 12) {
            c.numFmt = '#,##0.00';
            c.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      };

      const materialsMarginRow = currentRow;
      writeFinanceLine(addPctLabel('Маржа з товару'), { formula: `K${summaryStartRow}` });
      const worksMarginRow = currentRow;
      writeFinanceLine(addPctLabel('Маржа з робіт'), { formula: insRow ? `K${insRow.number}` : '0' });
      const grossMarginRow = currentRow;
      writeFinanceLine(addPctLabel('Загальна маржа (до податків)'), { formula: `K${finalRow.number}` });
      const managerBeforeTaxRow = currentRow;
      writeFinanceLine(addPctLabel(`Комісія менеджера до податків (${managerCommissionRate}%)`), { formula: `K${grossMarginRow}*${toNumber(managerCommissionRate, 0) / 100}` });
      writeFinanceLine(addPctLabel('Чиста маржа до податків'), { formula: `K${grossMarginRow}-K${managerBeforeTaxRow}` });

      currentRow += 1;
      const taxHeaderRow = sheet.getRow(currentRow++);
      taxHeaderRow.getCell(1).value = 'Податки';
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = taxHeaderRow.getCell(i);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF8' } };
        c.font = { bold: true, size: 10, color: { argb: 'FF1F3A68' } };
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }

      const writeTaxLine = (label, usdValue, uahValue = null) => {
        const row = sheet.getRow(currentRow++);
        row.getCell(1).value = label;
        row.getCell(11).value = usdValue;
        row.getCell(12).value = uahValue === null ? { formula: `K${row.number}*B$4` } : uahValue;
        for (let i = 1; i <= outHeaders.length; i += 1) {
          const c = row.getCell(i);
          c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
          if (i === 11 || i === 12) {
            c.numFmt = '#,##0.00';
            c.alignment = { horizontal: 'right', vertical: 'middle' };
          }
        }
      };

      const vatGoodsUsd = toNumber(calculations?.sums?.vatGoodsUsd, 0);
      const vatWorksUsd = toNumber(calculations?.sums?.vatWorksUsd, 0);
      const vatReceiptUsd = toNumber(calculations?.sums?.vatReceiptUsd, 0);
      const taxesUsd = toNumber(calculations?.sums?.taxesUsd, 0);
      const taxesUah = toNumber(calculations?.sums?.taxesUah, 0);

      if (taxMode === 'vat') {
        writeTaxLine(addPctLabel('ПДВ товари 20%', vatGoodsUsd), vatGoodsUsd, vatGoodsUsd * toNumber(rates?.usd, 1));
        writeTaxLine(addPctLabel('ПДВ роботи 20%', vatWorksUsd), vatWorksUsd, vatWorksUsd * toNumber(rates?.usd, 1));
        writeTaxLine(addPctLabel('Податок на чек 2%', vatReceiptUsd), vatReceiptUsd, vatReceiptUsd * toNumber(rates?.usd, 1));
      }

      if (taxMode === 'fop7' || taxMode === 'fop_advanced') {
        writeTaxLine(addPctLabel('Податок ФОП', taxesUsd), taxesUsd, taxesUah);
      }

      const taxTotalRow = sheet.getRow(currentRow++);
      taxTotalRow.getCell(1).value = 'Разом податки:';
      taxTotalRow.getCell(11).value = taxesUsd;
      taxTotalRow.getCell(12).value = { formula: `K${taxTotalRow.number}*B$4`, result: taxesUah };
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = taxTotalRow.getCell(i);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i >= 11 ? 'FF92D050' : 'FFE9F4DA' } };
        c.font = { bold: true };
        c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
        if (i >= 11) c.numFmt = '#,##0.00';
      }

      currentRow += 1;
      const finalFinanceHeader = sheet.getRow(currentRow++);
      finalFinanceHeader.getCell(1).value = 'Підсумок після податків';
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = finalFinanceHeader.getCell(i);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9EEF8' } };
        c.font = { bold: true, size: 10, color: { argb: 'FF1F3A68' } };
        c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      }

      const afterTaxMarginRowNumber = currentRow;
      writeTaxLine(addPctLabel('Маржа після податків'), { formula: `K${grossMarginRow}-K${taxTotalRow.number}` });
      const afterTaxCommissionRowNumber = currentRow;
      writeTaxLine(addPctLabel('Комісія менеджера після податків'), { formula: `K${afterTaxMarginRowNumber}*${toNumber(managerCommissionRate, 0) / 100}` });
      const netRow = sheet.getRow(currentRow++);
      netRow.getCell(1).value = addPctLabel('Чистий прибуток', calculations?.sums?.netMarginUsd);
      netRow.getCell(11).value = {
        formula: `K${afterTaxMarginRowNumber}-K${afterTaxCommissionRowNumber}`,
        result: toNumber(calculations?.sums?.netMarginUsd, 0)
      };
      netRow.getCell(12).value = {
        formula: `L${afterTaxMarginRowNumber}-L${afterTaxCommissionRowNumber}`,
        result: toNumber(calculations?.sums?.netMarginUah, 0)
      };
      for (let i = 1; i <= outHeaders.length; i += 1) {
        const c = netRow.getCell(i);
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i >= 11 ? 'FF92D050' : 'FFE9F4DA' } };
        c.font = { bold: true };
        c.border = { top: { style: 'medium' }, left: { style: 'thin' }, bottom: { style: 'medium' }, right: { style: 'thin' } };
        if (i >= 11) c.numFmt = '#,##0.00';
      }
    }
  } else {
    currentRow += 4;
    sheet.getCell(`A${currentRow}`).value = 'Здав: ___________________';
    sheet.getCell(`F${currentRow}`).value = 'Прийняв: ___________________';
    sheet.getRow(currentRow).font = { italic: true };
  }

    if (!workbookOverride) {
      const outBuffer = await workbook.xlsx.writeBuffer();
      const outBlob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const outBaseDocName = buildDocumentBaseName(clientInfo, calculations.stationPowerW);
      const suffix = isFullSpec ? '_Повна_специфікація' : '_Зведено';
      const outFileName = isOffer ? `${outBaseDocName}_КП${suffix}.xlsx` : `${outBaseDocName}_Накладна${suffix}.xlsx`;

      await saveToDiskUtility(
        workspaceHandle,
        clientInfo,
        calculations,
        outFileName,
        outBlob,
        isOffer ? 'Excel КП' : 'Excel Накладна',
        projectFolderName
      );
    }

    return workbook;
  } catch (err) {
    console.error('Excel Export Error:', err);
    alert(`Помилка при створенні Excel: ${err.message}`);
  }
}

window.exportToExcelFile = exportToExcelFile;

const toSheetName = (value = '', fallback = 'КП') => {
  const cleaned = String(value || fallback).replace(/[\[\]\*\/\\\?\:]/g, ' ').trim();
  const safe = cleaned || fallback;
  return safe.slice(0, 31);
};

const addComparisonSheet = (workbook, rows = []) => {
  const sheet = workbook.addWorksheet('Порівняльний лист');
  const headers = [
    'КП',
    'Сума за обладнання, $',
    'Сума за роботи, $',
    'Інші витрати, $',
    'Загальна вартість обʼєкту, $',
    'Маржа грязна, $',
    'Податки, $',
    'Маржа менеджера, $',
    'Маржа чиста, $'
  ];

  sheet.columns = [
    { width: 24 },
    { width: 20 },
    { width: 18 },
    { width: 16 },
    { width: 24 },
    { width: 16 },
    { width: 14 },
    { width: 18 },
    { width: 16 }
  ];

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF153772' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });

  rows.forEach((row) => {
    const dataRow = sheet.addRow([
      row.name || 'КП',
      toNumber(row.materialsSumUsd, 0),
      toNumber(row.worksTotalUsd, 0),
      toNumber(row.otherCostsUsd, 0),
      toNumber(row.finalTotalWithDiscountUsd, 0),
      toNumber(row.grossMarginBeforeTaxesUsd, 0),
      toNumber(row.taxesUsd, 0),
      toNumber(row.managerCommissionAfterTaxesUsd, 0),
      toNumber(row.netProfitUsd, 0)
    ]);
    dataRow.eachCell((cell, idx) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: idx === 1 ? 'left' : 'right', vertical: 'middle' };
      if (idx >= 2) cell.numFmt = '#,##0.00';
    });
  });
};

async function exportAllOffersToExcelFile({
  offerSheets = [],
  activeOfferSheetId = '',
  clientInfo,
  calculations,
  workspaceHandle,
  projectFolderName,
  detailLevel = 'full'
}) {
  try {
    if (typeof window.ExcelJS === 'undefined') {
      throw new Error('Бібліотека ExcelJS не завантажена. Спробуйте оновити сторінку.');
    }
    if (!Array.isArray(offerSheets) || offerSheets.length === 0) {
      throw new Error('Немає листів КП для експорту.');
    }

    const workbook = new window.ExcelJS.Workbook();
    const used = new Set();
    const normalized = offerSheets.map((sheet, idx) => {
      const base = toSheetName(sheet?.name || `КП ${idx + 1}`, `КП ${idx + 1}`);
      let candidate = base;
      let suffix = 2;
      while (used.has(candidate)) {
        const trimmed = base.slice(0, Math.max(1, 31 - (` (${suffix})`.length)));
        candidate = `${trimmed} (${suffix})`;
        suffix += 1;
      }
      used.add(candidate);
      return { ...sheet, _sheetName: candidate };
    });

    for (const sheet of normalized) {
      const snap = sheet?.data || {};
      const sum = sheet?.summary || {};
      const rates = snap?.rates && typeof snap.rates === 'object' ? snap.rates : { eur: 0, usd: 1 };
      const calculatedForSheet = (snap?.calculationsSnapshot && typeof snap.calculationsSnapshot === 'object')
        ? snap.calculationsSnapshot
        : buildCalculationsForOfferSheetExport(snap, sum);

      await exportToExcelFile({
        mode: 'offer',
        projectType: snap.projectType || 'project',
        clientInfo: snap.clientInfo || clientInfo || {},
        rates,
        modulePower: toNumber(snap.modulePower, 0),
        calculations: calculatedForSheet,
        installPercent: toNumber(snap.installPercent, 0),
        managerCommissionRate: toNumber(snap.managerCommissionRate, 0),
        workspaceHandle,
        projectFolderName,
        groupSettings: snap.groupSettings || {},
        detailLevel: detailLevel === 'summary' ? 'summary' : 'full',
        workbookOverride: workbook,
        sheetNameOverride: sheet._sheetName
      });
    }
    addComparisonSheet(workbook, normalized.map((sheet) => ({ ...(sheet.summary || {}), name: sheet.name || 'КП', active: String(sheet.id) === String(activeOfferSheetId) })));

    const outBuffer = await workbook.xlsx.writeBuffer();
    const outBlob = new Blob([outBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const outBaseDocName = buildDocumentBaseName(clientInfo, calculations?.stationPowerW || 0);
    const suffix = detailLevel === 'summary' ? 'Зведено' : 'Повна';
    const outFileName = `${outBaseDocName}_Всі_КП_${suffix}.xlsx`;

    await saveToDiskUtility(
      workspaceHandle,
      clientInfo,
      calculations,
      outFileName,
      outBlob,
      'Excel Всі КП',
      projectFolderName
    );
  } catch (err) {
    console.error('Excel Multi-Offer Export Error:', err);
    alert(`Помилка при створенні Excel (всі КП): ${err.message}`);
  }
}

window.exportAllOffersToExcelFile = exportAllOffersToExcelFile;
