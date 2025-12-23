
import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import * as THREE from 'three';
import { PointCloudData, ViewportSettings, PointBuffer } from '../types';

interface PointCloudViewProps {
  data: PointCloudData;
  settings: ViewportSettings;
}

const Cloud: React.FC<{ buffer: PointBuffer; settings: ViewportSettings; interacting: boolean }> = ({ buffer, settings, interacting }) => {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(buffer.positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(buffer.colors, 3));
    return geo;
  }, [buffer]);

  // Adjust point size slightly during interaction to fill gaps in low-res mode
  const currentPointSize = interacting ? settings.pointSize * 1.5 : settings.pointSize;

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={currentPointSize}
        vertexColors
        transparent
        opacity={interacting ? 0.6 : 0.85}
        sizeAttenuation={true}
        depthWrite={!interacting}
      />
    </points>
  );
};

const PointCloudView: React.FC<PointCloudViewProps> = ({ data, settings }) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeout = useRef<number | null>(null);

  const handleInteractionStart = () => {
    if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
    setIsInteracting(true);
  };

  const handleInteractionEnd = () => {
    // Small delay before switching back to full resolution for smoother feel
    interactionTimeout.current = window.setTimeout(() => {
      setIsInteracting(false);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (interactionTimeout.current) window.clearTimeout(interactionTimeout.current);
    };
  }, []);

  return (
    <div className="w-full h-full bg-[#050505] relative cursor-move">
      <Canvas dpr={[1, 2]} gl={{ antialias: false }}>
        <color attach="background" args={['#050505']} />
        <PerspectiveCamera makeDefault position={[0, 0, 40]} fov={50} />
        <OrbitControls 
          enableDamping 
          dampingFactor={0.1} 
          rotateSpeed={0.8}
          zoomSpeed={1.2}
          minDistance={1}
          maxDistance={200}
          onStart={handleInteractionStart}
          onEnd={handleInteractionEnd}
        />
        
        <ambientLight intensity={0.5} />
        
        <Center>
          <Cloud 
            buffer={isInteracting ? data.preview : data.full} 
            settings={settings} 
            interacting={isInteracting}
          />
        </Center>
      </Canvas>
      
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none transition-opacity duration-300">
        <div className={`px-4 py-2 rounded-full backdrop-blur-md border border-white/5 text-[10px] uppercase tracking-widest font-bold flex gap-4 transition-all duration-300 ${isInteracting ? 'bg-indigo-500/20 text-indigo-300 scale-95 opacity-80' : 'bg-black/40 text-white/40'}`}>
          {isInteracting ? (
            <span className="animate-pulse">Performance Mode Active</span>
          ) : (
            <>
              <span>Left Click: Rotate</span>
              <span>Right Click: Pan</span>
              <span>Scroll: Zoom</span>
            </>
          )}
        </div>
      </div>

      {!isInteracting && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none animate-in fade-in duration-700">
            <span className="text-[9px] uppercase tracking-[0.3em] text-emerald-500/60 font-black">Full Resolution Rendered</span>
        </div>
      )}
    </div>
  );
};

export default PointCloudView;
