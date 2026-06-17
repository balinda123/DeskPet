interface SettingsModalProps {
  scale: number;
  setScale: (s: number) => void;
  speedScale: number;
  setSpeedScale: (s: number) => void;
  onClose: () => void;
}

export function SettingsModal({ scale, setScale, speedScale, setSpeedScale, onClose }: SettingsModalProps) {
  const handleSave = () => {
    localStorage.setItem('pet_scale', scale.toString());
    localStorage.setItem('pet_speed', speedScale.toString());
    onClose();
  };

  return (
    <div
      className="fixed left-1/2 top-1/2 z-[9999] min-w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white/95 p-6 shadow-2xl backdrop-blur-md pointer-events-auto"
      onClick={(event) => event.stopPropagation()}
      onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
      onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
    >
      <h2 className="mb-6 text-xl font-bold text-gray-800">宠物设置</h2>

      <div className="mb-6">
        <label className="mb-2 block text-sm font-medium text-gray-700">小猫大小：{scale.toFixed(1)}x</label>
        <input
          type="range"
          min="0.2"
          max="2.0"
          step="0.1"
          value={scale}
          onChange={(event) => setScale(parseFloat(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>小</span>
          <span>大</span>
        </div>
      </div>

      <div className="mb-8">
        <label className="mb-2 block text-sm font-medium text-gray-700">动作速度：{speedScale.toFixed(1)}x</label>
        <input
          type="range"
          min="0.2"
          max="3.0"
          step="0.1"
          value={speedScale}
          onChange={(event) => setSpeedScale(parseFloat(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200"
        />
        <div className="mt-1 flex justify-between text-xs text-gray-500">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100">
          取消
        </button>
        <button onClick={handleSave} className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white shadow-md shadow-blue-200 hover:bg-blue-600">
          保存设置
        </button>
      </div>
    </div>
  );
}
