import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePetEngine, PetState, Direction, FRAME_WIDTH, FRAME_HEIGHT } from '../hooks/usePetEngine';
import { SettingsModal } from './SettingsModal';

export function CatPet() {
  const [state, setState] = useState<PetState>('walk');
  const [direction, setDirection] = useState<Direction>('right');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  const [scale, setScale] = useState(0.5);
  const [speedScale, setSpeedScale] = useState(1.0);

  useEffect(() => {
    const savedScale = localStorage.getItem('pet_scale');
    if (savedScale) setScale(parseFloat(savedScale));
    
    const savedSpeed = localStorage.getItem('pet_speed');
    if (savedSpeed) setSpeedScale(parseFloat(savedSpeed));
  }, []);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { x } = usePetEngine({ 
    canvasRef, 
    state, 
    direction, 
    setDirection, 
    scale, 
    speedScale, 
    paused: showMenu // Pause the cat movement when menu is open so it's easy to click!
  });

  const displayWidth = FRAME_WIDTH * scale;
  const displayHeight = FRAME_HEIGHT * scale;

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
          marginLeft: -displayWidth / 2, // proper centering
          x, // Drive x from the engine's motion value
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
            className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg flex gap-2 pointer-events-auto whitespace-nowrap z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => { setState('walk'); setShowMenu(false); }} className={`px-3 py-1 text-sm rounded-lg ${state === 'walk' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>散步</button>
            <button onClick={() => { setState('run'); setShowMenu(false); }} className={`px-3 py-1 text-sm rounded-lg ${state === 'run' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>跑</button>
            <button onClick={() => { setState('play'); setShowMenu(false); }} className={`px-3 py-1 text-sm rounded-lg ${state === 'play' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>玩球</button>
            <button onClick={() => { setState('sleep'); setShowMenu(false); }} className={`px-3 py-1 text-sm rounded-lg ${state === 'sleep' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}>睡觉</button>
            
            <div className="w-px h-6 bg-gray-200 mx-1 self-center"></div>
            
            <button 
              onClick={() => { setShowSettings(true); setShowMenu(false); window.electronAPI?.setIgnoreMouseEvents(false); }} 
              className="px-2 py-1 text-sm rounded-lg hover:bg-gray-100 text-gray-700 flex items-center justify-center"
              title="设置"
            >
              ⚙️
            </button>
          </div>
        )}

        <canvas 
          ref={canvasRef}
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          onClick={(e) => {
            e.stopPropagation();
            if (!showSettings) setShowMenu(!showMenu);
          }}
          style={{ width: '100%', height: '100%' }}
        />
      </motion.div>
    </>
  );
}
