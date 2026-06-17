import { app, BrowserWindow, ipcMain, screen } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
let mainWindow = null;
const getPetAssetPath = () => path.join(app.getPath("userData"), "pet-assets", "current.json");
async function ensurePetAssetDir() {
  await fs.mkdir(path.dirname(getPetAssetPath()), { recursive: true });
}
function registerPetAssetIpc() {
  ipcMain.handle("pet-asset:load", async () => {
    try {
      const raw = await fs.readFile(getPetAssetPath(), "utf8");
      return JSON.parse(raw);
    } catch (error) {
      const code = error.code;
      if (code === "ENOENT") return null;
      throw error;
    }
  });
  ipcMain.handle("pet-asset:save", async (_event, asset) => {
    try {
      await ensurePetAssetDir();
      await fs.writeFile(getPetAssetPath(), JSON.stringify(asset, null, 2), "utf8");
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unknown save error" };
    }
  });
  ipcMain.handle("pet-asset:clear", async () => {
    try {
      await fs.rm(getPetAssetPath(), { force: true });
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Unknown clear error" };
    }
  });
}
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width,
    height,
    x: 0,
    y: 0,
    transparent: true,
    frame: false,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  mainWindow.setIgnoreMouseEvents(true, { forward: true });
  const url = VITE_DEV_SERVER_URL || "http://localhost:5173";
  if (process.env.NODE_ENV === "development" || !app.isPackaged) {
    mainWindow.loadURL(url);
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
  mainWindow.webContents.on("console-message", (event, level, message, line, sourceId) => {
    console.log(`[Renderer Console] ${message} (at ${sourceId}:${line})`);
  });
  ipcMain.on("set-ignore-mouse-events", (event, ignore, options) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win) {
      win.setIgnoreMouseEvents(ignore, options);
    }
  });
}
app.whenReady().then(() => {
  registerPetAssetIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
