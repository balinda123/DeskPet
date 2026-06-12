import { useEffect, useRef } from 'react';
import { useMotionValue } from 'framer-motion';

export type PetState = 'walk' | 'run' | 'play' | 'sleep';
export type Direction = 'left' | 'right';

interface PetEngineOptions {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  state: PetState;
  direction: Direction;
  setDirection: (dir: Direction) => void;
  scale?: number;
  speedScale?: number;
  paused?: boolean;
}

// Fixed dimensions for the canvas container. We will center and bottom-align the sprites inside this.
export const FRAME_WIDTH = 450;
export const FRAME_HEIGHT = 350;
import ANIMATIONS_CONFIG from '../config/animations.json';

interface AnimationConfig {
  url: string;
  framesArray: {x: number, y: number, w: number, h: number}[];
  fps: number;
  speed: number;
  holdLastFrameMs: number;
}

const ANIMATIONS: Record<PetState, AnimationConfig> = ANIMATIONS_CONFIG as Record<PetState, AnimationConfig>;

export function usePetEngine({ canvasRef, state, direction, setDirection, scale = 1, speedScale = 1, paused = false }: PetEngineOptions) {
  const x = useMotionValue(0);
  // Store an image cache so we don't load the same image multiple times
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const currentImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const url = ANIMATIONS[state].url;
    if (imageCache.current[url]) {
      currentImageRef.current = imageCache.current[url];
    } else {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        imageCache.current[url] = img;
        currentImageRef.current = img;
      };
    }
  }, [state]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastDrawTime = 0;
    let currentFrame = 0;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!currentImageRef.current) return;

      const animConfig = ANIMATIONS[state];
      const framesCount = animConfig.framesArray.length;
      const { fps, speed, holdLastFrameMs } = animConfig;
      
      // Apply speed scale to FPS
      const actualFps = fps * speedScale;
      let frameDuration = 1000 / actualFps;

      // Check if we are holding the last frame
      const isHolding = currentFrame === framesCount - 1 && holdLastFrameMs > 0;
      if (isHolding) {
        frameDuration = holdLastFrameMs;
      }

      if (time - lastDrawTime > frameDuration) {
        currentFrame = (currentFrame + 1) % framesCount;
        lastDrawTime = time;
      }

      // If paused or holding the sit frame, don't update translation
      if (speed > 0 && !paused && !isHolding) {
        const currentX = x.get();
        const screenWidth = window.innerWidth;
        
        // Apply speed scale to movement speed
        const actualSpeed = speed * speedScale;
        const delta = direction === 'right' ? actualSpeed : -actualSpeed;
        let nextX = currentX + delta;
        
        // Display size considering scale
        const displayWidth = FRAME_WIDTH * scale;
        
        const rightBound = screenWidth / 2 - displayWidth / 2;
        const leftBound = -screenWidth / 2 + displayWidth / 2;

        if (nextX > rightBound) {
            nextX = rightBound;
            setDirection('left');
        } else if (nextX < leftBound) {
            nextX = leftBound;
            setDirection('right');
        }
        x.set(nextX);
      }

      ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);
      ctx.save();
      
      if (direction === 'left') {
        ctx.translate(FRAME_WIDTH, 0);
        ctx.scale(-1, 1);
      }

      const f = animConfig.framesArray[currentFrame];
      if (f) {
        // Bottom-center alignment so it looks like it's walking on the floor
        const dx = (FRAME_WIDTH - f.w) / 2;
        const dy = FRAME_HEIGHT - f.h; // Bottom align

        ctx.drawImage(
          currentImageRef.current,
          f.x, f.y, f.w, f.h, // Source
          dx, dy, f.w, f.h    // Destination
        );
      }

      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [canvasRef, state, direction, setDirection, x, scale, speedScale, paused]);

  return { x };
}
