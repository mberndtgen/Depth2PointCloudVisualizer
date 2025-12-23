
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
}
