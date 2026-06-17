export {};

declare global {
  interface Window {
    electronAPI?: {
      setIgnoreMouseEvents: (ignore: boolean, options?: { forward: boolean }) => void;
      loadPetAsset: () => Promise<unknown | null>;
      savePetAsset: (asset: unknown) => Promise<{ ok: boolean; error?: string }>;
      clearPetAsset: () => Promise<{ ok: boolean; error?: string }>;
    };
  }
}
