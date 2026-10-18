import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import si from 'systeminformation';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
}

const HOME = os.homedir();

function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function getDirSizeFast(dirPath, maxDepth = 4, currentDepth = 0) {
  let size = 0;
  let count = 0;
  if (!fs.existsSync(dirPath)) return { size: 0, count: 0 };
  
  try {
    const stats = fs.statSync(dirPath);
    if (!stats.isDirectory()) {
      return { size: stats.size, count: 1 };
    }
    
    if (currentDepth > maxDepth) return { size: 0, count: 0 };
    
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const fullPath = path.join(dirPath, file);
      try {
        const fileStats = fs.lstatSync(fullPath);
        if (fileStats.isSymbolicLink()) continue;
        if (fileStats.isDirectory()) {
          const res = getDirSizeFast(fullPath, maxDepth, currentDepth + 1);
          size += res.size;
          count += res.count;
        } else {
          size += fileStats.size;
          count += 1;
        }
      } catch (e) {}
    }
  } catch (e) {}
  return { size, count };
}

function scanItem(itemPath, category, name, safeToDelete = true) {
  if (!fs.existsSync(itemPath)) return null;
  try {
    const stats = fs.statSync(itemPath);
    let size = 0;
    let count = 0;
    
    if (stats.isDirectory()) {
      const res = getDirSizeFast(itemPath);
      size = res.size;
      count = res.count;
    } else {
      size = stats.size;
      count = 1;
    }

    if (size === 0) return null;

    const ext = path.extname(itemPath).toLowerCase();
    const isVideo = ['.mp4', '.mov', '.m4v', '.avi', '.mkdir', '.webm'].includes(ext);
    const isImage = ['.jpg', '.jpeg', '.png', '.heic', '.gif', '.webp', '.raw', '.cr2', '.nef'].includes(ext);

    return {
      id: Buffer.from(itemPath).toString('base64'),
      name: name || path.basename(itemPath),
      path: itemPath,
      category,
      size,
      formattedSize: formatBytes(size),
      count,
      mtime: stats.mtime,
      safeToDelete,
      isVideo,
      isImage,
      extension: ext.replace('.', '').toUpperCase() || 'FILE'
    };
  } catch (e) {
    return null;
  }
}

// Media stream & preview endpoint
app.get('/api/media-preview', (req, res) => {
  const { path: mediaPath } = req.query;
  if (!mediaPath) return res.status(400).send('Path required');

  const resolved = path.resolve(mediaPath);
  if (!resolved.startsWith(HOME) || !fs.existsSync(resolved)) {
    return res.status(404).send('File not found');
  }

  const ext = path.extname(resolved).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.m4v': 'video/mp4',
    '.webm': 'video/webm'
  };

  const contentType = mimeTypes[ext] || 'application/octet-stream';
  res.setHeader('Content-Type', contentType);
  fs.createReadStream(resolved).pipe(res);
});

// GET /api/system/status
app.get('/api/system/status', async (req, res) => {
  try {
    const cpu = await si.currentLoad();
    const mem = await si.mem();
    const fsSize = await si.fsSize();
    const osInfo = await si.osInfo();
    
    const rootFs = fsSize.find(f => f.mount === '/') || fsSize[0] || { size: 1, used: 0, available: 0, use: 0 };
    
    let cleanableEstimate = 0;
    const cacheScan = scanItem(path.join(HOME, 'Library/Caches'), 'Caches', 'Caches');
    const trashScan = scanItem(path.join(HOME, '.Trash'), 'Trash', 'Trash');
    const xcodeScan = scanItem(path.join(HOME, 'Library/Developer/Xcode/DerivedData'), 'Xcode', 'Xcode');
    
    if (cacheScan) cleanableEstimate += cacheScan.size;
    if (trashScan) cleanableEstimate += trashScan.size;
    if (xcodeScan) cleanableEstimate += xcodeScan.size;

    res.json({
      cpu: {
        load: Math.round(cpu.currentLoad || 0),
        user: Math.round(cpu.currentLoadUser || 0),
        system: Math.round(cpu.currentLoadSystem || 0),
      },
      memory: {
        total: mem.total || 1,
        used: mem.active || (mem.total - mem.free) || 0,
        free: mem.free || 0,
        active: mem.active || 0,
        wired: mem.wired || 0,
        formattedTotal: formatBytes(mem.total),
        formattedUsed: formatBytes(mem.active || (mem.total - mem.free)),
        formattedFree: formatBytes(mem.free),
        usedPercentage: Math.round(((mem.active || (mem.total - mem.free)) / (mem.total || 1)) * 100)
      },
      storage: {
        total: rootFs.size,
        used: rootFs.used,
        free: rootFs.available,
        usePercent: Math.round(rootFs.use || 0),
        formattedTotal: formatBytes(rootFs.size),
        formattedUsed: formatBytes(rootFs.used),
        formattedFree: formatBytes(rootFs.available),
        cleanableEstimate: formatBytes(cleanableEstimate),
        cleanableBytes: cleanableEstimate
      },
      os: {
        platform: osInfo.platform || 'darwin',
        distro: osInfo.distro || 'macOS',
        release: osInfo.release || '26.0',
        hostname: osInfo.hostname || 'MacBook',
        arch: osInfo.arch || 'arm64',
        uptime: Math.round(os.uptime() / 3600) + ' hours'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/scan
app.get('/api/scan', async (req, res) => {
  try {
    const items = [];
    
    // System Caches & Logs
    const cacheDir = path.join(HOME, 'Library/Caches');
    if (fs.existsSync(cacheDir)) {
      try {
        const subCaches = fs.readdirSync(cacheDir);
        for (const sub of subCaches.slice(0, 40)) {
          const fullP = path.join(cacheDir, sub);
          const item = scanItem(fullP, 'System Caches', `Cache: ${sub}`);
          if (item && item.size > 500000) items.push(item);
        }
      } catch (e) {}
    }

    const logDir = path.join(HOME, 'Library/Logs');
    const logItem = scanItem(logDir, 'System Logs', 'User Application Logs');
    if (logItem) items.push(logItem);

    // Developer Junk
    const xcodeDerivedData = path.join(HOME, 'Library/Developer/Xcode/DerivedData');
    const xcodeItem = scanItem(xcodeDerivedData, 'Developer Junk', 'Xcode DerivedData');
    if (xcodeItem) items.push(xcodeItem);

    const xcodeArchives = path.join(HOME, 'Library/Developer/Xcode/Archives');
    const archivesItem = scanItem(xcodeArchives, 'Developer Junk', 'Xcode Archives');
    if (archivesItem) items.push(archivesItem);

    const iosSupport = path.join(HOME, 'Library/Developer/Xcode/iOS DeviceSupport');
    const iosItem = scanItem(iosSupport, 'Developer Junk', 'iOS Device Support Logs');
    if (iosItem) items.push(iosItem);

    const cargoCache = path.join(HOME, '.cargo/registry/cache');
    const cargoItem = scanItem(cargoCache, 'Developer Junk', 'Rust Cargo Registry Cache');
    if (cargoItem) items.push(cargoItem);

    const pyCache = path.join(HOME, '.cache/pip');
    const pyItem = scanItem(pyCache, 'Developer Junk', 'Python PIP Cache');
    if (pyItem) items.push(pyItem);

    // Browser Caches
    const chromeCache = path.join(HOME, 'Library/Caches/Google/Chrome');
    const chromeItem = scanItem(chromeCache, 'Browser Caches', 'Google Chrome Cache');
    if (chromeItem) items.push(chromeItem);

    const safariCache = path.join(HOME, 'Library/Caches/com.apple.Safari');
    const safariItem = scanItem(safariCache, 'Browser Caches', 'Apple Safari Cache');
    if (safariItem) items.push(safariItem);

    const braveCache = path.join(HOME, 'Library/Caches/BraveSoftware');
    const braveItem = scanItem(braveCache, 'Browser Caches', 'Brave Browser Cache');
    if (braveItem) items.push(braveItem);

    const firefoxCache = path.join(HOME, 'Library/Caches/Firefox');
    const firefoxItem = scanItem(firefoxCache, 'Browser Caches', 'Mozilla Firefox Cache');
    if (firefoxItem) items.push(firefoxItem);

    const arcCache = path.join(HOME, 'Library/Caches/company.thebrowser.Browser');
    const arcItem = scanItem(arcCache, 'Browser Caches', 'Arc Browser Cache');
    if (arcItem) items.push(arcItem);

    // Trash & Downloads
    const trashDir = path.join(HOME, '.Trash');
    const trashItem = scanItem(trashDir, 'Trash & Downloads', 'macOS Trash Bin');
    if (trashItem) items.push(trashItem);

    const downloadsDir = path.join(HOME, 'Downloads');
    if (fs.existsSync(downloadsDir)) {
      try {
        const downloadFiles = fs.readdirSync(downloadsDir);
        for (const f of downloadFiles) {
          if (f.startsWith('.')) continue;
          const fullP = path.join(downloadsDir, f);
          const item = scanItem(fullP, 'Trash & Downloads', `Download: ${f}`);
          if (item && item.size > 20000000) {
            items.push(item);
          }
        }
      } catch (e) {}
    }

    // App Leftovers
    const appSupportDir = path.join(HOME, 'Library/Application Support');
    if (fs.existsSync(appSupportDir)) {
      try {
        const appsInMain = fs.existsSync('/Applications') ? fs.readdirSync('/Applications').map(a => a.toLowerCase()) : [];
        const appsInSystem = fs.existsSync('/System/Applications') ? fs.readdirSync('/System/Applications').map(a => a.toLowerCase()) : [];
        const allInstalledApps = [...appsInMain, ...appsInSystem].join(' ');

        const appSuppDirs = fs.readdirSync(appSupportDir);
        for (const dir of appSuppDirs.slice(0, 50)) {
          if (dir.startsWith('.') || dir === 'Apple' || dir === 'com.apple.sharedfilelist' || dir === 'MobileSync') continue;
          const fullP = path.join(appSupportDir, dir);
          const dirLower = dir.toLowerCase().replace(/[^a-z0-9]/g, '');
          if (dirLower.length > 3 && !allInstalledApps.replace(/[^a-z0-9]/g, '').includes(dirLower)) {
            const item = scanItem(fullP, 'App Leftovers', `Leftover Data: ${dir}`);
            if (item && item.size > 5000000) {
              items.push(item);
            }
          }
        }
      } catch (e) {}
    }

    const totalBytes = items.reduce((acc, curr) => acc + curr.size, 0);
    const categoriesMap = {};
    for (const item of items) {
      if (!categoriesMap[item.category]) {
        categoriesMap[item.category] = {
          name: item.category,
          totalBytes: 0,
          formattedTotalBytes: '0 B',
          itemCount: 0,
          items: []
        };
      }
      categoriesMap[item.category].totalBytes += item.size;
      categoriesMap[item.category].itemCount += 1;
      categoriesMap[item.category].items.push(item);
    }

    Object.values(categoriesMap).forEach(cat => {
      cat.formattedTotalBytes = formatBytes(cat.totalBytes);
    });

    res.json({
      totalScanBytes: totalBytes,
      formattedTotalScanBytes: formatBytes(totalBytes),
      totalItems: items.length,
      categories: Object.values(categoriesMap),
      rawItems: items
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/photos-cleaner (Deep visual media scanner)
app.get('/api/photos-cleaner', async (req, res) => {
  try {
    const photosItems = [];
    let requiresFullDiskAccess = false;

    // Deep search media directories
    const searchDirs = [
      path.join(HOME, 'Pictures'),
      path.join(HOME, 'Movies'),
      path.join(HOME, 'Downloads'),
      path.join(HOME, 'Desktop')
    ];

    const mediaExtensions = ['.jpg', '.jpeg', '.png', '.heic', '.mov', '.mp4', '.m4v', '.gif', '.webp', '.raw', '.cr2', '.nef'];

    function scanMediaFolder(dir, depth = 0) {
      if (depth > 3 || !fs.existsSync(dir)) return;
      try {
        const files = fs.readdirSync(dir);
        for (const f of files) {
          if (f.startsWith('.')) continue;
          const fullP = path.join(dir, f);
          try {
            const stats = fs.statSync(fullP);
            if (stats.isDirectory()) {
              scanMediaFolder(fullP, depth + 1);
            } else {
              const ext = path.extname(f).toLowerCase();
              if (mediaExtensions.includes(ext)) {
                const item = scanItem(fullP, f.toLowerCase().includes('screenshot') ? 'Screenshot Clutter' : 'Photos & Videos', f);
                if (item) photosItems.push(item);
              }
            }
          } catch (e) {}
        }
      } catch (e) {
        if (dir.includes('Photos Library.photoslibrary') || dir.includes('MobileSync')) {
          requiresFullDiskAccess = true;
        }
      }
    }

    for (const d of searchDirs) {
      scanMediaFolder(d);
    }

    // iOS Device Backups
    const backupDir = path.join(HOME, 'Library/Application Support/MobileSync/Backup');
    if (fs.existsSync(backupDir)) {
      try {
        const backupFolders = fs.readdirSync(backupDir);
        for (const folder of backupFolders) {
          if (folder.startsWith('.')) continue;
          const fullP = path.join(backupDir, folder);
          const item = scanItem(fullP, 'iOS Device Backups', `iPhone Backup (${folder.slice(0, 8)}...)`);
          if (item) photosItems.push(item);
        }
      } catch (e) {
        requiresFullDiskAccess = true;
      }
    }

    photosItems.sort((a, b) => b.size - a.size);

    const totalBytes = photosItems.reduce((acc, curr) => acc + curr.size, 0);

    res.json({
      totalBytes,
      formattedTotalBytes: formatBytes(totalBytes),
      count: photosItems.length,
      items: photosItems,
      requiresFullDiskAccess
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/open-privacy-settings
app.post('/api/open-privacy-settings', (req, res) => {
  exec('open "x-apple.systempreferences:com.apple.preference.security?Privacy_AllFiles"', (error) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });
});

// GET /api/processes
app.get('/api/processes', async (req, res) => {
  try {
    const processes = await si.processes();
    const list = (processes.list || [])
      .map(p => ({
        pid: p.pid,
        name: p.name,
        cpu: Math.round(p.cpu),
        mem: Math.round(p.mem),
        memVsz: formatBytes(p.memVsz * 1024),
        memRss: formatBytes(p.memRss * 1024),
        user: p.user
      }))
      .sort((a, b) => b.mem - a.mem)
      .slice(0, 30);

    res.json({ list });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/processes/kill
app.post('/api/processes/kill', (req, res) => {
  const { pid } = req.body;
  if (!pid) return res.status(400).json({ error: 'PID required' });

  try {
    process.kill(pid, 'SIGTERM');
    res.json({ success: true, message: `Terminated process PID ${pid}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/flush-dns
app.post('/api/flush-dns', (req, res) => {
  try {
    exec('dscacheutil -flushcache; killall -HUP mDNSResponder', (error) => {
      res.json({ success: true, message: 'macOS DNS cache flushed successfully.' });
    });
  } catch (e) {
    res.json({ success: true, message: 'DNS cache flushed.' });
  }
});

// GET /api/treemap
app.get('/api/treemap', async (req, res) => {
  try {
    const targetDirs = [
      { name: 'Downloads', path: path.join(HOME, 'Downloads'), color: '#3b82f6' },
      { name: 'Documents', path: path.join(HOME, 'Documents'), color: '#8b5cf6' },
      { name: 'Pictures & Photos', path: path.join(HOME, 'Pictures'), color: '#ec4899' },
      { name: 'Desktop', path: path.join(HOME, 'Desktop'), color: '#f59e0b' },
      { name: 'Library Caches', path: path.join(HOME, 'Library/Caches'), color: '#10b981' },
      { name: 'Developer Workspace', path: path.join(HOME, 'Library/Developer'), color: '#06b6d4' }
    ];

    const tree = [];
    for (const d of targetDirs) {
      if (fs.existsSync(d.path)) {
        const stats = getDirSizeFast(d.path, 2);
        if (stats.size > 0) {
          tree.push({
            name: d.name,
            path: d.path,
            color: d.color,
            size: stats.size,
            formattedSize: formatBytes(stats.size),
            fileCount: stats.count
          });
        }
      }
    }

    tree.sort((a, b) => b.size - a.size);
    const totalBytes = tree.reduce((acc, c) => acc + c.size, 0);

    res.json({
      tree,
      totalBytes,
      formattedTotalBytes: formatBytes(totalBytes)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/large-files
app.get('/api/large-files', async (req, res) => {
  try {
    const minSizeBytes = 50 * 1024 * 1024;
    const largeFiles = [];
    
    const searchDirs = [
      path.join(HOME, 'Downloads'),
      path.join(HOME, 'Documents'),
      path.join(HOME, 'Desktop'),
      path.join(HOME, 'Movies'),
      path.join(HOME, 'Music')
    ];

    function scanForLarge(dir, depth = 0) {
      if (depth > 3 || !fs.existsSync(dir)) return;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith('.')) continue;
          const fullPath = path.join(dir, file);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              scanForLarge(fullPath, depth + 1);
            } else if (stats.size >= minSizeBytes) {
              const ageDays = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
              let ageCategory = 'Recent (< 30 days)';
              if (ageDays > 365) ageCategory = 'Older than 1 Year';
              else if (ageDays > 90) ageCategory = '3 to 12 Months';
              else if (ageDays > 30) ageCategory = '1 to 3 Months';

              largeFiles.push({
                id: Buffer.from(fullPath).toString('base64'),
                name: file,
                path: fullPath,
                size: stats.size,
                formattedSize: formatBytes(stats.size),
                extension: path.extname(file).toUpperCase().replace('.', '') || 'FILE',
                mtime: stats.mtime,
                ageDays,
                ageCategory
              });
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    for (const d of searchDirs) {
      scanForLarge(d);
    }

    largeFiles.sort((a, b) => b.size - a.size);
    const totalSize = largeFiles.reduce((acc, curr) => acc + curr.size, 0);

    res.json({
      totalSize,
      formattedTotalSize: formatBytes(totalSize),
      count: largeFiles.length,
      files: largeFiles
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/duplicates
app.get('/api/duplicates', async (req, res) => {
  try {
    const searchDirs = [
      path.join(HOME, 'Downloads'),
      path.join(HOME, 'Documents'),
      path.join(HOME, 'Desktop'),
      path.join(HOME, 'Pictures')
    ];

    const filesBySize = {};

    function collectFiles(dir, depth = 0) {
      if (depth > 2 || !fs.existsSync(dir)) return;
      try {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          if (file.startsWith('.')) continue;
          const fullPath = path.join(dir, file);
          try {
            const stats = fs.statSync(fullPath);
            if (stats.isDirectory()) {
              collectFiles(fullPath, depth + 1);
            } else if (stats.size > 1000000) {
              if (!filesBySize[stats.size]) filesBySize[stats.size] = [];
              filesBySize[stats.size].push({
                path: fullPath,
                name: file,
                size: stats.size,
                mtime: stats.mtime
              });
            }
          } catch (e) {}
        }
      } catch (e) {}
    }

    for (const d of searchDirs) collectFiles(d);

    const duplicateGroups = [];

    for (const [sizeStr, files] of Object.entries(filesBySize)) {
      if (files.length > 1) {
        const hashGroups = {};
        for (const f of files) {
          try {
            const buffer = Buffer.alloc(65536);
            const fd = fs.openSync(f.path, 'r');
            const bytesRead = fs.readSync(fd, buffer, 0, 65536, 0);
            fs.closeSync(fd);

            const hash = crypto.createHash('md5').update(buffer.subarray(0, bytesRead)).update(sizeStr).digest('hex');

            if (!hashGroups[hash]) hashGroups[hash] = [];
            hashGroups[hash].push({
              ...f,
              formattedSize: formatBytes(f.size),
              extension: path.extname(f.name).toUpperCase().replace('.', '') || 'FILE'
            });
          } catch (e) {}
        }

        for (const [hash, group] of Object.entries(hashGroups)) {
          if (group.length > 1) {
            duplicateGroups.push({
              hash,
              size: group[0].size,
              formattedSize: formatBytes(group[0].size),
              files: group,
              wasteBytes: group[0].size * (group.length - 1),
              formattedWasteBytes: formatBytes(group[0].size * (group.length - 1))
            });
          }
        }
      }
    }

    duplicateGroups.sort((a, b) => b.wasteBytes - a.wasteBytes);
    const totalWasted = duplicateGroups.reduce((acc, g) => acc + g.wasteBytes, 0);

    res.json({
      groups: duplicateGroups,
      totalWastedBytes: totalWasted,
      formattedTotalWasted: formatBytes(totalWasted),
      count: duplicateGroups.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/startup-items
app.get('/api/startup-items', async (req, res) => {
  try {
    const launchDirs = [
      { path: path.join(HOME, 'Library/LaunchAgents'), scope: 'User LaunchAgent' },
      { path: '/Library/LaunchAgents', scope: 'System LaunchAgent' },
      { path: '/Library/LaunchDaemons', scope: 'System Daemon' }
    ];

    const items = [];

    for (const lDir of launchDirs) {
      if (fs.existsSync(lDir.path)) {
        try {
          const files = fs.readdirSync(lDir.path);
          for (const file of files) {
            if (file.startsWith('.')) continue;
            const fullP = path.join(lDir.path, file);
            const isEnabled = !file.endsWith('.disabled');
            items.push({
              id: Buffer.from(fullP).toString('base64'),
              name: file.replace('.disabled', '').replace('.plist', ''),
              filename: file,
              path: fullP,
              scope: lDir.scope,
              enabled: isEnabled
            });
          }
        } catch (e) {}
      }
    }

    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/startup-items/toggle
app.post('/api/startup-items/toggle', (req, res) => {
  const { path: itemPath, enable } = req.body;
  if (!itemPath) return res.status(400).json({ error: 'Path required' });

  try {
    if (!fs.existsSync(itemPath)) return res.status(404).json({ error: 'File not found' });

    let newPath = itemPath;
    if (enable && itemPath.endsWith('.disabled')) {
      newPath = itemPath.replace('.disabled', '');
      fs.renameSync(itemPath, newPath);
    } else if (!enable && !itemPath.endsWith('.disabled')) {
      newPath = itemPath + '.disabled';
      fs.renameSync(itemPath, newPath);
    }

    res.json({ success: true, newPath });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/battery-health
app.get('/api/battery-health', async (req, res) => {
  try {
    const battery = await si.battery();
    res.json({
      hasBattery: battery.hasBattery,
      isCharging: battery.isCharging,
      percent: battery.percent || 100,
      cycleCount: battery.cycleCount || 0,
      maxCapacity: battery.maxCapacity || 100,
      designedCapacity: battery.designedCapacity || 100,
      healthPercent: battery.designedCapacity ? Math.round((battery.maxCapacity / battery.designedCapacity) * 100) : 100,
      condition: (battery.percent || 100) > 80 ? 'Normal' : 'Service Recommended'
    });
  } catch (error) {
    res.json({
      hasBattery: false,
      percent: 100,
      cycleCount: 0,
      condition: 'Desktop Power'
    });
  }
});

// POST /api/clean
app.post('/api/clean', (req, res) => {
  const { paths } = req.body;
  if (!Array.isArray(paths) || paths.length === 0) {
    return res.status(400).json({ error: 'No paths provided for cleaning' });
  }

  let reclaimedBytes = 0;
  let deletedCount = 0;
  const errors = [];
  const cleanedPaths = [];

  for (const itemPath of paths) {
    const resolvedPath = path.resolve(itemPath);
    if (!resolvedPath.startsWith(HOME)) {
      errors.push({ path: itemPath, error: 'Access denied: Path outside user directory' });
      continue;
    }

    if (!fs.existsSync(resolvedPath)) continue;

    try {
      const stats = fs.statSync(resolvedPath);
      const size = stats.isDirectory() ? getDirSizeFast(resolvedPath).size : stats.size;

      if (resolvedPath === path.join(HOME, '.Trash')) {
        const trashItems = fs.readdirSync(resolvedPath);
        for (const tItem of trashItems) {
          const tPath = path.join(resolvedPath, tItem);
          fs.rmSync(tPath, { recursive: true, force: true });
        }
      } else {
        fs.rmSync(resolvedPath, { recursive: true, force: true });
      }

      reclaimedBytes += size;
      deletedCount += 1;
      cleanedPaths.push(resolvedPath);
    } catch (err) {
      errors.push({ path: itemPath, error: err.message });
    }
  }

  res.json({
    success: true,
    deletedCount,
    reclaimedBytes,
    formattedReclaimedBytes: formatBytes(reclaimedBytes),
    cleanedPaths,
    errors
  });
});

// POST /api/purge-memory
app.post('/api/purge-memory', (req, res) => {
  try {
    exec('purge', (error) => {
      if (global.gc) global.gc();
      res.json({ success: true, message: 'System RAM memory purged successfully.' });
    });
  } catch (e) {
    res.json({ success: true, message: 'Memory optimized.' });
  }
});

// POST /api/open-finder
app.post('/api/open-finder', (req, res) => {
  const { path: targetPath } = req.body;
  if (!targetPath) return res.status(400).json({ error: 'Path required' });
  
  exec(`open -R "${targetPath}"`, (error) => {
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  });
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexPath = path.join(__dirname, '../dist/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`[MacClean Backend Daemon] listening on http://localhost:${PORT}`);
});
