const MAX_BYTES = 1_400_000;

/**
 * Resize and compress image to JPEG data URL for storage.
 */
export function fileToCompressedDataUrl(file, maxWidth = 960, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        const scale = w > maxWidth ? maxWidth / w : 1;
        const cw = Math.max(1, Math.round(w * scale));
        const ch = Math.max(1, Math.round(h * scale));
        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, cw, ch);
        let dataUrl;
        try {
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        } catch (e) {
          reject(e);
          return;
        }
        if (dataUrl.length > MAX_BYTES) {
          reject(new Error("Image is still too large after compression. Try a smaller photo."));
          return;
        }
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Could not read image."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
}

export function dataUrlFromPasteEvent(e, maxWidth = 960, quality = 0.82) {
  const items = e.clipboardData?.items;
  if (!items) return Promise.reject(new Error("No clipboard data."));
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.type.startsWith("image/")) {
      const f = it.getAsFile();
      if (f) return fileToCompressedDataUrl(f, maxWidth, quality);
    }
  }
  return Promise.reject(new Error("No image in clipboard."));
}
