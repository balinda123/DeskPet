import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Direction, PetState, usePetEngine } from '../hooks/usePetEngine';
import { SettingsModal } from './SettingsModal';
import type { PetAssetManifest } from '../types/petAsset';

interface CatPetProps {
  asset: PetAssetManifest;
  onOpenGenerator: () => void;
}

export function CatPet({ asset, onOpenGenerator }: CatPetProps) {
  const [state, setState] = useState<PetState>('walk');
  const [direction, setDirection] = useState<Direction>('right');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [speedScale, setSpeedScale] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const savedScale = localStorage.getItem('pet_scale');
    const savedSpeed = localStorage.getItem('pet_speed');
    if (savedScale) setScale(parseFloat(savedScale));
    if (savedSpeed) setSpeedScale(parseFloat(savedSpeed));
  }, []);

  const { x, frameWidth, frameHeight } = usePetEngine({
    asset,
    canvasRef,
    direction,
    paused: showMenu,
    scale,
    setDirection,
    speedScale,
    state,
  });

  const displayWidth = frameWidth * scale;
  const displayHeight = frameHeight * scale;

  return (
    <>
      {showSettings && (
        <SettingsModal
          scale={scale}
          setScale={setScale}
          speedScale={speedScale}
          setSpeedScale={setSpeedScale}
          onClose={() => {
            setShowSettings(false);
            window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
          }}
        />
      )}

      <motion.div
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          width: displayWidth,
          height: displayHeight,
          cursor: 'pointer',
          marginLeft: -displayWidth / 2,
          x,
        }}
        drag
        dragMomentum={false}
        onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
        onMouseLeave={() => {
          if (!showSettings) {
            window.electronAPI?.setIgnoreMouseEvents(true, { forward: true });
          }
        }}
      >
        {showMenu && !showSettings && (
          <div
            className="absolute -top-12 left-1/2 z-50 flex -translate-x-1/2 gap-2 whitespace-nowrap rounded-lg bg-white/90 p-2 shadow-lg backdrop-blur-sm pointer-events-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <MenuButton active={state === 'walk'} onClick={() => switchState('walk')}>散步</MenuButton>
            <MenuButton active={state === 'run'} onClick={() => switchState('run')}>跑步</MenuButton>
            <MenuButton active={state === 'play'} onClick={() => switchState('play')}>玩球</MenuButton>
            <MenuButton active={state === 'sleep'} onClick={() => switchState('sleep')}>睡觉</MenuButton>
            <div className="mx-1 h-6 w-px self-center bg-gray-200" />
            <MenuButton onClick={() => {
              setShowSettings(true);
              setShowMenu(false);
              window.electronAPI?.setIgnoreMouseEvents(false);
            }}>
              设置
            </MenuButton>
            <MenuButton onClick={() => {
              onOpenGenerator();
              setShowMenu(false);
              window.electronAPI?.setIgnoreMouseEvents(false);
            }}>
              生成
            </MenuButton>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={frameWidth}
          height={frameHeight}
          onClick={(event) => {
            event.stopPropagation();
            if (!showSettings) setShowMenu(!showMenu);
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </motion.div>
    </>
  );

  function switchState(nextState: PetState) {
    setState(nextState);
    setShowMenu(false);
  }
}

function MenuButton({ active = false, children, onClick }: { active?: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1 text-sm ${active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
    >
      {children}
    </button>
  );
}
