import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  loadPetAsset: () => ipcRenderer.invoke('pet-asset:load'),
  savePetAsset: (asset: unknown) => ipcRenderer.invoke('pet-asset:save', asset),
  clearPetAsset: () => ipcRenderer.invoke('pet-asset:clear'),
});
