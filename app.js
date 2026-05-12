// Imports removed, using global variables from index.html scripts

const { useState, useMemo, useEffect, useRef } = React;

const expandableGroups = ["Захист PV", "Захист AC", "Захист DC"];
const MAIN_TYPES = ["Інвертор", "ФЕП", "АКБ", "BMS", "MPPT контролер", "Cerbo", "Кліматична шафа", "Стійка", "Інше"];
const PROTECTION_TYPES = ["Захист PV", "Захист AC", "Захист DC", "Інше"];
const PROTECTION_GROUP_CHOICES = ["Захист PV", "Захист AC", "Захист DC", "Інше"];
const GROUNDING_TYPES = ["Заземлення", "Інше"];
const CABLE_TYPES = ["Кабель", "Інше"];
const PROJECT_TYPES = {
  project: "Проєктний",
  commercial: "Комерційний",
  product: "Товарний"
};
const TAX_MODES = {
  none: "Без податків",
  fop7: "ФОП 7%",
  vat: "ПДВ",
  fop_advanced: "ФОП просунутий"
};
const TAX_DISTRIBUTION_SCOPES = {
  nonMainGoods: "Тільки неосновні товари",
  allGoods: "Весь товар, включно з Основним обладнанням",
  goodsWorksLogistics: "Товар + роботи + логістика"
};
const PV_TEMPLATE_TYPES = ["Стандарт", "Victron", "Інше"];
const MOUNTING_TEMPLATE_TYPES = [
  "Похилий дах",
  "Дах з трикутником",
  "Баластна система",
  "Наземна система"
];
const MOUNTING_TEMPLATE_CONFIG = {
  "Похилий дах": { name: "Кріплення на похилий дах", unit: "компл" },
  "Дах з трикутником": { name: "Кріплення на дах з трикутником", unit: "компл" },
  "Баластна система": { name: "Баластна система на прямий дах", unit: "компл" },
  "Наземна система": { name: "Наземна система", unit: "компл" }
};
const PV_TEMPLATE_METERS_BY_TYPE = {
  "Стандарт": 150,
  "Victron": 120,
  "Інше": 150
};
const PV_CABLE_TARGET_GROUP = "Кабельна продукція";
const PRODUCTS_CATALOG_FILE = 'data/products_catalog.json';
const TEMPLATES_CATALOG_FILE = 'data/templates_catalog.json';
const VICTRON_MPPT_DEFAULT = "Solar Charge Controller MPPT Victron SmartSolar MPPT 250/100-Tr VE.Can";
const VICTRON_CERBO_DEFAULT = "Cerbo Victron";
const HV_BATTERY_BUNDLE_MAP = {
  "BOS-A": {
    bms: "BOS-A-PDU-2 1000V/160A — BMS для батарей DEYE BOS-A 1000V 160A (BOS-A-PDU-2 1000V/160A)",
    rack: "BOS-A-Rack14 — Стійка для батарей DEYE BOS-A 14-рівнів (BOS-A-Rack14)"
  },
  "BOS-B": {
    bms: "BOS-B-PDU-2 — BMS для батарей DEYE BOS-B 200-1000Vdc 168A (BOS-B-PDU-2)",
    rack: "RACK/BOS-B-PRO — Стійка для 15 батарей DEYE BOS-B PRO (RACK/BOS-B-PRO)"
  },
  "BOS-B-PACK16-A3": {
    bms: "BOS-B-PDU-2-A — BMS для батарей DEYE BOS-B PRO 200-1000V 180A (BOS-B-PDU-2-A)",
    rack: "RACK/BOS-B-PRO — Стійка для 15 батарей DEYE BOS-B PRO (RACK/BOS-B-PRO)"
  },
  "BOS-G/BOS-GM5.1-D": {
    bms: "BOS-G-PDU-2 — BMS для батарей DEYE BOS-G PRO 200-1000Vdc 120A (BOS-G-PDU-2)",
    rack: "3U-HRACK — Стійка для 13 батарей DEYE BOS-G (3U-HRACK)"
  },
  "BOS-G-PACK5.1PRO": {
    bms: "BOS-G-PDU-2 — BMS для батарей DEYE BOS-G PRO 200-1000Vdc 120A (BOS-G-PDU-2)",
    rack: "3U-HRACK — Стійка для 13 батарей DEYE BOS-G (3U-HRACK)"
  }
};
const DEFAULT_RATES = { eur: 51.35, usd: 44.10 };
const DEFAULT_CLIENT_INFO = { name: "", address: "" };
const DEFAULT_OFFER_PURPOSE = "для власних потреб";
const DEFAULT_COVER_SYSTEM_NAME = "";
const DEFAULT_QR_URL = "https://www.solarservice.pro/";
const DEFAULT_MANAGER_CONTACTS = [
  { id: "manager_oleg_minakov", name: "Олег Мінаков", phone: "+380933990622" }
];
const COVER_PAGE_TYPES = ["Будинок", "Квартира", "Виробництво", "Наземна станція"];
const GENERATION_REGION_PROFILES = {
  south: {
    annualYieldKwhPerKw: 1300,
    monthFactors: [0.045, 0.06, 0.09, 0.11, 0.125, 0.13, 0.135, 0.125, 0.095, 0.055, 0.02, 0.01]
  },
  center: {
    annualYieldKwhPerKw: 1180,
    monthFactors: [0.035, 0.05, 0.085, 0.11, 0.125, 0.13, 0.13, 0.12, 0.095, 0.06, 0.035, 0.025]
  },
  west: {
    annualYieldKwhPerKw: 1080,
    monthFactors: [0.03, 0.045, 0.08, 0.11, 0.13, 0.135, 0.13, 0.115, 0.095, 0.065, 0.04, 0.025]
  },
  north: {
    annualYieldKwhPerKw: 1120,
    monthFactors: [0.03, 0.045, 0.08, 0.11, 0.125, 0.13, 0.13, 0.118, 0.098, 0.07, 0.04, 0.024]
  },
  east: {
    annualYieldKwhPerKw: 1210,
    monthFactors: [0.04, 0.055, 0.088, 0.112, 0.126, 0.13, 0.132, 0.122, 0.096, 0.064, 0.033, 0.022]
  },
  mountain: {
    annualYieldKwhPerKw: 1040,
    monthFactors: [0.028, 0.043, 0.078, 0.11, 0.131, 0.137, 0.133, 0.117, 0.098, 0.068, 0.04, 0.017]
  }
};
const GENERATION_CITY_TO_PROFILE = {
  "Миколаїв": "south",
  "Одеса": "south",
  "Херсон": "south",
  "Сімферополь": "south",
  "Севастополь": "south",
  "Ялта": "south",
  "Євпаторія": "south",
  "Керч": "south",
  "Феодосія": "south",
  "Київ": "center",
  "Вінниця": "center",
  "Черкаси": "center",
  "Кропивницький": "center",
  "Полтава": "center",
  "Дніпро": "center",
  "Кременчук": "center",
  "Біла Церква": "center",
  "Житомир": "north",
  "Чернігів": "north",
  "Суми": "north",
  "Луцьк": "north",
  "Рівне": "north",
  "Львів": "west",
  "Івано-Франківськ": "west",
  "Тернопіль": "west",
  "Хмельницький": "west",
  "Ужгород": "mountain",
  "Чернівці": "west",
  "Харків": "east",
  "Запоріжжя": "east",
  "Донецьк": "east",
  "Луганськ": "east",
  "Кривий Ріг": "east",
  "Маріуполь": "east",
  "Мелітополь": "south",
  "Бердянськ": "south"
};
const GENERATION_LOCATIONS = Object.keys(GENERATION_CITY_TO_PROFILE);
const GENERATION_MOUNT_TYPES = {
  roof: { label: "Дах", multiplier: 1.0 },
  ground: { label: "Наземна", multiplier: 1.08 }
};
const DEFAULT_OTHER_EXPENSES = [{ id: 1, name: "Транспорт / ПММ", quantity: 1, price: 100, currency: "USD", incomingPrice: 0, markupPercent: 0 }];
const DEFAULT_WORK_ITEMS = [{ id: 1, name: "Монтажні та пусконалагоджувальні роботи", quantity: 1, price: 0, currency: "USD", incomingPrice: 0, markupPercent: 0 }];
const DEFAULT_OFFER_SHEETS = [{ id: "offer_sheet_1", name: "КП 1", data: null, summary: null }];
const DEFAULT_COMMERCIAL_WORK_ITEMS = [
  "Геологічні та геодезичні вишукування",
  "Розробка проектних рішень",
  "Спец. транспорт (кран, маніпулятор)",
  "Доставка матеріалів",
  "Будівельно-монтажні роботи",
  "Електро-монтажні роботи",
  "Відрядження та транспортні",
  "Пуско-налагоджувальні роботи",
  "Навчання персоналу",
  "Технічна підтримка протягом 1-го року"
];

const WORKSPACE_DB_NAME = 'solar_workspace_db';
const WORKSPACE_STORE_NAME = 'handles';
const WORKSPACE_PINNED_KEY = 'pinned_workspace';
const PV_ENCLOSURE_SIZES = [8, 12, 18, 24, 36];

const DEFAULT_GROUPS_SNAPSHOT = JSON.parse(JSON.stringify(INITIAL_GROUPS));
const createDefaultGroups = () => JSON.parse(JSON.stringify(DEFAULT_GROUPS_SNAPSHOT));
const cloneGroupItems = (groupKey) => JSON.parse(JSON.stringify(DEFAULT_GROUPS_SNAPSHOT[groupKey] || []));
const cloneList = (list) => list.map(item => ({ ...item }));
const createCommercialWorkItems = () => DEFAULT_COMMERCIAL_WORK_ITEMS.map((name, idx) => ({
  id: Date.now() + idx + 1,
  name,
  quantity: 1,
  price: 0,
  currency: "USD",
  incomingPrice: 0,
  markupPercent: 0
}));
const createDefaultGroupSettings = () => ({
  "Захист PV": { mode: 'fixed', name: 'Захист PV', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0, pvTemplateStrings: 1, pvTemplateType: 'Стандарт', pvCableMetersPerString: 150, pvAutoCableQuantity: true },
  "Захист AC": { mode: 'fixed', name: 'Захист AC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
  "Захист DC": { mode: 'fixed', name: 'Захист DC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
  "Кріплення": { mode: 'detailed', name: 'Кріплення (металочерепиця/профнастил)', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 }
});
const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') {
    // Handle both dot and comma as decimal separators, and remove spaces
    const clean = value.replace(/\s/g, '').replace(',', '.');
    const n = Number(clean);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
const parseNumberInput = (value) => (value === "" ? "" : toNumber(value, 0));
const roundMarkupForInput = (value) => (value === "" ? "" : Math.round(toNumber(value, 0) * 10) / 10);
const normalizeForMatch = (value) => String(value || "").toLowerCase().replace(/[^a-z0-9а-яіїєґ]/g, "");
const isPvCableProductRow = (item) => {
  const name = normalizeForMatch(item?.name || "");
  return name.includes("kbedb60mmdcblack");
};
const isPvMc4ProductRow = (item) => {
  const name = normalizeForMatch(item?.name || "");
  return name.includes("конектормс4") || name.includes("mc4");
};
const normalizeCatalogKey = (value) => String(value || '').trim().toLowerCase();
const extractProductCode = (value) => {
  const source = String(value || '').trim();
  if (!source) return '';
  const first = source.split('—')[0].trim().split(/\s+/)[0];
  return first.toUpperCase().replace(/[^\w./-]/g, '');
};
const getHvBundleForBattery = (batteryName) => {
  const code = extractProductCode(batteryName);
  return HV_BATTERY_BUNDLE_MAP[code] || null;
};
const isVictronInverterName = (name) => {
  const source = String(name || '').toLowerCase();
  return source.includes('victron') && source.includes('inverter');
};
const normalizeImportedTemplates = (parsed) => {
  const list = Array.isArray(parsed)
    ? parsed
    : (Array.isArray(parsed?.templates) ? parsed.templates : null);
  if (!Array.isArray(list)) return null;
  return list
    .filter(t => t && typeof t === 'object')
    .map((t, idx) => ({
      id: String(t.id || `template_${idx + 1}`),
      name: String(t.name || `Шаблон ${idx + 1}`),
      data: (t.data && typeof t.data === 'object') ? t.data : {}
    }));
};
const buildTemplatesCatalogPayload = (templatesList = []) => ({
  schemaVersion: 1,
  updatedAt: new Date().toISOString(),
  templates: normalizeImportedTemplates({ templates: templatesList }) || []
});
const getTemplatesCatalogSignature = (templatesList = []) => JSON.stringify(
  (normalizeImportedTemplates({ templates: templatesList }) || []).map((template) => ({
    id: template.id,
    name: template.name,
    data: template.data
  }))
);

const fetchServerTemplatesCatalog = async () => {
  try {
    const response = await fetch('/api/templates', { method: 'GET' });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const normalized = normalizeImportedTemplates(payload?.data);
    return normalized || null;
  } catch (_) {
    return null;
  }
};

const saveServerTemplatesCatalog = async (templatesList = []) => {
  try {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildTemplatesCatalogPayload(templatesList))
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => null);
    return !!payload?.ok;
  } catch (_) {
    return false;
  }
};
const buildCatalogPayloadFromPricingMap = (pricingMap = {}) => {
  const items = [];
  Object.entries(pricingMap || {}).forEach(([category, byName]) => {
    Object.entries(byName || {}).forEach(([nameKey, pricing]) => {
      if (!nameKey) return;
      items.push({
        category,
        name: nameKey,
        price: toNumber(pricing?.price, 0),
        currency: pricing?.currency || 'USD',
        incomingPrice: toNumber(pricing?.incomingPrice, 0),
        markupPercent: pricing?.markupPercent === undefined ? null : toNumber(pricing?.markupPercent, 0),
        updatedAt: new Date().toISOString()
      });
    });
  });
  return {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    items
  };
};
const toGroupsSnapshotFromCatalog = (catalog) => {
  const groups = {};
  (catalog?.items || []).forEach((entry, idx) => {
    const category = entry?.category || "Інше";
    const normalizedName = normalizeCatalogKey(entry?.name || '');
    if (!normalizedName) return;
    if (!Array.isArray(groups[category])) groups[category] = [];
    groups[category].push({
      id: Date.now() + idx,
      type: category,
      name: normalizedName,
      unit: "шт.",
      quantity: 1,
      price: toNumber(entry?.price, 0),
      currency: entry?.currency || 'USD',
      incomingPrice: toNumber(entry?.incomingPrice, 0),
      markupPercent: entry?.markupPercent === null || entry?.markupPercent === undefined ? 0 : toNumber(entry?.markupPercent, 0)
    });
  });
  return groups;
};
const toSafeFilePart = (value = "") => {
  return String(value || "")
    .trim()
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[._\s]+$/, "")
    .slice(0, 150);
};
const buildDocumentBaseName = (clientInfo, stationPowerW) => {
  const safeClient = toSafeFilePart(clientInfo?.name || "Клієнт").replace(/\s+/g, "_");
  const safeAddress = toSafeFilePart(clientInfo?.address || "Адреса").replace(/\s+/g, "_");
  const powerKw = (Number(stationPowerW) || 0) / 1000;
  const safePower = powerKw > 0 ? (powerKw.toFixed(2) + "кВт") : "0кВт";
  const dateCode = new Date().toLocaleDateString("uk-UA").replace(/\./g, "-");
  return [safeClient || "Клієнт", safeAddress || "Адреса", safePower, dateCode].join("_");
};
const formatKw = (kw) => {
  const value = toNumber(kw, 0);
  if (value <= 0) return "0";
  const rounded = Math.round(value * 100) / 100;
  return rounded.toString().replace(".", ",");
};
const parsePowerKwFromText = (text) => {
  const source = String(text || "");
  const kwMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(?:квт|kw)\b/i);
  if (kwMatch) return toNumber(kwMatch[1].replace(",", "."), 0);
  const wMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(?:вт|w)\b/i);
  if (wMatch) return toNumber(wMatch[1].replace(",", "."), 0) / 1000;
  return 0;
};
const parseBatteryKwhFromText = (text) => {
  const source = String(text || "");
  const kwhMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(?:квт[\s·.\-]*год|kwh)\b/i);
  if (kwhMatch) return toNumber(kwhMatch[1].replace(",", "."), 0);
  const whMatch = source.match(/(\d+(?:[.,]\d+)?)\s*(?:вт[\s·.\-]*год|wh)\b/i);
  if (whMatch) return toNumber(whMatch[1].replace(",", "."), 0) / 1000;
  return 0;
};

const openWorkspaceDb = () => new Promise((resolve, reject) => {
  if (!window.indexedDB) {
    resolve(null);
    return;
  }
  const request = window.indexedDB.open(WORKSPACE_DB_NAME, 1);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(WORKSPACE_STORE_NAME)) {
      db.createObjectStore(WORKSPACE_STORE_NAME);
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const savePinnedWorkspaceHandle = async (handle) => {
  const db = await openWorkspaceDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_STORE_NAME, 'readwrite');
    tx.objectStore(WORKSPACE_STORE_NAME).put(handle, WORKSPACE_PINNED_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

const loadPinnedWorkspaceHandle = async () => {
  const db = await openWorkspaceDb();
  if (!db) return null;
  const handle = await new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_STORE_NAME, 'readonly');
    const req = tx.objectStore(WORKSPACE_STORE_NAME).get(WORKSPACE_PINNED_KEY);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return handle;
};

const clearPinnedWorkspaceHandle = async () => {
  const db = await openWorkspaceDb();
  if (!db) return;
  await new Promise((resolve, reject) => {
    const tx = db.transaction(WORKSPACE_STORE_NAME, 'readwrite');
    tx.objectStore(WORKSPACE_STORE_NAME).delete(WORKSPACE_PINNED_KEY);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
  db.close();
};

function App() {
  const getSaved = (key, def) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : def;
    } catch (e) { return def; }
  };

  const [rates, setRates] = useState(() => getSaved('solar_rates', DEFAULT_RATES));
  const [modulePower, setModulePower] = useState(550);
  const [clientInfo, setClientInfo] = useState(() => getSaved('solar_clientInfo', DEFAULT_CLIENT_INFO));
  const [offerPurpose, setOfferPurpose] = useState(() => getSaved('solar_offerPurpose', DEFAULT_OFFER_PURPOSE));
  const [coverSystemName, setCoverSystemName] = useState(() => getSaved('solar_coverSystemName', DEFAULT_COVER_SYSTEM_NAME));
  const [coverPageType, setCoverPageType] = useState(() => getSaved('solar_coverPageType', COVER_PAGE_TYPES[0]));
  const [showOfferStationSheet, setShowOfferStationSheet] = useState(() => getSaved('solar_showOfferStationSheet', false));
  const [generationLocation, setGenerationLocation] = useState(() => getSaved('solar_generationLocation', 'Миколаїв'));
  const [generationMountType, setGenerationMountType] = useState(() => getSaved('solar_generationMountType', 'roof'));
  const [energyTariffUah, setEnergyTariffUah] = useState(() => getSaved('solar_energyTariffUah', 4.32));
  const [typicalLoadKw, setTypicalLoadKw] = useState(() => getSaved('solar_typicalLoadKw', 2));
  const [coverQrUrl, setCoverQrUrl] = useState(() => getSaved('solar_coverQrUrl', DEFAULT_QR_URL));
  const [offerSettingsCollapsed, setOfferSettingsCollapsed] = useState(() => getSaved('solar_offerSettingsCollapsed', false));
  const [managerContacts, setManagerContacts] = useState(() => {
    const saved = getSaved('solar_managerContacts', DEFAULT_MANAGER_CONTACTS);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_MANAGER_CONTACTS;
  });
  const [selectedManagerId, setSelectedManagerId] = useState(() => getSaved('solar_selectedManagerId', DEFAULT_MANAGER_CONTACTS[0].id));
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPhone, setNewManagerPhone] = useState('');
  const [equipmentGroups, setEquipmentGroups] = useState(() => getSaved('solar_equipmentGroups', createDefaultGroups()));
  
  const [otherExpenses, setOtherExpenses] = useState(() => getSaved('solar_otherExpenses', cloneList(DEFAULT_OTHER_EXPENSES)));
  const [workItems, setWorkItems] = useState(() => getSaved('solar_workItems', cloneList(DEFAULT_WORK_ITEMS)));
  const [installPercent, setInstallPercent] = useState(() => getSaved('solar_installPercent', 15));
  const [managerCommissionRate, setManagerCommissionRate] = useState(() => getSaved('solar_managerCommissionRate', 10));
  const [clientDiscountPercent, setClientDiscountPercent] = useState(() => getSaved('solar_clientDiscountPercent', 0));
  const [taxMode, setTaxMode] = useState(() => getSaved('solar_taxMode', 'none'));
  const [fopTaxPercent, setFopTaxPercent] = useState(() => getSaved('solar_fopTaxPercent', 7));
  const [advancedFopPercent, setAdvancedFopPercent] = useState(() => getSaved('solar_advancedFopPercent', 7));
  const [advancedFopBaseMode, setAdvancedFopBaseMode] = useState(() => getSaved('solar_advancedFopBaseMode', 'all_goods'));
  const [advancedFopSelectedGroups, setAdvancedFopSelectedGroups] = useState(() => getSaved('solar_advancedFopSelectedGroups', []));
  const [advancedFopSelectedItems, setAdvancedFopSelectedItems] = useState(() => getSaved('solar_advancedFopSelectedItems', []));
  const [advancedFopGroupPercents, setAdvancedFopGroupPercents] = useState(() => getSaved('solar_advancedFopGroupPercents', {}));
  const [advancedFopItemPercents, setAdvancedFopItemPercents] = useState(() => getSaved('solar_advancedFopItemPercents', {}));
  const [lockedDistributedTaxUsd, setLockedDistributedTaxUsd] = useState(() => getSaved('solar_lockedDistributedTaxUsd', null));
  const [taxDistributionApplied, setTaxDistributionApplied] = useState(() => getSaved('solar_taxDistributionApplied', false));
  const [taxDistributionScope, setTaxDistributionScope] = useState(() => getSaved('solar_taxDistributionScope', 'nonMainGoods'));
  const [installPercentTaxUsd, setInstallPercentTaxUsd] = useState(() => getSaved('solar_installPercentTaxUsd', 0));
  const [autoInstallPercentEnabled, setAutoInstallPercentEnabled] = useState(() => getSaved('solar_autoInstallPercentEnabled', true));
  const [groupSettings, setGroupSettings] = useState(() => getSaved('solar_groupSettings', createDefaultGroupSettings()));

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState(() => getSaved('solar_projectType', 'commercial'));
  const [projectFolderName, setProjectFolderName] = useState(() => getSaved('solar_projectFolderName', ''));
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
  const [showQuickCalc, setShowQuickCalc] = useState(false);
  const [quickCalcExpr, setQuickCalcExpr] = useState('');
  const [quickCalcResult, setQuickCalcResult] = useState('0');
  const [clientMode, setClientMode] = useState(() => getSaved('solar_clientMode', false));
  const [templates, setTemplates] = useState(() => {
    const saved = getSaved('solar_templates', []);
    return Array.isArray(saved) ? saved : [];
  });
  const [projectCatalogSnapshots, setProjectCatalogSnapshots] = useState(() => {
    const saved = getSaved('solar_project_catalog_snapshots', []);
    return Array.isArray(saved) ? saved : [];
  });
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [newProtectionType, setNewProtectionType] = useState("Захист PV");
  const [newProtectionCustomName, setNewProtectionCustomName] = useState("");
  const [mountingTemplateSelection, setMountingTemplateSelection] = useState(() => getSaved('solar_mountingTemplateSelection', {}));
  const [offerSheets, setOfferSheets] = useState(() => {
    const saved = getSaved('solar_offerSheets', DEFAULT_OFFER_SHEETS);
    return Array.isArray(saved) && saved.length > 0 ? saved : DEFAULT_OFFER_SHEETS;
  });
  const [activeOfferSheetId, setActiveOfferSheetId] = useState(() => getSaved('solar_activeOfferSheetId', DEFAULT_OFFER_SHEETS[0].id));
  const [showOfferComparisonSheet, setShowOfferComparisonSheet] = useState(false);
  const [editingOfferSheetId, setEditingOfferSheetId] = useState('');
  const isApplyingOfferSheetRef = useRef(false);

  // Reverse migration to fix the issue where all protection items were merged into one group
  // Aggressive repair logic removed to prevent data loss.

  useEffect(() => {
    setEquipmentGroups(prev => {
      const cableItems = Array.isArray(prev["Кабельна продукція"]) ? prev["Кабельна продукція"] : [];
      const hasMc4 = cableItems.some(it => (it?.name || "").toLowerCase().includes("mc4"));
      if (hasMc4) return prev;

      const mc4Default = DEFAULT_GROUPS_SNAPSHOT["Кабельна продукція"]?.find(it => (it?.name || "").toLowerCase().includes("mc4"));
      if (!mc4Default) return prev;

      return {
        ...prev,
        "Кабельна продукція": [...cableItems, { ...mc4Default, id: Date.now() + 41 }]
      };
    });
  }, []);

  useEffect(() => {
    setGroupSettings(prev => {
      const mounting = prev["Кріплення"];
      if (!mounting || mounting.unit !== "кВт") return prev;
      return {
        ...prev,
        "Кріплення": { ...mounting, unit: "компл" }
      };
    });
  }, []);

  // Logic to build a database from templates and current groups, grouped by Type
  const productDatabase = useMemo(() => {
    const db = {};
    const extract = (groups) => {
      Object.entries(groups).forEach(([group, items]) => {
        if (!Array.isArray(items)) return;
        items.forEach(it => { 
          if (it.name) {
            // Use item.type if present (for Main Equipment), otherwise use group name
            const category = (group === "Основне обладнання" && it.type) ? it.type : group;
            if (!db[category]) db[category] = new Set();
            db[category].add(it.name); 
          }
        });
      });
    };
    
    // Add current items
    extract(equipmentGroups);
    // Add items from templates
    templates.forEach(t => {
      if (t?.data?.equipmentGroups) extract(t.data.equipmentGroups);
    });
    // Add items from saved/opened projects history
    projectCatalogSnapshots.forEach(groups => {
      if (groups && typeof groups === 'object') extract(groups);
    });

    const finalDb = {};
    Object.keys(db).forEach(k => finalDb[k] = Array.from(db[k]));
    
    // Merge external predefined database
    if (typeof EXTERNAL_PRODUCT_DB !== 'undefined') {
      Object.entries(EXTERNAL_PRODUCT_DB).forEach(([category, items]) => {
        if (!finalDb[category]) finalDb[category] = [];
        items.forEach(item => {
          if (!finalDb[category].includes(item)) {
            finalDb[category].push(item);
          }
        });
      });
    }

    return finalDb;
  }, [equipmentGroups, templates, projectCatalogSnapshots]);

  const productLastValues = useMemo(() => {
    const db = {};
    const normalizeName = (value) => String(value || '').trim().toLowerCase();
    const saveItem = (category, item) => {
      const itemName = String(item?.name || '').trim();
      const normalized = normalizeName(itemName);
      if (!normalized) return;
      if (!db[category]) db[category] = {};
      db[category][normalized] = {
        price: toNumber(item?.price, 0),
        currency: item?.currency || 'USD',
        incomingPrice: toNumber(item?.incomingPrice, 0),
        markupPercent: item?.markupPercent
      };
    };

    const extract = (groups) => {
      Object.entries(groups || {}).forEach(([group, items]) => {
        if (!Array.isArray(items)) return;
        items.forEach(it => {
          const category = (group === "Основне обладнання" && it.type) ? it.type : group;
          saveItem(category, it);
        });
      });
    };

    templates.forEach(t => {
      if (t?.data?.equipmentGroups) extract(t.data.equipmentGroups);
    });
    [...projectCatalogSnapshots].reverse().forEach(groups => {
      if (groups && typeof groups === 'object') extract(groups);
    });
    extract(equipmentGroups);

    return db;
  }, [equipmentGroups, templates, projectCatalogSnapshots]);

  const allProductNames = useMemo(() => {
    const set = new Set();
    Object.values(productDatabase || {}).forEach((arr) => {
      (arr || []).forEach((name) => {
        const n = String(name || '').trim();
        if (n) set.add(n);
      });
    });
    return Array.from(set);
  }, [productDatabase]);

  const [printMode, setPrintMode] = useState(null); // null, 'offer', 'invoice'
  const [includeManagerInOffer, setIncludeManagerInOffer] = useState(() => getSaved('solar_includeManagerInOffer', true));
  const [includeClientInOffer, setIncludeClientInOffer] = useState(() => getSaved('solar_includeClientInOffer', true));
  const [includeAddressInOffer, setIncludeAddressInOffer] = useState(() => getSaved('solar_includeAddressInOffer', true));
  const [printCurrencyMode, setPrintCurrencyMode] = useState(() => getSaved('solar_printCurrencyMode', 'both')); // both | usd | uah
  const [offerAppendPdfFiles, setOfferAppendPdfFiles] = useState([]);
  const offerAppendPdfInputRef = useRef(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [workspaceHandle, setWorkspaceHandle] = useState(null);
  const [workspacePinned, setWorkspacePinned] = useState(false);
  const [workspacePath, setWorkspacePath] = useState(() => getSaved('solar_workspacePath', ''));
  const [uiTheme, setUiTheme] = useState(() => getSaved('solar_uiTheme', 'dark'));
  const [layoutMode, setLayoutMode] = useState(() => getSaved('solar_layoutMode', 'classic'));
  const [menuCollapsed, setMenuCollapsed] = useState(() => getSaved('solar_menuCollapsed', false));
  const [autoMountingQuantity, setAutoMountingQuantity] = useState(() => getSaved('solar_autoMountingQuantity', true));
  const [newCategoryName, setNewCategoryName] = useState("");
  const catalogLoadedRef = useRef(false);
  const catalogWriteTimerRef = useRef(null);
  const lastCatalogSignatureRef = useRef('');
  const templatesLoadedRef = useRef(false);
  const templatesWriteTimerRef = useRef(null);
  const lastTemplatesSignatureRef = useRef('');

  useEffect(() => { localStorage.setItem('solar_projectType', JSON.stringify(projectType)); }, [projectType]);
  useEffect(() => { localStorage.setItem('solar_workspacePath', JSON.stringify(workspacePath)); }, [workspacePath]);
  useEffect(() => { localStorage.setItem('solar_projectFolderName', JSON.stringify(projectFolderName)); }, [projectFolderName]);
  useEffect(() => { localStorage.setItem('solar_clientMode', JSON.stringify(clientMode)); }, [clientMode]);
  useEffect(() => { localStorage.setItem('solar_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => {
    localStorage.setItem('solar_uiTheme', JSON.stringify(uiTheme));
    const normalizedTheme = uiTheme === 'light' || uiTheme === 'gray' ? uiTheme : 'dark';
    document.documentElement.setAttribute('data-theme', normalizedTheme);
  }, [uiTheme]);
  useEffect(() => { localStorage.setItem('solar_layoutMode', JSON.stringify(layoutMode)); }, [layoutMode]);
  useEffect(() => { localStorage.setItem('solar_menuCollapsed', JSON.stringify(menuCollapsed)); }, [menuCollapsed]);
  useEffect(() => { localStorage.setItem('solar_autoMountingQuantity', JSON.stringify(autoMountingQuantity)); }, [autoMountingQuantity]);

  const totalPanelQuantity = useMemo(() => {
    const rows = Array.isArray(equipmentGroups["Основне обладнання"]) ? equipmentGroups["Основне обладнання"] : [];
    return rows.reduce((acc, row) => {
      const rowType = String(row?.type || '').toLowerCase();
      if (rowType !== 'феп') return acc;
      return acc + Math.max(0, toNumber(row?.quantity, 0));
    }, 0);
  }, [equipmentGroups]);

  useEffect(() => {
    if (!autoMountingQuantity) return;
    const normalizedQty = Math.max(0, Math.round(toNumber(totalPanelQuantity, 0)));
    setGroupSettings(prev => {
      let changed = false;
      const next = { ...prev };
      Object.keys(equipmentGroups).forEach((gk) => {
        if (!gk.startsWith("Кріплення")) return;
        const current = next[gk] || { mode: 'fixed', name: gk, price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 };
        if (toNumber(current.quantity, 0) === normalizedQty) return;
        next[gk] = { ...current, quantity: normalizedQty };
        changed = true;
      });
      return changed ? next : prev;
    });
    setEquipmentGroups(prev => {
      let changed = false;
      const next = { ...prev };
      Object.keys(prev).forEach((gk) => {
        if (!gk.startsWith("Кріплення")) return;
        const items = Array.isArray(prev[gk]) ? prev[gk] : [];
        if (items.length === 0) return;
        let groupChanged = false;
        const updatedItems = items.map(item => {
          const currentQty = toNumber(item?.quantity, 0);
          if (currentQty === normalizedQty) return item;
          groupChanged = true;
          changed = true;
          return { ...item, quantity: normalizedQty };
        });
        if (groupChanged) next[gk] = updatedItems;
      });
      return changed ? next : prev;
    });
  }, [autoMountingQuantity, totalPanelQuantity]);

  useEffect(() => {
    const settings = groupSettings["Захист PV"] || {};
    if (!settings.pvAutoCableQuantity) return;

    const strings = Math.max(1, Math.floor(toNumber(settings.pvTemplateStrings, 1)));
    const metersPerString = Math.max(0, toNumber(settings.pvCableMetersPerString, 150));
    const requiredQty = strings * metersPerString;
    const requiredMc4Qty = strings * 3;

    setEquipmentGroups(prev => {
      const cableRows = Array.isArray(prev[PV_CABLE_TARGET_GROUP]) ? prev[PV_CABLE_TARGET_GROUP] : [];
      let changed = false;
      const nextCableRows = [...cableRows];

      let cableIdx = nextCableRows.findIndex(isPvCableProductRow);
      if (cableIdx < 0) {
        const defaultCable = DEFAULT_GROUPS_SNAPSHOT[PV_CABLE_TARGET_GROUP]?.find(isPvCableProductRow);
        const base = defaultCable || {
          id: Date.now() + 801,
          type: "Кабель",
          name: "KBE DB+ 6.0mm DC black",
          unit: "м.п.",
          quantity: requiredQty,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        };
        nextCableRows.push({ ...base, id: Date.now() + 802, quantity: requiredQty });
        cableIdx = nextCableRows.length - 1;
        changed = true;
      }

      let mc4Idx = nextCableRows.findIndex(isPvMc4ProductRow);
      if (mc4Idx < 0) {
        const defaultMc4 = DEFAULT_GROUPS_SNAPSHOT[PV_CABLE_TARGET_GROUP]?.find(isPvMc4ProductRow);
        const base = defaultMc4 || {
          id: Date.now() + 803,
          type: "Кабель",
          name: "Конектор MC4 (пара)",
          unit: "компл",
          quantity: requiredMc4Qty,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        };
        nextCableRows.push({ ...base, id: Date.now() + 804, quantity: requiredMc4Qty });
        mc4Idx = nextCableRows.length - 1;
        changed = true;
      }

      if (cableIdx >= 0 && toNumber(nextCableRows[cableIdx]?.quantity, 0) !== requiredQty) {
        nextCableRows[cableIdx] = { ...nextCableRows[cableIdx], quantity: requiredQty };
        changed = true;
      }
      if (mc4Idx >= 0 && toNumber(nextCableRows[mc4Idx]?.quantity, 0) !== requiredMc4Qty) {
        nextCableRows[mc4Idx] = { ...nextCableRows[mc4Idx], quantity: requiredMc4Qty };
        changed = true;
      }

      if (!changed) return prev;
      return { ...prev, [PV_CABLE_TARGET_GROUP]: nextCableRows };
    });
  }, [groupSettings]);

  useEffect(() => {
    setEquipmentGroups(prev => {
      const rows = Array.isArray(prev["Захист PV"]) ? prev["Захист PV"] : [];
      const nextRows = rows.filter(item => !isPvCableProductRow(item));
      if (nextRows.length === rows.length) return prev;
      return { ...prev, "Захист PV": nextRows };
    });
  }, []);

  const hvBatterySnapshot = useMemo(() => {
    const mainItems = equipmentGroups["Основне обладнання"] || [];
    return mainItems
      .filter(item => String(item?.type || '') === 'АКБ')
      .map(item => `${item.name}:${item.quantity}`)
      .join('|');
  }, [equipmentGroups["Основне обладнання"]]);

  useEffect(() => {
    setEquipmentGroups(prev => {
      const rows = Array.isArray(prev["Основне обладнання"]) ? prev["Основне обладнання"] : [];
      const required = {};

      rows.forEach((row) => {
        if (String(row?.type || '') !== 'АКБ') return;
        const bundle = getHvBundleForBattery(row?.name || '');
        if (!bundle) return;
        const qty = Math.max(1, Math.round(toNumber(row?.quantity, 1)));
        required[`BMS|${bundle.bms}`] = (required[`BMS|${bundle.bms}`] || 0) + qty;
        required[`Стійка|${bundle.rack}`] = (required[`Стійка|${bundle.rack}`] || 0) + qty;
      });

      let changed = false;
      let nextRows = [...rows];
      const consumedIndices = new Set();

      // Process required items: find existing or placeholders
      Object.entries(required).forEach(([key, qty]) => {
        const [type, name] = key.split('|');
        
        // 1. Try to find exact match among unconsumed
        let foundIdx = nextRows.findIndex((item, i) => 
          !consumedIndices.has(i) && 
          String(item?.type || '') === type && 
          String(item?.name || '').trim() === name
        );

        // 2. Try to find a placeholder match among unconsumed
        if (foundIdx < 0) {
          foundIdx = nextRows.findIndex((item, i) => {
            if (consumedIndices.has(i)) return false;
            if (String(item?.type || '') !== type) return false;
            
            const itemNameNormalized = normalizeForMatch(item?.name || "");
            const isPlaceholder = 
              itemNameNormalized === "" || 
              itemNameNormalized === normalizeForMatch("BMS плата") || 
              itemNameNormalized === normalizeForMatch("Стійка для обладнання") ||
              item?.hvAutoLinked;
            
            return isPlaceholder && !item?.hvManualOverride;
          });
        }

        if (foundIdx >= 0) {
          consumedIndices.add(foundIdx);
          const item = nextRows[foundIdx];
          if (item.name !== name || toNumber(item.quantity, 0) !== qty) {
            nextRows[foundIdx] = { ...item, name, quantity: qty, hvAutoLinked: true };
            changed = true;
          }
        } else {
          // No match, create new
          const newRow = {
            id: Date.now() + Math.floor(Math.random() * 100000),
            type,
            name,
            unit: "шт.",
            quantity: qty,
            price: 0,
            currency: "USD",
            incomingPrice: 0,
            markupPercent: 0,
            hvAutoLinked: true
          };
          nextRows.push(newRow);
          consumedIndices.add(nextRows.length - 1);
          changed = true;
        }
      });

      // Cleanup: remove hvAutoLinked items that were NOT consumed in this pass
      const finalRows = nextRows.filter((item, i) => {
        if (!item?.hvAutoLinked) return true;
        if (item?.hvManualOverride) return true;
        const type = String(item?.type || '');
        if (type !== 'BMS' && type !== 'Стійка') return true;
        return consumedIndices.has(i);
      });

      if (finalRows.length !== nextRows.length) {
        nextRows = finalRows;
        changed = true;
      }

      if (!changed) return prev;
      return { ...prev, "Основне обладнання": nextRows };
    });
  }, [hvBatterySnapshot]);

  const victronSnapshot = useMemo(() => {
    const mainItems = equipmentGroups["Основне обладнання"] || [];
    return mainItems
      .filter(item => String(item?.type || '') === 'Інвертор' && isVictronInverterName(item?.name || ''))
      .map(item => `${item.name}:${item.quantity}`)
      .join('|');
  }, [equipmentGroups["Основне обладнання"]]);

  useEffect(() => {
    setEquipmentGroups(prev => {
      const rows = Array.isArray(prev["Основне обладнання"]) ? prev["Основне обладнання"] : [];
      const victronTotalQty = rows.reduce((acc, row) => {
        if (String(row?.type || '') !== 'Інвертор') return acc;
        if (!isVictronInverterName(row?.name || '')) return acc;
        return acc + Math.max(0, Math.round(toNumber(row?.quantity, 0)));
      }, 0);

      const required = {};
      if (victronTotalQty > 0) {
        required[`MPPT контролер|${VICTRON_MPPT_DEFAULT}`] = victronTotalQty;
        required[`Cerbo|${VICTRON_CERBO_DEFAULT}`] = victronTotalQty;
      }

      let changed = false;
      let nextRows = [...rows];
      const consumedIndices = new Set();

      Object.entries(required).forEach(([key, qty]) => {
        const [type, name] = key.split('|');
        
        let foundIdx = nextRows.findIndex((item, i) => 
          !consumedIndices.has(i) && 
          String(item?.type || '') === type && 
          String(item?.name || '').trim() === name
        );

        if (foundIdx < 0) {
          foundIdx = nextRows.findIndex((item, i) => {
            if (consumedIndices.has(i)) return false;
            if (String(item?.type || '') !== type) return false;
            const nameNormalized = normalizeForMatch(item?.name || "");
            const isPlaceholder = nameNormalized === "" || item?.victronAutoLinked;
            return isPlaceholder && !item?.victronManualOverride;
          });
        }

        if (foundIdx >= 0) {
          consumedIndices.add(foundIdx);
          const item = nextRows[foundIdx];
          if (item.name !== name || toNumber(item.quantity, 0) !== qty) {
            nextRows[foundIdx] = { ...item, name, quantity: qty, victronAutoLinked: true };
            changed = true;
          }
        } else {
          nextRows.push({
            id: Date.now() + Math.floor(Math.random() * 100000) + 1000,
            type,
            name,
            unit: "шт.",
            quantity: qty,
            price: 0,
            currency: "USD",
            incomingPrice: 0,
            markupPercent: 0,
            victronAutoLinked: true
          });
          consumedIndices.add(nextRows.length - 1);
          changed = true;
        }
      });

      const finalRows = nextRows.filter((item, i) => {
        if (!item?.victronAutoLinked) return true;
        if (item?.victronManualOverride) return true;
        const type = String(item?.type || '');
        if (type !== 'MPPT контролер' && type !== 'Cerbo') return true;
        return consumedIndices.has(i);
      });

      if (finalRows.length !== nextRows.length) {
        nextRows = finalRows;
        changed = true;
      }

      if (!changed) return prev;
      return { ...prev, "Основне обладнання": nextRows };
    });
  }, [victronSnapshot]);


  const rememberProjectCatalog = (groups) => {
    if (!groups || typeof groups !== 'object') return;
    const snapshot = JSON.parse(JSON.stringify(groups));
    const signature = JSON.stringify(snapshot);

    setProjectCatalogSnapshots(prev => {
      const list = Array.isArray(prev) ? prev : [];
      const next = [snapshot, ...list.filter(item => JSON.stringify(item) !== signature)].slice(0, 50);
      return next;
    });
  };

  const persistProductsCatalog = async (pricingMap) => {
    if (!workspaceHandle) return false;
    const payload = buildCatalogPayloadFromPricingMap(pricingMap);
    const signature = JSON.stringify(payload.items || []);
    if (signature === lastCatalogSignatureRef.current) return true;
    const ok = await writeWorkspaceJson(workspaceHandle, PRODUCTS_CATALOG_FILE, payload);
    if (ok) lastCatalogSignatureRef.current = signature;
    return ok;
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const handle = await loadPinnedWorkspaceHandle();
        if (!active || !handle) return;
        setWorkspaceHandle(handle);
        setWorkspacePinned(true);
      } catch (error) {
        console.error("Failed to restore pinned workspace", error);
      }
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!workspaceHandle) {
      catalogLoadedRef.current = false;
      return;
    }

    let active = true;
    (async () => {
      const catalog = await readWorkspaceJson(workspaceHandle, PRODUCTS_CATALOG_FILE);
      if (!active || !catalog || !Array.isArray(catalog.items)) {
        catalogLoadedRef.current = true;
        return;
      }
      const groupsSnapshot = toGroupsSnapshotFromCatalog(catalog);
      if (Object.keys(groupsSnapshot).length > 0) {
        rememberProjectCatalog(groupsSnapshot);
      }
      lastCatalogSignatureRef.current = JSON.stringify(catalog.items || []);
      catalogLoadedRef.current = true;
    })();

    return () => { active = false; };
  }, [workspaceHandle]);

  useEffect(() => {
    if (!workspaceHandle || !catalogLoadedRef.current) return;
    if (catalogWriteTimerRef.current) clearTimeout(catalogWriteTimerRef.current);
    catalogWriteTimerRef.current = setTimeout(() => {
      persistProductsCatalog(productLastValues);
    }, 700);
    return () => {
      if (catalogWriteTimerRef.current) clearTimeout(catalogWriteTimerRef.current);
    };
  }, [workspaceHandle, productLastValues]);

  useEffect(() => {
    let active = true;
    (async () => {
      const serverTemplates = await fetchServerTemplatesCatalog();
      if (!active) return;

      if (serverTemplates) {
        setTemplates(serverTemplates);
        lastTemplatesSignatureRef.current = getTemplatesCatalogSignature(serverTemplates);
        templatesLoadedRef.current = true;
        return;
      }

      if (workspaceHandle) {
        const templatesCatalog = await readWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE);
        if (!active) return;
        if (templatesCatalog) {
          const normalizedTemplates = normalizeImportedTemplates(templatesCatalog);
          if (normalizedTemplates) {
            setTemplates(normalizedTemplates);
            lastTemplatesSignatureRef.current = getTemplatesCatalogSignature(normalizedTemplates);
          }
        }
      }

      templatesLoadedRef.current = true;
    })();

    return () => { active = false; };
  }, [workspaceHandle]);

  useEffect(() => {
    if (!templatesLoadedRef.current) return;
    if (templatesWriteTimerRef.current) clearTimeout(templatesWriteTimerRef.current);
    templatesWriteTimerRef.current = setTimeout(async () => {
      const signature = getTemplatesCatalogSignature(templates);
      if (signature === lastTemplatesSignatureRef.current) return;
      let saved = false;
      const serverSaved = await saveServerTemplatesCatalog(templates);
      if (serverSaved) saved = true;
      if (workspaceHandle) {
        const payload = buildTemplatesCatalogPayload(templates);
        const wsSaved = await writeWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE, payload);
        if (wsSaved) saved = true;
      }
      if (saved) lastTemplatesSignatureRef.current = signature;
    }, 700);
    return () => {
      if (templatesWriteTimerRef.current) clearTimeout(templatesWriteTimerRef.current);
    };
  }, [workspaceHandle, templates]);

  const pickWorkspace = async () => {
    try {
      const handle = await window.showDirectoryPicker();
      setWorkspaceHandle(handle);
      setWorkspacePinned(true);
      await savePinnedWorkspaceHandle(handle);
    } catch (e) {
      console.error("Workspace selection cancelled", e);
    }
  };

  const unpinWorkspace = async () => {
    setWorkspacePinned(false);
    setWorkspaceHandle(null);
    try {
      await clearPinnedWorkspaceHandle();
    } catch (error) {
      console.error("Failed to clear pinned workspace", error);
    }
  };

  const openProjectFolder = async () => {
    const projectFolder = String(projectFolderName || '').trim();
    if (!projectFolder) {
      alert('Спочатку збережіть або відкрийте проєкт, щоб була відома папка проєкту.');
      return;
    }

    // In hosted environment, we cannot open local folders via server API
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      alert('Автоматичне відкриття папок доступне лише при запуску програми локально. Будь ласка, відкрийте папку проєкту вручну у Провіднику вашого комп\'ютера.');
      return;
    }

    const tryOpenProjectFolder = async (basePathValue) => {
      const response = await fetch('/api/open-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePath: String(basePathValue || '').trim(), projectFolderName: projectFolder })
      });
      const payload = await response.json().catch(() => ({}));
      return { response, payload };
    };

    try {
      const currentBasePath = String(workspacePath || '').trim();
      let result = await tryOpenProjectFolder(currentBasePath);

      if ((!result.response.ok || !result.payload?.ok) && result.payload?.error === 'project_folder_not_found') {
        const suggestedPath = window.prompt(
          'Не знайдено папку проєкту. Вкажіть абсолютний шлях до робочої папки (де зберігаються проєкти), і ми спробуємо ще раз:',
          currentBasePath
        );
        const manualBasePath = String(suggestedPath || '').trim();
        if (manualBasePath) {
          setWorkspacePath(manualBasePath);
          result = await tryOpenProjectFolder(manualBasePath);
        }
      }

      if (!result.response.ok || !result.payload?.ok) {
        throw new Error(result.payload?.error || 'open_failed');
      }
    } catch (error) {
      console.error('Failed to open project folder', error);
      alert(`Не вдалося відкрити папку поточного проєкту. Причина: ${error?.message || 'невідома помилка'}. Перевірте, що проєкт збережений і шлях до робочої папки вказаний правильно.`);
    }
  };

  const buildOfferSheetSnapshot = () => ({
    rates,
    modulePower,
    clientInfo,
    offerPurpose,
    coverSystemName,
    coverPageType,
    showOfferStationSheet,
    generationLocation,
    generationMountType,
    energyTariffUah,
    typicalLoadKw,
    coverQrUrl,
    managerContacts,
    selectedManagerId,
    equipmentGroups,
    otherExpenses,
    workItems,
    installPercent,
    managerCommissionRate,
    clientDiscountPercent,
    taxMode,
    fopTaxPercent,
    advancedFopPercent,
    advancedFopBaseMode,
    advancedFopSelectedGroups,
    advancedFopSelectedItems,
    advancedFopGroupPercents,
    advancedFopItemPercents,
    lockedDistributedTaxUsd,
    taxDistributionApplied,
    taxDistributionScope,
    installPercentTaxUsd,
    autoInstallPercentEnabled,
    calculationsSnapshot: calculations,
    groupSettings,
    autoMountingQuantity,
    projectType
  });

  const buildOfferSheetSummary = () => ({
    stationPowerW: toNumber(calculations.stationPowerW, 0),
    finalTotalWithDiscountUsd: toNumber(calculations.sums?.finalTotalWithDiscountUsd, 0),
    finalTotalWithDiscountUah: toNumber(calculations.sums?.finalTotalWithDiscountUah, 0),
    materialsSumUsd: toNumber(calculations.sums?.materialsSumUsd, 0),
    worksTotalUsd: toNumber(calculations.workItemsSumUsd, 0) + toNumber(calculations.sums?.installPercentAmountUsd, 0),
    otherCostsUsd: toNumber(calculations.otherCostsUsd, 0),
    grossMarginBeforeTaxesUsd: toNumber(calculations.sums?.grossMarginBeforeTaxesUsd, 0),
    taxesUsd: toNumber(calculations.sums?.taxesUsd, 0),
    marginAfterTaxUsd: toNumber(calculations.sums?.marginAfterTaxUsd, 0),
    managerCommissionAfterTaxesUsd: toNumber(calculations.sums?.managerCommissionAfterTaxesUsd, 0),
    netProfitUsd: toNumber(calculations.sums?.netProfitUsd, 0)
  });

  const applyOfferSheetSnapshot = (data) => {
    if (!data || typeof data !== 'object') return;
    const loadedManagers = Array.isArray(data.managerContacts) && data.managerContacts.length > 0
      ? data.managerContacts
      : DEFAULT_MANAGER_CONTACTS;
    setRates(data.rates && typeof data.rates === 'object' ? data.rates : DEFAULT_RATES);
    setModulePower(data.modulePower ?? 550);
    setClientInfo(data.clientInfo && typeof data.clientInfo === 'object' ? data.clientInfo : DEFAULT_CLIENT_INFO);
    setOfferPurpose(typeof data.offerPurpose === 'string' ? data.offerPurpose : DEFAULT_OFFER_PURPOSE);
    setCoverSystemName(typeof data.coverSystemName === 'string' ? data.coverSystemName : DEFAULT_COVER_SYSTEM_NAME);
    setCoverPageType(typeof data.coverPageType === 'string' ? data.coverPageType : COVER_PAGE_TYPES[0]);
    setShowOfferStationSheet(typeof data.showOfferStationSheet === 'boolean' ? data.showOfferStationSheet : false);
    setGenerationLocation(typeof data.generationLocation === 'string' ? data.generationLocation : 'Миколаїв');
    setGenerationMountType(typeof data.generationMountType === 'string' ? data.generationMountType : 'roof');
    setEnergyTariffUah(data.energyTariffUah ?? 4.32);
    setTypicalLoadKw(data.typicalLoadKw ?? 2);
    setCoverQrUrl(typeof data.coverQrUrl === 'string' ? data.coverQrUrl : DEFAULT_QR_URL);
    setManagerContacts(loadedManagers);
    setSelectedManagerId(
      typeof data.selectedManagerId === 'string' && loadedManagers.some((m) => m.id === data.selectedManagerId)
        ? data.selectedManagerId
        : loadedManagers[0].id
    );
    setEquipmentGroups(data.equipmentGroups && typeof data.equipmentGroups === 'object' ? data.equipmentGroups : createDefaultGroups());
    setOtherExpenses(Array.isArray(data.otherExpenses) ? cloneList(data.otherExpenses) : cloneList(DEFAULT_OTHER_EXPENSES));
    setWorkItems(Array.isArray(data.workItems) ? cloneList(data.workItems) : cloneList(DEFAULT_WORK_ITEMS));
    setInstallPercent(data.installPercent ?? 15);
    setManagerCommissionRate(data.managerCommissionRate ?? 10);
    setClientDiscountPercent(data.clientDiscountPercent ?? 0);
    setTaxMode(data.taxMode || 'none');
    setFopTaxPercent(data.fopTaxPercent ?? 7);
    setAdvancedFopPercent(data.advancedFopPercent ?? 7);
    setAdvancedFopBaseMode(data.advancedFopBaseMode || 'all_goods');
    setAdvancedFopSelectedGroups(Array.isArray(data.advancedFopSelectedGroups) ? data.advancedFopSelectedGroups : []);
    setAdvancedFopSelectedItems(Array.isArray(data.advancedFopSelectedItems) ? data.advancedFopSelectedItems : []);
    setAdvancedFopGroupPercents(data.advancedFopGroupPercents && typeof data.advancedFopGroupPercents === 'object' ? data.advancedFopGroupPercents : {});
    setAdvancedFopItemPercents(data.advancedFopItemPercents && typeof data.advancedFopItemPercents === 'object' ? data.advancedFopItemPercents : {});
    setLockedDistributedTaxUsd(data.lockedDistributedTaxUsd ?? null);
    setTaxDistributionApplied(Boolean(data.taxDistributionApplied));
    setTaxDistributionScope(data.taxDistributionScope || 'nonMainGoods');
    setInstallPercentTaxUsd(data.installPercentTaxUsd ?? 0);
    setAutoInstallPercentEnabled(typeof data.autoInstallPercentEnabled === 'boolean' ? data.autoInstallPercentEnabled : true);
    setGroupSettings(data.groupSettings && typeof data.groupSettings === 'object' ? data.groupSettings : createDefaultGroupSettings());
    setAutoMountingQuantity(typeof data.autoMountingQuantity === 'boolean' ? data.autoMountingQuantity : true);
    setProjectType(data.projectType || 'commercial');
  };

  const applyProjectData = (project) => {
    const data = project?.data || {};
    const loadedManagers = Array.isArray(data.managerContacts) && data.managerContacts.length > 0
      ? data.managerContacts
      : DEFAULT_MANAGER_CONTACTS;
    setEquipmentGroups(data.equipmentGroups && typeof data.equipmentGroups === 'object' ? data.equipmentGroups : createDefaultGroups());
    setWorkItems(Array.isArray(data.workItems) ? cloneList(data.workItems) : cloneList(DEFAULT_WORK_ITEMS));
    setOtherExpenses(Array.isArray(data.otherExpenses) ? cloneList(data.otherExpenses) : cloneList(DEFAULT_OTHER_EXPENSES));
    setOfferPurpose(typeof data.offerPurpose === 'string' ? data.offerPurpose : DEFAULT_OFFER_PURPOSE);
    setCoverSystemName(typeof data.coverSystemName === 'string' ? data.coverSystemName : DEFAULT_COVER_SYSTEM_NAME);
    setCoverPageType(typeof data.coverPageType === 'string' ? data.coverPageType : COVER_PAGE_TYPES[0]);
    setShowOfferStationSheet(typeof data.showOfferStationSheet === 'boolean' ? data.showOfferStationSheet : false);
    setGenerationLocation(typeof data.generationLocation === 'string' ? data.generationLocation : 'Миколаїв');
    setGenerationMountType(typeof data.generationMountType === 'string' ? data.generationMountType : 'roof');
    setEnergyTariffUah(data.energyTariffUah ?? 4.32);
    setTypicalLoadKw(data.typicalLoadKw ?? 2);
    setCoverQrUrl(typeof data.coverQrUrl === 'string' ? data.coverQrUrl : DEFAULT_QR_URL);
    setManagerContacts(loadedManagers);
    setSelectedManagerId(
      typeof data.selectedManagerId === 'string' && loadedManagers.some((m) => m.id === data.selectedManagerId)
        ? data.selectedManagerId
        : loadedManagers[0].id
    );
    setInstallPercent(data.installPercent ?? 15);
    setRates(data.rates && typeof data.rates === 'object' ? data.rates : DEFAULT_RATES);
    setClientInfo(data.clientInfo && typeof data.clientInfo === 'object' ? data.clientInfo : DEFAULT_CLIENT_INFO);
    setManagerCommissionRate(data.managerCommissionRate ?? 10);
    setClientDiscountPercent(data.clientDiscountPercent ?? 0);
    setTaxMode(data.taxMode || 'none');
    setModulePower(data.modulePower ?? 550);
    setGroupSettings(data.groupSettings && typeof data.groupSettings === 'object' ? data.groupSettings : createDefaultGroupSettings());
    setProjectType(project.type || 'commercial');
    setProjectName(project.name || "");
    setProjectFolderName(project.projectFolderName || data.projectFolderName || "");
    if (typeof data.autoMountingQuantity === 'boolean') {
      setAutoMountingQuantity(data.autoMountingQuantity);
    } else {
      setAutoMountingQuantity(true);
    }
    if (data.equipmentGroups && typeof data.equipmentGroups === 'object') {
      rememberProjectCatalog(data.equipmentGroups);
    }
    const loadedSheets = Array.isArray(data.offerSheets) && data.offerSheets.length > 0
      ? data.offerSheets
      : DEFAULT_OFFER_SHEETS;
    const loadedActiveSheetId = typeof data.activeOfferSheetId === 'string'
      ? data.activeOfferSheetId
      : loadedSheets[0].id;
    setOfferSheets(loadedSheets);
    setActiveOfferSheetId(loadedActiveSheetId);
  };

  const applyTemplateData = (template) => {
    const data = template?.data || {};
    const loadedManagers = Array.isArray(data.managerContacts) && data.managerContacts.length > 0
      ? data.managerContacts
      : DEFAULT_MANAGER_CONTACTS;
    setEquipmentGroups(data.equipmentGroups && typeof data.equipmentGroups === 'object' ? data.equipmentGroups : createDefaultGroups());
    setWorkItems(Array.isArray(data.workItems) ? cloneList(data.workItems) : cloneList(DEFAULT_WORK_ITEMS));
    setOtherExpenses(Array.isArray(data.otherExpenses) ? cloneList(data.otherExpenses) : cloneList(DEFAULT_OTHER_EXPENSES));
    setOfferPurpose(typeof data.offerPurpose === 'string' ? data.offerPurpose : DEFAULT_OFFER_PURPOSE);
    setCoverSystemName(typeof data.coverSystemName === 'string' ? data.coverSystemName : DEFAULT_COVER_SYSTEM_NAME);
    setCoverPageType(typeof data.coverPageType === 'string' ? data.coverPageType : COVER_PAGE_TYPES[0]);
    setShowOfferStationSheet(typeof data.showOfferStationSheet === 'boolean' ? data.showOfferStationSheet : false);
    setGenerationLocation(typeof data.generationLocation === 'string' ? data.generationLocation : 'Миколаїв');
    setGenerationMountType(typeof data.generationMountType === 'string' ? data.generationMountType : 'roof');
    setEnergyTariffUah(data.energyTariffUah ?? 4.32);
    setTypicalLoadKw(data.typicalLoadKw ?? 2);
    setCoverQrUrl(typeof data.coverQrUrl === 'string' ? data.coverQrUrl : DEFAULT_QR_URL);
    setManagerContacts(loadedManagers);
    setSelectedManagerId(
      typeof data.selectedManagerId === 'string' && loadedManagers.some((m) => m.id === data.selectedManagerId)
        ? data.selectedManagerId
        : loadedManagers[0].id
    );
    setInstallPercent(data.installPercent ?? 15);
    setClientDiscountPercent(data.clientDiscountPercent ?? 0);
    setTaxMode(data.taxMode || 'none');
    setGroupSettings(data.groupSettings && typeof data.groupSettings === 'object' ? data.groupSettings : createDefaultGroupSettings());
    if (typeof data.autoMountingQuantity === 'boolean') {
      setAutoMountingQuantity(data.autoMountingQuantity);
    } else {
      setAutoMountingQuantity(true);
    }
    setSelectedTemplateId(String(template?.id || ""));
  };

  const saveProject = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const baseDocName = buildDocumentBaseName(clientInfo, calculations.stationPowerW);
    const safeName = projectName.trim() || baseDocName;
    const generatedFolder = toSafeFilePart(baseDocName).replace(/\s+/g, '_') || (`Project_` + Date.now());
    const normalizedFolder = (projectFolderName || "").trim();
    const isLegacyFolderName = /^(проєкт|проект|project)[_\-\s\d.]*$/i.test(normalizedFolder);
    const computedFolder = (!normalizedFolder || isLegacyFolderName) ? generatedFolder : normalizedFolder;
    rememberProjectCatalog(equipmentGroups);
    await persistProductsCatalog(productLastValues);

    const payload = {
      schemaVersion: 1,
      name: safeName,
      type: projectType,
      projectFolderName: computedFolder,
      exportedAt: new Date().toISOString(),
      data: {
        rates,
        modulePower,
        clientInfo,
        offerPurpose,
        coverSystemName,
        coverPageType,
        showOfferStationSheet,
        generationLocation,
        generationMountType,
        energyTariffUah,
        typicalLoadKw,
        coverQrUrl,
        managerContacts,
        selectedManagerId,
        equipmentGroups,
        otherExpenses,
        workItems,
        installPercent,
        managerCommissionRate,
        clientDiscountPercent,
        taxMode,
        groupSettings,
        autoMountingQuantity,
        projectFolderName: computedFolder,
        offerSheets,
        activeOfferSheetId
      }
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/x-calkproj+json" });
    const safeFileName = toSafeFilePart(baseDocName).replace(/\s+/g, '_');
    const saveResult = await saveToDiskUtility(
      workspaceHandle,
      clientInfo,
      calculations,
      (safeFileName || 'project') + '.calkproj',
      blob,
      'Проєкт',
      computedFolder
    );
    setProjectName(safeName);
    if (saveResult?.location === 'workspace') {
      setProjectFolderName(computedFolder);
    } else {
      setProjectFolderName('');
    }
  };

  const openProjectPicker = () => {
    const input = document.getElementById('project-file-input');
    if (input) input.click();
  };


  const openProjectFromFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (!parsed || typeof parsed !== 'object' || !parsed.data || typeof parsed.data !== 'object') {
          throw new Error('Invalid project file format');
        }
        applyProjectData(parsed);
      } catch (error) {
        console.error('Project import error', error);
        alert('Не вдалося відкрити файл проєкту. Перевірте формат файлу.');
      }
    };
    reader.readAsText(file);
    e.target.value = null;
  };

  const saveTemplate = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const safeName = templateName.trim() || `Шаблон ${new Date().toLocaleDateString('uk-UA')}`;
    const id = selectedTemplateId || String(Date.now());
    rememberProjectCatalog(equipmentGroups);

    const payload = {
      id,
      name: safeName,
      data: {
        equipmentGroups,
        offerPurpose,
        coverSystemName,
        coverPageType,
        showOfferStationSheet,
        generationLocation,
        generationMountType,
        energyTariffUah,
        typicalLoadKw,
        coverQrUrl,
        managerContacts,
        selectedManagerId,
        workItems,
        otherExpenses,
        installPercent,
        clientDiscountPercent,
        taxMode,
        groupSettings,
        autoMountingQuantity
      }
    };

    setTemplates(prev => {
      const idx = prev.findIndex(t => t.id === id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = payload;
        return next;
      }
      return [...prev, payload];
    });
    setTemplateName(safeName);
    setSelectedTemplateId(id);
  };

  const saveTemplateAsNew = (e) => {
    if (e?.preventDefault) e.preventDefault();
    const safeName = templateName.trim() || `Шаблон ${new Date().toLocaleDateString('uk-UA')}`;
    const id = String(Date.now());
    rememberProjectCatalog(equipmentGroups);

    const payload = {
      id,
      name: safeName,
      data: {
        equipmentGroups,
        offerPurpose,
        coverSystemName,
        coverPageType,
        showOfferStationSheet,
        generationLocation,
        generationMountType,
        energyTariffUah,
        typicalLoadKw,
        coverQrUrl,
        managerContacts,
        selectedManagerId,
        workItems,
        otherExpenses,
        installPercent,
        clientDiscountPercent,
        taxMode,
        groupSettings,
        autoMountingQuantity
      }
    };

    setTemplates(prev => [...prev, payload]);
    setTemplateName(safeName);
    setSelectedTemplateId(id);
  };

  const loadTemplate = (id) => {
    const selected = templates.find(t => t.id === String(id));
    if (!selected) return;
    applyTemplateData(selected);
    setTemplateName(selected.name || "");
  };

  const deleteTemplate = (id) => {
    if (!id) return;
    if (!window.confirm('Видалити шаблон?')) return;
    setTemplates(prev => prev.filter(t => t.id !== String(id)));
    if (String(id) === selectedTemplateId) {
      setSelectedTemplateId("");
      setTemplateName("");
    }
  };

  const startNewProject = (type) => {
    if (!window.confirm('Створити новий проєкт? Незбережені зміни буде втрачено.')) {
      return;
    }

    setRates({ ...DEFAULT_RATES });
    setModulePower(550);
    setClientInfo({ ...DEFAULT_CLIENT_INFO });
    let nextEquipmentGroups = createDefaultGroups();
    let nextGroupSettings = createDefaultGroupSettings();

    if (type === 'commercial') {
      setWorkItems(createCommercialWorkItems());
      setOtherExpenses([]);
      setInstallPercent(15);
    } else if (type === 'product') {
      setWorkItems([]);
      setOtherExpenses(cloneList(DEFAULT_OTHER_EXPENSES));
      setInstallPercent(0);
      nextGroupSettings = {};
      nextEquipmentGroups = { "Основне обладнання": [] };
    } else {
      setWorkItems(cloneList(DEFAULT_WORK_ITEMS));
      setOtherExpenses(cloneList(DEFAULT_OTHER_EXPENSES));
      setInstallPercent(15);
    }
    setManagerCommissionRate(10);
    setClientDiscountPercent(0);
    setTaxMode('none');
    setFopTaxPercent(7);
    setGenerationLocation('Миколаїв');
    setGenerationMountType('roof');
    setAutoMountingQuantity(true);
    setEquipmentGroups(nextEquipmentGroups);
    setGroupSettings(nextGroupSettings);
    setProjectType(type);
    setProjectName("");
    setProjectFolderName("");
    setTemplateName("");
    setSelectedTemplateId("");
    setNewProtectionType("Захист PV");
    setNewProtectionCustomName("");
    setOfferSheets(DEFAULT_OFFER_SHEETS);
    setActiveOfferSheetId(DEFAULT_OFFER_SHEETS[0].id);
    setShowOfferComparisonSheet(false);
    setPrintMode(null);
    setShowNewProjectDialog(false);
  };

  const persistCurrentSheetState = () => {
    if (showOfferComparisonSheet || isApplyingOfferSheetRef.current) return;
    const activeId = String(activeOfferSheetId || '');
    if (!activeId) return;
    const snapshot = buildOfferSheetSnapshot();
    const summary = buildOfferSheetSummary();
    setOfferSheets((prev) => {
      const list = Array.isArray(prev) && prev.length > 0 ? prev : DEFAULT_OFFER_SHEETS;
      return list.map((sheet) => (
        String(sheet.id) === activeId
          ? { ...sheet, data: snapshot, summary, updatedAt: new Date().toISOString() }
          : sheet
      ));
    });
  };

  const switchOfferSheet = (id) => {
    const targetId = String(id || '');
    if (!targetId || targetId === String(activeOfferSheetId || '')) return;
    persistCurrentSheetState();
    const target = (offerSheets || []).find((sheet) => String(sheet.id) === targetId);
    if (!target) return;
    setShowOfferComparisonSheet(false);
    setActiveOfferSheetId(targetId);
    if (target.data) {
      isApplyingOfferSheetRef.current = true;
      applyOfferSheetSnapshot(target.data);
      setTimeout(() => { isApplyingOfferSheetRef.current = false; }, 0);
    }
  };

  const addOfferSheet = () => {
    persistCurrentSheetState();
    const maxIndex = (offerSheets || []).reduce((acc, sheet) => {
      const match = String(sheet.name || '').match(/КП\s+(\d+)/i);
      const idx = match ? toNumber(match[1], 0) : 0;
      return Math.max(acc, idx);
    }, 0);
    const nextId = `offer_sheet_${Date.now()}`;
    const nextSheet = {
      id: nextId,
      name: `КП ${maxIndex + 1}`,
      data: buildOfferSheetSnapshot(),
      summary: buildOfferSheetSummary(),
      updatedAt: new Date().toISOString()
    };
    setOfferSheets((prev) => [...(Array.isArray(prev) ? prev : []), nextSheet]);
    setActiveOfferSheetId(nextId);
    setShowOfferComparisonSheet(false);
  };

  const removeOfferSheet = (id) => {
    const targetId = String(id || '');
    const list = Array.isArray(offerSheets) ? offerSheets : [];
    if (list.length <= 1) {
      alert('Має залишатися хоча б один лист КП.');
      return;
    }
    if (!window.confirm('Видалити цей лист КП?')) return;
    const next = list.filter((sheet) => String(sheet.id) !== targetId);
    setOfferSheets(next);
    if (String(activeOfferSheetId) === targetId) {
      const fallback = next[0];
      setActiveOfferSheetId(fallback.id);
      if (fallback?.data) {
        isApplyingOfferSheetRef.current = true;
        applyOfferSheetSnapshot(fallback.data);
        setTimeout(() => { isApplyingOfferSheetRef.current = false; }, 0);
      }
    }
  };

  const renameOfferSheet = (id, name) => {
    const targetId = String(id || '');
    const nextName = String(name || '').trim();
    if (!targetId || !nextName) return;
    setOfferSheets((prev) => (Array.isArray(prev) ? prev : []).map((sheet) => (
      String(sheet.id) === targetId ? { ...sheet, name: nextName } : sheet
    )));
  };

  const exportToExcel = async (mode = 'offer', detailLevel = 'summary') => {
    try {
      await exportToExcelFile({
        mode,
        projectType,
        clientInfo,
        rates: {
          eur: toNumber(rates.eur, 0),
          usd: toNumber(rates.usd, 0)
        },
        modulePower,
        calculations,
        installPercent,
        managerCommissionRate,
        workspaceHandle,
        projectFolderName,
        groupSettings,
        detailLevel
      });
    } catch (err) {
      console.error('Export trigger error', err);
      alert('Помилка запуску експорту Excel. Перевірте консоль браузера.');
    }
  };

  const exportToPdf = async () => {
    await exportToPdfFile({
      printMode,
      clientInfo,
      calculations,
      workspaceHandle,
      projectFolderName,
      appendedPdfFiles: printMode === 'offer' ? offerAppendPdfFiles : []
    });
  };

  const addOfferAppendPdfFiles = (incomingFiles) => {
    const picked = Array.from(incomingFiles || []).filter((f) => /\.pdf$/i.test(String(f?.name || '')) || String(f?.type || '').toLowerCase() === 'application/pdf');
    if (!picked.length) return;
    setOfferAppendPdfFiles((prev) => {
      const next = [...(Array.isArray(prev) ? prev : [])];
      for (const file of picked) {
        if (next.length >= 5) break;
        const already = next.some((x) => x.name === file.name && x.size === file.size && x.lastModified === file.lastModified);
        if (!already) next.push(file);
      }
      return next;
    });
  };

  const formatMoney = (val) => Number(val).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const applyProductFromCatalog = (groupKey, id, selectedName, categoryKey = groupKey) => {
    updateEquipment(groupKey, id, 'name', selectedName);
    const normalized = String(selectedName || '').trim().toLowerCase();
    let pricing = productLastValues?.[categoryKey]?.[normalized];
    if (!pricing && projectType === 'product') {
      const categories = Object.keys(productLastValues || {});
      for (const cat of categories) {
        const candidate = productLastValues?.[cat]?.[normalized];
        if (candidate) {
          pricing = candidate;
          break;
        }
      }
    }
    if (!pricing) return;

    setEquipmentGroups(prev => ({
      ...prev,
      [groupKey]: (prev[groupKey] || []).map(item => {
        if (item.id !== id) return item;
        const next = {
          ...item,
          price: toNumber(pricing.price, 0),
          currency: pricing.currency || item.currency || 'USD',
          incomingPrice: toNumber(pricing.incomingPrice, 0)
        };
        if (pricing.markupPercent !== undefined) {
          next.markupPercent = toNumber(pricing.markupPercent, 0);
        } else {
          const incoming = toNumber(next.incomingPrice, 0);
          const price = toNumber(next.price, 0);
          next.markupPercent = incoming > 0 ? ((price - incoming) / incoming) * 100 : 0;
        }
        return next;
      })
    }));
  };

  const updateEquipment = (groupKey, id, field, value) => {
    if (id && String(id).endsWith('-fixed')) {
      updateGroupSetting(groupKey, field, value);
      return;
    }
    setEquipmentGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey].map(item => {
        if (item.id === id) {
          const parsed = (field === 'name' || field === 'type' || field === 'unit' || field === 'currency')
            ? value
            : parseNumberInput(value);
          const updatedItem = { ...item, [field]: parsed };
          const isMainHvLinked = groupKey === "Основне обладнання" && item?.hvAutoLinked && !item?.hvManualOverride;
          const isMainVictronLinked = groupKey === "Основне обладнання" && item?.victronAutoLinked && !item?.victronManualOverride;
          const isManualField = field === 'name' || field === 'quantity' || field === 'type' || field === 'unit' || field === 'price' || field === 'incomingPrice' || field === 'markupPercent' || field === 'currency';
          if (isMainHvLinked && isManualField) {
            updatedItem.hvManualOverride = true;
          }
          if (isMainVictronLinked && isManualField) {
            updatedItem.victronManualOverride = true;
          }

          // If user manually changes cable or MC4 quantity, disable auto-calculation
          if (field === 'quantity' && groupKey === PV_CABLE_TARGET_GROUP && (isPvCableProductRow(updatedItem) || isPvMc4ProductRow(updatedItem))) {
            updateGroupSetting("Захист PV", "pvAutoCableQuantity", false);
          }
          if (field === 'quantity' && groupKey.startsWith("Кріплення")) {
            setAutoMountingQuantity(false);
          }
          const parsedNumber = toNumber(parsed, 0);
          const incomingNumber = toNumber(updatedItem.incomingPrice, 0);
          const categoryMarkupRaw = groupSettings[groupKey]?.categoryMarkupPercent;
          const hasCategoryMarkup = categoryMarkupRaw !== undefined && categoryMarkupRaw !== null && categoryMarkupRaw !== "";
          const categoryMarkup = toNumber(categoryMarkupRaw, 0);
          
          const usdRate = toNumber(rates.usd, 0) || 1;
          const eurRate = toNumber(rates.eur, 0) || 1;
          const eurUsdRate = eurRate / usdRate;

          const getNormalizedUsd = (val, curr) => {
            const v = toNumber(val, 0);
            if (curr === 'EUR') return v * eurUsdRate;
            if (curr === 'UAH') return v / usdRate;
            return v;
          };

          if (field === 'incomingPrice') {
             if (hasCategoryMarkup) {
               updatedItem.markupPercent = categoryMarkup;
               updatedItem.price = parsedNumber * (1 + categoryMarkup / 100);
             } else {
               const priceUsd = getNormalizedUsd(updatedItem.price, updatedItem.currency);
               const incomingUsd = getNormalizedUsd(parsedNumber, updatedItem.currency);
               if (incomingUsd > 0) {
                 updatedItem.markupPercent = ((priceUsd - incomingUsd) / incomingUsd) * 100;
               } else {
                 updatedItem.markupPercent = 0;
               }
             }
          } else if (field === 'markupPercent') {
             const m = toNumber(parsed, 0);
             if (incomingNumber > 0) {
               updatedItem.price = incomingNumber * (1 + m / 100);
             } else {
               const retail = toNumber(updatedItem.price, 0);
               const divisor = 1 + (m / 100);
               updatedItem.incomingPrice = divisor > 0 ? (retail / divisor) : 0;
             }
          } else if (field === 'price') {
             const m = toNumber(updatedItem.markupPercent, 0);
             // Only auto-update incoming price if markup is positive or not too extreme
             if (m > -80 && m !== 0) {
                 const divisor = 1 + (m / 100);
                 updatedItem.incomingPrice = divisor > 0 ? (parsedNumber / divisor) : 0;
             } else {
                 const priceUsd = getNormalizedUsd(parsedNumber, updatedItem.currency);
                 const incomingUsd = getNormalizedUsd(updatedItem.incomingPrice, updatedItem.currency);
                 if (incomingUsd > 0) {
                   updatedItem.markupPercent = ((priceUsd - incomingUsd) / incomingUsd) * 100;
                 } else {
                   updatedItem.markupPercent = 0;
                 }
             }
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addRow = (groupKey) => {
    const newId = Date.now();
    const isMain = groupKey === "Основне обладнання";
    const categoryMarkupRaw = groupSettings[groupKey]?.categoryMarkupPercent;
    const hasCategoryMarkup = categoryMarkupRaw !== undefined && categoryMarkupRaw !== null && categoryMarkupRaw !== "";
    const categoryMarkup = toNumber(categoryMarkupRaw, 0);
    setEquipmentGroups(prev => ({
      ...prev,
      [groupKey]: [...(Array.isArray(prev[groupKey]) ? prev[groupKey] : []), { id: newId, type: isMain ? "Новий тип" : "", name: "", unit: "шт.", quantity: 1, price: 0, currency: "USD", incomingPrice: 0, markupPercent: hasCategoryMarkup ? categoryMarkup : 0, power: isMain ? 550 : 0 }]
    }));
  };

  const addRowWithExpand = (groupKey) => {
    addRow(groupKey);
    if (!expandableGroups.includes(groupKey)) return;
    setGroupSettings(prev => {
      const defaults = createDefaultGroupSettings();
      const current = prev[groupKey] || defaults[groupKey] || { name: groupKey, mode: 'fixed', unit: 'компл', quantity: 1, currency: 'USD', price: 0, incomingPrice: 0, markupPercent: 0 };
      if (current.mode === 'detailed') return prev;
      return {
        ...prev,
        [groupKey]: { ...current, mode: 'detailed' }
      };
    });
  };

  const addSectionSubgroup = (prefix, baseSettings = {}) => {
    const existingNames = Object.keys(equipmentGroups).filter(name => name.startsWith(prefix));
    let index = 1;
    while (existingNames.includes(`${prefix} ${index}`)) index += 1;
    const newGroupKey = `${prefix} ${index}`;

    setEquipmentGroups(prev => ({
      ...prev,
      [newGroupKey]: []
    }));

    const defaults = createDefaultGroupSettings();
    const template = defaults[prefix] || { mode: 'fixed', name: newGroupKey, price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 };
    const autoQty = prefix === "Кріплення" && autoMountingQuantity ? Math.max(0, Math.round(toNumber(totalPanelQuantity, 0))) : undefined;
    setGroupSettings(prev => ({
      ...prev,
      [newGroupKey]: {
        ...template,
        ...baseSettings,
        ...(autoQty !== undefined ? { quantity: autoQty } : {}),
        name: newGroupKey,
        mode: prefix === "Кріплення" ? 'detailed' : 'fixed'
      }
    }));
  };

  const addProtectionSubgroup = () => {
    const defaults = createDefaultGroupSettings();
    let baseKey = newProtectionType;

    if (newProtectionType === "Інше") {
      const rawName = newProtectionCustomName.trim();
      if (rawName) {
        baseKey = rawName.toLowerCase().startsWith("захист") ? rawName : ("Захист " + rawName);
      } else {
        baseKey = "Захист Інше";
      }
    }

    const existingNames = Object.keys(equipmentGroups);
    let newGroupKey = baseKey;
    if (existingNames.includes(newGroupKey)) {
      let index = 2;
      while (existingNames.includes(baseKey + " " + index)) index += 1;
      newGroupKey = baseKey + " " + index;
    }

    const template = defaults[newProtectionType] || { mode: "fixed", name: newGroupKey, price: 0, incomingPrice: 0, currency: "USD", unit: "компл", quantity: 1, markupPercent: 0 };

    setEquipmentGroups(prev => ({
      ...prev,
      [newGroupKey]: []
    }));

    setGroupSettings(prev => ({
      ...prev,
      [newGroupKey]: { ...template, name: newGroupKey, mode: "fixed" }
    }));

    if (newProtectionType === "Інше") {
      setNewProtectionCustomName("");
    }
  };

  const applyMountingTemplate = (groupKey, templateKey) => {
    const template = MOUNTING_TEMPLATE_CONFIG[templateKey];
    if (!template) return;

    const currentRows = Array.isArray(equipmentGroups[groupKey]) ? equipmentGroups[groupKey] : [];
    const firstQty = toNumber(currentRows[0]?.quantity, 0);
    const qtyFromGroup = toNumber(groupSettings[groupKey]?.quantity, 0);
    const autoQty = autoMountingQuantity ? Math.max(0, Math.round(toNumber(totalPanelQuantity, 0))) : 0;
    const baseQty = autoQty > 0 ? autoQty : (firstQty > 0 ? firstQty : (qtyFromGroup > 0 ? qtyFromGroup : 1));

    const categoryMarkupRaw = groupSettings[groupKey]?.categoryMarkupPercent;
    const hasCategoryMarkup = categoryMarkupRaw !== undefined && categoryMarkupRaw !== null && categoryMarkupRaw !== "";
    const categoryMarkup = toNumber(categoryMarkupRaw, 0);
    const seedMarkup = hasCategoryMarkup ? categoryMarkup : 0;

    const newRow = {
      id: Date.now(),
      type: "",
      name: template.name,
      unit: template.unit || "компл",
      quantity: baseQty,
      price: 0,
      currency: "USD",
      incomingPrice: 0,
      markupPercent: seedMarkup
    };

    setEquipmentGroups(prev => ({
      ...prev,
      [groupKey]: [newRow]
    }));

    setGroupSettings(prev => ({
      ...prev,
      [groupKey]: {
        ...(prev[groupKey] || {}),
        name: template.name,
        unit: template.unit || (prev[groupKey]?.unit || 'компл'),
        quantity: baseQty,
        mode: 'detailed'
      }
    }));

    setMountingTemplateSelection(prev => ({
      ...prev,
      [groupKey]: templateKey
    }));
  };

  const addCustomCategory = () => {
    const raw = newCategoryName.trim();
    if (!raw) {
      alert('Введіть назву нової категорії.');
      return;
    }

    const existingNames = Object.keys(equipmentGroups);
    let newGroupKey = raw;
    if (existingNames.includes(newGroupKey)) {
      let index = 2;
      while (existingNames.includes(raw + ' ' + index)) index += 1;
      newGroupKey = raw + ' ' + index;
    }

    const seedRow = { id: Date.now(), type: 'Інше', name: '', unit: 'шт.', quantity: 1, price: 0, currency: 'USD', incomingPrice: 0, markupPercent: 0 };
    setEquipmentGroups(prev => ({ ...prev, [newGroupKey]: [seedRow] }));
    setNewCategoryName('');

    setTimeout(() => {
      const node = document.querySelector('[data-group-key="' + CSS.escape(newGroupKey) + '"]');
      if (node && typeof node.scrollIntoView === 'function') {
        node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
  };

  const isCustomCategoryGroup = (groupKey) => {
    const standard = ["Основне обладнання", "Кабельна продукція", "Заземлення"];
    if (standard.includes(groupKey)) return false;
    if (groupKey.startsWith("Захист")) return false;
    if (groupKey.startsWith("Кріплення")) return false;
    return true;
  };

  const removeGroup = (groupKey) => {
    if (window.confirm(`Видалити весь розділ "${groupKey}"?`)) {
      setEquipmentGroups(prev => {
        const next = { ...prev };
        delete next[groupKey];
        return next;
      });
      setGroupSettings(prev => {
        const next = { ...prev };
        delete next[groupKey];
        return next;
      });
    }
  };

  const removeRow = (groupKey, id) => {
    if (id === `${groupKey}-fixed`) {
      setGroupSettings(prev => ({
        ...prev,
        [groupKey]: {
          ...(prev[groupKey] || {}),
          mode: 'detailed'
        }
      }));
      setEquipmentGroups(prev => ({
        ...prev,
        [groupKey]: []
      }));
      return;
    }

    setEquipmentGroups(prev => ({
      ...prev,
      [groupKey]: prev[groupKey].filter(item => item.id !== id)
    }));
  };

  const updateList = (list, setList, id, field, value) => {
    setList(prev => prev.map(item => {
      if (item.id !== id) return item;
      const parsed = (field === 'name' || field === 'currency') ? value : parseNumberInput(value);
      const updated = { ...item, [field]: parsed };

      if (field === 'price' || field === 'incomingPrice') {
        if (field === 'price') {
          const priceVal = toNumber(parsed, 0);
          const markupVal = toNumber(updated.markupPercent, 0);
          if (markupVal !== 0) {
            const divisor = 1 + (markupVal / 100);
            updated.incomingPrice = divisor > 0 ? (priceVal / divisor) : 0;
          } else {
            const incomingVal = toNumber(updated.incomingPrice, 0);
            updated.markupPercent = incomingVal > 0 ? ((priceVal - incomingVal) / incomingVal) * 100 : 0;
          }
        } else {
          const priceVal = toNumber(updated.price, 0);
          const incomingVal = toNumber(parsed, 0);
          updated.markupPercent = incomingVal > 0 ? ((priceVal - incomingVal) / incomingVal) * 100 : 0;
        }
      } else if (field === 'markupPercent') {
        const incomingVal = toNumber(updated.incomingPrice, 0);
        const priceVal = toNumber(updated.price, 0);
        const markupVal = toNumber(parsed, 0);
        if (incomingVal > 0) {
          updated.price = incomingVal * (1 + markupVal / 100);
        } else {
          const divisor = 1 + (markupVal / 100);
          updated.incomingPrice = divisor > 0 ? (priceVal / divisor) : 0;
        }
      } else if (updated.markupPercent === undefined) {
        const priceVal = toNumber(updated.price, 0);
        const incomingVal = toNumber(updated.incomingPrice, 0);
        updated.markupPercent = incomingVal > 0 ? ((priceVal - incomingVal) / incomingVal) * 100 : 0;
      }

      return updated;
    }));
  };

  const addItem = (setList, name) => {
    setList(prev => [...prev, { id: Date.now(), name, quantity: 1, price: 0, currency: "USD", incomingPrice: 0, markupPercent: 0 }]);
  };

  const removeItem = (setList, id) => {
    setList(prev => prev.filter(item => item.id !== id));
  };

  const updateGroupSetting = (groupKey, field, value) => {
    const normalized = (field === 'name' || field === 'unit' || field === 'currency' || field === 'mode')
      ? value
      : (field === 'pvTemplateType' || typeof value === 'boolean')
        ? value
        : parseNumberInput(value);

    if (field === 'categoryMarkupPercent') {
      const categoryMarkup = toNumber(normalized, 0);
      setEquipmentGroups(prev => {
        const rows = Array.isArray(prev[groupKey]) ? prev[groupKey] : [];
        if (rows.length === 0) return prev;
        return {
          ...prev,
          [groupKey]: rows.map(item => {
            const incoming = toNumber(item.incomingPrice, 0);
            return {
              ...item,
              markupPercent: categoryMarkup,
              price: incoming * (1 + categoryMarkup / 100)
            };
          })
        };
      });
    }

    if (field === 'quantity' && groupKey.startsWith("Кріплення")) {
      setAutoMountingQuantity(false);
    }

    setGroupSettings(prev => {
      let updated = { ...prev[groupKey], [field]: normalized };

      if (field === 'pvTemplateType') {
        const suggestedMeters = toNumber(PV_TEMPLATE_METERS_BY_TYPE[normalized], 150);
        updated.pvCableMetersPerString = suggestedMeters;
      }
      
      // Auto-calculate logic for markup
      const usdRate = toNumber(rates.usd, 0) || 1;
      const eurRate = toNumber(rates.eur, 0) || 1;
      const eurUsdRate = eurRate / usdRate;

      const getNormalizedUsd = (val, curr) => {
        const v = toNumber(val, 0);
        if (curr === 'EUR') return v * eurUsdRate;
        if (curr === 'UAH') return v / usdRate;
        return v;
      };

      if (field === 'price' || field === 'incomingPrice') {
        if (field === 'price') {
          const p = toNumber(normalized, 0);
          const m = toNumber(updated.markupPercent, 0);
          if (m !== 0) {
            const divisor = 1 + (m / 100);
            updated.incomingPrice = divisor > 0 ? (p / divisor) : 0;
          } else {
            const priceUsd = getNormalizedUsd(p, updated.currency);
            const incomingUsd = getNormalizedUsd(updated.incomingPrice, updated.currency);
            updated.markupPercent = incomingUsd > 0 ? ((priceUsd - incomingUsd) / incomingUsd) * 100 : 0;
          }
        } else {
          const p = toNumber(updated.price, 0);
          const inc = toNumber(normalized, 0);
          const priceUsd = getNormalizedUsd(p, updated.currency);
          const incomingUsd = getNormalizedUsd(inc, updated.currency);
          updated.markupPercent = incomingUsd > 0 ? ((priceUsd - incomingUsd) / incomingUsd) * 100 : 0;
        }
      } else if (field === 'markupPercent') {
        const m = toNumber(normalized, 0);
        const inc = toNumber(updated.incomingPrice, 0);
        if (inc > 0) {
          updated.price = inc * (1 + m / 100);
        } else {
          const p = toNumber(updated.price, 0);
          const divisor = 1 + (m / 100);
          updated.incomingPrice = divisor > 0 ? (p / divisor) : 0;
        }
      }
      
      return { ...prev, [groupKey]: updated };
    });
  };

  const applyCategoryMarkup = (groupKey) => {
    const percent = toNumber(groupSettings[groupKey]?.categoryMarkupPercent, 0);
    setEquipmentGroups(prev => {
      const rows = Array.isArray(prev[groupKey]) ? prev[groupKey] : [];
      if (rows.length === 0) return prev;
      return {
        ...prev,
        [groupKey]: rows.map(item => {
          const incoming = toNumber(item.incomingPrice, 0);
          return {
            ...item,
            markupPercent: percent,
            price: incoming * (1 + percent / 100)
          };
        })
      };
    });
  };

  const toggleGroupMode = (groupKey) => {
    setGroupSettings(prev => ({
        ...prev,
        [groupKey]: { 
            ...prev[groupKey], 
            mode: prev[groupKey]?.mode === 'fixed' ? 'detailed' : 'fixed' 
        }
    }));
  };

  const applyPvProtectionTemplate = (rawStrings) => {
    const strings = Math.max(1, Math.floor(toNumber(rawStrings, 1)));
    const occupiedPlaces = (3 * strings) + strings + strings; // OPN (3) + holder (1) + disconnector (1) per string
    const enclosurePlaces = PV_ENCLOSURE_SIZES.find(size => size >= occupiedPlaces) || PV_ENCLOSURE_SIZES[PV_ENCLOSURE_SIZES.length - 1];

    setEquipmentGroups(prev => {
      const existing = Array.isArray(prev["Захист PV"]) ? prev["Захист PV"] : [];
      const pick = (matcher) => existing.find(matcher);
      const withPrices = (baseItem, matched) => ({
        ...baseItem,
        price: matched?.price ?? baseItem.price,
        currency: matched?.currency ?? baseItem.currency,
        incomingPrice: matched?.incomingPrice ?? baseItem.incomingPrice,
        markupPercent: matched?.markupPercent ?? baseItem.markupPercent
      });

      const ts = Date.now();
      const rows = [
        withPrices({
          id: ts + 1,
          type: "Захист PV",
          name: "Обмежувач напруги",
          unit: "шт.",
          quantity: strings,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        }, pick(it => {
          const name = (it.name || "").toLowerCase();
          return name.includes("узіп") || name.includes("опн") || name.includes("обмежувач");
        })),
        withPrices({
          id: ts + 2,
          type: "Захист PV",
          name: "Тримач запобіжника",
          unit: "шт.",
          quantity: strings,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        }, pick(it => (it.name || "").toLowerCase().includes("тримач"))),
        withPrices({
          id: ts + 3,
          type: "Захист PV",
          name: "Запобіжник",
          unit: "шт.",
          quantity: strings,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        }, pick(it => (it.name || "").toLowerCase().includes("запобіж"))),
        withPrices({
          id: ts + 4,
          type: "Захист PV",
          name: "Розмикач",
          unit: "шт.",
          quantity: strings,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        }, pick(it => {
          const name = (it.name || "").toLowerCase();
          return name.includes("розмикач") || name.includes("рубиль");
        })),
        withPrices({
          id: ts + 5,
          type: "Захист PV",
          name: `Корпус щита ${enclosurePlaces} місць`,
          unit: "шт.",
          quantity: 1,
          price: 0,
          currency: "USD",
          incomingPrice: 0,
          markupPercent: 0
        }, pick(it => (it.name || "").toLowerCase().includes("корпус")))
      ];

      return { ...prev, "Захист PV": rows };
    });

    updateGroupSetting("Захист PV", "pvTemplateStrings", strings);
  };

  // Auto-save current state
  useEffect(() => { localStorage.setItem('solar_rates', JSON.stringify(rates)); }, [rates]);
  useEffect(() => { localStorage.setItem('solar_clientInfo', JSON.stringify(clientInfo)); }, [clientInfo]);
  useEffect(() => { localStorage.setItem('solar_offerPurpose', JSON.stringify(offerPurpose)); }, [offerPurpose]);
  useEffect(() => { localStorage.setItem('solar_coverSystemName', JSON.stringify(coverSystemName)); }, [coverSystemName]);
  useEffect(() => { localStorage.setItem('solar_coverPageType', JSON.stringify(coverPageType)); }, [coverPageType]);
  useEffect(() => { localStorage.setItem('solar_showOfferStationSheet', JSON.stringify(showOfferStationSheet)); }, [showOfferStationSheet]);
  useEffect(() => { localStorage.setItem('solar_generationLocation', JSON.stringify(generationLocation)); }, [generationLocation]);
  useEffect(() => { localStorage.setItem('solar_generationMountType', JSON.stringify(generationMountType)); }, [generationMountType]);
  useEffect(() => { localStorage.setItem('solar_energyTariffUah', JSON.stringify(energyTariffUah)); }, [energyTariffUah]);
  useEffect(() => { localStorage.setItem('solar_typicalLoadKw', JSON.stringify(typicalLoadKw)); }, [typicalLoadKw]);
  useEffect(() => { localStorage.setItem('solar_coverQrUrl', JSON.stringify(coverQrUrl)); }, [coverQrUrl]);
  useEffect(() => { localStorage.setItem('solar_offerSettingsCollapsed', JSON.stringify(offerSettingsCollapsed)); }, [offerSettingsCollapsed]);
  useEffect(() => { localStorage.setItem('solar_managerContacts', JSON.stringify(managerContacts)); }, [managerContacts]);
  useEffect(() => { localStorage.setItem('solar_includeManagerInOffer', JSON.stringify(includeManagerInOffer)); }, [includeManagerInOffer]);
  useEffect(() => { localStorage.setItem('solar_includeClientInOffer', JSON.stringify(includeClientInOffer)); }, [includeClientInOffer]);
  useEffect(() => { localStorage.setItem('solar_includeAddressInOffer', JSON.stringify(includeAddressInOffer)); }, [includeAddressInOffer]);
  useEffect(() => { localStorage.setItem('solar_printCurrencyMode', JSON.stringify(printCurrencyMode)); }, [printCurrencyMode]);
  useEffect(() => { localStorage.setItem('solar_selectedManagerId', JSON.stringify(selectedManagerId)); }, [selectedManagerId]);
  useEffect(() => { localStorage.setItem('solar_equipmentGroups', JSON.stringify(equipmentGroups)); }, [equipmentGroups]);
  useEffect(() => { localStorage.setItem('solar_otherExpenses', JSON.stringify(otherExpenses)); }, [otherExpenses]);
  useEffect(() => { localStorage.setItem('solar_workItems', JSON.stringify(workItems)); }, [workItems]);
  useEffect(() => { localStorage.setItem('solar_installPercent', JSON.stringify(installPercent)); }, [installPercent]);
  useEffect(() => { localStorage.setItem('solar_managerCommissionRate', JSON.stringify(managerCommissionRate)); }, [managerCommissionRate]);
  useEffect(() => { localStorage.setItem('solar_clientDiscountPercent', JSON.stringify(clientDiscountPercent)); }, [clientDiscountPercent]);
  useEffect(() => { localStorage.setItem('solar_taxMode', JSON.stringify(taxMode)); }, [taxMode]);
  useEffect(() => { localStorage.setItem('solar_fopTaxPercent', JSON.stringify(fopTaxPercent)); }, [fopTaxPercent]);
  useEffect(() => { localStorage.setItem('solar_advancedFopPercent', JSON.stringify(advancedFopPercent)); }, [advancedFopPercent]);
  useEffect(() => { localStorage.setItem('solar_advancedFopBaseMode', JSON.stringify(advancedFopBaseMode)); }, [advancedFopBaseMode]);
  useEffect(() => { localStorage.setItem('solar_advancedFopSelectedGroups', JSON.stringify(advancedFopSelectedGroups)); }, [advancedFopSelectedGroups]);
  useEffect(() => { localStorage.setItem('solar_advancedFopSelectedItems', JSON.stringify(advancedFopSelectedItems)); }, [advancedFopSelectedItems]);
  useEffect(() => { localStorage.setItem('solar_advancedFopGroupPercents', JSON.stringify(advancedFopGroupPercents)); }, [advancedFopGroupPercents]);
  useEffect(() => { localStorage.setItem('solar_advancedFopItemPercents', JSON.stringify(advancedFopItemPercents)); }, [advancedFopItemPercents]);
  useEffect(() => { localStorage.setItem('solar_lockedDistributedTaxUsd', JSON.stringify(lockedDistributedTaxUsd)); }, [lockedDistributedTaxUsd]);
  useEffect(() => { localStorage.setItem('solar_taxDistributionApplied', JSON.stringify(taxDistributionApplied)); }, [taxDistributionApplied]);
  useEffect(() => { localStorage.setItem('solar_taxDistributionScope', JSON.stringify(taxDistributionScope)); }, [taxDistributionScope]);
  useEffect(() => { localStorage.setItem('solar_installPercentTaxUsd', JSON.stringify(installPercentTaxUsd)); }, [installPercentTaxUsd]);
  useEffect(() => { localStorage.setItem('solar_autoInstallPercentEnabled', JSON.stringify(autoInstallPercentEnabled)); }, [autoInstallPercentEnabled]);
  useEffect(() => { localStorage.setItem('solar_groupSettings', JSON.stringify(groupSettings)); }, [groupSettings]);
  useEffect(() => { localStorage.setItem('solar_project_catalog_snapshots', JSON.stringify(projectCatalogSnapshots)); }, [projectCatalogSnapshots]);
  useEffect(() => { localStorage.setItem('solar_mountingTemplateSelection', JSON.stringify(mountingTemplateSelection)); }, [mountingTemplateSelection]);
  useEffect(() => { localStorage.setItem('solar_offerSheets', JSON.stringify(offerSheets)); }, [offerSheets]);
  useEffect(() => { localStorage.setItem('solar_activeOfferSheetId', JSON.stringify(activeOfferSheetId)); }, [activeOfferSheetId]);

  useEffect(() => {
    if (!activeOfferSheetId || !Array.isArray(offerSheets) || offerSheets.length === 0) return;
    const hasActive = offerSheets.some((sheet) => String(sheet.id) === String(activeOfferSheetId));
    if (!hasActive) {
      setActiveOfferSheetId(String(offerSheets[0].id));
    }
  }, [offerSheets, activeOfferSheetId]);
  useEffect(() => {
    const nodes = document.querySelectorAll('.top-shell [data-title]');
    nodes.forEach((el) => {
      const tip = el.getAttribute('data-title');
      if (tip && !el.getAttribute('title')) el.setAttribute('title', tip);
    });
  }, [layoutMode, menuCollapsed, clientMode, workspacePinned, workspaceHandle, templates.length]);

  const calculations = useMemo(() => {
    const usdRate = toNumber(rates.usd, 0);
    const eurRate = toNumber(rates.eur, 0);
    const safeUsdRate = usdRate > 0 ? usdRate : 1;
    const eurUsdRate = usdRate > 0 ? (eurRate / usdRate) : 1;
    let totalPower = 0;
    let totals = { sumUsd: 0, costUsd: 0 };
    const processedGroups = {};
    const groupTotalsUsd = {};
    const groupTotalsUah = {};
    const groupCostTotalsUsd = {};

    Object.keys(equipmentGroups).forEach(groupKey => {
      let groupSumUsd = 0;
      let groupSumUah = 0;
      let groupCostSumUsd = 0;
      
      const mode = groupSettings[groupKey]?.mode || 'detailed';

      if (mode === 'fixed') {
        const settings = groupSettings[groupKey] || {};
        const settingsPrice = toNumber(settings.price, 0);
        const settingsIncoming = toNumber(settings.incomingPrice, 0);
        const settingsQty = toNumber(settings.quantity, 0);

        let priceNormalizedUsd = settingsPrice;
        if (settings.currency === "EUR") priceNormalizedUsd = settingsPrice * eurUsdRate;
        else if (settings.currency === "UAH") priceNormalizedUsd = settingsPrice / safeUsdRate;
        
        let costNormalizedUsd = settingsIncoming;
        if (settings.currency === "EUR") costNormalizedUsd = settingsIncoming * eurUsdRate;
        else if (settings.currency === "UAH") costNormalizedUsd = settingsIncoming / safeUsdRate;

        const priceUah = priceNormalizedUsd * safeUsdRate;
        const sumUsd = priceNormalizedUsd * settingsQty;
        const sumUah = sumUsd * safeUsdRate;
        const costUsd = costNormalizedUsd * settingsQty;
        const marginUsd = sumUsd - costUsd;
        
        processedGroups[groupKey] = [{
            id: groupKey + '-fixed',
            name: settings.name || `${groupKey} (фіксована сума)`,
            unit: settings.unit || 'компл',
            quantity: settings.quantity ?? 1,
            price: settings.price ?? 0,
            priceBaseUsd: settings.priceBaseUsd,
            currency: settings.currency,
            incomingPrice: settings.incomingPrice ?? 0,
            priceUah,
            sumUsd,
            sumUah,
            costUsd,
            marginUsd,
            markupPercent: toNumber(settings.markupPercent, 0),
            taxDistributedUsd: toNumber(settings.taxDistributedUsd, 0),
            taxDistributedPerUnitUsd: toNumber(settings.taxDistributedPerUnitUsd, 0),
            isFixed: true
        }];

        groupSumUsd = sumUsd;
        groupSumUah = sumUah;
        groupCostSumUsd = costUsd;
        totals.sumUsd += sumUsd;
        totals.costUsd += costUsd;

      } else {
        processedGroups[groupKey] = equipmentGroups[groupKey].map(item => {
          const itemPrice = toNumber(item.price, 0);
          const itemIncoming = toNumber(item.incomingPrice, 0);
          const itemQty = toNumber(item.quantity, 0);

          let priceNormalizedUsd = itemPrice;
          if (item.currency === "EUR") priceNormalizedUsd = itemPrice * eurUsdRate;
          else if (item.currency === "UAH") priceNormalizedUsd = itemPrice / safeUsdRate;
          
          let costNormalizedUsd = itemIncoming;
          if (item.currency === "EUR") costNormalizedUsd = itemIncoming * eurUsdRate;
          else if (item.currency === "UAH") costNormalizedUsd = itemIncoming / safeUsdRate;

          const priceUah = priceNormalizedUsd * safeUsdRate;
          const sumUsd = priceNormalizedUsd * itemQty;
          const sumUah = sumUsd * safeUsdRate;
          const costUsd = costNormalizedUsd * itemQty;
          const marginUsd = sumUsd - costUsd;
          
          // initialize markupPercent if missing
          let markupPercent = item.markupPercent;
          if (markupPercent === undefined) {
               markupPercent = itemIncoming > 0 ? ((itemPrice - itemIncoming) / itemIncoming) * 100 : 0;
          }

          // Calculate station power if it's a PV panel (ФЕП)
          if (groupKey === "Основне обладнання" && item.type === "ФЕП") {
            const p = toNumber(item.power, modulePower);
            totalPower += toNumber(item.quantity, 0) * p;
          }

          groupSumUsd += sumUsd;
          groupSumUah += sumUah;
          groupCostSumUsd += costUsd;
          totals.sumUsd += sumUsd;
          totals.costUsd += costUsd;

          return { ...item, priceNormalizedUsd, incomingPriceNormalizedUsd: costNormalizedUsd, priceUah, sumUsd, sumUah, costUsd, marginUsd, markupPercent };
        });
      }
      groupTotalsUsd[groupKey] = groupSumUsd;
      groupTotalsUah[groupKey] = groupSumUah;
      groupCostTotalsUsd[groupKey] = groupCostSumUsd;
    });

    const installPercentValue = toNumber(installPercent, 0);
    const installPercentAmountUsd = totals.sumUsd * (installPercentValue / 100);
    const processList = (list) => list.map(it => {
      const itemPrice = toNumber(it.price, 0);
      const itemIncoming = toNumber(it.incomingPrice, 0);
      const itemQty = toNumber(it.quantity, 0);
      let priceNormalizedUsd = itemPrice;
      if (it.currency === "EUR") priceNormalizedUsd = itemPrice * eurUsdRate;
      else if (it.currency === "UAH") priceNormalizedUsd = itemPrice / safeUsdRate;

      let incomingNormalizedUsd = itemIncoming;
      if (it.currency === "EUR") incomingNormalizedUsd = itemIncoming * eurUsdRate;
      else if (it.currency === "UAH") incomingNormalizedUsd = itemIncoming / safeUsdRate;
      
      const sumUsd = priceNormalizedUsd * itemQty;
      const sumUah = sumUsd * safeUsdRate;
      const priceUah = priceNormalizedUsd * safeUsdRate;
      const costUsd = incomingNormalizedUsd * itemQty;
      const marginUsd = sumUsd - costUsd;
      let markupPercent = it.markupPercent;
      if (markupPercent === undefined) {
        markupPercent = itemIncoming > 0 ? ((itemPrice - itemIncoming) / itemIncoming) * 100 : 0;
      }

      return { ...it, sumUsd, sumUah, priceUah, priceNormalizedUsd, incomingPriceNormalizedUsd: incomingNormalizedUsd, costUsd, marginUsd, markupPercent };
    });

    const processedWorkItems = processList(workItems);
    const processedOtherExpenses = processList(otherExpenses);

    const workItemsSumUsd = processedWorkItems.reduce((acc, it) => acc + it.sumUsd, 0);
    const workItemsCostUsd = processedWorkItems.reduce((acc, it) => acc + toNumber(it.costUsd, 0), 0);
    const workItemsMarginUsd = workItemsSumUsd - workItemsCostUsd;
    const workItemsSumUah = processedWorkItems.reduce((acc, it) => acc + it.sumUah, 0);
    const otherCostsUsd = processedOtherExpenses.reduce((acc, it) => acc + it.sumUsd, 0);
    const otherCostsUah = processedOtherExpenses.reduce((acc, it) => acc + it.sumUah, 0);
    const otherCostsCostUsd = processedOtherExpenses.reduce((acc, it) => acc + toNumber(it.costUsd, 0), 0);
    const otherCostsMarginUsd = otherCostsUsd - otherCostsCostUsd;
    
    const logisticsTotalUsd = otherCostsUsd;
    const logisticsTotalUah = otherCostsUah;
    const installationTotalUsd = installPercentAmountUsd + workItemsSumUsd;
    const installationTotalUah = (installPercentAmountUsd * safeUsdRate) + workItemsSumUah;
    
    const finalTotalUsd = totals.sumUsd + installationTotalUsd + logisticsTotalUsd;
    const discountPercent = Math.max(0, toNumber(clientDiscountPercent, 0));
    const discountUsd = finalTotalUsd * (discountPercent / 100);
    const finalTotalWithDiscountUsd = Math.max(0, finalTotalUsd - discountUsd);
    const finalTotalUah = finalTotalUsd * safeUsdRate;
    const finalTotalEur = eurUsdRate > 0 ? (finalTotalUsd / eurUsdRate) : 0;
    const finalTotalWithDiscountUah = finalTotalWithDiscountUsd * safeUsdRate;
    const finalTotalWithDiscountEur = eurUsdRate > 0 ? (finalTotalWithDiscountUsd / eurUsdRate) : 0;
    const marginMaterialsUsd = totals.sumUsd - totals.costUsd;
    const marginWorksUsd = workItemsMarginUsd;
    const marginTotalUsd = marginMaterialsUsd + marginWorksUsd; // Брудна маржа (обладнання + роботи)
    const materialsCostWithWorksUsd = totals.costUsd + workItemsCostUsd;
    const orderCostUsd = totals.costUsd + workItemsCostUsd + otherCostsCostUsd;
    const marginMaterialsPercent = totals.sumUsd > 0 ? (marginMaterialsUsd / totals.sumUsd) * 100 : 0;
    const marginWorksPercent = workItemsSumUsd > 0 ? (marginWorksUsd / workItemsSumUsd) * 100 : 0;
    const marginFromOrderPercent = finalTotalWithDiscountUsd > 0 ? (marginTotalUsd / finalTotalWithDiscountUsd) * 100 : 0;
    // Маржа для виплат менеджеру/чистого прибутку — вже з урахуванням клієнтської знижки
    const grossMarginBeforeTaxesUsd = marginTotalUsd - discountUsd;
    // Комісія менеджера (до податків) — від маржі замовлення після знижки
    const managerCommissionBeforeTaxesUsd = Math.max(0, grossMarginBeforeTaxesUsd) * (toNumber(managerCommissionRate, 0) / 100);
    const netMarginBeforeTaxesUsd = grossMarginBeforeTaxesUsd - managerCommissionBeforeTaxesUsd;
    const materialsWithDiscountUsd = Math.max(0, totals.sumUsd - (discountUsd * (totals.sumUsd / (finalTotalUsd || 1))));
    const worksWithDiscountUsd = Math.max(0, installationTotalUsd - (discountUsd * (installationTotalUsd / (finalTotalUsd || 1))));
    const logisticsWithDiscountUsd = Math.max(0, logisticsTotalUsd - (discountUsd * (logisticsTotalUsd / (finalTotalUsd || 1))));
    let taxesUsd = 0;
    let vatGoodsUsd = 0;
    let vatWorksUsd = 0;
    let vatReceiptUsd = 0;
    let advancedFopBaseUsd = 0;
    if (taxMode === 'fop7') {
      taxesUsd = finalTotalWithDiscountUsd * (Math.max(0, toNumber(fopTaxPercent, 7)) / 100);
    } else if (taxMode === 'vat') {
      const materialsMarginNoDiscountUsd = Math.max(0, marginMaterialsUsd);
      vatGoodsUsd = materialsMarginNoDiscountUsd * 0.20;
      vatWorksUsd = worksWithDiscountUsd * 0.20;
      vatReceiptUsd = finalTotalWithDiscountUsd * 0.02;
      taxesUsd = vatGoodsUsd + vatWorksUsd + vatReceiptUsd;
    } else if (taxMode === 'fop_advanced') {
      const groupKeys = Object.keys(processedGroups || {});
      if (advancedFopBaseMode === 'groups') {
        const grouped = groupKeys.reduce((acc, gk) => {
          if (!advancedFopSelectedGroups.includes(gk)) return acc;
          const groupSum = toNumber(groupTotalsUsd[gk], 0);
          const groupPercent = Math.max(7, Math.min(9, toNumber(advancedFopGroupPercents[gk], toNumber(advancedFopPercent, 7))));
          advancedFopBaseUsd += groupSum;
          return acc + ((groupSum * 0.5) * (groupPercent / 100));
        }, 0);
        taxesUsd = grouped;
      } else if (advancedFopBaseMode === 'items') {
        const byItems = groupKeys.reduce((acc, gk) => {
          const rows = Array.isArray(processedGroups[gk]) ? processedGroups[gk] : [];
          return acc + rows.reduce((s, row) => {
            const key = `${gk}::${row.id}`;
            if (!advancedFopSelectedItems.includes(key)) return s;
            const rowSum = toNumber(row.sumUsd, 0);
            const rowPercent = Math.max(7, Math.min(9, toNumber(advancedFopItemPercents[key], toNumber(advancedFopPercent, 7))));
            advancedFopBaseUsd += rowSum;
            return s + ((rowSum * 0.5) * (rowPercent / 100));
          }, 0);
        }, 0);
        taxesUsd = byItems;
      } else {
        advancedFopBaseUsd = materialsWithDiscountUsd;
        const taxBaseUsd = advancedFopBaseUsd * 0.5;
        taxesUsd = taxBaseUsd * (Math.max(7, Math.min(9, toNumber(advancedFopPercent, 7))) / 100);
      }
    }
    const distributedTaxUsdFromRows = Object.values(equipmentGroups || {}).reduce((groupsAcc, items) => {
      const list = Array.isArray(items) ? items : [];
      return groupsAcc + list.reduce((acc, it) => acc + Math.max(0, toNumber(it.taxDistributedUsd, 0)), 0);
    }, 0);
    const distributedTaxUsdFromFixedGroups = Object.values(groupSettings || {}).reduce((acc, settings) => {
      return acc + Math.max(0, toNumber(settings?.taxDistributedUsd, 0));
    }, 0);
    const distributedTaxUsdTotal = distributedTaxUsdFromRows + distributedTaxUsdFromFixedGroups;
    if (taxMode !== 'vat' && taxDistributionApplied && lockedDistributedTaxUsd !== null && lockedDistributedTaxUsd !== undefined && toNumber(lockedDistributedTaxUsd, 0) > 0) {
      taxesUsd = toNumber(lockedDistributedTaxUsd, 0);
    }
    const marginAfterTaxesUsd = grossMarginBeforeTaxesUsd - taxesUsd;
    const taxesUah = taxesUsd * safeUsdRate;
    const marginAfterTaxesUah = marginAfterTaxesUsd * safeUsdRate;
    // Комісія менеджера (після податків) — від маржі після податків
    const managerCommissionAfterTaxesUsd = Math.max(0, marginAfterTaxesUsd) * (toNumber(managerCommissionRate, 0) / 100);
    const managerCommissionAfterTaxesUah = managerCommissionAfterTaxesUsd * safeUsdRate;
    // Чистий прибуток після податків і комісії
    const netMarginUsd = marginAfterTaxesUsd - managerCommissionAfterTaxesUsd;
    const netMarginUah = netMarginUsd * safeUsdRate;

    return {
      groups: processedGroups,
      groupTotalsUsd,
      groupTotalsUah,
      groupCostTotalsUsd,
      processedWorkItems,
      processedOtherExpenses,
      workItemsSumUsd,
      workItemsSumUah,
      workItemsCostUsd,
      workItemsMarginUsd,
      otherCostsUsd,
      otherCostsUah,
      otherCostsCostUsd,
      otherCostsMarginUsd,
      stationPowerW: totalPower,
      sums: {
        materialsSumUsd: totals.sumUsd,
        materialsCostUsd: totals.costUsd,
        materialsCostWithWorksUsd,
        orderCostUsd,
        logisticsTotalUsd,
        logisticsTotalUah,
        installPercentAmountUsd,
        installationTotalUsd,
        installationTotalUah,
        workItemsCostUsd,
        marginMaterialsUsd,
        marginMaterialsPercent,
        marginWorksUsd,
        marginWorksPercent,
        marginTotalUsd,
        marginFromOrderPercent,
        taxesUsd,
        taxesUah,
        vatGoodsUsd,
        vatWorksUsd,
        vatReceiptUsd,
        advancedFopBaseUsd,
        advancedFopPercent: Math.max(7, Math.min(9, toNumber(advancedFopPercent, 7))),
        vatGoodsUah: vatGoodsUsd * safeUsdRate,
        vatWorksUah: vatWorksUsd * safeUsdRate,
        vatReceiptUah: vatReceiptUsd * safeUsdRate,
        distributedTaxUsdFromRows: (taxDistributionApplied || taxMode === 'fop_advanced') ? distributedTaxUsdTotal : 0,
        grossMarginBeforeTaxesUsd,
        netMarginBeforeTaxesUsd,
        marginAfterTaxesUsd,
        marginAfterTaxesUah,
        managerCommissionBeforeTaxesUsd,
        managerCommissionAfterTaxesUsd,
        managerCommissionAfterTaxesUah,
        netMarginUsd,
        netMarginUah,
        discountPercent,
        discountUsd,
        finalTotalUsd,
        finalTotalUah,
        finalTotalEur,
        finalTotalWithDiscountUsd,
        finalTotalWithDiscountUah,
        finalTotalWithDiscountEur
      }
    };
  }, [
    equipmentGroups,
    rates,
    modulePower,
    installPercent,
    workItems,
    otherExpenses,
    managerCommissionRate,
    clientDiscountPercent,
    groupSettings,
    taxMode,
    fopTaxPercent,
    lockedDistributedTaxUsd,
    taxDistributionApplied,
    advancedFopPercent,
    advancedFopBaseMode,
    advancedFopSelectedGroups,
    advancedFopSelectedItems,
    advancedFopGroupPercents,
    advancedFopItemPercents
  ]);

  useEffect(() => {
    persistCurrentSheetState();
  }, [
    activeOfferSheetId,
    showOfferComparisonSheet,
    rates,
    modulePower,
    clientInfo,
    offerPurpose,
    coverSystemName,
    coverPageType,
    showOfferStationSheet,
    generationLocation,
    generationMountType,
    energyTariffUah,
    typicalLoadKw,
    coverQrUrl,
    managerContacts,
    selectedManagerId,
    equipmentGroups,
    otherExpenses,
    workItems,
    installPercent,
    managerCommissionRate,
    clientDiscountPercent,
    taxMode,
    fopTaxPercent,
    advancedFopPercent,
    advancedFopBaseMode,
    advancedFopSelectedGroups,
    advancedFopSelectedItems,
    advancedFopGroupPercents,
    advancedFopItemPercents,
    lockedDistributedTaxUsd,
    taxDistributionApplied,
    taxDistributionScope,
    installPercentTaxUsd,
    autoInstallPercentEnabled,
    groupSettings,
    autoMountingQuantity,
    projectType,
    calculations.sums.finalTotalWithDiscountUsd,
    calculations.sums.finalTotalWithDiscountUah,
    calculations.stationPowerW
  ]);

  const protectionGroups = useMemo(
    () => Object.keys(calculations.groups).filter(groupKey => groupKey.startsWith("Захист") && groupKey !== "Захист"),
    [calculations.groups]
  );
  const installPercentValue = toNumber(installPercent, 0);
  const installPercentBaseUsd = calculations.sums.materialsSumUsd;
  const installPercentOnlyUsd = Math.max(0, toNumber(calculations.sums.installPercentAmountUsd, 0));
  const installPercentOnlyUah = installPercentOnlyUsd * toNumber(rates.usd, 0);
  const commercialServiceTotalUsd = calculations.workItemsSumUsd + calculations.otherCostsUsd + installPercentOnlyUsd;
  const commercialServicePercent = calculations.sums.materialsSumUsd > 0
    ? (commercialServiceTotalUsd / calculations.sums.materialsSumUsd) * 100
    : 0;

  const buildSummaryLabel = (items, fallback) => {
    const names = Array.from(new Set((items || [])
      .filter((it) => (it?.name || '').trim() && toNumber(it?.quantity, 0) > 0)
      .map((it) => String(it.name).trim())));

    if (names.length === 0) return fallback;
    if (names.length === 1) return names[0] + ':';
    if (names.length === 2) return names.join(' + ') + ':';
    return names[0] + ' + ' + (names.length - 1) + ' ще:';
  };

  const logisticsSummaryLabel = buildSummaryLabel(
    calculations.processedOtherExpenses,
    projectType === 'commercial' ? 'Доставка та додаткові витрати (окремо):' : 'Доставка та додаткові витрати:'
  );

  const worksSummaryLabel = buildSummaryLabel(
    calculations.processedWorkItems,
    projectType === 'commercial' ? 'Монтаж, запуск та супровід:' : 'Монтажні та пусконалагоджувальні роботи:'
  );
  const offerSheetsForUi = (Array.isArray(offerSheets) && offerSheets.length > 0) ? offerSheets : DEFAULT_OFFER_SHEETS;
  const offerComparisonRows = offerSheetsForUi.map((sheet) => {
    const isActive = String(sheet.id) === String(activeOfferSheetId);
    const summary = isActive
      ? buildOfferSheetSummary()
      : (sheet.summary || {});
    return {
      id: sheet.id,
      name: sheet.name || 'КП',
      stationPowerW: toNumber(summary.stationPowerW, 0),
      finalTotalWithDiscountUsd: toNumber(summary.finalTotalWithDiscountUsd, 0),
      finalTotalWithDiscountUah: toNumber(summary.finalTotalWithDiscountUah, 0),
      materialsSumUsd: toNumber(summary.materialsSumUsd, 0),
      worksTotalUsd: toNumber(summary.worksTotalUsd, 0),
      otherCostsUsd: toNumber(summary.otherCostsUsd, 0),
      grossMarginBeforeTaxesUsd: toNumber(summary.grossMarginBeforeTaxesUsd, 0),
      taxesUsd: toNumber(summary.taxesUsd, 0),
      marginAfterTaxUsd: toNumber(summary.marginAfterTaxUsd, 0),
      managerCommissionAfterTaxesUsd: toNumber(summary.managerCommissionAfterTaxesUsd, 0),
      netProfitUsd: toNumber(summary.netProfitUsd, 0)
    };
  });

  const currentYear = new Date().getFullYear();
  const splitMoneyParts = (value) => {
    const formatted = formatMoney(value);
    const parts = String(formatted).split(',');
    return {
      whole: parts[0] || '0',
      frac: (parts[1] || '00').padEnd(2, '0').slice(0, 2)
    };
  };
  const totalUsdParts = splitMoneyParts(calculations.sums.finalTotalWithDiscountUsd);
  const totalUahParts = splitMoneyParts(calculations.sums.finalTotalWithDiscountUah);
  const totalBeforeDiscountUsdParts = splitMoneyParts(calculations.sums.finalTotalUsd || 0);
  const totalBeforeDiscountUahParts = splitMoneyParts(calculations.sums.finalTotalUah || 0);
  const discountUsdParts = splitMoneyParts(calculations.sums.discountUsd || 0);
  const discountUahParts = splitMoneyParts((calculations.sums.discountUsd || 0) * toNumber(rates.usd, 0));
  const hasOfferDiscount = toNumber(calculations.sums.discountPercent, 0) > 0;
  const showUsdInPrint = printCurrencyMode !== 'uah';
  const showUahInPrint = printCurrencyMode !== 'usd';
  const solarPowerKw = toNumber(calculations.stationPowerW, 0) / 1000;
  const allRows = Object.values(calculations.groups).flat();
  const inverterRows = allRows.filter((row) => row && String(row.type || "").trim() === "Інвертор");
  const batteryRows = allRows.filter((row) => row && String(row.type || "").trim() === "АКБ");

  const inverterPowerKw = inverterRows.reduce((acc, row) => {
    const rowQty = toNumber(row.quantity, 0);
    const parsed = parsePowerKwFromText(row.name);
    return acc + (parsed * (rowQty > 0 ? rowQty : 1));
  }, 0);

  const batteryKwh = batteryRows.reduce((acc, row) => {
    const rowQty = toNumber(row.quantity, 0);
    const parsed = parseBatteryKwhFromText(row.name);
    return acc + (parsed * (rowQty > 0 ? rowQty : 1));
  }, 0);

  const inverterTotalUah = inverterRows.reduce((acc, row) => acc + toNumber(row.sumUah, 0), 0);
  const hasSolar = solarPowerKw > 0;
  const hasInverter = inverterRows.length > 0;
  const hasBattery = batteryRows.length > 0;
  const isBackupSystem = !hasSolar && hasInverter && hasBattery;

  const coverMainPowerKw = hasSolar ? solarPowerKw : inverterPowerKw;
  const coverPowerKnown = coverMainPowerKw > 0;
  const coverSystemNameAuto = isBackupSystem ? "Безперебійна система" : "Гібридна станція";
  const coverSystemNameFinal = (coverSystemName || '').trim() || coverSystemNameAuto;
  const coverMainTitle = coverPowerKnown ? `${coverSystemNameFinal} ${formatKw(coverMainPowerKw)} кВт` : coverSystemNameFinal;
  const coverAddress = clientInfo.address || "____________________";
  const coverPowerLine = coverPowerKnown ? (formatKw(coverMainPowerKw) + " кВт") : "—";
  const coverBatteryLine = batteryKwh > 0 ? (formatKw(batteryKwh) + " кВт·год") : (hasBattery ? (batteryRows.reduce((acc, row) => acc + toNumber(row.quantity, 0), 0) + " шт.") : "—");
  const coverInverterLine = hasInverter
    ? (inverterPowerKw > 0 ? (formatKw(inverterPowerKw) + " кВт") : "—")
    : "—";
  const coverSubtitle = (offerPurpose || DEFAULT_OFFER_PURPOSE).trim() || DEFAULT_OFFER_PURPOSE;
  const generationProfileKey = GENERATION_CITY_TO_PROFILE[generationLocation] || "south";
  const selectedGenerationProfile = GENERATION_REGION_PROFILES[generationProfileKey] || GENERATION_REGION_PROFILES.south;
  const selectedMountConfig = GENERATION_MOUNT_TYPES[generationMountType] || GENERATION_MOUNT_TYPES.roof;
  const stationPowerKw = toNumber(calculations.stationPowerW, 0) / 1000;
  const annualGenerationKwh = Math.max(
    0,
    Math.round(stationPowerKw * toNumber(selectedGenerationProfile.annualYieldKwhPerKw, 1300) * toNumber(selectedMountConfig.multiplier, 1))
  );
  const monthLabels = ['Січ', 'Лют', 'Бер', 'Кві', 'Тра', 'Чер', 'Лип', 'Сер', 'Вер', 'Жов', 'Лис', 'Гру'];
  const monthFactors = Array.isArray(selectedGenerationProfile.monthFactors)
    ? selectedGenerationProfile.monthFactors
    : [0.045, 0.06, 0.09, 0.11, 0.125, 0.13, 0.135, 0.125, 0.095, 0.055, 0.02, 0.01];
  const monthFactorSum = monthFactors.reduce((acc, value) => acc + toNumber(value, 0), 0) || 1;
  const monthlyGeneration = monthFactors.map((f) => Math.round((annualGenerationKwh * toNumber(f, 0)) / monthFactorSum));
  const annualSavingsUah = hasSolar ? Math.max(0, annualGenerationKwh * toNumber(energyTariffUah, 0)) : 0;
  const paybackYears = annualSavingsUah > 0
    ? (toNumber(calculations.sums.finalTotalWithDiscountUah, 0) / annualSavingsUah)
    : 0;
  const autonomyHours = (batteryKwh > 0 && toNumber(typicalLoadKw, 0) > 0)
    ? (batteryKwh / toNumber(typicalLoadKw, 0))
    : 0;
  const normalizedCoverQrUrl = String(coverQrUrl || '').trim();
  const coverQrSrc = normalizedCoverQrUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=140x140&format=png&data=${encodeURIComponent(normalizedCoverQrUrl)}`
    : "";
  const orderBaseUsdForPercents = Math.max(0.000001, toNumber(calculations?.sums?.finalTotalWithDiscountUsd, 0));
  const pctOfOrder = (value) => ((toNumber(value, 0) / orderBaseUsdForPercents) * 100).toFixed(1);
  const isSidebarLayout = layoutMode === 'sidebar';
  const menuToggleSymbol = isSidebarLayout
    ? (menuCollapsed ? '▶' : '◀')
    : (menuCollapsed ? '▼' : '▲');
  const menuToggleTitle = menuCollapsed ? 'Розгорнути меню' : 'Згорнути меню';
  const MenuBtnLabel = ({ icon, label }) => (
    <span className="menu-btn-content">
      <span className="btn-icon" aria-hidden="true">{icon}</span>
      <span className="btn-label">{label}</span>
    </span>
  );

  const addManagerContact = () => {
    const name = String(newManagerName || '').trim();
    const phone = String(newManagerPhone || '').trim();
    if (!name || !phone) return;
    const nextManager = {
      id: `manager_${Date.now()}`,
      name,
      phone
    };
    setManagerContacts((prev) => [...prev, nextManager]);
    setSelectedManagerId(nextManager.id);
    setNewManagerName('');
    setNewManagerPhone('');
  };

  const activeManager = managerContacts.find((m) => m.id === selectedManagerId) || managerContacts[0] || null;
  const managerNameLabel = String(activeManager?.name || '').trim() || 'Менеджер';
  const managerPhoneLabel = String(activeManager?.phone || '').trim() || '—';
  const managerPhoneHref = `tel:${managerPhoneLabel.replace(/[^\d+]/g, '')}`;
  const OfferManagerBar = () => (
    <div className="offer-manager-bar">
      <span className="offer-manager-bar-kicker">Ваш менеджер</span>
      <span className="offer-manager-bar-name">{managerNameLabel}</span>
      <a className="offer-manager-bar-phone" href={managerPhoneHref}>{managerPhoneLabel}</a>
    </div>
  );

  const distributeTaxToGoods = () => {
    const taxAmount = toNumber(lockedDistributedTaxUsd, 0) > 0
      ? toNumber(lockedDistributedTaxUsd, 0)
      : toNumber(calculations.sums.taxesUsd, 0);
    if (taxAmount <= 0) {
      alert('Немає податку для розподілу.');
      return;
    }

    const eligible = [];
    const isAdvancedFop = taxMode === 'fop_advanced';
    Object.keys(calculations.groups || {}).forEach((groupKey) => {
      if (!isAdvancedFop && taxDistributionScope === 'nonMainGoods' && groupKey === 'Основне обладнання') return;
      if (isAdvancedFop && advancedFopBaseMode === 'groups' && !advancedFopSelectedGroups.includes(groupKey)) return;
      const isFixedGroup = (groupSettings[groupKey]?.mode || 'detailed') === 'fixed';
      if (isFixedGroup) {
        if (isAdvancedFop && advancedFopBaseMode === 'items') return;
        const qty = Math.max(1, toNumber(groupSettings[groupKey]?.quantity, 1));
        const groupSum = Math.max(0, toNumber(calculations.groupTotalsUsd?.[groupKey], 0));
        if (groupSum > 0) eligible.push({ kind: 'fixed', groupKey, qty, sum: groupSum });
        return;
      }
      const items = Array.isArray(calculations.groups[groupKey]) ? calculations.groups[groupKey] : [];
      items.forEach((item) => {
        if (isAdvancedFop && advancedFopBaseMode === 'items' && !advancedFopSelectedItems.includes(`${groupKey}::${item.id}`)) return;
        const qty = Math.max(0, toNumber(item.quantity, 0));
        const sumUsd = Math.max(0, toNumber(item.sumUsd, 0));
        const fallbackSumUsd = Math.max(0, toNumber(item.priceNormalizedUsd, toNumber(item.price, 0)) * qty);
        const effectiveSumUsd = sumUsd > 0 ? sumUsd : fallbackSumUsd;
        if (qty > 0 && effectiveSumUsd > 0) eligible.push({ kind: 'item', groupKey, id: item.id, qty, sum: effectiveSumUsd });
      });
    });

    const totalEligible = eligible.reduce((acc, x) => acc + x.sum, 0);
    if (totalEligible <= 0) {
      alert('Немає позицій для розкиду податку (перевірте ціни/кількість у неосновних блоках).');
      return;
    }

    const addMap = new Map();
    const fixedAddMap = new Map();
    const workAddMap = new Map();
    const logisticsAddMap = new Map();
    let installPercentAdd = 0;

    if (!isAdvancedFop && taxDistributionScope === 'goodsWorksLogistics') {
      if (installPercentOnlyUsd > 0) {
        eligible.push({ kind: 'installPercent', id: 'installPercent', qty: 1, sum: installPercentOnlyUsd });
      }
      (calculations.processedWorkItems || []).forEach((it) => {
        const qty = Math.max(0, toNumber(it.quantity, 0));
        const sum = Math.max(0, toNumber(it.sumUsd, 0));
        if (qty > 0 && sum > 0) eligible.push({ kind: 'work', id: it.id, qty, sum });
      });
      (calculations.processedOtherExpenses || []).forEach((it) => {
        const qty = Math.max(0, toNumber(it.quantity, 0));
        const sum = Math.max(0, toNumber(it.sumUsd, 0));
        if (qty > 0 && sum > 0) eligible.push({ kind: 'logistics', id: it.id, qty, sum });
      });
    }

    const fullEligibleTotal = eligible.reduce((acc, x) => acc + x.sum, 0);
    if (fullEligibleTotal <= 0) {
      alert('Немає позицій для розкиду податку (перевірте ціни/кількість).');
      return;
    }

    eligible.forEach((x) => {
      const add = taxAmount * (x.sum / fullEligibleTotal);
      if (x.kind === 'fixed') fixedAddMap.set(x.groupKey, add);
      else if (x.kind === 'work') workAddMap.set(x.id, add);
      else if (x.kind === 'logistics') logisticsAddMap.set(x.id, add);
      else if (x.kind === 'installPercent') installPercentAdd = add;
      else addMap.set(`${x.groupKey}__${x.id}`, add);
    });

    setEquipmentGroups((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((groupKey) => {
        next[groupKey] = (next[groupKey] || []).map((item) => {
          const previousPerUnitTax = toNumber(item.taxDistributedPerUnitUsd, 0);
          const basePrice = Math.max(0, toNumber(item.price, 0) - previousPerUnitTax);
          const add = addMap.get(`${groupKey}__${item.id}`) || 0;
          const qty = Math.max(1, toNumber(item.quantity, 1));
          const perUnitAdd = add > 0 ? (add / qty) : 0;
          const newPrice = basePrice + perUnitAdd;
          const incoming = toNumber(item.incomingPrice, 0);
          const newMarkup = incoming > 0 ? ((newPrice - incoming) / incoming) * 100 : toNumber(item.markupPercent, 0);
          return { ...item, priceBaseUsd: basePrice, price: newPrice, markupPercent: newMarkup, taxDistributedUsd: add, taxDistributedPerUnitUsd: perUnitAdd };
        });
      });
      return next;
    });

    setGroupSettings((prev) => {
      const next = { ...prev };
      fixedAddMap.forEach((add, groupKey) => {
        const current = next[groupKey] || {};
        const prevPerUnitTax = toNumber(current.taxDistributedPerUnitUsd, 0);
        const qty = Math.max(1, toNumber(current.quantity, 1));
        const basePrice = Math.max(0, toNumber(current.price, 0) - prevPerUnitTax);
        const perUnitAdd = add > 0 ? (add / qty) : 0;
        const newPrice = basePrice + perUnitAdd;
        const incoming = toNumber(current.incomingPrice, 0);
        const newMarkup = incoming > 0 ? ((newPrice - incoming) / incoming) * 100 : toNumber(current.markupPercent, 0);
        next[groupKey] = { ...current, priceBaseUsd: basePrice, price: newPrice, markupPercent: newMarkup, taxDistributedUsd: add, taxDistributedPerUnitUsd: perUnitAdd };
      });
      return next;
    });

    if (taxDistributionScope === 'goodsWorksLogistics') {
      setInstallPercentTaxUsd(Math.max(0, installPercentAdd));
      setWorkItems((prev) => (prev || []).map((it) => {
        const prevPerUnitTax = toNumber(it.taxDistributedPerUnitUsd, 0);
        const basePrice = Math.max(0, toNumber(it.price, 0) - prevPerUnitTax);
        const add = workAddMap.get(it.id) || 0;
        const qty = Math.max(1, toNumber(it.quantity, 1));
        const perUnitAdd = add > 0 ? add / qty : 0;
        const newPrice = basePrice + perUnitAdd;
        const incoming = toNumber(it.incomingPrice, 0);
        const newMarkup = incoming > 0 ? ((newPrice - incoming) / incoming) * 100 : toNumber(it.markupPercent, 0);
        return { ...it, priceBaseUsd: basePrice, price: newPrice, markupPercent: newMarkup, taxDistributedUsd: add, taxDistributedPerUnitUsd: perUnitAdd };
      }));
      setOtherExpenses((prev) => (prev || []).map((it) => {
        const prevPerUnitTax = toNumber(it.taxDistributedPerUnitUsd, 0);
        const basePrice = Math.max(0, toNumber(it.price, 0) - prevPerUnitTax);
        const add = logisticsAddMap.get(it.id) || 0;
        const qty = Math.max(1, toNumber(it.quantity, 1));
        const perUnitAdd = add > 0 ? add / qty : 0;
        const newPrice = basePrice + perUnitAdd;
        const incoming = toNumber(it.incomingPrice, 0);
        const newMarkup = incoming > 0 ? ((newPrice - incoming) / incoming) * 100 : toNumber(it.markupPercent, 0);
        return { ...it, priceBaseUsd: basePrice, price: newPrice, markupPercent: newMarkup, taxDistributedUsd: add, taxDistributedPerUnitUsd: perUnitAdd };
      }));
    } else {
      setInstallPercentTaxUsd(0);
    }
    if (toNumber(lockedDistributedTaxUsd, 0) <= 0) setLockedDistributedTaxUsd(taxAmount);
    setTaxDistributionApplied(true);

    if (taxMode === 'fop_advanced') {
      const modeLabel =
        advancedFopBaseMode === 'items' ? 'обраних товарах' :
        advancedFopBaseMode === 'groups' ? 'обраних групах' :
        'всьому товарі';
      alert(`Податок розкинуто по ${modeLabel}.`);
    } else {
      alert('Податок розкинуто по товарах.');
    }
  };

  const rollbackDistributedTax = () => {
    setEquipmentGroups((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((groupKey) => {
        next[groupKey] = (next[groupKey] || []).map((item) => {
          const distributedPerUnit = toNumber(item.taxDistributedPerUnitUsd, 0);
          if (distributedPerUnit <= 0) return { ...item, priceBaseUsd: undefined };
          const restoredPrice = Math.max(0, toNumber(item.price, 0) - distributedPerUnit);
          const incoming = toNumber(item.incomingPrice, 0);
          const restoredMarkup = incoming > 0 ? ((restoredPrice - incoming) / incoming) * 100 : toNumber(item.markupPercent, 0);
          return {
            ...item,
            price: restoredPrice,
            priceBaseUsd: restoredPrice,
            markupPercent: restoredMarkup,
            taxDistributedUsd: 0,
            taxDistributedPerUnitUsd: 0
          };
        });
      });
      return next;
    });
    setGroupSettings((prev) => {
      const next = { ...prev };
      Object.keys(next).forEach((groupKey) => {
        const current = next[groupKey] || {};
        const perUnit = toNumber(current.taxDistributedPerUnitUsd, 0);
        if (perUnit <= 0) return;
        const restoredPrice = Math.max(0, toNumber(current.price, 0) - perUnit);
        const incoming = toNumber(current.incomingPrice, 0);
        const restoredMarkup = incoming > 0 ? ((restoredPrice - incoming) / incoming) * 100 : toNumber(current.markupPercent, 0);
        next[groupKey] = { ...current, price: restoredPrice, priceBaseUsd: restoredPrice, markupPercent: restoredMarkup, taxDistributedUsd: 0, taxDistributedPerUnitUsd: 0 };
      });
      return next;
    });
    setWorkItems((prev) => (prev || []).map((it) => {
      const perUnit = toNumber(it.taxDistributedPerUnitUsd, 0);
      if (perUnit <= 0) return { ...it, priceBaseUsd: undefined };
      const restoredPrice = Math.max(0, toNumber(it.price, 0) - perUnit);
      const incoming = toNumber(it.incomingPrice, 0);
      const restoredMarkup = incoming > 0 ? ((restoredPrice - incoming) / incoming) * 100 : toNumber(it.markupPercent, 0);
      return { ...it, price: restoredPrice, priceBaseUsd: restoredPrice, markupPercent: restoredMarkup, taxDistributedUsd: 0, taxDistributedPerUnitUsd: 0 };
    }));
    setOtherExpenses((prev) => (prev || []).map((it) => {
      const perUnit = toNumber(it.taxDistributedPerUnitUsd, 0);
      if (perUnit <= 0) return { ...it, priceBaseUsd: undefined };
      const restoredPrice = Math.max(0, toNumber(it.price, 0) - perUnit);
      const incoming = toNumber(it.incomingPrice, 0);
      const restoredMarkup = incoming > 0 ? ((restoredPrice - incoming) / incoming) * 100 : toNumber(it.markupPercent, 0);
      return { ...it, price: restoredPrice, priceBaseUsd: restoredPrice, markupPercent: restoredMarkup, taxDistributedUsd: 0, taxDistributedPerUnitUsd: 0 };
    }));
    setInstallPercentTaxUsd(0);
    setLockedDistributedTaxUsd(null);
    setTaxDistributionApplied(false);
    alert('Розкид податку скасовано.');
  };

  const getDistributedTaxByGroup = (groupKey) => {
    const rowTax = (equipmentGroups[groupKey] || []).reduce((acc, item) => acc + Math.max(0, toNumber(item.taxDistributedUsd, 0)), 0);
    const fixedTax = Math.max(0, toNumber(groupSettings[groupKey]?.taxDistributedUsd, 0));
    return rowTax + fixedTax;
  };

  const resetTaxDistributionState = () => {
    setTaxDistributionApplied(false);
    setLockedDistributedTaxUsd(null);
  };
  const safeEvalQuickCalc = (expr) => {
    const normalized = String(expr || '').replace(',', '.').replace(/\s+/g, '');
    if (!normalized) return '0';
    if (!/^[\d+\-*/().]+$/.test(normalized)) return 'Помилка';
    try {
      const value = Function(`"use strict"; return (${normalized});`)();
      if (!Number.isFinite(value)) return 'Помилка';
      return String(Math.round(value * 1000000) / 1000000);
    } catch (e) {
      return 'Помилка';
    }
  };
  const quickCalcAppend = (token) => {
    const next = `${quickCalcExpr}${token}`;
    setQuickCalcExpr(next);
    setQuickCalcResult(safeEvalQuickCalc(next));
  };
  const quickCalcClearAll = () => {
    setQuickCalcExpr('');
    setQuickCalcResult('0');
  };
  useEffect(() => {
    if (!showQuickCalc) return;
    const onKeyDown = (e) => {
      const k = e.key;
      if (/^[0-9]$/.test(k) || ['+', '-', '*', '/', '(', ')', '.'].includes(k)) {
        e.preventDefault();
        quickCalcAppend(k);
        return;
      }
      if (k === ',') {
        e.preventDefault();
        quickCalcAppend('.');
        return;
      }
      if (k === 'Backspace') {
        e.preventDefault();
        const next = quickCalcExpr.slice(0, -1);
        setQuickCalcExpr(next);
        setQuickCalcResult(safeEvalQuickCalc(next));
        return;
      }
      if (k === 'Escape') {
        e.preventDefault();
        quickCalcClearAll();
        return;
      }
      if (k === 'Enter' || k === '=') {
        e.preventDefault();
        setQuickCalcResult(safeEvalQuickCalc(quickCalcExpr));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showQuickCalc, quickCalcExpr]);

  return (
    <div className={`container ${clientMode ? 'client-mode' : ''} ${layoutMode === 'sidebar' ? 'layout-sidebar' : 'layout-classic'} ${menuCollapsed ? 'menu-collapsed' : ''}`}>
      {Object.keys(productDatabase).map(cat => (
        <datalist key={cat} id={`db-${cat.replace(/\s+/g, '-')}`}>
          {productDatabase[cat].map(p => <option key={p} value={p} />)}
        </datalist>
      ))}

      <div className="top-shell card">
        <div className="top-shell-main">
          <div className="top-meta">
            {isSidebarLayout && <div className="sidebar-badge">Solar CRM</div>}
            <h1>Калькулятор СЕС v4.6</h1>
            <div style={{fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
              Тип поточного проєкту: <strong style={{color: 'var(--accent-yellow)'}}>{PROJECT_TYPES[projectType] || PROJECT_TYPES.commercial}</strong>
            </div>
          </div>

          <div className={`top-export ${isSidebarLayout ? 'sidebar-menu-group' : ''}`}>
            <button
              type="button"
              className="secondary menu-toggle-btn menu-action-btn"
              data-cat="toggle"
              style={{background: menuCollapsed ? '#0f766e' : '#475569'}}
              onClick={() => setMenuCollapsed(prev => !prev)}
              data-title={menuToggleTitle}
              aria-label={menuToggleTitle}
            >
              <span className="menu-toggle-arrow">{menuToggleSymbol}</span>
            </button>
            {isSidebarLayout && <div className="sidebar-menu-title">Вигляд та експорт</div>}
            <select
              className="secondary theme-toggle-btn"
              style={{width: '180px', padding: '0.8rem 1rem', background: uiTheme === 'dark' ? '#334155' : uiTheme === 'light' ? '#cbd5e1' : '#9ca3af'}}
              value={uiTheme}
              onChange={(e) => setUiTheme(e.target.value)}
              data-title="Тема оформлення"
            >
              <option value="dark">Темна тема</option>
              <option value="light">Світла тема</option>
              <option value="gray">Сіра тема</option>
            </select>
            <select
              className="secondary theme-toggle-btn"
              style={{width: '170px', padding: '0.8rem 1rem', background: layoutMode === 'sidebar' ? '#0f766e' : '#334155'}}
              value={layoutMode}
              onChange={(e) => setLayoutMode(e.target.value)}
              data-title="Режим меню"
            >
              <option value="classic">Класичний</option>
              <option value="sidebar">Бокове меню</option>
            </select>
            <button type="button" className="secondary menu-action-btn" data-cat="export" style={{background: "#059669"}} onClick={() => exportToExcel("offer", "summary")} data-title="Excel (зведено)"><MenuBtnLabel icon="📊" label="Excel (зведено)" /></button>
            <button type="button" className="secondary menu-action-btn" data-cat="export" style={{background: "#0f766e"}} onClick={() => exportToExcel("offer", "full")} data-title="Excel (повна)"><MenuBtnLabel icon="📗" label="Excel (повна)" /></button>
            <button type="button" className="secondary menu-action-btn" data-cat="print" style={{background: '#7c3aed'}} onClick={() => setPrintMode('offer')} data-title="КП"><MenuBtnLabel icon="📄" label="КП" /></button>
            <button type="button" className="secondary menu-action-btn" data-cat="print" style={{background: '#3b82f6'}} onClick={() => setPrintMode('invoice')} data-title="Накладна"><MenuBtnLabel icon="🧾" label="Накладна" /></button>
          </div>
        </div>

        <div className="action-grid">
          <div className={`action-group ${isSidebarLayout ? 'sidebar-menu-group' : ''}`}>
            <div className="action-group-title">{isSidebarLayout ? '📁 Проєкт' : 'Проєкт'}</div>
            <div className="controls-row">
              <button type="button" className="secondary menu-action-btn" data-cat="project" style={{background: workspaceHandle ? '#059669' : '#4b5563'}} onClick={pickWorkspace} data-title={workspaceHandle ? `Папка: ${workspaceHandle.name || 'обрано'}` : 'Обрати робочу папку'}>
                <MenuBtnLabel icon="📁" label={workspaceHandle ? `Папка: ${workspaceHandle.name || 'обрано'}` : 'Обрати робочу папку'} />
              </button>
              {workspacePinned && (
                <button type="button" className="danger menu-action-btn" data-cat="danger" onClick={unpinWorkspace} data-title="Відв'язати папку"><MenuBtnLabel icon="🔓" label="Відв'язати папку" /></button>
              )}
              <div className={`flex flex-col gap-1 ${menuCollapsed ? 'hidden' : ''}`} style={{minWidth: isSidebarLayout && !menuCollapsed ? '250px' : '0'}}>
                <input type="text" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Назва проєкту..." className="project-name-input" style={{width: '100%'}} />
              </div>
              <button type="button" className="secondary light-surface-btn menu-action-btn" data-cat="project" onClick={saveProject} data-title="Зберегти проєкт"><MenuBtnLabel icon="💾" label="Зберегти проєкт" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="project" style={{background: '#374151'}} onClick={openProjectPicker} data-title="Відкрити проєкт"><MenuBtnLabel icon="📂" label="Відкрити проєкт" /></button>
              <input id="project-file-input" type="file" accept=".calkproj,.json,.solar.json" onChange={openProjectFromFile} style={{display: 'none'}} />
              <button type="button" className="secondary menu-action-btn" data-cat="new" style={{background: '#0f766e'}} onClick={() => setShowNewProjectDialog(true)} data-title="Новий проєкт"><MenuBtnLabel icon="🆕" label="Новий проєкт" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="mode" style={{background: clientMode ? '#b45309' : '#1f2937'}} onClick={() => setClientMode(prev => !prev)} data-title={clientMode ? 'Режим менеджера' : 'Клієнтський режим'}>
                <MenuBtnLabel icon={clientMode ? "🛠️" : "👤"} label={clientMode ? 'Режим менеджера' : 'Клієнтський режим'} />
              </button>
            </div>
          </div>

          <div className={`action-group ${isSidebarLayout ? 'sidebar-menu-group' : ''}`}>
            <div className="action-group-title">{isSidebarLayout ? '🧩 Шаблони' : 'Шаблони'}</div>
            <div className="controls-row">
              <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)} placeholder="Назва шаблону..." className="project-name-input" />
              <button type="button" className="secondary menu-action-btn" data-cat="template" style={{background: '#4b5563'}} onClick={saveTemplate} data-title="Зберегти шаблон"><MenuBtnLabel icon="💾" label="Зберегти шаблон" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="template" style={{background: '#2563eb'}} onClick={saveTemplateAsNew} data-title="Зберегти як новий"><MenuBtnLabel icon="🆕" label="Зберегти як" /></button>
              <select className="secondary template-select" onChange={(e) => loadTemplate(e.target.value)} value={selectedTemplateId}>
                <option value="" disabled>Завантажити шаблон...</option>
                {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
              <button type="button" className="danger menu-action-btn" data-cat="danger" disabled={!selectedTemplateId} onClick={() => deleteTemplate(selectedTemplateId)} data-title="Видалити шаблон"><MenuBtnLabel icon="🗑️" label="Видалити шаблон" /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="layout-main">
      <div className="card grid grid-cols-2">
        <div className="input-group">
          <label>ПІБ Клієнта</label>
          <input type="text" value={clientInfo.name} onChange={(e) => setClientInfo({...clientInfo, name: e.target.value})} placeholder="Введіть ПІБ замовника..." />
        </div>
        <div className="input-group">
          <label>Адреса об'єкта</label>
          <input type="text" value={clientInfo.address} onChange={(e) => setClientInfo({...clientInfo, address: e.target.value})} placeholder="Введіть адресу встановлення..." />
        </div>
      </div>

      <div className="card" style={{marginTop: '-0.25rem'}}>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: offerSettingsCollapsed ? 0 : '0.75rem'}}>
          <div style={{fontWeight: 800, color: 'var(--text-muted)', letterSpacing: '0.02em'}}>Налаштування КП</div>
          <button
            type="button"
            className="secondary"
            style={{background: '#334155', padding: '0.45rem 0.8rem'}}
            onClick={() => setOfferSettingsCollapsed((prev) => !prev)}
          >
            {offerSettingsCollapsed ? '▾ Розгорнути' : '▴ Згорнути'}
          </button>
        </div>
        {!offerSettingsCollapsed && (
        <div className="grid grid-cols-4" style={{gap: '0.75rem'}}>
        <div className="input-group" style={{margin: 0}}>
          <label>Підзаголовок КП</label>
          <input type="text" value={offerPurpose} onChange={(e) => setOfferPurpose(e.target.value)} placeholder="для власних потреб / для підприємства / ..." />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Назва системи для КП</label>
          <input type="text" value={coverSystemName} onChange={(e) => setCoverSystemName(e.target.value)} placeholder={coverSystemNameAuto} />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Тип титульної сторінки</label>
          <select value={coverPageType} onChange={(e) => setCoverPageType(e.target.value)}>
            <option value="">Пусто</option>
            {COVER_PAGE_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Окремий лист у КП</label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '38px', paddingTop: 0}}>
            <input
              type="checkbox"
              checked={showOfferStationSheet}
              onChange={(e) => setShowOfferStationSheet(e.target.checked)}
            />
            <span>Додати “Дані станції”</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '28px', paddingTop: '0.45rem'}}>
            <input
              type="checkbox"
              checked={includeManagerInOffer}
              onChange={(e) => setIncludeManagerInOffer(!!e.target.checked)}
            />
            <span>Додавати дані менеджера</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '28px'}}>
            <input
              type="checkbox"
              checked={includeClientInOffer}
              onChange={(e) => setIncludeClientInOffer(!!e.target.checked)}
            />
            <span>Додавати дані замовника</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '28px'}}>
            <input
              type="checkbox"
              checked={includeAddressInOffer}
              onChange={(e) => setIncludeAddressInOffer(!!e.target.checked)}
            />
            <span>Додавати адресу об'єкта</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', minHeight: '28px'}}>
            <span>Валюта в КП/накладній:</span>
            <select value={printCurrencyMode} onChange={(e) => setPrintCurrencyMode(e.target.value)} style={{maxWidth: '190px'}}>
              <option value="both">USD + грн (як зараз)</option>
              <option value="usd">Тільки USD</option>
              <option value="uah">Тільки грн</option>
            </select>
          </label>
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Локація генерації</label>
          <select value={generationLocation} onChange={(e) => setGenerationLocation(e.target.value)}>
            {GENERATION_LOCATIONS.map((location) => (
              <option key={location} value={location}>{location}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Тип встановлення</label>
          <select value={generationMountType} onChange={(e) => setGenerationMountType(e.target.value)}>
            {Object.entries(GENERATION_MOUNT_TYPES).map(([value, cfg]) => (
              <option key={value} value={value}>{cfg.label}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Тариф, грн/кВт·год</label>
          <input type="number" step="0.01" value={energyTariffUah} onChange={(e) => setEnergyTariffUah(parseNumberInput(e.target.value))} />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Типове навантаження, кВт</label>
          <input type="number" step="0.1" value={typicalLoadKw} onChange={(e) => setTypicalLoadKw(parseNumberInput(e.target.value))} />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>QR посилання (сайт/менеджер)</label>
          <input type="text" value={coverQrUrl} onChange={(e) => setCoverQrUrl(e.target.value)} placeholder={DEFAULT_QR_URL} />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Менеджер у КП</label>
          <select value={selectedManagerId} onChange={(e) => setSelectedManagerId(e.target.value)}>
            {managerContacts.map((m) => (
              <option key={m.id} value={m.id}>{m.name} · {m.phone}</option>
            ))}
          </select>
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Новий менеджер (ПІБ)</label>
          <input type="text" value={newManagerName} onChange={(e) => setNewManagerName(e.target.value)} placeholder="Напр. Олег Мінаков" />
        </div>
        <div className="input-group" style={{margin: 0}}>
          <label>Телефон менеджера</label>
          <input type="text" value={newManagerPhone} onChange={(e) => setNewManagerPhone(e.target.value)} placeholder="+380..." />
        </div>
        <div className="input-group" style={{margin: 0, display: 'flex', alignItems: 'flex-end'}}>
          <button type="button" className="secondary" style={{width: '100%', background: '#0f766e'}} onClick={addManagerContact}>
            + Додати менеджера
          </button>
        </div>
        </div>
        )}
      </div>

      <div className="card grid grid-cols-4">
        <div className="input-group">
          <label>Курс USD (грн)</label>
          <input type="number" step="0.01" value={rates.usd} onChange={(e) => setRates({...rates, usd: parseNumberInput(e.target.value)})} />
        </div>
        <div className="input-group">
          <label>Курс EUR (грн)</label>
          <input type="number" step="0.01" value={rates.eur} onChange={(e) => setRates({...rates, eur: parseNumberInput(e.target.value)})} />
        </div>
        <div style={{width: '1px', height: '30px', background: 'var(--border-color)', margin: '0 0.5rem'}}></div>
        <div className="input-group" style={{margin: 0}}>
          <label style={{fontSize: '0.75rem', marginBottom: '0.2rem', color: 'var(--text-muted)'}}>Загальна потужність (Вт)</label>
          <div style={{fontSize: '1.5rem', fontWeight: '900', color: 'var(--accent-yellow)'}}>{calculations.stationPowerW.toFixed(0)}</div>
        </div>
      </div>

      <div className="card table-container aux-table-container" style={{padding: '0'}}>
        <div style={{padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center'}}>
          {offerSheetsForUi.map((sheet) => {
            const active = !showOfferComparisonSheet && String(activeOfferSheetId) === String(sheet.id);
            return (
              <div key={sheet.id} style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                {String(editingOfferSheetId) === String(sheet.id) ? (
                  <input
                    type="text"
                    autoFocus
                    defaultValue={sheet.name || 'КП'}
                    onBlur={(e) => { renameOfferSheet(sheet.id, e.target.value); setEditingOfferSheetId(''); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { renameOfferSheet(sheet.id, e.currentTarget.value); setEditingOfferSheetId(''); }
                      if (e.key === 'Escape') setEditingOfferSheetId('');
                    }}
                    style={{width: '130px', padding: '0.35rem 0.5rem'}}
                  />
                ) : (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => switchOfferSheet(sheet.id)}
                    onDoubleClick={() => setEditingOfferSheetId(String(sheet.id))}
                    style={{background: active ? '#0f766e' : '#1d4e89', padding: '0.35rem 0.7rem', fontWeight: 700}}
                    title="Подвійний клік для перейменування"
                  >
                    {sheet.name || 'КП'}
                  </button>
                )}
                {offerSheetsForUi.length > 1 && (
                  <button
                    type="button"
                    className="danger"
                    onClick={() => removeOfferSheet(sheet.id)}
                    style={{padding: '0.25rem 0.45rem', minWidth: 'auto'}}
                    title="Видалити лист КП"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })}
          <button type="button" className="secondary" onClick={addOfferSheet} style={{background: '#0284c7', padding: '0.35rem 0.75rem'}}>
            + КП
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              persistCurrentSheetState();
              setShowOfferComparisonSheet(true);
            }}
            style={{background: showOfferComparisonSheet ? '#f59e0b' : '#1d4e89', padding: '0.35rem 0.75rem', fontWeight: 700}}
          >
            Порівняльний лист
          </button>
        </div>
        {!showOfferComparisonSheet && projectType !== 'product' && (
          <div className="flex justify-between items-center" style={{padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-color)', gap: '0.75rem', flexWrap: 'wrap'}}>
            <div style={{fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem'}}>Категорії</div>
            <div className="flex items-center" style={{gap: '0.5rem', flexWrap: 'wrap'}}>
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomCategory(); }}
                placeholder="Нова категорія..."
                style={{width: '230px', padding: '0.45rem'}}
              />
              <button type="button" className="secondary" style={{background: '#0f766e'}} onClick={addCustomCategory}>+ Додати категорію</button>
            </div>
          </div>
        )}
        {showOfferComparisonSheet ? (
          <div style={{padding: '0.9rem'}}>
            <h3 style={{margin: '0 0 0.8rem 0'}}>Порівняльний лист КП</h3>
            <table>
              <thead>
                <tr>
                  <th>Лист КП</th>
                  <th className="text-right">Обладнання, $</th>
                  <th className="text-right">Роботи, $</th>
                  <th className="text-right">Дод. витрати, $</th>
                  <th className="text-right">Разом, $</th>
                  <th className="text-right">Разом, грн</th>
                  <th className="text-right">Маржа брудна, $</th>
                  <th className="text-right">Податки, $</th>
                  <th className="text-right">Маржа після под., $</th>
                  <th className="text-right">Маржа менеджера, $</th>
                  <th className="text-right">Маржа чиста, $</th>
                </tr>
              </thead>
              <tbody>
                {offerComparisonRows.map((row) => (
                  <tr key={`cmp-${row.id}`}>
                    <td style={{fontWeight: 700}}>{row.name}</td>
                    <td className="text-right">${formatMoney(row.materialsSumUsd)}</td>
                    <td className="text-right">${formatMoney(row.worksTotalUsd)}</td>
                    <td className="text-right">${formatMoney(row.otherCostsUsd)}</td>
                    <td className="text-right">${formatMoney(row.finalTotalWithDiscountUsd)}</td>
                    <td className="text-right">₴{formatMoney(row.finalTotalWithDiscountUah)}</td>
                    <td className="text-right">${formatMoney(row.grossMarginBeforeTaxesUsd)}</td>
                    <td className="text-right">${formatMoney(row.taxesUsd)}</td>
                    <td className="text-right">${formatMoney(row.marginAfterTaxUsd)}</td>
                    <td className="text-right">${formatMoney(row.managerCommissionAfterTaxesUsd)}</td>
                    <td className="text-right">${formatMoney(row.netProfitUsd)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
        <table>
          {(() => {
            const allSections = ["Основне обладнання", "ЗАХИСТ", "Кріплення", "Кабельна продукція", "Заземлення", "Інші групи"];
            if (projectType === 'product') {
              return ["Основне обладнання"];
            }
            return allSections;
          })().map(sectionKey => {
            if (sectionKey === "ЗАХИСТ") {
              // Dynamically find all groups that belong to the Protection section
              // This includes the default ones and any custom ones the user might have named starting with "Захист"
              const sectionGroups = Object.keys(calculations.groups).filter(gk => gk.startsWith("Захист") && gk !== "Захист");
              if (sectionGroups.length === 0) return null;
              const hasExpandedProtection = sectionGroups.some(gk => (groupSettings[gk]?.mode || 'fixed') === 'detailed');

              const totalSectionSumUsd = sectionGroups.reduce((acc, gk) => acc + (calculations.groupTotalsUsd[gk] || 0), 0);
              const totalSectionSumUah = sectionGroups.reduce((acc, gk) => acc + (calculations.groupTotalsUah[gk] || 0), 0);
              const totalSectionCostUsd = sectionGroups.reduce((acc, gk) => acc + (calculations.groupCostTotalsUsd[gk] || 0), 0);

              return (
                <tbody key="ProtectionBlock">
                  <tr>
                    <td colSpan="12" className="group-header">
                      <div className="flex justify-between items-center">
                        <span>ЗАХИСТ</span>
                        <div className="flex items-center" style={{gap: "0.5rem", flexWrap: "wrap", justifyContent: "flex-end"}}>
                          <select
                            className="secondary"
                            style={{width: "150px", padding: "0.45rem"}}
                            value={newProtectionType}
                            onChange={(e) => setNewProtectionType(e.target.value)}
                          >
                            {PROTECTION_GROUP_CHOICES.map(typeName => <option key={typeName} value={typeName}>{typeName}</option>)}
                          </select>
                          {newProtectionType === "Інше" && (
                            <input
                              type="text"
                              value={newProtectionCustomName}
                              onChange={(e) => setNewProtectionCustomName(e.target.value)}
                              placeholder="Свій тип захисту"
                              style={{width: "180px", padding: "0.45rem"}}
                            />
                          )}
                          <button type="button" className="secondary" onClick={addProtectionSubgroup}>+ Додати тип захисту</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr style={{backgroundColor: '#1E1E1E'}}>
                    <th className="col-name text-left">Номенклатура та тип</th>
                    <th className="col-unit text-left">Од.</th>
                    <th className="col-qty text-right">Кіл-ть</th>
                    <th className="col-currency text-center">Вал.</th>
                    <th className="col-price text-right">Ціна ($/п)</th>
                    <th className="col-price text-right">Ціна (₴)</th>
                    <th className="col-readonly text-right">Сума ($)</th>
                    <th className="col-readonly text-right">Сума (₴)</th>
                    <th className="col-price text-right internal-only">Собів. ($)</th>
                    <th className="col-markup text-right">Націнка %</th>
                    <th className="col-readonly text-yellow text-right">Маржа ($)</th>
                    <th style={{width: '50px'}}></th>
                  </tr>
                  {sectionGroups.map(gk => {
                    const mode = groupSettings[gk]?.mode || 'fixed';
                    const items = calculations.groups[gk];
                    const subTotalUsd = calculations.groupTotalsUsd[gk];
                    const subTotalUah = calculations.groupTotalsUah[gk];
                    const settings = groupSettings[gk] || {};

                    return (
                      <React.Fragment key={gk}>
                        <tr className={`subgroup-row subgroup-main-row ${(mode === 'detailed' || hasExpandedProtection) ? 'subgroup-main-row-open' : ''}`}>
                          <td className="col-name">
                            <div className="equipment-cell">
                              <div className="flex items-center" style={{gap: '0.5rem', flexWrap: 'wrap'}}>
                                <input 
                                  type="text" 
                                  className="equipment-name-input" 
                                  style={{fontWeight: '700', color: mode === 'detailed' ? 'var(--accent-yellow)' : '#fff', height: 'auto', minHeight: '34px'}}
                                  value={mode === 'detailed' ? gk : settings.name} 
                                  onChange={(e) => updateGroupSetting(gk, 'name', e.target.value)} 
                                  placeholder="Назва / Модель" 
                                  readOnly={mode === 'detailed'}
                                />
                                <button type="button" className="secondary" style={{padding: '0.3rem 0.6rem', fontSize: '0.75rem', whiteSpace: 'nowrap', background: mode === 'detailed' ? '#4b5563' : '#3b82f6'}} onClick={() => toggleGroupMode(gk)}>
                                   {mode === 'detailed' ? 'Згорнути' : 'Розширена специфікація'}
                                </button>
                                <div className="flex items-center" style={{gap: '0.35rem'}}>
                                  <input
                                    type="number"
                                    className="text-right"
                                    value={groupSettings[gk]?.categoryMarkupPercent ?? 0}
                                    onChange={(e) => updateGroupSetting(gk, 'categoryMarkupPercent', parseNumberInput(e.target.value))}
                                    style={{width: '76px'}}
                                  />
                                  <button type="button" className="secondary" style={{padding: '0.3rem 0.55rem', fontSize: '0.75rem'}} onClick={() => applyCategoryMarkup(gk)}>Націнка кат.</button>
                                </div>
                              </div>
                              {gk === "Захист PV" && mode === 'detailed' && (
                                <div className="flex items-center" style={{gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap'}}>
                                  <span style={{fontSize: '0.78rem', color: 'var(--text-muted)'}}>Шаблон PV:</span>
                                  <select
                                    value={settings.pvTemplateType || "Стандарт"}
                                    onChange={(e) => updateGroupSetting(gk, 'pvTemplateType', e.target.value)}
                                    style={{width: '120px', padding: '0.35rem'}}
                                  >
                                    {PV_TEMPLATE_TYPES.map(typeName => <option key={typeName} value={typeName}>{typeName}</option>)}
                                  </select>
                                  <span style={{fontSize: '0.78rem', color: 'var(--text-muted)'}}>Стрінгів</span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={settings.pvTemplateStrings ?? 1}
                                    onChange={(e) => {
                                      const nextStrings = parseNumberInput(e.target.value);
                                      updateGroupSetting(gk, 'pvTemplateStrings', nextStrings);
                                      applyPvProtectionTemplate(nextStrings);
                                    }}
                                    style={{width: '78px', padding: '0.35rem'}}
                                  />
                                  <span style={{fontSize: '0.78rem', color: 'var(--text-muted)'}}>м/стрінг</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={settings.pvCableMetersPerString ?? 150}
                                    onChange={(e) => updateGroupSetting(gk, 'pvCableMetersPerString', parseNumberInput(e.target.value))}
                                    style={{width: '90px', padding: '0.35rem'}}
                                  />
                                  <label className="flex items-center" style={{gap: '0.35rem', fontSize: '0.78rem', color: 'var(--text-muted)'}}>
                                    <input
                                      type="checkbox"
                                      checked={settings.pvAutoCableQuantity !== false}
                                      onChange={(e) => updateGroupSetting(gk, 'pvAutoCableQuantity', e.target.checked)}
                                    />
                                    Авто кабель
                                  </label>
                                  <button
                                    type="button"
                                    className="secondary"
                                    style={{padding: '0.35rem 0.65rem', fontSize: '0.75rem', background: '#0f766e'}}
                                    onClick={() => applyPvProtectionTemplate(settings.pvTemplateStrings)}
                                  >
                                    Застосувати шаблон
                                  </button>
                                </div>
                              )}
                              {toNumber(settings.taxDistributedUsd, 0) > 0 && (
                                <div style={{marginTop: '0.35rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                                  + Податок: ${formatMoney(settings.taxDistributedUsd)} (по ${formatMoney(settings.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(settings.priceBaseUsd ?? (toNumber(settings.price, 0) - toNumber(settings.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(settings.price)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <select value={settings.unit} onChange={(e) => updateGroupSetting(gk, 'unit', e.target.value)} disabled={mode === 'detailed'}>
                              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                            </select>
                          </td>
                          <td>
                            <input type="number" className="text-right" value={settings.quantity} onChange={(e) => updateGroupSetting(gk, 'quantity', parseNumberInput(e.target.value))} disabled={mode === 'detailed'} />
                          </td>
                          <td className="col-currency">
                             <select value={settings.currency} onChange={(e) => updateGroupSetting(gk, 'currency', e.target.value)} style={{padding: '0.4rem'}} disabled={mode === 'detailed'}>
                              <option value="USD">$</option><option value="EUR">€</option><option value="UAH">₴</option>
                            </select>
                          </td>
                          <td>
                            <input type="number" className="text-right" value={mode === 'detailed' ? (subTotalUsd / (settings.quantity || 1)) : settings.price} onChange={(e) => updateGroupSetting(gk, 'price', parseNumberInput(e.target.value))} readOnly={mode === 'detailed'} style={mode === 'detailed' ? {background: 'transparent', border: 'none', fontWeight: 'bold'} : {}} />
                          </td>
                          <td className="text-right font-bold col-readonly">{formatMoney(subTotalUah / (settings.quantity || 1))}</td>
                          <td className="text-right font-bold text-blue">${formatMoney(subTotalUsd)}</td>
                          <td className="text-right font-bold text-blue">₴{formatMoney(subTotalUah)}</td>
                          <td>
                            <input type="number" className="text-right" value={mode === 'detailed' ? items.reduce((acc, it) => acc + it.costUsd, 0) : settings.incomingPrice} onChange={(e) => updateGroupSetting(gk, 'incomingPrice', parseNumberInput(e.target.value))} readOnly={mode === 'detailed'} style={mode === 'detailed' ? {background: 'transparent', border: 'none'} : {}} />
                          </td>
                          <td className="text-right font-bold">
                            <input type="number" className="text-right" value={mode === 'detailed' ? (items.reduce((acc, it) => acc + it.costUsd, 0) > 0 ? Math.round(((subTotalUsd - items.reduce((acc, it) => acc + it.costUsd, 0)) / items.reduce((acc, it) => acc + it.costUsd, 0)) * 1000) / 10 : 0) : roundMarkupForInput(settings.markupPercent)} onChange={(e) => updateGroupSetting(gk, 'markupPercent', parseNumberInput(e.target.value))} readOnly={mode === 'detailed'} style={mode === 'detailed' ? {background: 'transparent', border: 'none'} : {}} />
                          </td>
                          <td className="text-right text-yellow font-bold">${formatMoney(mode === 'detailed' ? (subTotalUsd - items.reduce((acc, it) => acc + (it.costUsd || 0), 0)) : (subTotalUsd - (settings.incomingPrice || 0) * (settings.quantity || 1)))}</td>
                          <td className="text-center">
                            <div className="flex items-center justify-center gap-1">
                               <button type="button" className="secondary" style={{padding: '0.2rem 0.5rem', fontSize: '1rem', background: '#059669', minWidth: '30px'}} onClick={() => addRowWithExpand(gk)}>+</button>
                               <button type="button" className="danger" style={{padding: '0.2rem 0.5rem', fontSize: '1rem', minWidth: '30px'}} onClick={() => removeGroup(gk)}>✕</button>
                            </div>
                          </td>
                        </tr>
                        {mode === 'detailed' && items.map(item => (
                          <tr key={item.id}>
                            <td className="col-name indent-cell">
                              <div className="equipment-cell" style={{position: 'relative', width: '100%'}}>
                                <textarea className="equipment-name-input" value={item.name} onFocus={() => setActiveDropdown(`${gk}-${item.id}`)} onClick={() => setActiveDropdown(`${gk}-${item.id}`)} onBlur={() => setTimeout(() => setActiveDropdown(null), 200)} onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }} onChange={(e) => updateEquipment(gk, item.id, 'name', e.target.value)} placeholder="Назва / Модель" style={{height: 'auto', minHeight: '34px'}} />
                                {activeDropdown === `${gk}-${item.id}` && productDatabase[gk] && productDatabase[gk].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).length > 0 && (
                                   <div className="autocomplete-dropdown">
                                     {productDatabase[gk].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).map(n => (
                                        <div key={n} className="autocomplete-item" onMouseDown={() => applyProductFromCatalog(gk, item.id, n, gk)}>{n}</div>
                                     ))}
                                   </div>
                                )}
                                {toNumber(item.taxDistributedUsd, 0) > 0 && (
                                  <div style={{marginTop: '0.25rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                                    + Податок: ${formatMoney(item.taxDistributedUsd)} (по ${formatMoney(item.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(item.priceBaseUsd ?? (toNumber(item.price, 0) - toNumber(item.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(item.price)}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td><select value={item.unit} onChange={(e) => updateEquipment(gk, item.id, 'unit', e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></td>
                            <td><input type="number" className="text-right" value={item.quantity} onChange={(e) => updateEquipment(gk, item.id, 'quantity', e.target.value)} /></td>
                            <td className="col-currency"><select value={item.currency} onChange={(e) => updateEquipment(gk, item.id, 'currency', e.target.value)} style={{padding: '0.4rem'}}><option value="USD">$</option><option value="EUR">€</option><option value="UAH">₴</option></select></td>
                            <td><input type="number" className="text-right" value={item.price} onChange={(e) => updateEquipment(gk, item.id, 'price', e.target.value)} /></td>
                            <td className="text-right font-bold col-readonly">{formatMoney(item.priceUah)}</td>
                            <td className="text-right font-bold col-readonly">{formatMoney(item.sumUsd)}</td>
                            <td className="text-right font-bold col-readonly">{formatMoney(item.sumUah)}</td>
                            <td><input type="number" className="text-right" value={item.incomingPrice} onChange={(e) => updateEquipment(gk, item.id, 'incomingPrice', e.target.value)} /></td>
                            <td className="col-markup text-right"><input type="number" className="text-right" value={roundMarkupForInput(item.markupPercent)} onChange={(e) => updateEquipment(gk, item.id, 'markupPercent', e.target.value)} /></td>
                            <td className="text-right text-yellow col-readonly font-bold">{formatMoney(item.marginUsd)}</td>
                            <td className="text-center"><button type="button" className="danger" onClick={() => removeRow(gk, item.id)}>✕</button></td>
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                  <tr className="group-summary-row">
                    <td colSpan="6" className="text-right font-bold" style={{paddingRight: '1rem'}}>Всього за розділом "ЗАХИСТ":</td>
                    <td className="text-right font-bold text-blue">${formatMoney(totalSectionSumUsd)}</td>
                    <td className="text-right font-bold text-blue">₴{formatMoney(totalSectionSumUah)}</td>
                    <td className="text-right font-bold text-blue internal-only">${formatMoney(totalSectionCostUsd)}</td>
                    <td colSpan="3" className="text-right" style={{fontSize: '0.78rem', color: '#fbbf24'}}>
                      {toNumber(getDistributedTaxByGroup('Захист PV') + getDistributedTaxByGroup('Захист AC') + getDistributedTaxByGroup('Захист DC'), 0) > 0
                        ? `Податок у розділі: $${formatMoney(getDistributedTaxByGroup('Захист PV') + getDistributedTaxByGroup('Захист AC') + getDistributedTaxByGroup('Захист DC'))}`
                        : ''}
                    </td>
                  </tr>
                </tbody>
              );
            }

            if (sectionKey === "Кріплення") {
              const mountingGroups = Object.keys(calculations.groups).filter(name => name.startsWith("Кріплення"));
              if (mountingGroups.length === 0) return null;
              return mountingGroups.map(groupKey => (
                <tbody key={groupKey} data-group-key={groupKey}>
                  <tr>
                    <td colSpan="12" className="group-header">
                      <div className="flex justify-between items-center" style={{gap: '0.6rem', flexWrap: 'wrap'}}>
                    <span>{projectType === 'product' && groupKey === 'Основне обладнання' ? 'ТОВАРИ' : groupKey.toUpperCase()}</span>
                        <div className="flex items-center" style={{gap: '0.45rem', flexWrap: 'wrap'}}>
                          <select
                            className="secondary"
                            style={{width: '190px', padding: '0.45rem'}}
                            value={mountingTemplateSelection[groupKey] || MOUNTING_TEMPLATE_TYPES[0]}
                            onChange={(e) => setMountingTemplateSelection(prev => ({ ...prev, [groupKey]: e.target.value }))}
                          >
                            {MOUNTING_TEMPLATE_TYPES.map(templateName => (
                              <option key={templateName} value={templateName}>{templateName}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            className="secondary"
                            style={{background: '#0f766e'}}
                            onClick={() => applyMountingTemplate(groupKey, mountingTemplateSelection[groupKey] || MOUNTING_TEMPLATE_TYPES[0])}
                          >
                            Застосувати шаблон
                          </button>
                          <div className="flex items-center" style={{gap: '0.35rem'}}>
                            <input
                              type="number"
                              className="text-right"
                              value={groupSettings[groupKey]?.categoryMarkupPercent ?? 0}
                              onChange={(e) => updateGroupSetting(groupKey, 'categoryMarkupPercent', parseNumberInput(e.target.value))}
                              style={{width: '76px'}}
                            />
                            <button type="button" className="secondary" onClick={() => applyCategoryMarkup(groupKey)}>Націнка кат.</button>
                          </div>
                          <button type="button" className="secondary" onClick={() => addRowWithExpand(groupKey)}>+ Нова позиція кріплення</button>
                          {groupKey !== "Кріплення" && (
                            <button type="button" className="danger" onClick={() => removeGroup(groupKey)}>Видалити тип</button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr style={{backgroundColor: '#1E1E1E'}}>
                    <th className="col-name text-left">Номенклатура та тип</th>
                    <th className="col-unit text-left">Од.</th>
                    <th className="col-qty text-right">Кіл-ть</th>
                    <th className="col-currency text-center">Вал.</th>
                    <th className="col-price text-right">Ціна ($/п)</th>
                    <th className="col-price text-right">Ціна (₴)</th>
                    <th className="col-readonly text-right">Сума ($)</th>
                    <th className="col-readonly text-right">Сума (₴)</th>
                    <th className="col-price text-right internal-only">Собів. ($)</th>
                    <th className="col-markup text-right">Націнка %</th>
                    <th className="col-readonly text-yellow text-right">Маржа ($)</th>
                    <th style={{width: '50px'}}></th>
                  </tr>
                  {calculations.groups[groupKey].map(item => (
                    <tr key={item.id}>
                      <td className="col-name">
                        <div className="equipment-cell">
                          <div style={{position: 'relative', width: '100%'}}>
                            <textarea
                              className="equipment-name-input"
                              value={item.name}
                              onFocus={() => setActiveDropdown(`${groupKey}-${item.id}`)}
                              onClick={() => setActiveDropdown(`${groupKey}-${item.id}`)}
                              onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                              onInput={(e) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                              onChange={(e) => updateEquipment(groupKey, item.id, 'name', e.target.value)}
                              placeholder="Назва / Модель"
                              style={{height: 'auto', minHeight: '34px'}}
                            />
                            {activeDropdown === `${groupKey}-${item.id}` && productDatabase[groupKey] && productDatabase[groupKey].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).length > 0 && (
                               <div className="autocomplete-dropdown">
                                 {productDatabase[groupKey].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).map(n => (
                                    <div key={n} className="autocomplete-item" onMouseDown={() => applyProductFromCatalog(groupKey, item.id, n, groupKey)}>{n}</div>
                                 ))}
                               </div>
                            )}
                            {toNumber(item.taxDistributedUsd, 0) > 0 && (
                              <div style={{marginTop: '0.25rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                                + Податок: ${formatMoney(item.taxDistributedUsd)} (по ${formatMoney(item.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(item.priceBaseUsd ?? (toNumber(item.price, 0) - toNumber(item.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(item.price)}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td><select value={item.unit} onChange={(e) => updateEquipment(groupKey, item.id, 'unit', e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></td>
                      <td><input type="number" className="text-right" value={item.quantity} onChange={(e) => { if (autoMountingQuantity) setAutoMountingQuantity(false); updateEquipment(groupKey, item.id, 'quantity', e.target.value); }} title={autoMountingQuantity ? 'Авто-кількість увімкнена (при ручній зміні буде вимкнено)' : ''} /></td>
                      <td className="col-currency"><select value={item.currency} onChange={(e) => updateEquipment(groupKey, item.id, 'currency', e.target.value)} style={{padding: '0.4rem'}}><option value="USD">$</option><option value="EUR">€</option><option value="UAH">₴</option></select></td>
                      <td><input type="number" className="text-right" value={item.price} onChange={(e) => updateEquipment(groupKey, item.id, 'price', e.target.value)} /></td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.priceUah)}</td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.sumUsd)}</td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.sumUah)}</td>
                      <td className="internal-only"><input type="number" className="text-right" value={item.incomingPrice} onChange={(e) => updateEquipment(groupKey, item.id, 'incomingPrice', e.target.value)} /></td>
                      <td className="col-markup text-right"><input type="number" className="text-right" value={roundMarkupForInput(item.markupPercent)} onChange={(e) => updateEquipment(groupKey, item.id, 'markupPercent', e.target.value)} /></td>
                      <td className="text-right text-yellow col-readonly font-bold">{formatMoney(item.marginUsd)}</td>
                      <td className="text-center"><button type="button" className="danger" onClick={() => removeRow(groupKey, item.id)}>✕</button></td>
                    </tr>
                  ))}
                  <tr className="group-summary-row">
                    <td colSpan="6" className="text-right font-bold" style={{paddingRight: '1rem'}}>Всього за розділом "{groupKey}":</td>
                    <td className="text-right font-bold text-blue">${formatMoney(calculations.groupTotalsUsd[groupKey])}</td>
                    <td className="text-right font-bold text-blue">₴{formatMoney(calculations.groupTotalsUah[groupKey])}</td>
                    <td className="text-right font-bold text-blue internal-only">${formatMoney(calculations.groupCostTotalsUsd[groupKey])}</td>
                    <td colSpan="3" className="text-right" style={{fontSize: '0.78rem', color: '#fbbf24'}}>
                      {toNumber(getDistributedTaxByGroup(groupKey), 0) > 0 ? `Податок у розділі: $${formatMoney(getDistributedTaxByGroup(groupKey))}` : ''}
                    </td>
                  </tr>
                </tbody>
              ));
            }

            // Handle rendering for all other groups based on the requested order
            const groupsToRender = [];
            if (sectionKey === "Інші групи") {
              const knownSections = ["Основне обладнання", "Кабельна продукція", "Заземлення"];
              Object.keys(calculations.groups).forEach(gk => {
                if (!knownSections.includes(gk) && !gk.startsWith("Захист") && !gk.startsWith("Кріплення")) {
                  groupsToRender.push(gk);
                }
              });
            } else if (sectionKey !== "ЗАХИСТ" && sectionKey !== "Кріплення") {
              if (calculations.groups[sectionKey]) {
                groupsToRender.push(sectionKey);
              }
            }

            return groupsToRender.map(groupKey => (
              <tbody key={groupKey} data-group-key={groupKey}>
                <tr>
                  <td colSpan="12" className="group-header">
                    <div className="flex justify-between items-center" style={{gap: '0.6rem', flexWrap: 'wrap'}}>
                      <span>{groupKey.toUpperCase()}</span>
                      <div className="flex items-center" style={{gap: '0.45rem', flexWrap: 'wrap'}}>
                        <div className="flex items-center" style={{gap: '0.35rem'}}>
                          <input
                            type="number"
                            className="text-right"
                            value={groupSettings[groupKey]?.categoryMarkupPercent ?? 0}
                            onChange={(e) => updateGroupSetting(groupKey, 'categoryMarkupPercent', parseNumberInput(e.target.value))}
                            style={{width: '76px'}}
                          />
                          <button type="button" className="secondary" onClick={() => applyCategoryMarkup(groupKey)}>Націнка кат.</button>
                        </div>
                        <button type="button" className="secondary" onClick={() => addRow(groupKey)}>+ Додати позицію</button>
                        {isCustomCategoryGroup(groupKey) && (
                          <button type="button" className="danger" onClick={() => removeGroup(groupKey)}>Видалити категорію</button>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
                <tr style={{backgroundColor: '#1E1E1E'}}>
                  <th className="col-name text-left">Номенклатура та тип</th>
                  <th className="col-unit text-left">Од.</th>
                  <th className="col-qty text-right">Кіл-ть</th>
                  <th className="col-currency text-center">Вал.</th>
                  <th className="col-price text-right">Ціна ($/п)</th>
                  <th className="col-price text-right">Ціна (₴)</th>
                  <th className="col-readonly text-right">Сума ($)</th>
                  <th className="col-readonly text-right">Сума (₴)</th>
                  <th className="col-price text-right internal-only">Собів. ($)</th>
                  <th className="col-markup text-right">Націнка %</th>
                  <th className="col-readonly text-yellow text-right">Маржа ($)</th>
                  <th style={{width: '50px'}}></th>
                </tr>
                {calculations.groups[groupKey].map((item, itemIndex) => {
                  const isProductMainGroup = projectType === 'product' && groupKey === 'Основне обладнання';
                  const categoryLabel = (groupKey === "Основне обладнання" && item.type) ? item.type : groupKey;
                  const dropdownSource = isProductMainGroup ? allProductNames : (productDatabase[categoryLabel] || []);

                  return (
                    <tr key={item.id}>
                      <td className="col-name">
                        <div className="equipment-cell">
                          {!isProductMainGroup && (groupKey === "Основне обладнання" || groupKey === "Захист" || groupKey === "Заземлення" || groupKey === "Кабельна продукція") && (
                            <select 
                              className="equipment-type-input" 
                              style={{width: '140px', marginRight: '0.5rem', background: '#374151', padding: '0.2rem'}}
                              value={item.type || ""} 
                              onChange={(e) => updateEquipment(groupKey, item.id, 'type', e.target.value)}
                            >
                              <option value="">Тип...</option>
                              {(() => {
                                if (groupKey === "Основне обладнання") return MAIN_TYPES;
                                if (groupKey === "Захист") return PROTECTION_TYPES;
                                if (groupKey === "Заземлення") return GROUNDING_TYPES;
                                if (groupKey === "Кабельна продукція") return CABLE_TYPES;
                                return ["Інше"];
                              })().map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          )}
                          <div style={{position: 'relative', width: '100%'}}>
                            <textarea 
                              className="equipment-name-input" 
                              value={item.name} 
                              onFocus={() => setActiveDropdown(`${groupKey}-${item.id}`)}
                              onClick={() => setActiveDropdown(`${groupKey}-${item.id}`)}
                              onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                              onInput={(e) => {
                                 e.target.style.height = 'auto';
                                 e.target.style.height = e.target.scrollHeight + 'px';
                              }}
                              onChange={(e) => updateEquipment(groupKey, item.id, 'name', e.target.value)} 
                              placeholder="Назва / Модель" 
                              style={{height: 'auto'}}
                            />
                            {activeDropdown === `${groupKey}-${item.id}` && dropdownSource.filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).length > 0 && (
                               <div className="autocomplete-dropdown">
                                 {dropdownSource.filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).map(n => (
                                    <div key={n} className="autocomplete-item" onMouseDown={() => applyProductFromCatalog(groupKey, item.id, n, isProductMainGroup ? 'Основне обладнання' : categoryLabel)}>
                                      {n}
                                    </div>
                                 ))}
                               </div>
                            )}
                            {toNumber(item.taxDistributedUsd, 0) > 0 && (
                              <div style={{marginTop: '0.25rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                                + Податок: ${formatMoney(item.taxDistributedUsd)} (по ${formatMoney(item.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(item.priceBaseUsd ?? (toNumber(item.price, 0) - toNumber(item.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(item.price)}
                              </div>
                            )}
                          </div>
                          {projectType !== 'product' && item.type === "ФЕП" && (
                            <div className="flex items-center" style={{marginLeft: '0.5rem', gap: '0.3rem', background: 'rgba(250, 204, 21, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px', border: '1px solid rgba(250, 204, 21, 0.3)', width: '100%'}}>
                               <span style={{fontSize: '0.75rem', color: 'var(--accent-yellow)'}}>Wp:</span>
                               <input 
                                  type="number" 
                                  className="power-wp-input"
                                  value={item.power || 0} 
                                  onChange={(e) => updateEquipment(groupKey, item.id, 'power', e.target.value)} 
                                  style={{width: '72px', background: 'transparent', border: 'none', color: '#fff', fontSize: '0.85rem', fontWeight: 'bold'}}
                               />
                               {itemIndex === 0 && (
                                 <label className="flex items-center" style={{marginLeft: 'auto', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-muted)'}}>
                                   <input
                                     type="checkbox"
                                     checked={autoMountingQuantity}
                                     onChange={(e) => setAutoMountingQuantity(e.target.checked)}
                                   />
                                   Авто кріплення = к-сть панелей ({Math.round(totalPanelQuantity)})
                                 </label>
                               )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <select value={item.unit} onChange={(e) => updateEquipment(groupKey, item.id, 'unit', e.target.value)}>
                          {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="number" className="text-right" value={item.quantity} onChange={(e) => updateEquipment(groupKey, item.id, 'quantity', e.target.value)} />
                      </td>
                      <td className="col-currency">
                        <select value={item.currency} onChange={(e) => updateEquipment(groupKey, item.id, 'currency', e.target.value)} style={{padding: '0.4rem'}}>
                          <option value="USD">$</option>
                          <option value="EUR">€</option>
                          <option value="UAH">₴</option>
                        </select>
                      </td>
                      <td>
                        <input type="number" className="text-right" value={item.price} onChange={(e) => updateEquipment(groupKey, item.id, 'price', e.target.value)} />
                      </td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.priceUah)}</td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.sumUsd)}</td>
                      <td className="text-right font-bold col-readonly">{formatMoney(item.sumUah)}</td>
                      <td>
                        <input type="number" className="text-right" value={item.incomingPrice} onChange={(e) => updateEquipment(groupKey, item.id, 'incomingPrice', e.target.value)} />
                      </td>
                      <td className="col-markup text-right">
                        <input type="number" className="text-right" value={item.markupPercent !== undefined ? roundMarkupForInput(item.markupPercent) : 0} onChange={(e) => updateEquipment(groupKey, item.id, 'markupPercent', e.target.value)} />
                      </td>
                      <td className="text-right text-yellow col-readonly font-bold">{formatMoney(item.marginUsd)}</td>
                      <td className="text-center">
                        <button type="button" className="danger" onClick={() => removeRow(groupKey, item.id)}>✕</button>
                      </td>
                    </tr>
                  );
                })}
                <tr className="group-summary-row">
                  <td colSpan="6" className="text-right font-bold" style={{paddingRight: '1rem'}}>Всього за розділом "{groupKey}":</td>
                  <td className="text-right font-bold text-blue">${formatMoney(calculations.groupTotalsUsd[groupKey])}</td>
                  <td className="text-right font-bold text-blue">₴{formatMoney(calculations.groupTotalsUah[groupKey])}</td>
                  <td className="text-right font-bold text-blue internal-only">${formatMoney(calculations.groupCostTotalsUsd[groupKey])}</td>
                  <td colSpan="3" className="text-right" style={{fontSize: '0.78rem', color: '#fbbf24'}}>
                    {toNumber(getDistributedTaxByGroup(groupKey), 0) > 0 ? `Податок у розділі: $${formatMoney(getDistributedTaxByGroup(groupKey))}` : ''}
                  </td>
                </tr>
              </tbody>
            ));
          })}
        </table>
        )}
      </div>

      {projectType !== 'product' && (
        <div className="card table-container aux-table-container" style={{padding: '0'}}>
          <div className="flex justify-between items-center" style={{padding: '1.5rem', paddingBottom: '1rem'}}>
            <h2 style={{margin: 0}}>Монтажні роботи</h2>
            <button type="button" className="secondary" onClick={() => addItem(setWorkItems, "Новий вид робіт")}>+ Додати роботу</button>
          </div>
          <div style={{padding: '0 1.5rem 1.5rem'}}>
            <table style={{border: '1px solid var(--border-color)'}}>
              <thead>
                <tr style={{backgroundColor: '#1E1E1E'}}>
                  <th className="col-name text-left">Найменування робіт</th>
                  <th className="col-qty text-right">Кіл-ть</th>
                  <th className="col-currency text-center">Вал.</th>
                  <th className="col-price text-right">Ціна (од)</th>
                  <th className="col-price text-right">Ціна (₴)</th>
                  <th className="col-readonly text-right">Сума ($)</th>
                  <th className="col-readonly text-right">Сума (₴)</th>
                  <th className="col-price text-right internal-only">Собів. ($)</th>
                  <th className="col-markup text-right">Націнка %</th>
                  <th className="col-readonly text-right internal-only">Маржа ($)</th>
                  <th style={{width: '50px'}}></th>
                </tr>
              </thead>
              <tbody>
                {calculations.processedWorkItems.map(it => (
                  <tr key={it.id}>
                    <td>
                      <input type="text" className="equipment-name-input" value={it.name} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'name', e.target.value)} placeholder="Назва робіт" />
                      {toNumber(it.taxDistributedUsd, 0) > 0 && (
                        <div style={{marginTop: '0.25rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                          + Податок: ${formatMoney(it.taxDistributedUsd)} (по ${formatMoney(it.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(it.priceBaseUsd ?? (toNumber(it.price, 0) - toNumber(it.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(it.price)}
                        </div>
                      )}
                    </td>
                    <td><input type="number" className="text-right" value={it.quantity} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'quantity', e.target.value)} /></td>
                    <td className="col-currency">
                      <select value={it.currency} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'currency', e.target.value)}>
                        <option value="USD">$</option><option value="EUR">€</option><option value="UAH">₴</option>
                      </select>
                    </td>
                    <td><input type="number" className="text-right" value={it.price} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'price', e.target.value)} /></td>
                    <td className="text-right font-bold col-readonly">₴{formatMoney(it.priceUah)}</td>
                    <td className="text-right font-bold text-blue col-readonly">${formatMoney(it.sumUsd)}</td>
                    <td className="text-right font-bold text-blue col-readonly">₴{formatMoney(it.sumUah)}</td>
                    <td className="internal-only"><input type="number" className="text-right" value={it.incomingPrice || 0} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'incomingPrice', e.target.value)} /></td>
                    <td><input type="number" className="text-right" value={roundMarkupForInput(it.markupPercent)} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'markupPercent', e.target.value)} /></td>
                    <td className="text-right font-bold text-yellow col-readonly internal-only">${formatMoney((it.sumUsd || 0) - (it.costUsd || 0))}</td>
                    <td className="text-center"><button type="button" className="danger" onClick={() => removeItem(setWorkItems, it.id)}>✕</button></td>
                  </tr>
                ))}
                <tr className="group-summary-row">
                  {clientMode ? (
                    <>
                      <td colSpan="5" className="text-right font-bold">Всього за роботами:</td>
                      <td className="text-right font-bold text-blue">${formatMoney(calculations.workItemsSumUsd + installPercentOnlyUsd + toNumber(installPercentTaxUsd, 0))}</td>
                      <td className="text-right font-bold text-blue">₴{formatMoney((calculations.workItemsSumUsd + installPercentOnlyUsd + toNumber(installPercentTaxUsd, 0)) * toNumber(rates.usd, 0))}</td>
                    </>
                  ) : (
                    <>
                      <td colSpan="5" className="text-right font-bold">Всього за роботами:</td>
                      <td className="text-right font-bold text-blue">${formatMoney(calculations.workItemsSumUsd + installPercentOnlyUsd + toNumber(installPercentTaxUsd, 0))}</td>
                      <td className="text-right font-bold text-blue">₴{formatMoney((calculations.workItemsSumUsd + installPercentOnlyUsd + toNumber(installPercentTaxUsd, 0)) * toNumber(rates.usd, 0))}</td>
                      <td className="text-right font-bold internal-only">${formatMoney(calculations.workItemsCostUsd || 0)}</td>
                      <td colSpan="3" className="text-right font-bold text-yellow">
                        <span style={{marginRight: '0.75rem'}}>${formatMoney((calculations.workItemsMarginUsd || 0) + installPercentOnlyUsd + toNumber(installPercentTaxUsd, 0))}</span>
                        {toNumber((calculations.processedWorkItems || []).reduce((acc, item) => acc + toNumber(item.taxDistributedUsd, 0), 0) + toNumber(installPercentTaxUsd, 0), 0) > 0
                          ? `Податок у розділі: $${formatMoney((calculations.processedWorkItems || []).reduce((acc, item) => acc + toNumber(item.taxDistributedUsd, 0), 0) + toNumber(installPercentTaxUsd, 0))}`
                          : ''}
                      </td>
                    </>
                  )}
                </tr>
              </tbody>
            </table>
            <div
              style={{
                width: '100%',
                marginTop: '0.9rem',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, rgba(14, 116, 144, 0.12), rgba(15, 23, 42, 0.35))',
                padding: '1rem 1.1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                flexWrap: 'wrap'
              }}
            >
              <div>
                <div style={{fontSize: '2rem', fontWeight: 800, color: '#cbd5e1', lineHeight: 1}}>Додатковий % за монтаж</div>
                <div style={{fontSize: '1.1rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>(від вартості обладнання)</div>
              </div>
              <div className="flex items-center" style={{gap: '1rem'}}>
                <input
                  type="number"
                  style={{width: '120px', fontSize: '2rem', fontWeight: 800, padding: '0.45rem 0.6rem'}}
                  value={installPercent}
                  onChange={(e) => { setInstallPercent(parseNumberInput(e.target.value)); resetTaxDistributionState(); }}
                />
                <div>
                  <div className="font-bold text-blue" style={{fontSize: '2.2rem', lineHeight: 1}}>${formatMoney(installPercentOnlyUsd)}</div>
                  <div style={{fontSize: '1.8rem', color: 'var(--text-muted)', marginTop: '0.2rem'}}>₴{formatMoney(installPercentOnlyUah)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card table-container aux-table-container" style={{padding: '0'}}>
        <div className="flex justify-between items-center" style={{padding: '1.5rem', paddingBottom: '1rem'}}>
          <h2 style={{margin: 0}}>Інші витрати (Логістика / ПММ)</h2>
          <button type="button" className="secondary" onClick={() => addItem(setOtherExpenses, "Нова витрата")}>+ Додати витрату</button>
        </div>
        <div style={{padding: '0 1.5rem 1.5rem'}}>
          <table style={{border: '1px solid var(--border-color)'}}>
            <thead>
              <tr style={{backgroundColor: '#1E1E1E'}}>
                <th className="col-name text-left">Опис витрати</th>
                <th className="col-qty text-right">Кіл-ть</th>
                <th className="col-currency text-center">Вал.</th>
                <th className="col-price text-right">Ціна (од)</th>
                <th className="col-price text-right">Ціна (₴)</th>
                <th className="col-readonly text-right">Сума ($)</th>
                <th className="col-readonly text-right">Сума (₴)</th>
                <th className="col-price text-right internal-only">Собів. ($)</th>
                <th className="col-markup text-right">Націнка %</th>
                <th className="col-readonly text-yellow text-right">Маржа ($)</th>
                <th style={{width: '50px'}}></th>
              </tr>
            </thead>
            <tbody>
              {calculations.processedOtherExpenses.map(exp => (
                <tr key={exp.id}>
                  <td>
                    <input type="text" className="equipment-name-input" value={exp.name} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'name', e.target.value)} placeholder="Назва витрати" />
                    {toNumber(exp.taxDistributedUsd, 0) > 0 && (
                      <div style={{marginTop: '0.25rem', fontSize: '0.76rem', color: '#fbbf24'}}>
                        + Податок: ${formatMoney(exp.taxDistributedUsd)} (по ${formatMoney(exp.taxDistributedPerUnitUsd || 0)}/од.) · Ціна: ${formatMoney(exp.priceBaseUsd ?? (toNumber(exp.price, 0) - toNumber(exp.taxDistributedPerUnitUsd, 0)))} → ${formatMoney(exp.price)}
                      </div>
                    )}
                  </td>
                  <td><input type="number" className="text-right" value={exp.quantity} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'quantity', e.target.value)} /></td>
                  <td className="col-currency">
                    <select value={exp.currency} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'currency', e.target.value)}>
                      <option value="USD">$</option><option value="EUR">€</option><option value="UAH">₴</option>
                    </select>
                  </td>
                  <td><input type="number" className="text-right" value={exp.price} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'price', e.target.value)} /></td>
                  <td className="text-right font-bold col-readonly">₴{formatMoney(exp.priceUah)}</td>
                  <td className="text-right font-bold text-blue col-readonly">${formatMoney(exp.sumUsd)}</td>
                  <td className="text-right font-bold text-blue col-readonly">₴{formatMoney(exp.sumUah)}</td>
                  <td className="internal-only"><input type="number" className="text-right" value={exp.incomingPrice || 0} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'incomingPrice', e.target.value)} /></td>
                  <td><input type="number" className="text-right" value={roundMarkupForInput(exp.markupPercent)} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'markupPercent', e.target.value)} /></td>
                  <td className="text-right font-bold text-yellow col-readonly">${formatMoney((exp.sumUsd || 0) - (exp.costUsd || 0))}</td>
                  <td className="text-center"><button type="button" className="danger" onClick={() => removeItem(setOtherExpenses, exp.id)}>✕</button></td>
                </tr>
              ))}
              <tr className="group-summary-row">
                 {clientMode ? (
                   <>
                     <td colSpan="5" className="text-right font-bold">Всього за іншими витратами:</td>
                     <td className="text-right font-bold text-blue">${formatMoney(calculations.otherCostsUsd)}</td>
                     <td className="text-right font-bold text-blue">₴{formatMoney(calculations.otherCostsUah)}</td>
                   </>
                 ) : (
                   <>
                     <td colSpan="5" className="text-right font-bold">Всього за іншими витратами:</td>
                     <td className="text-right font-bold text-blue">${formatMoney(calculations.otherCostsUsd)}</td>
                     <td className="text-right font-bold text-blue">₴{formatMoney(calculations.otherCostsUah)}</td>
                     <td className="text-right font-bold internal-only">${formatMoney(calculations.otherCostsCostUsd || 0)}</td>
                     <td colSpan="3" className="text-right font-bold text-yellow">
                       <span style={{marginRight: '0.75rem'}}>${formatMoney(calculations.otherCostsMarginUsd || 0)}</span>
                       {toNumber((calculations.processedOtherExpenses || []).reduce((acc, item) => acc + toNumber(item.taxDistributedUsd, 0), 0), 0) > 0
                         ? `Податок у розділі: $${formatMoney((calculations.processedOtherExpenses || []).reduce((acc, item) => acc + toNumber(item.taxDistributedUsd, 0), 0))}`
                         : ''}
                     </td>
                   </>
                 )}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-2" style={{gap: '3rem'}}>
          <div>
            <h2>Резюме проєкту</h2>
            <div className="summary-list" style={{marginTop: '1rem'}}>
              {projectType !== 'product' && (
                <div className="flex justify-between py-1 border-b">
                  <span>Проєктна потужність станції:</span>
                  <span className="font-bold text-yellow" style={{fontSize: '1.2rem'}}>{calculations.stationPowerW.toFixed(0)} Вт</span>
                </div>
              )}
              {/* БЛОК ОБЛАДНАННЯ */}
              <div className="summary-block" style={{background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 'bold'}}>{projectType === 'product' ? '🛒 ТОВАРИ' : '📦 ОБЛАДНАННЯ'}</div>
                <div className="flex justify-between py-1">
                  <span>Загальна вартість обладнання:</span>
                  <span className="font-bold">${formatMoney(calculations.sums.materialsSumUsd)}</span>
                </div>
                <div className="flex justify-between py-1 internal-only" style={{opacity: 0.8, fontSize: '0.95rem'}}>
                  <span>Собівартість обладнання:</span>
                  <span className="font-bold">${formatMoney(calculations.sums.materialsCostUsd || 0)}</span>
                </div>
                <div className="flex justify-between py-1 internal-only" style={{borderTop: '1px dashed rgba(148,163,184,0.2)', marginTop: '0.4rem', paddingTop: '0.4rem'}}>
                  <span style={{color: 'var(--accent-yellow)'}}>Маржа з товару:</span>
                  <span className="font-bold text-yellow">
                    ${formatMoney(calculations.sums.marginMaterialsUsd || 0)}
                    <span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.8}}>({toNumber(calculations.sums.marginMaterialsPercent, 0).toFixed(1)}%)</span>
                  </span>
                </div>
              </div>
              
              {/* БЛОК РОБІТ */}
                {projectType !== 'product' && calculations.sums.installationTotalUsd > 0 && (
                <div className="summary-block" style={{background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                  <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 'bold'}}>🛠️ РОБОТИ ТА ПОСЛУГИ</div>
                  
                  {toNumber(installPercent, 0) > 0 && (
                    <div className="flex justify-between py-1" style={{fontSize: '0.95rem', opacity: 0.9}}>
                      <span>Монтажні і пусконалагоджувальні роботи:</span>
                      <span className="font-bold">${formatMoney(calculations.sums.installPercentAmountUsd)}</span>
                    </div>
                  )}
                  
                  {calculations.workItemsSumUsd > 0 && (
                    <div className="flex justify-between py-1" style={{fontSize: '0.95rem', opacity: 0.9}}>
                      <span>Додаткові роботи та послуги:</span>
                      <span className="font-bold">${formatMoney(calculations.workItemsSumUsd)}</span>
                    </div>
                  )}
  
                  <div className="flex justify-between py-1" style={{borderTop: '1px solid rgba(148,163,184,0.2)', marginTop: '0.4rem', paddingTop: '0.4rem'}}>
                    <span>Загальна вартість робіт:</span>
                    <span className="font-bold text-green">${formatMoney(calculations.sums.installationTotalUsd)}</span>
                  </div>
  
                  <div className="flex justify-between py-1 internal-only" style={{opacity: 0.8, fontSize: '0.95rem'}}>
                    <span>Собівартість робіт:</span>
                    <span className="font-bold">${formatMoney(calculations.sums.workItemsCostUsd || 0)}</span>
                  </div>
  
                  <div className="flex justify-between py-1 internal-only" style={{borderTop: '1px dashed rgba(148,163,184,0.2)', marginTop: '0.4rem', paddingTop: '0.4rem'}}>
                    <span style={{color: 'var(--accent-yellow)'}}>Маржа з робіт:</span>
                    <span className="font-bold text-yellow">
                      ${formatMoney(calculations.sums.marginWorksUsd || 0)}
                      <span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.8}}>({toNumber(calculations.sums.marginWorksPercent, 0).toFixed(1)}%)</span>
                    </span>
                  </div>
                </div>
                )}

              {/* ЛОГІСТИКА ТА ПІДСУМОК */}
              <div className="summary-block" style={{padding: '0 1rem'}}>
                <div className="flex justify-between py-1 border-b">
                  <span>{logisticsSummaryLabel}</span>
                  <span className="font-bold">${formatMoney(calculations.sums.logisticsTotalUsd)}</span>
                </div>

                <div className="flex justify-between py-2 internal-only" style={{background: 'rgba(148, 163, 184, 0.05)', padding: '0.5rem', borderRadius: '4px', marginTop: '0.5rem'}}>
                  <span>Загальна собівартість замовлення:</span>
                  <span className="font-bold">${formatMoney(calculations.sums.orderCostUsd || 0)}</span>
                </div>
                
                {projectType === 'commercial' && (
                  <div className="flex justify-between py-1" style={{marginTop: '0.5rem'}}>
                    <span>Частка монтажу/запуску від вартості товару:</span>
                    <span className="font-bold text-yellow">{commercialServicePercent.toFixed(1)}%</span>
                  </div>
                )}

                <div className="flex justify-between py-3 internal-only" style={{marginTop: '1rem', background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.1), transparent)', padding: '0.75rem', borderRadius: '8px', borderLeft: '4px solid var(--accent-yellow)'}}>
                  <span className="font-bold">ЗАГАЛЬНА МАРЖА:</span>
                  <span className="font-bold text-yellow" style={{fontSize: '1.1rem'}}>
                    ${formatMoney(calculations.sums.marginTotalUsd)}
                    <span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.8}}>({toNumber(calculations.sums.marginFromOrderPercent, 0).toFixed(1)}% від замовлення)</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center internal-only" style={{gap: '1rem', marginTop: '1.5rem', marginBottom: '1.5rem'}}>
              <div className="input-group" style={{margin: 0, flex: 1}}>
                <label>Комісія менеджера (%) від маржі замовлення</label>
                <input type="number" value={managerCommissionRate} onChange={(e) => setManagerCommissionRate(parseNumberInput(e.target.value))} />
              </div>
              <div className="input-group" style={{margin: 0, flex: 1}}>
                <label>Сума комісії ($)</label>
                <div className="font-bold" style={{color: '#fff', background: '#173f7a', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)'}}>${formatMoney(calculations.sums.managerCommissionBeforeTaxesUsd || 0)}</div>
              </div>
            </div>
            
            <div className="summary-card internal-only" style={{marginTop: '2rem'}}>
              <div className="summary-item highlight">
                <h3>Загальна маржа замовлення (до податків)</h3>
                <div className="summary-value" style={{color: 'var(--accent-yellow)'}}>
                  ${formatMoney(calculations.sums.grossMarginBeforeTaxesUsd || 0)}
                  <span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.grossMarginBeforeTaxesUsd || 0)}% від замовлення)</span>
                </div>
              </div>
              <div className="summary-item highlight" style={{marginTop: '1rem'}}>
                <h3>Чиста маржа до податків</h3>
                <div className="summary-value" style={{color: '#93c5fd'}}>
                  ${formatMoney(calculations.sums.netMarginBeforeTaxesUsd || 0)}
                  <span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.netMarginBeforeTaxesUsd || 0)}% від замовлення)</span>
                </div>
              </div>
            </div>

          </div>

          <div>
            <h2>Разом до сплати (Клієнт)</h2>
            <div className="input-group" style={{marginBottom: '1rem'}}>
              <label>Знижка клієнту (%)</label>
              <input type="number" value={clientDiscountPercent} onChange={(e) => setClientDiscountPercent(parseNumberInput(e.target.value))} />
            </div>
            {!clientMode && <div className="input-group" style={{marginBottom: '1rem'}}>
              <label>Податковий режим</label>
              <select value={taxMode} onChange={(e) => setTaxMode(e.target.value)}>
                {Object.entries(TAX_MODES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>}
            {!clientMode && taxMode === 'fop7' && (
              <div className="input-group" style={{marginBottom: '1rem'}}>
                <label>% податку ФОП</label>
                <input type="number" min="0" step="0.1" value={fopTaxPercent} onChange={(e) => { setFopTaxPercent(parseNumberInput(e.target.value)); resetTaxDistributionState(); }} />
              </div>
            )}
            {!clientMode && taxMode === 'fop_advanced' && (
              <>
                <div className="input-group" style={{marginBottom: '0.75rem'}}>
                  <label>% податку ФОП+ (7-9)</label>
                  <input type="number" min="7" max="9" step="0.1" value={advancedFopPercent} onChange={(e) => setAdvancedFopPercent(parseNumberInput(e.target.value))} />
                </div>
                <div className="input-group" style={{marginBottom: '0.75rem'}}>
                  <label>База оподаткування</label>
                  <select value={advancedFopBaseMode} onChange={(e) => setAdvancedFopBaseMode(e.target.value)}>
                    <option value="all_goods">Весь товар</option>
                    <option value="groups">Обрані групи</option>
                    <option value="items">Окремі товари</option>
                  </select>
                </div>
                {advancedFopBaseMode === 'groups' && (
                  <div style={{marginBottom: '0.75rem', fontSize: '0.86rem'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem'}}>
                      <button
                        type="button"
                        className="secondary"
                        style={{padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#0f766e'}}
                        onClick={() => {
                          const percent = Math.max(7, Math.min(9, toNumber(advancedFopPercent, 7)));
                          setAdvancedFopGroupPercents((prev) => {
                            const next = { ...prev };
                            advancedFopSelectedGroups.forEach((gk) => { next[gk] = percent; });
                            return next;
                          });
                        }}
                      >
                        Застосувати % до всіх вибраних
                      </button>
                    </div>
                    {Object.keys(calculations.groups || {}).map((gk) => (
                      <div key={gk} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                        <label style={{flex: 1}}>
                          <input
                            type="checkbox"
                            checked={advancedFopSelectedGroups.includes(gk)}
                            onChange={(e) => setAdvancedFopSelectedGroups((prev) => e.target.checked ? [...new Set([...prev, gk])] : prev.filter(x => x !== gk))}
                          /> {gk}
                        </label>
                        <input
                          type="number"
                          min="7"
                          max="9"
                          step="0.1"
                          style={{width: '74px'}}
                          value={toNumber(advancedFopGroupPercents[gk], toNumber(advancedFopPercent, 7))}
                          onChange={(e) => setAdvancedFopGroupPercents((prev) => ({ ...prev, [gk]: parseNumberInput(e.target.value) }))}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {advancedFopBaseMode === 'items' && (
                  <div style={{marginBottom: '0.75rem', fontSize: '0.86rem', maxHeight: '180px', overflow: 'auto', border: '1px solid var(--border-color)', padding: '0.5rem', borderRadius: '6px'}}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.45rem'}}>
                      <button
                        type="button"
                        className="secondary"
                        style={{padding: '0.3rem 0.6rem', fontSize: '0.78rem', background: '#0f766e'}}
                        onClick={() => {
                          const percent = Math.max(7, Math.min(9, toNumber(advancedFopPercent, 7)));
                          setAdvancedFopItemPercents((prev) => {
                            const next = { ...prev };
                            advancedFopSelectedItems.forEach((key) => { next[key] = percent; });
                            return next;
                          });
                        }}
                      >
                        Застосувати % до всіх вибраних
                      </button>
                    </div>
                    {Object.entries(calculations.groups || {}).map(([gk, rows]) => (
                      <div key={gk}>
                        <div style={{fontWeight: 700, marginTop: '0.25rem'}}>{gk}</div>
                        {(rows || []).map((row) => {
                          const key = `${gk}::${row.id}`;
                          return (
                            <div key={key} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem'}}>
                              <label style={{flex: 1}}>
                                <input
                                  type="checkbox"
                                  checked={advancedFopSelectedItems.includes(key)}
                                  onChange={(e) => setAdvancedFopSelectedItems((prev) => e.target.checked ? [...new Set([...prev, key])] : prev.filter(x => x !== key))}
                                /> {row.name || '(без назви)'} (${formatMoney(row.sumUsd || 0)})
                              </label>
                              <input
                                type="number"
                                min="7"
                                max="9"
                                step="0.1"
                                style={{width: '74px'}}
                                value={toNumber(advancedFopItemPercents[key], toNumber(advancedFopPercent, 7))}
                                onChange={(e) => setAdvancedFopItemPercents((prev) => ({ ...prev, [key]: parseNumberInput(e.target.value) }))}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
            {!clientMode && taxMode !== 'none' && taxMode !== 'vat' && taxMode !== 'fop_advanced' && (
              <div className="input-group" style={{marginBottom: '0.75rem'}}>
                <label>Режим розкиду податку</label>
                <select value={taxDistributionScope} onChange={(e) => setTaxDistributionScope(e.target.value)}>
                  {Object.entries(TAX_DISTRIBUTION_SCOPES).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            )}
            {!clientMode && taxMode !== 'none' && taxMode !== 'vat' && (
              <div className="flex items-center" style={{gap: '0.5rem', marginBottom: '0.75rem'}}>
                <button type="button" className="secondary" style={{background: '#0f766e'}} onClick={distributeTaxToGoods}>
                  Розкинути податок
                </button>
                <button type="button" className="secondary" style={{background: '#475569'}} onClick={rollbackDistributedTax}>
                  Відмінити розкид
                </button>
              </div>
            )}
            {!clientMode && taxMode !== 'none' && (
              <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem'}}>
                Податки: <strong style={{color: 'var(--accent-yellow)'}}>${formatMoney(calculations.sums.taxesUsd || 0)}</strong>
                {taxMode !== 'vat' && <span style={{marginLeft: '0.75rem'}}>
                  · Розкинуто на товари: <strong style={{color: '#93c5fd'}}>${formatMoney(calculations.sums.distributedTaxUsdFromRows || 0)}</strong>
                </span>}
              </div>
            )}
            {toNumber(calculations.sums.discountPercent, 0) > 0 && (
              <div style={{fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem'}}>
                Сума знижки: <strong style={{color: 'var(--accent-yellow)'}}>${formatMoney(calculations.sums.discountUsd || 0)}</strong>
              </div>
            )}
            <div className="total-ribbon" style={{flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center'}}>
              <div style={{width: '100%', marginBottom: '1rem'}}>
                <div style={{fontSize: '1rem', opacity: '0.9'}}>Основна валюта (UAH)</div>
                <div className="final-total-uah">{formatMoney(calculations.sums.finalTotalWithDiscountUah)} грн</div>
                {toNumber(calculations.sums.discountPercent, 0) > 0 && (
                  <div style={{fontSize: '0.82rem', opacity: 0.85}}>без знижки: {formatMoney(calculations.sums.finalTotalUah)} грн</div>
                )}
              </div>
              <div className="flex justify-between" style={{width: '100%', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: '1rem'}}>
                <div>
                  <div style={{fontSize: '0.8rem', opacity: '0.9'}}>Валюта USD</div>
                  <div style={{fontSize: '1.5rem', fontWeight: '700'}}>${formatMoney(calculations.sums.finalTotalWithDiscountUsd)}</div>
                </div>
                <div className="text-right">
                  <div style={{fontSize: '0.8rem', opacity: '0.9'}}>Валюта EUR</div>
                  <div style={{fontSize: '1.5rem', fontWeight: '700'}}>€{formatMoney(calculations.sums.finalTotalWithDiscountEur)}</div>
                </div>
              </div>
            </div>

            {!clientMode && <div className="summary-card internal-only" style={{marginTop: '1rem', border: '1px solid rgba(56, 189, 248, 0.35)'}}>
              <div className="summary-item highlight">
                <h3>Податки та чистий прибуток</h3>
                <div style={{display: 'grid', gap: '0.45rem', marginTop: '0.75rem'}}>
                  <div className="flex justify-between"><span>Режим податків:</span><strong>{TAX_MODES[taxMode] || TAX_MODES.none}</strong></div>
                  <div className="flex justify-between"><span>Податки:</span><strong style={{color: 'var(--accent-yellow)'}}>${formatMoney(calculations.sums.taxesUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.taxesUah || 0)})</span><span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.taxesUsd || 0)}%)</span></strong></div>
                  {taxMode === 'vat' && (
                    <>
                      <div className="flex justify-between"><span>ПДВ товари 20%:</span><strong>${formatMoney(calculations.sums.vatGoodsUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.vatGoodsUah || 0)})</span></strong></div>
                      <div className="flex justify-between"><span>ПДВ роботи 20%:</span><strong>${formatMoney(calculations.sums.vatWorksUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.vatWorksUah || 0)})</span></strong></div>
                      <div className="flex justify-between"><span>Податок на чек 2%:</span><strong>${formatMoney(calculations.sums.vatReceiptUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.vatReceiptUah || 0)})</span></strong></div>
                    </>
                  )}
                  <div className="flex justify-between"><span>Маржа після податків:</span><strong>${formatMoney(calculations.sums.marginAfterTaxesUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.marginAfterTaxesUah || 0)})</span><span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.marginAfterTaxesUsd || 0)}%)</span></strong></div>
                  <div className="flex justify-between"><span>Комісія менеджера (після податків):</span><strong>${formatMoney(calculations.sums.managerCommissionAfterTaxesUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.managerCommissionAfterTaxesUah || 0)})</span><span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.managerCommissionAfterTaxesUsd || 0)}%)</span></strong></div>
                  <div className="flex justify-between" style={{paddingTop: '0.35rem', borderTop: '1px dashed rgba(148,163,184,0.35)'}}><span>Чистий прибуток:</span><strong style={{color: 'var(--accent-green)'}}>${formatMoney(calculations.sums.netMarginUsd || 0)} <span style={{opacity: 0.85}}>(₴{formatMoney(calculations.sums.netMarginUah || 0)})</span><span style={{fontSize: '0.85rem', marginLeft: '0.5rem', opacity: 0.85}}>({pctOfOrder(calculations.sums.netMarginUsd || 0)}%)</span></strong></div>
                </div>
              </div>
            </div>}
          </div>
        </div>
      </div>
      </div>

      <button
        type="button"
        className="quick-calc-fab no-print"
        onClick={() => setShowQuickCalc((v) => !v)}
        title={showQuickCalc ? 'Закрити калькулятор' : 'Відкрити калькулятор'}
      >
        🧮 Калькулятор
      </button>

      {showQuickCalc && (
        <div className="quick-calc-panel no-print">
          <div className="quick-calc-header">Базовий калькулятор</div>
          <input
            type="text"
            className="quick-calc-input"
            value={quickCalcExpr}
            onChange={(e) => {
              setQuickCalcExpr(e.target.value);
              setQuickCalcResult(safeEvalQuickCalc(e.target.value));
            }}
            placeholder="Наприклад: (1200+350)*1.2"
          />
          <div className="quick-calc-result">= {quickCalcResult}</div>
          <div className="quick-calc-grid">
            {['7','8','9','/','4','5','6','*','1','2','3','-','0','.','(',')','+'].map((t) => (
              <button key={t} type="button" className="secondary" onClick={() => quickCalcAppend(t)}>{t}</button>
            ))}
            <button type="button" className="danger" onClick={quickCalcClearAll}>C</button>
            <button type="button" className="secondary" style={{gridColumn: 'span 3'}} onClick={quickCalcClearAll}>Стерти все</button>
          </div>
        </div>
      )}

      {showNewProjectDialog && (
        <div className="project-modal-overlay">
          <div className="project-modal-card">
            <h3 style={{marginBottom: '0.5rem'}}>Створити новий проєкт</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>Оберіть тип нового проєкту:</p>
            <div className="flex" style={{gap: '0.75rem', flexWrap: 'wrap'}}>
              <button type="button" className="secondary" style={{background: '#0e7490', flex: '1 1 120px'}} onClick={() => startNewProject('project')}>
                Проєктний
              </button>
              <button type="button" className="secondary" style={{background: '#1d4ed8', flex: '1 1 120px'}} onClick={() => startNewProject('commercial')}>
                Комерційний
              </button>
              <button type="button" className="secondary" style={{background: '#059669', flex: '1 1 120px'}} onClick={() => startNewProject('product')}>
                Товарний
              </button>
            </div>
            <button type="button" className="danger" style={{marginTop: '1rem', width: '100%'}} onClick={() => setShowNewProjectDialog(false)}>
              Скасувати
            </button>
          </div>
        </div>
      )}

      {printMode && (
        <div className="print-overlay">
          <button type="button" className="secondary no-print print-overlay-close" onClick={() => setPrintMode(null)}>
            Закрити
          </button>
          <div className={`print-container ${printMode === 'offer' ? 'offer-print-container' : ''} ${printMode === 'invoice' ? 'invoice-print-container' : ''}`}>
            {printMode === "offer" && (
              <div className="offer-cover-page">
                <img className="offer-cover-image" src={coverPageType === 'Квартира' ? './title2.jpg' : './title1.jpg'} alt="Обкладинка КП" />
                <div className="offer-cover-content">
                  <div className="offer-cover-top">
                    {coverPageType
                      ? `КОМЕРЦІЙНА ПРОПОЗИЦІЯ · ${coverPageType} · ${currentYear}`
                      : `КОМЕРЦІЙНА ПРОПОЗИЦІЯ · ${currentYear}`}
                  </div>
                  <h1 className="offer-cover-title">{coverMainTitle}</h1>
                  <div className="offer-cover-subtitle">{coverSubtitle}</div>
                  <div className="offer-cover-address">📍 {coverAddress}</div>
                  {includeManagerInOffer && <div className="offer-cover-manager">Менеджер: {managerNameLabel}</div>}
                  <div className="offer-cover-metrics">
                    <div>{hasSolar ? "Сонячне поле" : "Потужність"}: {coverPowerLine}</div>
                    <div>Акумулятор: {coverBatteryLine}</div>
                    <div>Інвертор: {coverInverterLine}</div>
                    <div>Вартість: {formatMoney(calculations.sums.finalTotalWithDiscountUah)} грн</div>
                  </div>
                </div>
              </div>
            )}
            {printMode === 'offer' && <div className="offer-page-break"></div>}
            <div className={printMode === 'offer' ? 'offer-proposal-sheet' : ''}>
            <div className={printMode === 'invoice' ? 'invoice-print-header' : 'offer-print-header'} style={{marginBottom: '1.5rem', color: '#000'}}>
              {printMode === 'invoice' ? (
                <>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'}}>
                    <img src="./SolarLogo3.png" alt="Solar Service" style={{height: '88px', objectFit: 'contain'}} />
                  </div>
                  <div className="invoice-orange-line"></div>
                  <h1 className="invoice-title">СПЕЦИФІКАЦІЯ ЗАМОВЛЕННЯ</h1>
                  <div className="invoice-doc-meta">№ _______ &nbsp;&nbsp; від {new Date().toLocaleDateString('uk-UA')} р.</div>
                  <div className="invoice-orange-line" style={{marginBottom: '0.8rem'}}></div>
                </>
              ) : (
                <div className="flex justify-between items-start" style={{marginBottom: '1rem'}}>
                  <div>
                    <h1 style={{color: '#000', margin: 0}}>Комерційна пропозиція</h1>
                    <p style={{color: '#666'}}>Дата: {new Date().toLocaleDateString('uk-UA')}</p>
                  </div>
                </div>
              )}

              {includeClientInOffer && (
                <div className="invoice-customer">
                  <p><strong>Замовник:</strong> {clientInfo.name || "____________________"}</p>
                  {includeAddressInOffer && <p><strong>Адреса:</strong> {clientInfo.address || "____________________"}</p>}
                </div>
              )}
            </div>

            {printMode === 'offer' && (
              <div className="offer-top-grid">
                <div className="offer-top-card">
                  <h3>Технічні параметри</h3>
                  <div className="offer-station-list">
                    <div><span>Тип системи:</span><strong>{coverSystemNameFinal}</strong></div>
                    <div><span>Потужність сонячного поля:</span><strong>{formatKw(toNumber(calculations.stationPowerW, 0) / 1000)} кВт</strong></div>
                    <div><span>Потужність інвертора:</span><strong>{formatKw(inverterPowerKw)} кВт</strong></div>
                    <div><span>Ємність АКБ:</span><strong>{formatKw(batteryKwh)} кВт·год</strong></div>
                    {hasSolar && <div><span>Прогноз генерації/рік:</span><strong>{formatMoney(annualGenerationKwh).replace(',00', '')} кВт·год</strong></div>}
                  </div>
                </div>
                <div className="offer-top-card">
                  <h3>Гарантії та сервіс</h3>
                  <div className="offer-station-list">
                    <div><span>Сонячні модулі:</span><strong>до 15 років</strong></div>
                    <div><span>Інвертор:</span><strong>до 5 років</strong></div>
                    <div><span>Акумуляторні системи:</span><strong>до 10 років</strong></div>
                    <div><span>Монтажні роботи:</span><strong>12 місяців</strong></div>
                    <div><span>Сервісна підтримка:</span><strong>консультація та супровід</strong></div>
                  </div>
                </div>
              </div>
            )}

            <table className="print-table" style={{tableLayout: 'fixed', width: '100%'}}>
               <colgroup>
                  <col style={{width: '4%'}} />
                  <col style={{width: '38%'}} />
                  <col style={{width: '6%'}} />
                  <col style={{width: '6%'}} />
                  {showUsdInPrint && <col style={{width: showUahInPrint ? '11.5%' : '23%'}} />}
                  {showUahInPrint && <col style={{width: showUsdInPrint ? '11.5%' : '23%'}} />}
                  {showUsdInPrint && <col style={{width: showUahInPrint ? '11.5%' : '23%'}} />}
                  {showUahInPrint && <col style={{width: showUsdInPrint ? '11.5%' : '23%'}} />}
               </colgroup>
               <thead>
                  <tr>
                     <th>№</th>
                     <th>Найменування товару / послуги</th>
                     <th>Од.</th>
                     <th>Кіл-ть</th>
                     {showUsdInPrint && <th style={{fontSize: '0.8rem'}}>Ціна, $</th>}
                     {showUahInPrint && <th style={{fontSize: '0.8rem'}}>Ціна, грн</th>}
                     {showUsdInPrint && <th style={{fontSize: '0.8rem'}}>Сума, $</th>}
                     {showUahInPrint && <th style={{fontSize: '0.8rem'}}>Сума, грн</th>}
                  </tr>
               </thead>
               <tbody>
                  {(() => {
                     const rows = [];

                     Object.keys(calculations.groups).forEach((gk) => {
                        (calculations.groups[gk] || []).forEach((it) => {
                           if (toNumber(it.sumUsd, 0) === 0 && toNumber(it.sumUah, 0) === 0) return;
                           const qty = toNumber(it.quantity, 0);
                           const unitPriceUsd = qty > 0 ? toNumber(it.sumUsd, 0) / qty : 0;
                           rows.push({
                              key: `g-${gk}-${it.id}`,
                              name: (it.type ? it.type + " " : "") + it.name,
                              unit: it.unit,
                              qty: it.quantity,
                              unitPriceUsd: toNumber(it.priceNormalizedUsd, unitPriceUsd),
                              priceUah: toNumber(it.priceUah, unitPriceUsd * toNumber(rates.usd, 0)),
                              sumUsd: it.sumUsd,
                              sumUah: it.sumUah
                           });
                        });
                     });

                     (calculations.processedWorkItems || []).forEach((it) => {
                        if (toNumber(it.sumUsd, 0) === 0 && toNumber(it.sumUah, 0) === 0) return;
                        rows.push({
                           key: `w-${it.id}`,
                           name: it.name,
                           unit: 'посл.',
                           qty: it.quantity,
                           unitPriceUsd: toNumber(it.priceNormalizedUsd || 0, 0),
                           priceUah: it.priceUah,
                           sumUsd: it.sumUsd,
                           sumUah: it.sumUah
                        });
                     });

                     (calculations.processedOtherExpenses || []).forEach((it) => {
                        if (toNumber(it.sumUsd, 0) === 0 && toNumber(it.sumUah, 0) === 0) return;
                        rows.push({
                           key: `o-${it.id}`,
                           name: it.name,
                           unit: 'посл.',
                           qty: it.quantity,
                           unitPriceUsd: toNumber(it.priceNormalizedUsd || 0, 0),
                           priceUah: it.priceUah,
                           sumUsd: it.sumUsd,
                           sumUah: it.sumUah
                        });
                     });

                     if (toNumber(calculations.sums.installPercentAmountUsd, 0) > 0) {
                        rows.push({
                           key: 'install-percent-work',
                           name: 'Монтажні і пусконалагоджувальні роботи',
                           unit: 'посл.',
                           qty: 1,
                           unitPriceUsd: toNumber(calculations.sums.installPercentAmountUsd, 0),
                           priceUah: toNumber(calculations.sums.installPercentAmountUsd, 0) * toNumber(rates.usd, 0),
                           sumUsd: toNumber(calculations.sums.installPercentAmountUsd, 0),
                           sumUah: toNumber(calculations.sums.installPercentAmountUsd, 0) * toNumber(rates.usd, 0)
                        });
                     }

                     return rows.map((row, idx) => (
                        <tr key={row.key} className={idx % 2 === 1 ? 'print-alt-row' : ''}>
                           <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1.02rem'}}>{idx + 1}</td>
                           <td style={{wordBreak: 'break-word', overflowWrap: 'break-word'}}>{row.name}</td>
                           <td style={{textAlign: 'center', whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1.02rem'}}>{row.unit}</td>
                           <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1.02rem'}}>{row.qty}</td>
                           {showUsdInPrint && <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1rem'}}>{formatMoney(row.unitPriceUsd)}</td>}
                           {showUahInPrint && <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1rem'}}>{formatMoney(row.priceUah)}</td>}
                           {showUsdInPrint && <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1rem'}}>{formatMoney(row.sumUsd)}</td>}
                           {showUahInPrint && <td className="text-right" style={{whiteSpace: 'nowrap', fontSize: printMode === 'invoice' ? '0.9rem' : '1rem'}}>{formatMoney(row.sumUah)}</td>}
                        </tr>
                     ));
                  })()}
               </tbody>
               <tfoot>
                  {printMode === 'offer' && hasOfferDiscount && (
                    <tr className="print-total-row">
                      <td colSpan="4" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem'}}>ЗАГАЛОМ ДО СПЛАТИ (БЕЗ ЗНИЖКИ):</td>
                      {showUsdInPrint && (
                        <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          ${totalBeforeDiscountUsdParts.whole},{totalBeforeDiscountUsdParts.frac}
                        </td>
                      )}
                      {showUahInPrint && (
                        <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          {totalBeforeDiscountUahParts.whole},{totalBeforeDiscountUahParts.frac} грн
                        </td>
                      )}
                    </tr>
                  )}
                  {printMode === 'offer' && hasOfferDiscount && (
                    <tr className="print-total-row">
                      <td colSpan="4" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem'}}>ЗНИЖКА ({formatKw(toNumber(calculations.sums.discountPercent, 0))}%):</td>
                      {showUsdInPrint && (
                        <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          -${discountUsdParts.whole},{discountUsdParts.frac}
                        </td>
                      )}
                      {showUahInPrint && (
                        <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: '0.98rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          -{discountUahParts.whole},{discountUahParts.frac} грн
                        </td>
                      )}
                    </tr>
                  )}
                  <tr className="print-total-row">
                     <td colSpan="4" className="text-right" style={{fontWeight: 'bold', fontSize: printMode === 'invoice' ? '0.98rem' : '1.1rem'}}>
                        {printMode === 'offer' && hasOfferDiscount ? 'ЗАГАЛОМ ДО СПЛАТИ (ЗІ ЗНИЖКОЮ):' : 'ЗАГАЛОМ ДО СПЛАТИ:'}
                     </td>
                     {showUsdInPrint && (
                       <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: printMode === 'invoice' ? '0.98rem' : '1.05rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          ${totalUsdParts.whole},{totalUsdParts.frac}
                       </td>
                     )}
                     {showUahInPrint && (
                       <td colSpan="2" className="text-right" style={{fontWeight: 'bold', fontSize: printMode === 'invoice' ? '0.98rem' : '1.05rem', whiteSpace: 'nowrap', lineHeight: 1.1}}>
                          {totalUahParts.whole},{totalUahParts.frac} грн
                       </td>
                     )}
                  </tr>
               </tfoot>
            </table>
            {printMode === 'offer' && includeManagerInOffer && <OfferManagerBar />}
            </div>

            {printMode === 'invoice' && (
              <div style={{marginTop: '3rem', color: '#000', display: 'flex', justifyContent: 'space-between'}}>
                 <div>Здав: ___________________</div>
                 <div>Прийняв: ___________________</div>
              </div>
            )}

            {printMode === 'offer' && showOfferStationSheet && (
              <>
                <div className="offer-page-break"></div>
                <div className="offer-station-sheet offer-station-sheet-new-page">
                  <div className="offer-station-title-row">
                    <h2>Дані станції</h2>
                  </div>
                  <div className={`offer-insight-grid ${hasSolar ? '' : 'no-generation'}`} style={{marginTop: '0.65rem'}}>
                    {hasSolar && (
                      <div className="offer-gen-block">
                        <h3>Генерація по місяцях</h3>
                        <div className="offer-gen-tag">{formatMoney(annualGenerationKwh).replace(',00', '')} кВт•год / рік</div>
                        <div className="offer-gen-meta">
                          Орієнтовний середній показник для обраної області ({generationLocation}), не точний індивідуальний прогноз.
                        </div>
                        <div className="offer-bars offer-bars-with-axis">
                          <div className="offer-axis">
                            {(() => {
                              const maxVal = Math.max(...monthlyGeneration, 1);
                              const top = Math.ceil(maxVal / 25) * 25;
                              const mid = Math.round(top / 2);
                              return (
                                <>
                                  <span>{top}</span>
                                  <span>{mid}</span>
                                  <span>0</span>
                                </>
                              );
                            })()}
                          </div>
                          {monthlyGeneration.map((val, idx) => {
                            const maxVal = Math.max(...monthlyGeneration, 1);
                            const h = Math.max(12, Math.round((val / maxVal) * 180));
                            return (
                              <div key={`st-m-${idx}`} className="offer-bar-item">
                                <div className="offer-bar" style={{height: `${h}px`}}></div>
                                <div className="offer-bar-label">{monthLabels[idx]}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="offer-benefits-block">
                      <h3>Як працює система</h3>
                      <div className="offer-benefits-cards">
                        {hasSolar && (
                          <div className="offer-benefit-card orange">
                            <div className="offer-benefit-title">День</div>
                            <div className="offer-benefit-text">Панелі -> живлення об’єкта</div>
                            <div className="offer-benefit-text">Надлишок -> заряд АКБ</div>
                          </div>
                        )}
                        <div className="offer-benefit-card blue">
                          <div className="offer-benefit-title">Ніч / Відключення</div>
                          <div className="offer-benefit-text">АКБ -> живлення</div>
                          <div className="offer-benefit-text">Автоматично, без перебоїв</div>
                        </div>
                        <div className="offer-benefit-card green">
                          <div className="offer-benefit-title">Автономія</div>
                          <div className="offer-benefit-text">Резерв критичних ліній</div>
                        </div>
                        <div className="offer-benefit-card navy">
                          <div className="offer-benefit-title">Захист</div>
                          <div className="offer-benefit-text">Швидкий автоперехід</div>
                        </div>
                        {hasSolar && (
                          <div className="offer-benefit-card eco">
                            <div className="offer-benefit-title">Екологія</div>
                            <div className="offer-benefit-text">~{formatMoney((annualGenerationKwh * 0.48) / 1000).replace(',00', '')} т CO₂/рік менше</div>
                          </div>
                        )}
                        <div className="offer-benefit-card warranty">
                          <div className="offer-benefit-title">Гарантії</div>
                          <div className="offer-benefit-text">15 / 10 / 5 років на обладнання</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="offer-station-economics">
                    <div className="offer-station-economics-card">
                      <h3>Економіка та автономність</h3>
                      <div className="offer-station-list">
                        <div><span>Економія/рік:</span><strong>{hasSolar ? (formatMoney(annualSavingsUah) + " грн") : "—"}</strong></div>
                        <div><span>Окупність:</span><strong>{hasSolar && paybackYears > 0 ? (formatKw(paybackYears) + " років") : "—"}</strong></div>
                        <div><span>Автономність АКБ:</span><strong>{autonomyHours > 0 ? (formatKw(autonomyHours) + " год") : "—"}</strong></div>
                        <div><span>Тариф:</span><strong>{formatKw(toNumber(energyTariffUah, 0))} грн/кВт·год</strong></div>
                        <div><span>Типове навантаження:</span><strong>{formatKw(toNumber(typicalLoadKw, 0))} кВт</strong></div>
                      </div>
                    </div>
                    {coverQrSrc && (
                      <div className="offer-station-qr-card">
                        <img src={coverQrSrc} alt="QR контакт" crossOrigin="anonymous" />
                        <div>Скануй для зв’язку</div>
                      </div>
                    )}
                  </div>
                  {includeManagerInOffer && <OfferManagerBar />}
                </div>
              </>
            )}

            <div className="no-print" style={{marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
               {printMode === 'offer' && (
                 <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.6rem', width: '100%'}}>
                   <input
                     ref={offerAppendPdfInputRef}
                     type="file"
                     accept="application/pdf,.pdf"
                     multiple
                     style={{display: 'none'}}
                     onChange={(e) => {
                       addOfferAppendPdfFiles(e.target?.files);
                     }}
                   />
                   <div
                     onDragOver={(e) => { e.preventDefault(); }}
                     onDrop={(e) => {
                       e.preventDefault();
                       addOfferAppendPdfFiles(e.dataTransfer?.files);
                     }}
                     style={{width: '100%', maxWidth: '560px', border: '1px dashed #64748b', borderRadius: '10px', padding: '0.8rem', color: '#cbd5e1'}}
                   >
                     Перетягніть PDF сюди або
                     <button type="button" className="secondary" style={{background: '#475569', marginLeft: '0.5rem'}} onClick={() => offerAppendPdfInputRef.current?.click()}>
                       Додати PDF до КП
                     </button>
                     <div style={{fontSize: '0.85rem', marginTop: '0.35rem'}}>Максимум 5 файлів</div>
                   </div>
                   {offerAppendPdfFiles.length > 0 && (
                     <div style={{width: '100%', maxWidth: '560px', textAlign: 'left'}}>
                       {offerAppendPdfFiles.map((f, idx) => (
                         <div key={`${f.name}-${f.size}-${f.lastModified}`} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.25rem'}}>
                           <span style={{fontSize: '0.9rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                             {idx + 1}. {f.name}
                           </span>
                           <button
                             type="button"
                             className="danger"
                             style={{padding: '0.35rem 0.7rem'}}
                             onClick={() => setOfferAppendPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                           >
                             Видалити
                           </button>
                         </div>
                       ))}
                       <button
                         type="button"
                         className="danger"
                         style={{padding: '0.5rem 0.8rem', marginTop: '0.5rem'}}
                         onClick={() => {
                           setOfferAppendPdfFiles([]);
                           if (offerAppendPdfInputRef.current) offerAppendPdfInputRef.current.value = '';
                         }}
                       >
                         Очистити всі PDF
                       </button>
                     </div>
                   )}
                 </div>
               )}
               <button onClick={() => window.print()} style={{background: '#0284c7', padding: '1rem 2rem'}}>🖨 Відкрити друк</button>
               <button onClick={exportToPdf} style={{background: '#059669', padding: '1rem 2rem'}}>💾 Зберегти в PDF</button>
               {printMode === 'invoice' && (
                  <button onClick={() => exportToExcel('invoice')} style={{background: '#3b82f6', padding: '1rem 2rem'}}>📊 Зберегти Накладну в Excel</button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    alert('Помилка: елемент #root не знайдено в index.html');
  } else {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
  }
} catch (e) {
  alert('Помилка рендерінгу: ' + e.message);
  console.error(e);
}
