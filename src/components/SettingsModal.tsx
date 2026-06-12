import React from 'react';

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
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md p-6 rounded-2xl shadow-2xl z-[9999] pointer-events-auto min-w-[300px]"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-xl font-bold text-gray-800 mb-6">宠物设置</h2>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          小猫大小: {scale.toFixed(1)}x
        </label>
        <input 
          type="range" 
          min="0.2" 
          max="2.0" 
          step="0.1" 
          value={scale} 
          onChange={(e) => setScale(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>小</span>
          <span>大</span>
        </div>
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          动作速率: {speedScale.toFixed(1)}x
        </label>
        <input 
          type="range" 
          min="0.2" 
          max="3.0" 
          step="0.1" 
          value={speedScale} 
          onChange={(e) => setSpeedScale(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>慢</span>
          <span>快</span>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <button 
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
        >
          取消
        </button>
        <button 
          onClick={handleSave}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors shadow-md shadow-blue-200"
        >
          保存设置
        </button>
      </div>
    </div>
  );
}
