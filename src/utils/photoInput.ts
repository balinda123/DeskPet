export interface ValidatedPhoto {
  file: File;
  dataUrl: string;
}

export async function validatePetPhotos(files: FileList | File[]): Promise<ValidatedPhoto[]> {
  const selected = Array.from(files);
  if (selected.length < 3 || selected.length > 8) {
    throw new Error('请上传 3-8 张宠物照片。');
  }

  const invalid = selected.find((file) => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
  if (invalid) {
    throw new Error(`不支持的图片格式：${invalid.name}`);
  }

  const tooLarge = selected.find((file) => file.size > 8 * 1024 * 1024);
  if (tooLarge) {
    throw new Error(`图片过大：${tooLarge.name}，单张请控制在 8MB 以内。`);
  }

  return Promise.all(selected.map(async (file) => ({ file, dataUrl: await readFileAsDataUrl(file) })));
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error(`读取图片失败：${file.name}`));
    reader.readAsDataURL(file);
  });
}
