
import { PointCloudData, PointBuffer } from '../types';

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const extractPoints = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  sampling: number,
  depthScale: number
): PointBuffer => {
  const step = Math.max(1, sampling);
  const count = Math.ceil(width / step) * Math.ceil(height / step);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  let pIdx = 0;
  let cIdx = 0;

  const maxDim = Math.max(width, height);
  const scale = maxDim / 10;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const intensity = (r + g + b) / 3;
      const depth = intensity / 255;

      // Center and scale
      positions[pIdx++] = (x - width / 2) / scale;
      positions[pIdx++] = (height / 2 - y) / scale;
      positions[pIdx++] = (depth * depthScale) / 10;

      colors[cIdx++] = r / 255;
      colors[cIdx++] = g / 255;
      colors[cIdx++] = b / 255;
    }
  }

  return { 
    positions: positions.slice(0, pIdx), 
    colors: colors.slice(0, cIdx) 
  };
};

export const processDepthMap = async (
  img: HTMLImageElement,
  depthScale: number = 60
): Promise<PointCloudData> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  
  if (!ctx) throw new Error('Could not create canvas context');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, img.width, img.height);
  const data = imageData.data;
  
  // Full resolution (or slightly sampled if huge)
  const fullSampling = (img.width * img.height) > 1000000 ? 2 : 1;
  const full = extractPoints(data, img.width, img.height, fullSampling, depthScale);
  
  // Low resolution preview (aggressive sampling for high performance during interaction)
  const previewSampling = Math.max(fullSampling * 4, 8);
  const preview = extractPoints(data, img.width, img.height, previewSampling, depthScale);

  return { full, preview };
};
