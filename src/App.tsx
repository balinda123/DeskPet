import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import './App.css';
import { BUILTIN_PET_ASSET } from './config/builtinPetAsset';
import { CatPet } from './components/CatPet';
import { ChatBubble } from './components/ChatBubble';
import { PetGeneratorWizard } from './components/PetGeneratorWizard';
import { ReminderPanel } from './components/ReminderPanel';
import { loadStoredPetAsset } from './utils/petAssetStore';
import type { PetAssetManifest, StoredPetAsset } from './types/petAsset';

function App() {
  const [asset, setAsset] = useState<PetAssetManifest>(BUILTIN_PET_ASSET);
  const [showGenerator, setShowGenerator] = useState(false);

  useEffect(() => {
    loadStoredPetAsset()
      .then((storedAsset) => {
        if (storedAsset) setAsset(storedAsset.manifest);
      })
      .catch(() => setAsset(BUILTIN_PET_ASSET));
  }, []);

  const handleGenerated = (storedAsset: StoredPetAsset) => {
    setAsset(storedAsset.manifest);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-transparent">
      <ReminderPanel />
      <button
        onClick={() => setShowGenerator(true)}
        className="fixed right-6 bottom-6 z-[9997] rounded-full bg-slate-900 p-3 text-white shadow-lg pointer-events-auto hover:bg-slate-700"
        onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
        title="生成我的小猫"
      >
        <Sparkles size={18} />
      </button>
      <CatPet asset={asset} onOpenGenerator={() => setShowGenerator(true)} />
      <ChatBubble onInteract={() => {}} />
      {showGenerator && <PetGeneratorWizard onClose={() => setShowGenerator(false)} onGenerated={handleGenerated} />}
    </div>
  );
}

export default App;
