import type { PetActionId, PetAssetManifest, PetFrame, PetStyle, StoredPetAsset } from '../types/petAsset';
import type { GeneratedActionImages } from './qwenImageProvider';
import type { ValidatedPhoto } from './photoInput';

const FRAME_WIDTH = 360;
const FRAME_HEIGHT = 300;
const FLOOR_Y = 280;

const ACTION_FRAME_COUNT: Partial<Record<PetActionId, number>> = {
  idle: 4,
  walk: 8,
  playBall: 6,
  sleep: 4,
};

const ACTION_FPS: Partial<Record<PetActionId, number>> = {
  idle: 6,
  walk: 10,
  playBall: 8,
  sleep: 4,
};

export async function buildPetAssetFromGeneratedImages(
  images: GeneratedActionImages,
  fallbackPhotos: ValidatedPhoto[],
  style: PetStyle,
): Promise<StoredPetAsset> {
  const sourceImages: GeneratedActionImages = {
    idle: images.idle ?? fallbackPhotos[0]?.dataUrl,
    walk: images.walk ?? fallbackPhotos[1]?.dataUrl ?? fallbackPhotos[0]?.dataUrl,
    playBall: images.playBall ?? fallbackPhotos[2]?.dataUrl ?? fallbackPhotos[0]?.dataUrl,
    sleep: images.sleep ?? fallbackPhotos[0]?.dataUrl,
  };

  const storedImages: Record<string, string> = {};
  const actions: PetAssetManifest['actions'] = {};

  for (const action of ['idle', 'walk', 'playBall', 'sleep'] satisfies PetActionId[]) {
    const source = sourceImages[action];
    if (!source) continue;

    const key = `${action}.png`;
    const frameCount = ACTION_FRAME_COUNT[action] ?? 4;
    const spriteUrl = await createSpriteSheet(source, action, frameCount);
    storedImages[key] = spriteUrl;
    actions[action] = {
      spriteUrl,
      fps: ACTION_FPS[action] ?? 8,
      loop: true,
      locomotionSpeedPxPerSecond: action === 'walk' ? 80 : 0,
      frames: createFrames(frameCount),
    };
  }

  if (actions.walk) {
    actions.run = {
      ...actions.walk,
      fps: 14,
      locomotionSpeedPxPerSecond: 130,
    };
  }

  return {
    manifest: {
      manifestVersion: 1,
      petId: `local-${Date.now()}`,
      displayName: '我的小猫',
      style,
      baseFrame: { width: FRAME_WIDTH, height: FRAME_HEIGHT, floorY: FLOOR_Y },
      actions,
    },
    images: storedImages,
  };
}

function createFrames(frameCount: number): PetFrame[] {
  return Array.from({ length: frameCount }, (_unused, index) => ({
    x: index * FRAME_WIDTH,
    y: 0,
    w: FRAME_WIDTH,
    h: FRAME_HEIGHT,
    anchorX: FRAME_WIDTH / 2,
    anchorY: FLOOR_Y,
    hitbox: {
      x: FRAME_WIDTH * 0.22,
      y: FRAME_HEIGHT * 0.1,
      w: FRAME_WIDTH * 0.56,
      h: FRAME_HEIGHT * 0.78,
    },
  }));
}

async function createSpriteSheet(sourceUrl: string, action: PetActionId, frameCount: number): Promise<string> {
  const image = await loadImage(sourceUrl);
  const canvas = document.createElement('canvas');
  canvas.width = FRAME_WIDTH * frameCount;
  canvas.height = FRAME_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('无法创建精灵图画布。');

  for (let i = 0; i < frameCount; i += 1) {
    drawFrame(ctx, image, action, i, frameCount);
  }

  return canvas.toDataURL('image/png');
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  action: PetActionId,
  index: number,
  frameCount: number,
) {
  const phase = (index / frameCount) * Math.PI * 2;
  const x = index * FRAME_WIDTH;
  const bob = action === 'sleep' ? 0 : Math.sin(phase) * 4;
  const sway = action === 'walk' ? Math.sin(phase) * 10 : action === 'playBall' ? Math.sin(phase) * 6 : 0;
  const scale = action === 'sleep' ? 0.62 : 0.72 + Math.sin(phase) * 0.015;
  const maxW = FRAME_WIDTH * scale;
  const maxH = FRAME_HEIGHT * (action === 'sleep' ? 0.68 : 0.82);
  const imageRatio = image.width / image.height;
  const targetW = imageRatio > 1 ? maxW : maxH * imageRatio;
  const targetH = imageRatio > 1 ? maxW / imageRatio : maxH;
  const dx = x + (FRAME_WIDTH - targetW) / 2 + sway;
  const dy = FLOOR_Y - targetH + bob;

  ctx.save();
  ctx.clearRect(x, 0, FRAME_WIDTH, FRAME_HEIGHT);
  ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
  ctx.shadowBlur = 10;
  ctx.drawImage(image, dx, dy, targetW, targetH);
  ctx.restore();

  if (action === 'playBall') {
    ctx.save();
    ctx.fillStyle = '#de6f8f';
    ctx.beginPath();
    ctx.arc(x + FRAME_WIDTH * 0.72 + Math.sin(phase) * 18, FLOOR_Y - 20, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x + FRAME_WIDTH * 0.72 + Math.sin(phase) * 18, FLOOR_Y - 20, 10, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('图片加载失败，无法生成精灵图。'));
    image.src = src;
  });
}
