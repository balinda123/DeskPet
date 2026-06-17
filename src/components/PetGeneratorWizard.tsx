import { useMemo, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import type { PetStyle, StoredPetAsset } from '../types/petAsset';
import { validatePetPhotos, type ValidatedPhoto } from '../utils/photoInput';
import { generateQwenActionImages } from '../utils/qwenImageProvider';
import { buildPetAssetFromGeneratedImages } from '../utils/spritePostProcessor';
import { saveStoredPetAsset } from '../utils/petAssetStore';

interface PetGeneratorWizardProps {
  onClose: () => void;
  onGenerated: (asset: StoredPetAsset) => void;
}

const DEFAULT_BASE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1';

export function PetGeneratorWizard({ onClose, onGenerated }: PetGeneratorWizardProps) {
  const [photos, setPhotos] = useState<ValidatedPhoto[]>([]);
  const [apiKey, setApiKey] = useState(localStorage.getItem('ALIYUN_API_KEY') ?? '');
  const [baseUrl, setBaseUrl] = useState(localStorage.getItem('ALIYUN_IMAGE_BASE_URL') ?? DEFAULT_BASE_URL);
  const [model, setModel] = useState(localStorage.getItem('ALIYUN_IMAGE_MODEL') ?? 'qwen-image-2.0-pro');
  const [style, setStyle] = useState<PetStyle>('watercolor');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const canGenerate = useMemo(() => photos.length >= 3 && photos.length <= 8 && !busy, [busy, photos.length]);

  const handleFiles = async (files: FileList | null) => {
    setError('');
    if (!files) return;
    try {
      setPhotos(await validatePetPhotos(files));
    } catch (err) {
      setPhotos([]);
      setError(err instanceof Error ? err.message : '图片校验失败。');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setBusy(true);
    setError('');
    localStorage.setItem('ALIYUN_API_KEY', apiKey);
    localStorage.setItem('ALIYUN_IMAGE_BASE_URL', baseUrl);
    localStorage.setItem('ALIYUN_IMAGE_MODEL', model);

    try {
      setStatus('正在调用 Qwen Image 生成动作关键帧...');
      const generatedImages = await generateQwenActionImages(photos, style, { apiKey, baseUrl, model });
      setStatus('正在拼接精灵图和生成资产配置...');
      const asset = await buildPetAssetFromGeneratedImages(generatedImages, photos, style);
      await saveStoredPetAsset(asset);
      onGenerated(asset);
      onClose();
    } catch (err) {
      setStatus('Qwen 生成不可用，正在用上传照片创建本地占位资产...');
      try {
        const asset = await buildPetAssetFromGeneratedImages({}, photos, style);
        await saveStoredPetAsset(asset);
        onGenerated(asset);
        setError(err instanceof Error ? err.message : 'Qwen 生成失败，已使用本地占位资产。');
      } catch (fallbackError) {
        setError(fallbackError instanceof Error ? fallbackError.message : '本地资产生成失败。');
      }
    } finally {
      setBusy(false);
      setStatus('');
    }
  };

  return (
    <div
      className="fixed right-6 top-6 z-[9999] w-[420px] rounded-lg border border-slate-200 bg-white/95 p-5 text-left shadow-2xl backdrop-blur pointer-events-auto"
      onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
      onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">生成我的小猫</h2>
          <p className="mt-1 text-xs text-slate-500">上传 3-8 张照片，生成轻量桌宠资产。</p>
        </div>
        <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} title="关闭">
          <X size={18} />
        </button>
      </div>

      <label className="mb-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center hover:bg-slate-100">
        <ImagePlus className="mb-2 text-slate-500" size={24} />
        <span className="text-sm font-medium text-slate-800">选择宠物照片</span>
        <span className="mt-1 text-xs text-slate-500">JPG / PNG / WebP，单张 8MB 内</span>
        <input type="file" accept="image/png,image/jpeg,image/webp" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
      </label>

      {photos.length > 0 && (
        <div className="mb-4 grid grid-cols-4 gap-2">
          {photos.map((photo) => (
            <img key={photo.file.name} src={photo.dataUrl} alt={photo.file.name} className="h-16 w-full rounded-md object-cover" />
          ))}
        </div>
      )}

      <div className="grid gap-3">
        <Field label="阿里云 API Key">
          <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} type="password" className="input" placeholder="sk-..." />
        </Field>
        <Field label="Base URL">
          <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className="input" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="模型">
            <select value={model} onChange={(e) => setModel(e.target.value)} className="input">
              <option value="qwen-image-2.0-pro">qwen-image-2.0-pro</option>
              <option value="wan2.7-image-pro">wan2.7-image-pro</option>
            </select>
          </Field>
          <Field label="风格">
            <select value={style} onChange={(e) => setStyle(e.target.value as PetStyle)} className="input">
              <option value="watercolor">水彩</option>
              <option value="anime">动漫</option>
              <option value="soft3d">柔和 3D</option>
              <option value="pixel">像素</option>
            </select>
          </Field>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{error}</div>}
      {status && <div className="mt-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-800">{status}</div>}

      <button
        onClick={handleGenerate}
        disabled={!canGenerate}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {busy ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
        生成桌宠资产
      </button>
    </div>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block text-xs font-medium text-slate-600">
      <span className="mb-1 block">{label}</span>
      {children}
    </label>
  );
}
