import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

// Import backend Express daemon directly in main process
import '../server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 650,
    titleBarStyle: 'hiddenInset',
    vibrancy: 'under-window',
    visualEffectState: 'active',
    backgroundColor: '#0b0f19',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true
    },
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  setTimeout(() => {
    mainWindow.loadURL('http://localhost:3001');
  }, 500);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
  const iconBuffer = Buffer.from(iconSvg);
  const icon = nativeImage.createFromBuffer(iconBuffer);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('MacClean Studio - System Health');

  const contextMenu = Menu.buildFromTemplate([
    { label: 'MacClean Studio', enabled: false },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Purge RAM Memory',
      click: async () => {
        try {
          await fetch('http://localhost:3001/api/purge-memory', { method: 'POST' });
        } catch (e) {}
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
