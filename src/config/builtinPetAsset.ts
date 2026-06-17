import ANIMATIONS_CONFIG from './animations.json';
import type { PetActionId, PetAnimation, PetAssetManifest } from '../types/petAsset';

interface LegacyAnimation {
  url: string;
  framesArray: { x: number; y: number; w: number; h: number }[];
  fps: number;
  speed: number;
  holdLastFrameMs: number;
}

const LEGACY_ACTION_MAP: Record<string, PetActionId> = {
  walk: 'walk',
  run: 'run',
  play: 'playBall',
  sleep: 'sleep',
};

const convertLegacyAnimation = (action: string, animation: LegacyAnimation): PetAnimation => {
  const loop = action !== 'sleep';
  const canMove = action === 'walk' || action === 'run';
  return {
    spriteUrl: animation.url,
    fps: animation.fps,
    loop,
    locomotionSpeedPxPerSecond: canMove && animation.speed > 0 ? animation.speed * 60 : 0,
    frames: animation.framesArray.map((frame) => ({
      ...frame,
      anchorX: frame.w / 2,
      anchorY: frame.h,
      hitbox: {
        x: frame.w * 0.2,
        y: frame.h * 0.08,
        w: frame.w * 0.6,
        h: frame.h * 0.9,
      },
    })),
  };
};

const legacyAnimations = ANIMATIONS_CONFIG as Record<string, LegacyAnimation>;

export const BUILTIN_PET_ASSET: PetAssetManifest = {
  manifestVersion: 1,
  petId: 'builtin-white-cat',
  displayName: '白猫',
  style: 'watercolor',
  baseFrame: { width: 650, height: 450, floorY: 450 },
  actions: Object.fromEntries(
    Object.entries(legacyAnimations).map(([key, value]) => [
      LEGACY_ACTION_MAP[key] ?? key,
      convertLegacyAnimation(key, value),
    ]),
  ),
};
