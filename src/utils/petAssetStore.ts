import type { StoredPetAsset } from '../types/petAsset';

export async function loadStoredPetAsset(): Promise<StoredPetAsset | null> {
  if (!window.electronAPI?.loadPetAsset) {
    const raw = localStorage.getItem('current_pet_asset');
    if (!raw) return null;
    try {
      const asset = JSON.parse(raw) as unknown;
      return isStoredPetAsset(asset) ? asset : null;
    } catch {
      return null;
    }
  }
  const asset = await window.electronAPI.loadPetAsset();
  return isStoredPetAsset(asset) ? asset : null;
}

export async function saveStoredPetAsset(asset: StoredPetAsset): Promise<void> {
  if (!window.electronAPI?.savePetAsset) {
    localStorage.setItem('current_pet_asset', JSON.stringify(asset));
    return;
  }
  const result = await window.electronAPI.savePetAsset(asset);
  if (!result.ok) throw new Error(result.error ?? '保存宠物资产失败。');
}

export async function clearStoredPetAsset(): Promise<void> {
  if (!window.electronAPI?.clearPetAsset) {
    localStorage.removeItem('current_pet_asset');
    return;
  }
  const result = await window.electronAPI.clearPetAsset();
  if (!result.ok) throw new Error(result.error ?? '清除宠物资产失败。');
}

function isStoredPetAsset(value: unknown): value is StoredPetAsset {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as StoredPetAsset;
  return candidate.manifest?.manifestVersion === 1 && typeof candidate.images === 'object';
}
