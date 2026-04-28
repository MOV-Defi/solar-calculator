const { useState, useMemo, useEffect, useRef } = React;

import { UNITS, INITIAL_GROUPS, EXTERNAL_PRODUCT_DB } from './constants.js';
import { exportToExcelFile } from './exportExcel.js';
import { exportToPdfFile } from './exportPdf.js';
import { saveToDiskUtility, readWorkspaceJson, writeWorkspaceJson } from './fileSystem.js';

const expandableGroups = ["Захист PV", "Захист AC", "Захист DC", "Кріплення"];
const MAIN_TYPES = ["Інвертор", "ФЕП", "АКБ", "BMS", "MPPT контролер", "Cerbo", "Кліматична шафа", "Стійка", "Інше"];
const PROTECTION_TYPES = ["Захист PV", "Захист AC", "Захист DC", "Інше"];
const PROTECTION_GROUP_CHOICES = ["Захист PV", "Захист AC", "Захист DC", "Інше"];
const GROUNDING_TYPES = ["Заземлення", "Інше"];
const CABLE_TYPES = ["Кабель", "Інше"];
const PROJECT_TYPES = {
  project: "Проєктний",
  commercial: "Комерційний"
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
const DEFAULT_OTHER_EXPENSES = [{ id: 1, name: "Транспорт / ПММ", quantity: 1, price: 100, currency: "USD", incomingPrice: 0, markupPercent: 0 }];
const DEFAULT_WORK_ITEMS = [{ id: 1, name: "Монтажні та пусконалагоджувальні роботи", quantity: 1, price: 0, currency: "USD", incomingPrice: 0, markupPercent: 0 }];
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
  incomingPrice: 0
}));
const createDefaultGroupSettings = () => ({
  "Захист PV": { mode: 'fixed', name: 'Захист PV', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0, pvTemplateStrings: 1, pvTemplateType: 'Стандарт', pvCableMetersPerString: 150, pvAutoCableQuantity: true },
  "Захист AC": { mode: 'fixed', name: 'Захист AC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
  "Захист DC": { mode: 'fixed', name: 'Захист DC', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 },
  "Кріплення": { mode: 'fixed', name: 'Кріплення (металочерепиця/профнастил)', price: 0, incomingPrice: 0, currency: 'USD', unit: 'компл', quantity: 1, markupPercent: 0 }
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
  const [equipmentGroups, setEquipmentGroups] = useState(() => getSaved('solar_equipmentGroups', createDefaultGroups()));
  
  const [otherExpenses, setOtherExpenses] = useState(() => getSaved('solar_otherExpenses', cloneList(DEFAULT_OTHER_EXPENSES)));
  const [workItems, setWorkItems] = useState(() => getSaved('solar_workItems', cloneList(DEFAULT_WORK_ITEMS)));
  const [installPercent, setInstallPercent] = useState(() => getSaved('solar_installPercent', 15));
  const [managerCommissionRate, setManagerCommissionRate] = useState(() => getSaved('solar_managerCommissionRate', 10));
  const [clientDiscountPercent, setClientDiscountPercent] = useState(() => getSaved('solar_clientDiscountPercent', 0));
  const [groupSettings, setGroupSettings] = useState(() => getSaved('solar_groupSettings', createDefaultGroupSettings()));

  const [projectName, setProjectName] = useState("");
  const [projectType, setProjectType] = useState(() => getSaved('solar_projectType', 'commercial'));
  const [projectFolderName, setProjectFolderName] = useState(() => getSaved('solar_projectFolderName', ''));
  const [showNewProjectDialog, setShowNewProjectDialog] = useState(false);
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

  useEffect(() => {
    if (projectType !== 'commercial') return;
    if (!Array.isArray(otherExpenses) || otherExpenses.length === 0) return;

    setWorkItems(prev => {
      const normalizedPrev = Array.isArray(prev) ? prev : [];
      const movedItems = otherExpenses.map((item, idx) => ({
        ...item,
        id: Date.now() + idx + 100,
        name: item.name || "Додаткова витрата"
      }));
      return [...normalizedPrev, ...movedItems];
    });
    setOtherExpenses([]);
  }, [projectType, otherExpenses]);

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

  const [printMode, setPrintMode] = useState(null); // null, 'offer', 'invoice'
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
    if (!workspaceHandle) {
      templatesLoadedRef.current = false;
      return;
    }

    let active = true;
    (async () => {
      const templatesCatalog = await readWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE);
      if (!active) return;

      if (templatesCatalog) {
        const normalizedTemplates = normalizeImportedTemplates(templatesCatalog);
        if (normalizedTemplates) {
          setTemplates(normalizedTemplates);
          lastTemplatesSignatureRef.current = getTemplatesCatalogSignature(normalizedTemplates);
        }
      }

      templatesLoadedRef.current = true;
    })();

    return () => { active = false; };
  }, [workspaceHandle]);

  useEffect(() => {
    if (!workspaceHandle || !templatesLoadedRef.current) return;
    if (templatesWriteTimerRef.current) clearTimeout(templatesWriteTimerRef.current);
    templatesWriteTimerRef.current = setTimeout(async () => {
      const signature = getTemplatesCatalogSignature(templates);
      if (signature === lastTemplatesSignatureRef.current) return;
      const payload = buildTemplatesCatalogPayload(templates);
      const ok = await writeWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE, payload);
      if (ok) lastTemplatesSignatureRef.current = signature;
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

  const applyProjectData = (project) => {
    const data = project?.data || {};
    setEquipmentGroups(data.equipmentGroups && typeof data.equipmentGroups === 'object' ? data.equipmentGroups : createDefaultGroups());
    setWorkItems(Array.isArray(data.workItems) ? cloneList(data.workItems) : cloneList(DEFAULT_WORK_ITEMS));
    setOtherExpenses(Array.isArray(data.otherExpenses) ? cloneList(data.otherExpenses) : cloneList(DEFAULT_OTHER_EXPENSES));
    setOfferPurpose(typeof data.offerPurpose === 'string' ? data.offerPurpose : DEFAULT_OFFER_PURPOSE);
    setInstallPercent(data.installPercent ?? 15);
    setRates(data.rates && typeof data.rates === 'object' ? data.rates : DEFAULT_RATES);
    setClientInfo(data.clientInfo && typeof data.clientInfo === 'object' ? data.clientInfo : DEFAULT_CLIENT_INFO);
    setManagerCommissionRate(data.managerCommissionRate ?? 10);
    setClientDiscountPercent(data.clientDiscountPercent ?? 0);
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
  };

  const applyTemplateData = (template) => {
    const data = template?.data || {};
    setEquipmentGroups(data.equipmentGroups && typeof data.equipmentGroups === 'object' ? data.equipmentGroups : createDefaultGroups());
    setWorkItems(Array.isArray(data.workItems) ? cloneList(data.workItems) : cloneList(DEFAULT_WORK_ITEMS));
    setOtherExpenses(Array.isArray(data.otherExpenses) ? cloneList(data.otherExpenses) : cloneList(DEFAULT_OTHER_EXPENSES));
    setOfferPurpose(typeof data.offerPurpose === 'string' ? data.offerPurpose : DEFAULT_OFFER_PURPOSE);
    setInstallPercent(data.installPercent ?? 15);
    setClientDiscountPercent(data.clientDiscountPercent ?? 0);
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
        equipmentGroups,
        otherExpenses,
        workItems,
        installPercent,
        managerCommissionRate,
        clientDiscountPercent,
        groupSettings,
        autoMountingQuantity,
        projectFolderName: computedFolder
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

  const exportProductsCatalog = async () => {
    const payload = buildCatalogPayloadFromPricingMap(productLastValues);
    const fileName = 'products_catalog.json';

    if (workspaceHandle) {
      const saved = await writeWorkspaceJson(workspaceHandle, PRODUCTS_CATALOG_FILE, payload);
      if (saved) {
        lastCatalogSignatureRef.current = JSON.stringify(payload.items || []);
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openCatalogImportPicker = () => {
    const input = document.getElementById('catalog-file-input');
    if (input) input.click();
  };

  const importProductsCatalog = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const normalizedCatalog = Array.isArray(parsed)
          ? { schemaVersion: 1, updatedAt: new Date().toISOString(), items: parsed }
          : parsed;

        if (!normalizedCatalog || !Array.isArray(normalizedCatalog.items)) {
          throw new Error('Invalid catalog format');
        }

        const groupsSnapshot = toGroupsSnapshotFromCatalog(normalizedCatalog);
        if (Object.keys(groupsSnapshot).length > 0) {
          rememberProjectCatalog(groupsSnapshot);
        }

        lastCatalogSignatureRef.current = JSON.stringify(normalizedCatalog.items || []);
        if (workspaceHandle) {
          await writeWorkspaceJson(workspaceHandle, PRODUCTS_CATALOG_FILE, normalizedCatalog);
        }
        alert('Базу товарів імпортовано.');
      } catch (error) {
        console.error('Catalog import error', error);
        alert('Не вдалося імпортувати базу. Перевірте формат JSON.');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const exportTemplatesCatalog = async () => {
    const payload = buildTemplatesCatalogPayload(templates);
    const fileName = 'templates_catalog.json';

    if (workspaceHandle) {
      const saved = await writeWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE, payload);
      if (saved) {
        lastTemplatesSignatureRef.current = getTemplatesCatalogSignature(payload.templates || []);
      }
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const openTemplatesImportPicker = () => {
    const input = document.getElementById('templates-file-input');
    if (input) input.click();
  };

  const importTemplatesCatalog = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const normalizedTemplates = normalizeImportedTemplates(parsed);
        if (!normalizedTemplates) {
          throw new Error('Invalid templates format');
        }

        setTemplates(normalizedTemplates);
        setSelectedTemplateId("");
        setTemplateName("");
        const importedSignature = getTemplatesCatalogSignature(normalizedTemplates);

        if (workspaceHandle) {
          const saved = await writeWorkspaceJson(workspaceHandle, TEMPLATES_CATALOG_FILE, buildTemplatesCatalogPayload(normalizedTemplates));
          if (saved) lastTemplatesSignatureRef.current = importedSignature;
        } else {
          lastTemplatesSignatureRef.current = importedSignature;
        }
        alert('Шаблони імпортовано.');
      } catch (error) {
        console.error('Templates import error', error);
        alert('Не вдалося імпортувати шаблони. Перевірте формат JSON.');
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsText(file);
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
        workItems,
        otherExpenses,
        installPercent,
        clientDiscountPercent,
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
    setEquipmentGroups(createDefaultGroups());
    if (type === 'commercial') {
      setWorkItems(createCommercialWorkItems());
      setOtherExpenses([]);
    } else {
      setWorkItems(cloneList(DEFAULT_WORK_ITEMS));
      setOtherExpenses(cloneList(DEFAULT_OTHER_EXPENSES));
    }
    setInstallPercent(15);
    setManagerCommissionRate(10);
    setClientDiscountPercent(0);
    setAutoMountingQuantity(true);
    setGroupSettings(createDefaultGroupSettings());
    setProjectType(type);
    setProjectName("");
    setProjectFolderName("");
    setTemplateName("");
    setSelectedTemplateId("");
    setNewProtectionType("Захист PV");
    setNewProtectionCustomName("");
    setPrintMode(null);
    setShowNewProjectDialog(false);
  };

  const exportToExcel = async (mode = 'offer', detailLevel = 'summary') => {
    await exportToExcelFile({
      mode,
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
  };

  const exportToPdf = async () => {
    await exportToPdfFile({
      printMode,
      clientInfo,
      calculations,
      workspaceHandle,
      projectFolderName
    });
  };

  const formatMoney = (val) => Number(val).toLocaleString('uk-UA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const applyProductFromCatalog = (groupKey, id, selectedName, categoryKey = groupKey) => {
    updateEquipment(groupKey, id, 'name', selectedName);
    const normalized = String(selectedName || '').trim().toLowerCase();
    const pricing = productLastValues?.[categoryKey]?.[normalized];
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
      [newGroupKey]: { ...template, ...baseSettings, ...(autoQty !== undefined ? { quantity: autoQty } : {}), name: newGroupKey, mode: 'fixed' }
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
  useEffect(() => { localStorage.setItem('solar_equipmentGroups', JSON.stringify(equipmentGroups)); }, [equipmentGroups]);
  useEffect(() => { localStorage.setItem('solar_otherExpenses', JSON.stringify(otherExpenses)); }, [otherExpenses]);
  useEffect(() => { localStorage.setItem('solar_workItems', JSON.stringify(workItems)); }, [workItems]);
  useEffect(() => { localStorage.setItem('solar_installPercent', JSON.stringify(installPercent)); }, [installPercent]);
  useEffect(() => { localStorage.setItem('solar_managerCommissionRate', JSON.stringify(managerCommissionRate)); }, [managerCommissionRate]);
  useEffect(() => { localStorage.setItem('solar_clientDiscountPercent', JSON.stringify(clientDiscountPercent)); }, [clientDiscountPercent]);
  useEffect(() => { localStorage.setItem('solar_groupSettings', JSON.stringify(groupSettings)); }, [groupSettings]);
  useEffect(() => { localStorage.setItem('solar_project_catalog_snapshots', JSON.stringify(projectCatalogSnapshots)); }, [projectCatalogSnapshots]);
  useEffect(() => { localStorage.setItem('solar_mountingTemplateSelection', JSON.stringify(mountingTemplateSelection)); }, [mountingTemplateSelection]);

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
            currency: settings.currency,
            incomingPrice: settings.incomingPrice ?? 0,
            priceUah,
            sumUsd,
            sumUah,
            costUsd,
            marginUsd,
            markupPercent: toNumber(settings.markupPercent, 0),
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
    
    const marginMaterialsUsd = totals.sumUsd - totals.costUsd;
    const marginWorksUsd = workItemsMarginUsd;
    const marginTotalUsd = marginMaterialsUsd + marginWorksUsd; // Брудна маржа (обладнання + роботи)
    
    // Комісія менеджера — від маржі товару (тільки якщо вона позитивна)
    const managerCommissionUsd = Math.max(0, marginMaterialsUsd) * (toNumber(managerCommissionRate, 0) / 100);
    const netMarginUsd = marginTotalUsd - managerCommissionUsd; // Чиста маржа

    const finalTotalUsd = totals.sumUsd + installationTotalUsd + logisticsTotalUsd;
    const discountPercent = Math.max(0, toNumber(clientDiscountPercent, 0));
    const discountUsd = finalTotalUsd * (discountPercent / 100);
    const finalTotalWithDiscountUsd = Math.max(0, finalTotalUsd - discountUsd);
    const finalTotalUah = finalTotalUsd * safeUsdRate;
    const finalTotalEur = eurUsdRate > 0 ? (finalTotalUsd / eurUsdRate) : 0;
    const finalTotalWithDiscountUah = finalTotalWithDiscountUsd * safeUsdRate;
    const finalTotalWithDiscountEur = eurUsdRate > 0 ? (finalTotalWithDiscountUsd / eurUsdRate) : 0;
    const materialsCostWithWorksUsd = totals.costUsd + workItemsCostUsd;
    const orderCostUsd = totals.costUsd + workItemsCostUsd + otherCostsCostUsd;
    const marginMaterialsPercent = totals.sumUsd > 0 ? (marginMaterialsUsd / totals.sumUsd) * 100 : 0;
    const marginWorksPercent = workItemsSumUsd > 0 ? (marginWorksUsd / workItemsSumUsd) * 100 : 0;
    const marginFromOrderPercent = finalTotalWithDiscountUsd > 0 ? (marginTotalUsd / finalTotalWithDiscountUsd) * 100 : 0;

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
        managerCommissionUsd,
        netMarginUsd,
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
  }, [equipmentGroups, rates, modulePower, installPercent, workItems, otherExpenses, managerCommissionRate, clientDiscountPercent, groupSettings]);

  const protectionGroups = useMemo(
    () => Object.keys(calculations.groups).filter(groupKey => groupKey.startsWith("Захист") && groupKey !== "Захист"),
    [calculations.groups]
  );
  const installPercentValue = toNumber(installPercent, 0);
  const installPercentOnlyUsd = calculations.sums.materialsSumUsd * (installPercentValue / 100);
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

  const currentYear = new Date().getFullYear();
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
  const coverMainTitle = isBackupSystem
    ? (coverPowerKnown ? ("Безперебійна система " + formatKw(coverMainPowerKw) + " кВт") : "Безперебійна система")
    : (coverPowerKnown ? ("Гібридна станція " + formatKw(coverMainPowerKw) + " кВт") : "Гібридна станція");
  const coverAddress = clientInfo.address || "____________________";
  const coverPowerLine = coverPowerKnown ? (formatKw(coverMainPowerKw) + " кВт") : "—";
  const coverBatteryLine = batteryKwh > 0 ? (formatKw(batteryKwh) + " кВт·год") : (hasBattery ? (batteryRows.reduce((acc, row) => acc + toNumber(row.quantity, 0), 0) + " шт.") : "—");
  const coverInverterLine = hasInverter
    ? ((inverterPowerKw > 0 ? (formatKw(inverterPowerKw) + " кВт") : "—") + (inverterTotalUah > 0 ? (" · " + formatMoney(inverterTotalUah) + " грн") : ""))
    : "—";
  const coverSubtitle = (offerPurpose || DEFAULT_OFFER_PURPOSE).trim() || DEFAULT_OFFER_PURPOSE;
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
            <h1>Калькулятор СЕС v3.0</h1>
            <div style={{fontSize: '0.92rem', color: 'var(--text-muted)', marginTop: '0.25rem'}}>
              Тип поточного проєкту: <strong style={{color: 'var(--accent-yellow)'}}>{PROJECT_TYPES[projectType] || PROJECT_TYPES.commercial}</strong>
            </div>
            {projectFolderName && (
              <div style={{fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.15rem'}}>
                Папка проєкту: <strong style={{color: 'var(--accent-mint)'}}>{projectFolderName}</strong>
              </div>
            )}
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
            <button type="button" className="secondary menu-action-btn" data-cat="folder" style={{background: '#ef4444'}} onClick={openProjectFolder} data-title="Папка проєкту"><MenuBtnLabel icon="📂" label="Папка проєкту" /></button>
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
                <input 
                  type="text" 
                  value={workspacePath} 
                  onChange={(e) => setWorkspacePath(e.target.value)} 
                  placeholder="Абсолютний шлях до робочої папки (для Windows)..." 
                  style={{fontSize: '0.75rem', padding: '0.3rem 0.5rem', opacity: 0.8}} 
                  title="Вкажіть шлях (напр. D:\Solar\Projects), щоб кнопка 'Відкрити папку' працювала стабільно на Windows"
                />
              </div>
              <button type="button" className="secondary light-surface-btn menu-action-btn" data-cat="project" onClick={saveProject} data-title="Зберегти проєкт"><MenuBtnLabel icon="💾" label="Зберегти проєкт" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="project" style={{background: '#374151'}} onClick={openProjectPicker} data-title="Відкрити проєкт"><MenuBtnLabel icon="📂" label="Відкрити проєкт" /></button>
              <input id="project-file-input" type="file" accept=".calkproj,.json,.solar.json" onChange={openProjectFromFile} style={{display: 'none'}} />
              <button type="button" className="secondary menu-action-btn" data-cat="data" style={{background: '#0e7490'}} onClick={exportProductsCatalog} data-title="Експорт бази"><MenuBtnLabel icon="⬇️" label="Експорт бази" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="data" style={{background: '#0369a1'}} onClick={openCatalogImportPicker} data-title="Імпорт бази"><MenuBtnLabel icon="⬆️" label="Імпорт бази" /></button>
              <input id="catalog-file-input" type="file" accept=".json" onChange={importProductsCatalog} style={{display: 'none'}} />
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
              <button type="button" className="secondary menu-action-btn" data-cat="template" style={{background: '#0e7490'}} onClick={exportTemplatesCatalog} data-title="Експорт шаблонів"><MenuBtnLabel icon="⬇️" label="Експорт шаблонів" /></button>
              <button type="button" className="secondary menu-action-btn" data-cat="template" style={{background: '#0369a1'}} onClick={openTemplatesImportPicker} data-title="Імпорт шаблонів"><MenuBtnLabel icon="⬆️" label="Імпорт шаблонів" /></button>
              <input id="templates-file-input" type="file" accept=".json" onChange={importTemplatesCatalog} style={{display: 'none'}} />
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

      <div className="card" style={{marginTop: '-0.25rem'}}><div className="input-group" style={{margin: 0}}><label>Підзаголовок КП</label><input type="text" value={offerPurpose} onChange={(e) => setOfferPurpose(e.target.value)} placeholder="для власних потреб / для підприємства / ..." /></div></div>

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

      <div className="card table-container" style={{padding: '0'}}>
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
        <table>
          {["Основне обладнання", "ЗАХИСТ", "Кріплення", "Кабельна продукція", "Заземлення", "Інші групи"].map(sectionKey => {
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
                    <td colSpan="3"></td>
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
                        <span>{groupKey.toUpperCase()}</span>
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
                          </div>
                        </div>
                      </td>
                      <td><select value={item.unit} onChange={(e) => updateEquipment(groupKey, item.id, 'unit', e.target.value)}>{UNITS.map(u => <option key={u} value={u}>{u}</option>)}</select></td>
                      <td><input type="number" className="text-right" value={item.quantity} onChange={(e) => updateEquipment(groupKey, item.id, 'quantity', e.target.value)} disabled={autoMountingQuantity} title={autoMountingQuantity ? 'Авто-кількість увімкнена' : ''} /></td>
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
                    <td colSpan="3"></td>
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
                  const categoryLabel = (groupKey === "Основне обладнання" && item.type) ? item.type : groupKey;
                  const datalistId = `db-${categoryLabel.replace(/\s+/g, '-')}`;

                  return (
                    <tr key={item.id}>
                      <td className="col-name">
                        <div className="equipment-cell">
                          {(groupKey === "Основне обладнання" || groupKey === "Захист" || groupKey === "Заземлення" || groupKey === "Кабельна продукція") && (
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
                            {activeDropdown === `${groupKey}-${item.id}` && productDatabase[categoryLabel] && productDatabase[categoryLabel].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).length > 0 && (
                               <div className="autocomplete-dropdown">
                                 {productDatabase[categoryLabel].filter(n => n.toLowerCase().includes((item.name || "").toLowerCase())).map(n => (
                                    <div key={n} className="autocomplete-item" onMouseDown={() => applyProductFromCatalog(groupKey, item.id, n, categoryLabel)}>
                                      {n}
                                    </div>
                                 ))}
                               </div>
                            )}
                          </div>
                          {item.type === "ФЕП" && (
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
                  <td colSpan="3"></td>
                </tr>
              </tbody>
            ));
          })}
        </table>
      </div>

      {projectType === 'commercial' ? (
      <div className="card table-container" style={{padding: '0'}}>
        <div className="flex justify-between items-center" style={{padding: '1.5rem', paddingBottom: '1rem'}}>
          <h2 style={{margin: 0}}>Монтаж та запуск станції (Комерційний шаблон)</h2>
          <button type="button" className="secondary" onClick={() => addItem(setWorkItems, "Нова робота / витрата")}>+ Додати позицію</button>
        </div>
        <div className="flex" style={{gap: '1rem', padding: '0 1.5rem 1.5rem'}}>
          <div style={{flex: 1}}>
            <table style={{border: '1px solid var(--border-color)'}}>
              <thead>
                <tr style={{backgroundColor: '#1E1E1E'}}>
                  <th className="col-name text-left">Найменування робіт / витрат</th>
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
                    <td><input type="text" className="equipment-name-input" value={it.name} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'name', e.target.value)} placeholder="Назва роботи / витрати" /></td>
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
                   <td colSpan="6" className="text-right font-bold">Всього за монтажем та запуском:</td>
                   <td className="text-right font-bold text-blue">${formatMoney(calculations.workItemsSumUsd)}</td>
                   <td className="text-right font-bold text-blue">₴{formatMoney(calculations.workItemsSumUah)}</td>
                   <td className="text-right font-bold internal-only">${formatMoney(calculations.workItemsCostUsd || 0)}</td>
                   <td></td>
                   <td className="text-right font-bold text-yellow internal-only">${formatMoney(calculations.workItemsMarginUsd || 0)}</td>
                   <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="input-group" style={{minWidth: '250px', background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
            <label style={{color: 'var(--accent-blue)', fontWeight: 'bold'}}>Додатковий % за монтаж</label>
            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>(від вартості обладнання)</div>
            <div className="flex items-center" style={{gap: '1rem'}}>
              <input type="number" style={{width: '80px', fontSize: '1.2rem', fontWeight: 'bold'}} value={installPercent} onChange={(e) => setInstallPercent(parseNumberInput(e.target.value))} />
              <div style={{flex: 1}}>
                <div className="font-bold text-blue" style={{fontSize: '1.2rem'}}>${formatMoney(installPercentOnlyUsd)}</div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>₴{formatMoney(installPercentOnlyUah)}</div>
              </div>
            </div>
            <div style={{marginTop: '0.9rem', borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: '0.8rem'}}>
              <div style={{fontSize: '0.78rem', color: 'var(--text-muted)'}}>Частка блоку монтаж/запуск від вартості товару</div>
              <div className="font-bold" style={{fontSize: '1.1rem', color: 'var(--accent-yellow)'}}>{commercialServicePercent.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
      ) : (
      <>
      <div className="card table-container" style={{padding: '0'}}>
        <div className="flex justify-between items-center" style={{padding: '1.5rem', paddingBottom: '1rem'}}>
          <h2 style={{margin: 0}}>Монтажні роботи</h2>
          <button type="button" className="secondary" onClick={() => addItem(setWorkItems, "Новий вид робіт")}>+ Додати роботу</button>
        </div>
        <div className="flex" style={{gap: '1rem', padding: '0 1.5rem 1.5rem'}}>
          <div style={{flex: 1}}>
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
                    <td><input type="text" className="equipment-name-input" value={it.name} onChange={(e) => updateList(workItems, setWorkItems, it.id, 'name', e.target.value)} placeholder="Назва робіт" /></td>
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
                   <td colSpan="6" className="text-right font-bold">Всього за роботами:</td>
                   <td className="text-right font-bold text-blue">${formatMoney(calculations.workItemsSumUsd)}</td>
                   <td className="text-right font-bold text-blue">₴{formatMoney(calculations.workItemsSumUah)}</td>
                   <td className="text-right font-bold internal-only">${formatMoney(calculations.workItemsCostUsd || 0)}</td>
                   <td></td>
                   <td className="text-right font-bold text-yellow internal-only">${formatMoney(calculations.workItemsMarginUsd || 0)}</td>
                   <td></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="input-group" style={{minWidth: '250px', background: 'rgba(59, 130, 246, 0.05)', padding: '1.5rem', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)'}}>
            <label style={{color: 'var(--accent-blue)', fontWeight: 'bold'}}>Додатковий % за монтаж</label>
            <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem'}}>(від вартості обладнання)</div>
            <div className="flex items-center" style={{gap: '1rem'}}>
              <input type="number" style={{width: '80px', fontSize: '1.2rem', fontWeight: 'bold'}} value={installPercent} onChange={(e) => setInstallPercent(parseNumberInput(e.target.value))} />
              <div style={{flex: 1}}>
                <div className="font-bold text-blue" style={{fontSize: '1.2rem'}}>${formatMoney(installPercentOnlyUsd)}</div>
                <div style={{fontSize: '0.85rem', color: 'var(--text-muted)'}}>₴{formatMoney(installPercentOnlyUah)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="card table-container" style={{padding: '0'}}>
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
                  <td><input type="text" className="equipment-name-input" value={exp.name} onChange={(e) => updateList(otherExpenses, setOtherExpenses, exp.id, 'name', e.target.value)} placeholder="Назва витрати" /></td>
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
                 <td colSpan="6" className="text-right font-bold">Всього за іншими витратами:</td>
                 <td className="text-right font-bold text-blue">${formatMoney(calculations.otherCostsUsd)}</td>
                 <td className="text-right font-bold text-blue">₴{formatMoney(calculations.otherCostsUah)}</td>
                 <td className="text-right font-bold internal-only">${formatMoney(calculations.otherCostsCostUsd || 0)}</td>
                 <td></td>
                 <td className="text-right font-bold text-yellow">${formatMoney(calculations.otherCostsMarginUsd || 0)}</td>
                 <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}

      <div className="card">
        <div className="grid grid-cols-2" style={{gap: '3rem'}}>
          <div>
            <h2>Резюме проєкту</h2>
            <div className="summary-list" style={{marginTop: '1rem'}}>
              <div className="flex justify-between py-1 border-b">
                <span>Проєктна потужність станції:</span>
                <span className="font-bold text-yellow" style={{fontSize: '1.2rem'}}>{calculations.stationPowerW.toFixed(0)} Вт</span>
              </div>
              {/* БЛОК ОБЛАДНАННЯ */}
              <div className="summary-block" style={{background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 'bold'}}>📦 ОБЛАДНАННЯ</div>
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
              <div className="summary-block" style={{background: 'rgba(30, 41, 59, 0.5)', borderRadius: '8px', padding: '1rem', marginBottom: '1.5rem', border: '1px solid rgba(148, 163, 184, 0.1)'}}>
                <div style={{fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#94a3b8', marginBottom: '0.75rem', fontWeight: 'bold'}}>🛠️ РОБОТИ ТА ПОСЛУГИ</div>
                
                {toNumber(installPercent, 0) > 0 && (
                  <div className="flex justify-between py-1" style={{fontSize: '0.95rem', opacity: 0.9}}>
                    <span>Монтаж та запуск ({toNumber(installPercent, 0)}%):</span>
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
                <label>Комісія менеджера (%) від маржі товару</label>
                <input type="number" value={managerCommissionRate} onChange={(e) => setManagerCommissionRate(parseNumberInput(e.target.value))} />
              </div>
              <div className="input-group" style={{margin: 0, flex: 1}}>
                <label>Сума комісії ($)</label>
                <div className="font-bold" style={{color: '#fff', background: '#173f7a', padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--border-color)'}}>${formatMoney(calculations.sums.managerCommissionUsd)}</div>
              </div>
            </div>
            
            <div className="summary-card internal-only" style={{marginTop: '2rem'}}>
              <div className="summary-item highlight">
                <h3>Кінцева чиста маржа (Прибуток компанії)</h3>
                <div className="summary-value" style={{color: 'var(--accent-green)'}}>${formatMoney(calculations.sums.netMarginUsd)}</div>
              </div>
            </div>
          </div>

          <div>
            <h2>Разом до сплати (Клієнт)</h2>
            <div className="input-group" style={{marginBottom: '1rem'}}>
              <label>Знижка клієнту (%)</label>
              <input type="number" value={clientDiscountPercent} onChange={(e) => setClientDiscountPercent(parseNumberInput(e.target.value))} />
            </div>
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
          </div>
        </div>
      </div>
      </div>

      {showNewProjectDialog && (
        <div className="project-modal-overlay">
          <div className="project-modal-card">
            <h3 style={{marginBottom: '0.5rem'}}>Створити новий проєкт</h3>
            <p style={{color: 'var(--text-muted)', marginBottom: '1rem'}}>Оберіть тип нового проєкту:</p>
            <div className="flex" style={{gap: '0.75rem'}}>
              <button type="button" className="secondary" style={{background: '#0e7490', flex: 1}} onClick={() => startNewProject('project')}>
                Проєктний
              </button>
              <button type="button" className="secondary" style={{background: '#1d4ed8', flex: 1}} onClick={() => startNewProject('commercial')}>
                Комерційний
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
          <div className={`print-container ${printMode === 'offer' ? 'offer-print-container' : ''}`}>
            {printMode === "offer" && (
              <div className="offer-cover-page" style={{backgroundImage: "url(./title1.jpg)"}}>
                <button className="secondary no-print offer-cover-close" onClick={() => setPrintMode(null)}>Закрити</button>
                <div className="offer-cover-content">
                  <div className="offer-cover-top">КОМЕРЦІЙНА ПРОПОЗИЦІЯ · {currentYear}</div>
                  <h1 className="offer-cover-title">{coverMainTitle}</h1>
                  <div className="offer-cover-subtitle">{coverSubtitle}</div>
                  <div className="offer-cover-address">📍 {coverAddress}</div>
                  <div className="offer-cover-metrics">
                    <div>Потужність: {coverPowerLine}</div>
                    <div>Акумулятор: {coverBatteryLine}</div>
                    <div>Інвертор: {coverInverterLine}</div>
                    <div>Вартість: {formatMoney(calculations.sums.finalTotalWithDiscountUah)} грн</div>
                  </div>
                </div>
              </div>
            )}
            {printMode === 'offer' && <div className="offer-page-break"></div>}
            <div className={printMode === 'invoice' ? 'invoice-print-header' : ''} style={{marginBottom: '1.5rem', color: '#000'}}>
              {printMode === 'invoice' ? (
                <>
                  <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'}}>
                    <img src="./SolarLogo3.png" alt="Solar Service" style={{height: '88px', objectFit: 'contain'}} />
                    <button className="secondary no-print" onClick={() => setPrintMode(null)}>Закрити</button>
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
                  <button className="secondary no-print" onClick={() => setPrintMode(null)}>Закрити</button>
                </div>
              )}

              <div className="invoice-customer">
                <p><strong>Замовник:</strong> {clientInfo.name || "____________________"}</p>
                <p><strong>Адреса:</strong> {clientInfo.address || "____________________"}</p>
              </div>
            </div>

            <table className="print-table">
               <thead>
                  <tr>
                     <th>№</th>
                     <th>Найменування товару / послуги</th>
                     <th>Од.</th>
                     <th>Кіл-ть</th>
                     <th>Ціна, $</th>
                     <th>Ціна, грн</th>
                     <th>Сума, $</th>
                     <th>Сума, грн</th>
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
                              unitPriceUsd,
                              priceUah: it.priceUah,
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

                     return rows.map((row, idx) => (
                        <tr key={row.key} className={idx % 2 === 1 ? 'print-alt-row' : ''}>
                           <td className="text-right">{idx + 1}</td>
                           <td>{row.name}</td>
                           <td>{row.unit}</td>
                           <td className="text-right">{row.qty}</td>
                           <td className="text-right">{formatMoney(row.unitPriceUsd)}</td>
                           <td className="text-right">{formatMoney(row.priceUah)}</td>
                           <td className="text-right">{formatMoney(row.sumUsd)}</td>
                           <td className="text-right">{formatMoney(row.sumUah)}</td>
                        </tr>
                     ));
                  })()}
               </tbody>
               <tfoot>
                  <tr className="print-total-row">
                     <td colSpan="6" className="text-right" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>ЗАГАЛОМ ДО СПЛАТИ:</td>
                     <td className="text-right" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>${formatMoney(calculations.sums.finalTotalWithDiscountUsd)}</td>
                     <td className="text-right" style={{fontWeight: 'bold', fontSize: '1.1rem'}}>{formatMoney(calculations.sums.finalTotalWithDiscountUah)} грн</td>
                  </tr>
               </tfoot>
            </table>

            <div style={{marginTop: '3rem', color: '#000', display: 'flex', justifyContent: 'space-between'}}>
               <div>Здав: ___________________</div>
               <div>Прийняв: ___________________</div>
            </div>

            <div className="no-print" style={{marginTop: '2rem', textAlign: 'center', display: 'flex', gap: '1rem', justifyContent: 'center'}}>
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

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
