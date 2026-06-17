"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("electronAPI", {
  setIgnoreMouseEvents: (ignore, options) => electron.ipcRenderer.send("set-ignore-mouse-events", ignore, options),
  loadPetAsset: () => electron.ipcRenderer.invoke("pet-asset:load"),
  savePetAsset: (asset) => electron.ipcRenderer.invoke("pet-asset:save", asset),
  clearPetAsset: () => electron.ipcRenderer.invoke("pet-asset:clear")
});
