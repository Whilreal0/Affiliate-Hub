const MAX_BYTES = 100 * 1024;

export async function preparePreviewImage(input: File): Promise<{ file: File; dataUrl: string }> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(input.type)) {
    throw new Error('Choose a JPG, PNG, WebP, or AVIF image.');
  }
  if (input.size > 12 * 1024 * 1024) throw new Error('Choose an image smaller than 12 MB.');
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input);
  } catch {
    throw new Error('This image could not be opened. Try a JPG or PNG.');
  }
  try {
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image conversion is unavailable in this browser.');
    for (let attempt = 0; attempt < 6; attempt++) {
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', Math.max(0.45, 0.82 - attempt * 0.08))
      );
      if (!blob || blob.type !== 'image/webp')
        throw new Error('Please use a browser that supports WebP conversion.');
      if (blob.size <= MAX_BYTES) {
        const file = new File([blob], `${input.name.replace(/\.[^.]+$/, '') || 'preview'}.webp`, {
          type: 'image/webp'
        });
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = () => reject(new Error('Could not read the converted image.'));
          reader.readAsDataURL(file);
        });
        return { file, dataUrl };
      }
      canvas.width = Math.max(1, Math.round(canvas.width * 0.8));
      canvas.height = Math.max(1, Math.round(canvas.height * 0.8));
    }
    throw new Error('This image could not be compressed enough. Choose another image.');
  } finally {
    bitmap.close();
  }
}
