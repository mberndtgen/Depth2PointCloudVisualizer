
import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileImage, AlertCircle, RefreshCcw, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
import PointCloudView from './components/PointCloudView';
import InfoPanel from './components/InfoPanel';
import { processDepthMap, formatFileSize, getImageData, extractPointColors } from './utils/imageProcessing';
import { PointCloudData, ImageStats, ViewportSettings } from './types';

const App: React.FC = () => {
  const [pointData, setPointData] = useState<PointCloudData | null>(null);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<ViewportSettings>({
    pointSize: 0.08,
    depthScale: 60,
    sampling: 1,
    colorScheme: 'original',
    useColorImage: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);

  const handleDepthFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid PNG or JPEG depth map.');
      return;
    }

    setIsLoading(true);
    setError(null);
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await processDepthMap(img, settings.depthScale);
            setPointData(result);
            setStats({
              width: img.width,
              height: img.height,
              name: file.name,
              size: formatFileSize(file.size),
              type: file.type,
              pointCount: result.full.positions.length / 3
            });
          } catch (err) {
            setError('Processing failed. The image might be too large.');
          } finally {
            setIsLoading(false);
          }
        };
        img.onerror = () => {
          setError('Failed to load image.');
          setIsLoading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('An error occurred during processing.');
      setIsLoading(false);
    }
  }, [settings.depthScale]);

  const handleColorFile = useCallback(async (file: File) => {
    if (!pointData || !stats) return;
    if (!file.type.startsWith('image/')) {
      setError('Invalid color image format.');
      return;
    }

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width !== stats.width || img.height !== stats.height) {
            setError(`Resolution mismatch! Expected ${stats.width}x${stats.height}`);
            setIsLoading(false);
            return;
          }

          const { data } = getImageData(img);
          const fullSampling = (img.width * img.height) > 1000000 ? 2 : 1;
          const texturedColors = extractPointColors(data, img.width, img.height, fullSampling);
          
          setPointData(prev => prev ? ({
            ...prev,
            full: { ...prev.full, texturedColors }
          }) : null);
          
          setSettings(s => ({ ...s, useColorImage: true }));
          setIsLoading(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Failed to process color mapping.');
      setIsLoading(false);
    }
  }, [pointData, stats]);

  const onDrop = (e: React.DragEvent, type: 'depth' | 'color') => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (type === 'depth') handleDepthFile(file);
      else handleColorFile(file);
    }
  };

  const triggerReset = () => {
    setPointData(null);
    setStats(null);
    setError(null);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#0a0a0a]">
      <nav className="absolute top-0 left-0 w-full px-8 py-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BoxIcon className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white/90">DepthPoint.AI</h1>
            <p className="text-[10px] uppercase tracking-widest text-white/40 font-semibold">Vision Processor</p>
          </div>
        </div>
        
        {pointData && (
          <button 
            onClick={triggerReset}
            className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/60 hover:text-white transition-all text-xs font-medium backdrop-blur-md"
          >
            <RefreshCcw className="w-4 h-4" />
            Clear All
          </button>
        )}
      </nav>

      <main className="flex-1 relative overflow-hidden">
        {pointData ? (
          <>
            <PointCloudView data={pointData} settings={settings} />
            <InfoPanel 
              stats={stats} 
              settings={settings} 
              setSettings={setSettings} 
              hasColorMap={!!pointData.full.texturedColors}
            />

            {/* Color Image Upload Overlay when UseColorImage is enabled but no image uploaded */}
            {settings.useColorImage && !pointData.full.texturedColors && (
              <div 
                className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => onDrop(e, 'color')}
              >
                <div 
                  className="max-w-md w-full bg-[#111] border border-white/10 p-8 rounded-3xl flex flex-col items-center text-center group cursor-pointer"
                  onClick={() => colorInputRef.current?.click()}
                >
                   <div className="w-16 h-16 bg-indigo-500/20 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-105 transition-transform">
                      <ImageIcon className="w-8 h-8" />
                   </div>
                   <h4 className="text-white font-semibold text-lg mb-2">Original Color Image Required</h4>
                   <p className="text-white/40 text-sm mb-6 leading-relaxed px-4">
                     To apply color mapping, upload the original scene image. It must match the depth map resolution ({stats?.width}x{stats?.height}).
                   </p>
                   <button className="px-6 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-bold transition-colors">
                     Select Color Image
                   </button>
                   <input type="file" className="hidden" ref={colorInputRef} onChange={(e) => e.target.files?.[0] && handleColorFile(e.target.files[0])} />
                </div>
              </div>
            )}
          </>
        ) : (
          <div 
            className="w-full h-full flex items-center justify-center p-8"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDrop(e, 'depth')}
          >
            <div className="relative max-w-2xl w-full group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
              
              <div 
                className={`relative bg-[#111] border-2 border-dashed border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center text-center transition-all duration-300 ${isLoading ? 'opacity-50 pointer-events-none' : 'hover:border-indigo-500/50 hover:bg-[#151515] cursor-pointer'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-20 h-20 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Upload className="w-10 h-10 text-indigo-400" />
                </div>
                
                <h3 className="text-2xl font-semibold text-white mb-4">Transform Depth to 3D</h3>
                <p className="text-white/40 max-w-md mb-8 leading-relaxed">
                  Start by uploading your grayscale depth map. 
                  You can later add color mapping for more realistic visualization.
                </p>

                <div className="flex gap-4">
                  <div className="px-4 py-2 bg-white/5 rounded-lg flex items-center gap-2 border border-white/5">
                    <FileImage className="w-4 h-4 text-white/40" />
                    <span className="text-xs text-white/60 font-medium">Depth Map (PNG/JPG)</span>
                  </div>
                </div>

                <input type="file" className="hidden" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleDepthFile(e.target.files[0])} accept="image/*" />

                {isLoading && (
                  <div className="absolute inset-0 bg-[#111]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                    <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-indigo-400 font-medium tracking-wide">Processing Vision Data...</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="absolute -bottom-16 left-0 right-0 flex justify-center animate-in slide-in-from-top-4">
                  <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl flex items-center gap-2 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="px-8 py-4 border-t border-white/5 flex justify-between items-center text-[10px] text-white/20 font-medium uppercase tracking-widest bg-[#0a0a0a]">
        <div>Performance Optimized LOD Renderer v1.2.0</div>
        <div className="flex gap-6">
          <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> System Ready</span>
          <span>© 2024 DepthPoint Visualization</span>
        </div>
      </footer>
    </div>
  );
};

const BoxIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m7.5 4.27 9 5.15" />
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5" />
    <path d="M12 22V12" />
  </svg>
);

export default App;
