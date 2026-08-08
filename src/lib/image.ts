const MAX_DIMENSION = 800;
const MAX_IMAGE_BYTES = 500 * 1024;

export function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Formato de imagem não suportado.'));
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error(`Imagem muito grande (máx. ${Math.round(MAX_IMAGE_BYTES / 1024)} KB).`));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const w = Math.max(1, Math.round(img.width * scale));
        const h = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Erro ao processar a imagem.');
        ctx.drawImage(img, 0, 0, w, h);
        const outType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve(canvas.toDataURL(outType, 0.82));
      } catch {
        reject(new Error('Erro ao processar a imagem.'));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Erro ao processar a imagem.'));
    };
    img.src = url;
  });
}
