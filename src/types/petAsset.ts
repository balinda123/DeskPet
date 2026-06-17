export type PetActionId =
  | 'idle'
  | 'walk'
  | 'run'
  | 'playBall'
  | 'sleep'
  | 'lookLeft'
  | 'lookRight'
  | 'dragged'
  | 'notify';

export type PetStyle = 'watercolor' | 'pixel' | 'anime' | 'soft3d';

export interface PetFrame {
  x: number;
  y: number;
  w: number;
  h: number;
  anchorX: number;
  anchorY: number;
  hitbox: { x: number; y: number; w: number; h: number };
}

export interface PetAnimation {
  spriteUrl: string;
  fps: number;
  loop: boolean;
  locomotionSpeedPxPerSecond: number;
  frames: PetFrame[];
}

export interface PetAssetManifest {
  manifestVersion: 1;
  petId: string;
  displayName: string;
  style: PetStyle;
  baseFrame: { width: number; height: number; floorY: number };
  actions: Partial<Record<PetActionId, PetAnimation>>;
}

export interface StoredPetAsset {
  manifest: PetAssetManifest;
  images: Record<string, string>;
}
