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
// Precise bounding boxes for the 24 walk frames
const WALK_FRAMES = [
  { x: 60, y: 69, w: 377, h: 306 }, { x: 505, y: 68, w: 378, h: 307 }, { x: 944, y: 69, w: 374, h: 306 },
  { x: 1392, y: 69, w: 374, h: 307 }, { x: 1812, y: 68, w: 371, h: 307 }, { x: 2242, y: 69, w: 357, h: 305 },
  { x: 48, y: 464, w: 397, h: 222 }, { x: 488, y: 467, w: 425, h: 250 }, { x: 943, y: 444, w: 412, h: 221 },
  { x: 1390, y: 434, w: 379, h: 291 }, { x: 1809, y: 495, w: 390, h: 225 }, { x: 2235, y: 470, w: 372, h: 253 },
  { x: 17, y: 956, w: 416, h: 251 }, { x: 478, y: 974, w: 414, h: 232 }, { x: 937, y: 967, w: 400, h: 241 },
  { x: 1380, y: 948, w: 380, h: 260 }, { x: 1810, y: 944, w: 373, h: 264 }, { x: 2237, y: 941, w: 357, h: 267 },
  { x: 52, y: 1335, w: 360, h: 264 }, { x: 538, y: 1323, w: 277, h: 276 }, { x: 995, y: 1281, w: 247, h: 318 },
  { x: 1430, y: 1273, w: 258, h: 326 }, { x: 1860, y: 1273, w: 258, h: 326 }, { x: 2279, y: 1273, w: 256, h: 326 }
];

interface AnimationConfig {
  url: string;
  framesArray: {x: number, y: number, w: number, h: number}[];
  fps: number;
  speed: number;
  holdLastFrameMs: number;
}

const ANIMATIONS: Record<PetState, AnimationConfig> = {
  walk: { url: '/assets/walk_cat_transparent.png', framesArray: WALK_FRAMES, fps: 24, speed: 2, holdLastFrameMs: 3000 },
  // Temporarily fallback all other states to the walk animation until new images are provided
  run: { url: '/assets/walk_cat_transparent.png', framesArray: WALK_FRAMES, fps: 36, speed: 5, holdLastFrameMs: 0 },
  play: { url: '/assets/walk_cat_transparent.png', framesArray: WALK_FRAMES, fps: 12, speed: 0, holdLastFrameMs: 0 },
  sleep: { url: '/assets/walk_cat_transparent.png', framesArray: WALK_FRAMES, fps: 6, speed: 0, holdLastFrameMs: 0 }
};

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
