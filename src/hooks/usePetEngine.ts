import { useEffect, useMemo, useRef } from 'react';
import { useMotionValue } from 'framer-motion';
import { BUILTIN_PET_ASSET } from '../config/builtinPetAsset';
import type { PetActionId, PetAnimation, PetAssetManifest } from '../types/petAsset';

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
  asset?: PetAssetManifest;
}

export const FRAME_WIDTH = 650;
export const FRAME_HEIGHT = 450;

const STATE_TO_ACTION: Record<PetState, PetActionId> = {
  walk: 'walk',
  run: 'run',
  play: 'playBall',
  sleep: 'sleep',
};

export function usePetEngine({
  canvasRef,
  state,
  direction,
  setDirection,
  scale = 1,
  speedScale = 1,
  paused = false,
  asset = BUILTIN_PET_ASSET,
}: PetEngineOptions) {
  const x = useMotionValue(0);
  const imageCache = useRef<Record<string, HTMLImageElement>>({});
  const currentImageRef = useRef<HTMLImageElement | null>(null);
  const action = STATE_TO_ACTION[state];
  const animation = useMemo(() => resolveAnimation(asset, action), [asset, action]);
  const frameWidth = asset.baseFrame.width;
  const frameHeight = asset.baseFrame.height;

  useEffect(() => {
    const url = animation.spriteUrl;
    currentImageRef.current = null;
    if (imageCache.current[url]) {
      currentImageRef.current = imageCache.current[url];
      return;
    }

    const image = new Image();
    image.onload = () => {
      imageCache.current[url] = image;
      currentImageRef.current = image;
    };
    image.src = url;
  }, [animation.spriteUrl]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = 0;
    let frameAccumulator = 0;
    let currentFrame = 0;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);
      if (!currentImageRef.current) return;

      const deltaMs = lastTime === 0 ? 0 : Math.min(time - lastTime, 80);
      lastTime = time;

      const framesCount = animation.frames.length;
      const frameDuration = 1000 / Math.max(1, animation.fps * speedScale);

      if (!paused && framesCount > 1) {
        frameAccumulator += deltaMs;
        while (frameAccumulator >= frameDuration) {
          const nextFrame = currentFrame + 1;
          currentFrame = animation.loop ? nextFrame % framesCount : Math.min(nextFrame, framesCount - 1);
          frameAccumulator -= frameDuration;
        }
      }

      movePet({
        deltaMs,
        direction,
        frameWidth,
        paused,
        scale,
        setDirection,
        speed: animation.locomotionSpeedPxPerSecond,
        speedScale,
        x,
      });

      drawPetFrame({
        asset,
        ctx,
        direction,
        frame: animation.frames[currentFrame],
        frameHeight,
        frameWidth,
        image: currentImageRef.current,
      });
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [animation, asset, canvasRef, direction, frameHeight, frameWidth, paused, scale, setDirection, speedScale, x]);

  return { x, frameWidth, frameHeight };
}

function movePet({
  deltaMs,
  direction,
  frameWidth,
  paused,
  scale,
  setDirection,
  speed,
  speedScale,
  x,
}: {
  deltaMs: number;
  direction: Direction;
  frameWidth: number;
  paused: boolean;
  scale: number;
  setDirection: (dir: Direction) => void;
  speed: number;
  speedScale: number;
  x: ReturnType<typeof useMotionValue<number>>;
}) {
  if (speed <= 0 || paused || deltaMs <= 0) return;

  const actualSpeed = speed * speedScale;
  const delta = (direction === 'right' ? actualSpeed : -actualSpeed) * (deltaMs / 1000);
  let nextX = x.get() + delta;
  const displayWidth = frameWidth * scale;
  const rightBound = window.innerWidth / 2 - displayWidth / 2;
  const leftBound = -window.innerWidth / 2 + displayWidth / 2;

  if (nextX > rightBound) {
    nextX = rightBound;
    setDirection('left');
  } else if (nextX < leftBound) {
    nextX = leftBound;
    setDirection('right');
  }
  x.set(nextX);
}

function drawPetFrame({
  asset,
  ctx,
  direction,
  frame,
  frameHeight,
  frameWidth,
  image,
}: {
  asset: PetAssetManifest;
  ctx: CanvasRenderingContext2D;
  direction: Direction;
  frame: PetAnimation['frames'][number] | undefined;
  frameHeight: number;
  frameWidth: number;
  image: HTMLImageElement;
}) {
  ctx.clearRect(0, 0, frameWidth, frameHeight);
  if (!frame) return;

  ctx.save();
  if (direction === 'left') {
    ctx.translate(frameWidth, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    image,
    frame.x,
    frame.y,
    frame.w,
    frame.h,
    frameWidth / 2 - frame.anchorX,
    asset.baseFrame.floorY - frame.anchorY,
    frame.w,
    frame.h,
  );
  ctx.restore();
}

function resolveAnimation(asset: PetAssetManifest, action: PetActionId): PetAnimation {
  const preferred = asset.actions[action];
  const fallback = asset.actions.walk ?? BUILTIN_PET_ASSET.actions.walk;
  if (preferred) return preferred;
  if (fallback) return fallback;
  throw new Error('Pet asset is missing a playable walk animation.');
}
