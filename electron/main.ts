import { app, BrowserWindow, ipcMain, screen, Tray, Menu } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Makes the window click-through depending on content
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  const url = VITE_DEV_SERVER_URL || 'http://localhost:5173';
  if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools({ mode: 'detach' }); // Open devtools for debugging
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Catch console logs from the renderer to help debugging
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (at ${sourceId}:${line})`);
  });

  // Handle IPC to set ignore mouse events dynamically
  ipcMain.on('set-ignore-mouse-events', (event, ignore: boolean, options?: { forward: boolean }) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });
}

function createTray() {
  // Try to use a default icon, or create a simple tray
  tray = new Tray(path.join(__dirname, '../public/favicon.ico') || path.join(__dirname, '../assets/cat_sp.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: '召唤猫咪', type: 'normal', click: () => { mainWindow?.show(); } },
    { type: 'separator' },
    { label: '退出', type: 'normal', click: () => { app.quit(); } }
  ]);
  tray.setToolTip('桌面宠物猫');
  tray.setContextMenu(contextMenu);
}

app.whenReady().then(() => {
  createWindow();
  // createTray(); // Will uncomment once we have a proper ico/png tray icon ready to avoid crash

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
