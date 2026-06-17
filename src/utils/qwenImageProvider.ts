import type { PetActionId, PetStyle } from '../types/petAsset';
import type { ValidatedPhoto } from './photoInput';

export interface QwenImageSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export type GeneratedActionImages = Partial<Record<PetActionId, string>>;

const ACTION_PROMPTS: Record<PetActionId, string> = {
  idle: 'standing calmly, cute desktop pet pose, transparent or plain background',
  walk: 'walking side view, cute desktop pet animation key pose, transparent or plain background',
  run: 'running side view, energetic but readable desktop pet pose, transparent or plain background',
  playBall: 'playing with a small yarn ball, cute desktop pet pose, transparent or plain background',
  sleep: 'sleeping curled up, cute desktop pet pose, transparent or plain background',
  lookLeft: 'looking to the left, curious face, cute desktop pet pose',
  lookRight: 'looking to the right, curious face, cute desktop pet pose',
  dragged: 'being gently picked up, relaxed cute desktop pet pose',
  notify: 'sitting and calling attention, cute desktop pet pose',
};

export async function generateQwenActionImages(
  photos: ValidatedPhoto[],
  style: PetStyle,
  settings: QwenImageSettings,
): Promise<GeneratedActionImages> {
  if (!settings.apiKey.trim()) {
    throw new Error('请先填写阿里云百炼 API Key。');
  }

  const actions: PetActionId[] = ['idle', 'walk', 'playBall', 'sleep'];
  const output: GeneratedActionImages = {};

  for (const action of actions) {
    output[action] = await generateSingleActionImage(action, photos, style, settings);
  }

  return output;
}

async function generateSingleActionImage(
  action: PetActionId,
  photos: ValidatedPhoto[],
  style: PetStyle,
  settings: QwenImageSettings,
): Promise<string> {
  const prompt = [
    'Create a single full-body cat desktop pet sprite keyframe.',
    `Style: ${style}.`,
    `Action: ${ACTION_PROMPTS[action]}.`,
    'Preserve the pet identity from the reference photos: fur color, face shape, markings, eye color, and body proportions.',
    'Keep the whole cat visible, centered, no text, no humans, no extra animals.',
  ].join(' ');

  const response = await fetch(`${settings.baseUrl.replace(/\/$/, '')}/images/generations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: settings.model,
      prompt,
      n: 1,
      size: '1024x1024',
      response_format: 'b64_json',
      images: photos.slice(0, 3).map((photo) => photo.dataUrl),
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Qwen Image 生成失败：${response.status} ${message.slice(0, 180)}`);
  }

  const data = await response.json() as {
    data?: Array<{ b64_json?: string; url?: string }>;
    output?: { results?: Array<{ url?: string; b64_json?: string }> };
  };
  const first = data.data?.[0] ?? data.output?.results?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  if (first?.url) return first.url;

  throw new Error('Qwen Image 返回结果中没有图片。');
}
