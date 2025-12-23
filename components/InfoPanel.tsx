
import React from 'react';
import { ImageStats, ViewportSettings } from '../types';
import { Info, Box, LayoutGrid, Cpu, Image as ImageIcon } from 'lucide-react';

interface InfoPanelProps {
  stats: ImageStats | null;
  settings: ViewportSettings;
  setSettings: React.Dispatch<React.SetStateAction<ViewportSettings>>;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ stats, settings, setSettings }) => {
  if (!stats) return null;

  return (
    <div className="absolute top-4 right-4 w-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 z-10 transition-all duration-500 animate-in fade-in slide-in-from-right-4">
      <header className="flex items-center gap-3">
        <div className="p-2 bg-indigo-500/20 rounded-lg">
          <Info className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-white/90">Image Assets</h2>
          <p className="text-[10px] text-white/40 uppercase tracking-wider">Metadata Insight</p>
        </div>
      </header>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <LayoutGrid className="w-4 h-4 text-white/40 mb-2" />
            <p className="text-[10px] text-white/40 uppercase font-medium">Resolution</p>
            <p className="text-sm text-white/80 font-mono">{stats.width} × {stats.height}</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <Cpu className="w-4 h-4 text-white/40 mb-2" />
            <p className="text-[10px] text-white/40 uppercase font-medium">Points</p>
            <p className="text-sm text-white/80 font-mono">{(stats.pointCount / 1000).toFixed(1)}k</p>
          </div>
        </div>

        <div className="bg-white/5 p-4 rounded-xl border border-white/5">
           <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] text-white/40 uppercase font-medium">Filename</span>
              <ImageIcon className="w-3 h-3 text-white/30" />
           </div>
           <p className="text-xs text-white/80 truncate font-medium">{stats.name}</p>
           <p className="text-[10px] text-white/40 mt-1">{stats.size}</p>
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Point Size</label>
            <span className="text-[10px] font-mono text-indigo-400">{settings.pointSize.toFixed(2)}</span>
          </div>
          <input 
            type="range" 
            min="0.01" 
            max="0.5" 
            step="0.01"
            value={settings.pointSize}
            onChange={(e) => setSettings({...settings, pointSize: parseFloat(e.target.value)})}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Depth Scale</label>
            <span className="text-[10px] font-mono text-indigo-400">{settings.depthScale}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="150" 
            step="1"
            value={settings.depthScale}
            onChange={(e) => setSettings({...settings, depthScale: parseInt(e.target.value)})}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      </div>
    </div>
  );
};

export default InfoPanel;
