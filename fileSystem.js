async function ensureReadWritePermission(handle) {
  if (!handle || typeof handle.queryPermission !== 'function') return true;

  const options = { mode: 'readwrite' };
  try {
    const current = await handle.queryPermission(options);
    if (current === 'granted') return true;
    
    // On Windows, the prompt might be blocked if not triggered by direct user action.
    // We only call requestPermission here, assuming it's part of a user-triggered flow.
    const requested = await handle.requestPermission(options);
    return requested === 'granted';
  } catch (error) {
    console.error('Permission check failed', error);
    return false;
  }
}

async function getNestedDirectoryHandle(rootHandle, folderPath, create = false) {
  const parts = String(folderPath || '')
    .split(/[\/\\]/)
    .map((p) => p.trim())
    .filter(Boolean);

  let current = rootHandle;
  for (const part of parts) {
    const safePart = sanitizeFileName(part);
    current = await current.getDirectoryHandle(safePart, { create });
  }
  return current;
}

const sanitizeFileName = (name = "") => {
  return String(name || "")
    .trim()
    .replace(/[<>:"\/\\|?*\x00-\x1F]/g, "_")
    .replace(/\s+/g, "_")
    .replace(/[._\s]+$/, "")
    .slice(0, 150);
};

const splitFileName = (fileName = '') => {
  const sanitized = sanitizeFileName(fileName);
  const dotIdx = sanitized.lastIndexOf('.');
  if (dotIdx <= 0) return { base: sanitized, ext: '' };
  return {
    base: sanitized.slice(0, dotIdx),
    ext: sanitized.slice(dotIdx)
  };
};

const fileExists = async (dirHandle, candidateName) => {
  try {
    await dirHandle.getFileHandle(candidateName, { create: false });
    return true;
  } catch (_) {
    return false;
  }
};

const getVersionedFileName = async (dirHandle, requestedName) => {
  if (!await fileExists(dirHandle, requestedName)) return requestedName;

  const { base, ext } = splitFileName(requestedName);
  let version = 1;
  while (version < 10000) {
    const candidate = `${base}_v${version}${ext}`;
    if (!await fileExists(dirHandle, candidate)) return candidate;
    version += 1;
  }

  return `${base}_${Date.now()}${ext}`;
};

async function saveToDiskUtility(workspaceHandle, clientInfo, calculations, fileName, blob, typeLabel, projectFolderName = '') {
  const fallbackToDownload = (reasonText = '') => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(link.href);
    const suffix = reasonText ? ` (${reasonText})` : '';
    alert(`${typeLabel} збережено як завантаження${suffix}.`);
    return { ok: true, location: 'download', reason: reasonText || '' };
  };

  if (workspaceHandle) {
    try {
      const hasWorkspacePermission = await ensureReadWritePermission(workspaceHandle);
      if (!hasWorkspacePermission) {
        return fallbackToDownload('немає доступу до робочої папки');
      }

      const safeFolderInput = (projectFolderName || '').trim();
      const address = clientInfo.address || 'Невідомо';
      const stationPowerW = Number(calculations.stationPowerW) || 0;
      const power = stationPowerW > 0 ? (stationPowerW / 1000).toFixed(1) + 'кВт' : '0кВт';
      
      const rawFolderName = safeFolderInput || `${address}_${power}`;
      const folderName = sanitizeFileName(rawFolderName);

      const dirHandle = await workspaceHandle.getDirectoryHandle(folderName, { create: true });
      
      // Small delay for Windows to handle new directory creation
      await new Promise(r => setTimeout(r, 100));

      const resolvedName = await getVersionedFileName(dirHandle, sanitizeFileName(fileName));
      const fileHandle = await dirHandle.getFileHandle(resolvedName, { create: true });
      
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      const versionInfo = resolvedName !== fileName ? ` (${resolvedName})` : '';
      alert(`${typeLabel} збережено у папку ${dirHandle.name}${versionInfo}!`);
      return {
        ok: true,
        location: 'workspace',
        folderName: dirHandle.name,
        fileName: resolvedName
      };
    } catch (error) {
      console.error('File save error', error);
      return fallbackToDownload('помилка доступу до диска');
    }
  }

  return fallbackToDownload('робоча папка не обрана');
}

async function readWorkspaceJson(workspaceHandle, relativePath) {
  if (!workspaceHandle) return null;
  const hasWorkspacePermission = await ensureReadWritePermission(workspaceHandle);
  if (!hasWorkspacePermission) return null;

  try {
    const parts = String(relativePath || '').split(/[\/\\]/).filter(Boolean);
    if (parts.length === 0) return null;
    const rawFileName = parts.pop();
    const fileName = sanitizeFileName(rawFileName);
    const dirPath = parts.join('/');
    const dirHandle = dirPath ? await getNestedDirectoryHandle(workspaceHandle, dirPath, false) : workspaceHandle;
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: false });
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch (_) {
    return null;
  }
}

async function writeWorkspaceJson(workspaceHandle, relativePath, data) {
  if (!workspaceHandle) return false;
  const hasWorkspacePermission = await ensureReadWritePermission(workspaceHandle);
  if (!hasWorkspacePermission) return false;

  try {
    const parts = String(relativePath || '').split(/[\/\\]/).filter(Boolean);
    if (parts.length === 0) return false;
    const rawFileName = parts.pop();
    const fileName = sanitizeFileName(rawFileName);
    const dirPath = parts.join('/');
    const dirHandle = dirPath ? await getNestedDirectoryHandle(workspaceHandle, dirPath, true) : workspaceHandle;
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch (error) {
    console.error('writeWorkspaceJson error', error);
    return false;
  }
}
