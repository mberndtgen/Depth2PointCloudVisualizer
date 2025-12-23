
export interface ImageStats {
  width: number;
  height: number;
  name: string;
  size: string;
  type: string;
  pointCount: number;
}

export interface PointBuffer {
  positions: Float32Array;
  colors: Float32Array;
  texturedColors?: Float32Array; // Stored separately to switch between grayscale and color mapping
}

export interface PointCloudData {
  full: PointBuffer;
  preview: PointBuffer;
}

export interface ViewportSettings {
  pointSize: number;
  depthScale: number;
  sampling: number;
  colorScheme: 'original' | 'depth' | 'plasma';
  useColorImage: boolean;
}
