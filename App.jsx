import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const SpectraDemo = () => {
  const canvasRef = useRef(null);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [hoveredLayer, setHoveredLayer] = useState(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);

  const layers = [
    {
      id: 'unet',
      name: 'U-Net Detection',
      description: 'Deep learning model identifies oil spill signatures in SAR imagery',
      color: '#00f2ff',
      position: 0
    },
    {
      id: 'lookalike',
      name: 'Look-alike Classifier',
      description: 'Validates detections and filters false positives from natural phenomena',
      color: '#00ff88',
      position: 1
    },
    {
      id: 'wind',
      name: 'Wind Context (ERA5)',
      description: 'Cross-references wind patterns to confirm spill movement dynamics',
      color: '#ffaa00',
      position: 2
    },
    {
      id: 'sentinel2',
      name: 'Sentinel-2 Validation',
      description: 'Optical satellite confirmation of SAR-detected anomalies',
      color: '#ff00ff',
      position: 3
    },
    {
      id: 'ais',
      name: 'AIS Vessel Attribution',
      description: 'Identifies source vessels using ship tracking data',
      color: '#ff3366',
      position: 4
    }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current, 
      antialias: true, 
      alpha: true 
    });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    
    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    camera.position.set(0, 0, 15);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00f2ff, 1, 100);
    pointLight1.position.set(10, 10, 10);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0xff00ff, 0.8, 100);
    pointLight2.position.set(-10, -10, 10);
    scene.add(pointLight2);

    // Create magnifying glass group
    const magnifyingGlass = new THREE.Group();

    // Glass lens (main)
    const lensGeometry = new THREE.CircleGeometry(2, 64);
    const lensMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x00f2ff,
      transparent: true,
      opacity: 0.15,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.9,
      thickness: 0.5,
      side: THREE.DoubleSide
    });
    const lens = new THREE.Mesh(lensGeometry, lensMaterial);
    magnifyingGlass.add(lens);

    // Lens rim
    const rimGeometry = new THREE.RingGeometry(2, 2.15, 64);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f2ff,
      metalness: 0.9,
      roughness: 0.2,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.3
    });
    const rim = new THREE.Mesh(rimGeometry, rimMaterial);
    magnifyingGlass.add(rim);

    // Handle
    const handleGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 32);
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0x00f2ff,
      metalness: 0.8,
      roughness: 0.3,
      emissive: 0x00f2ff,
      emissiveIntensity: 0.2
    });
    const handle = new THREE.Mesh(handleGeometry, handleMaterial);
    handle.position.set(0, -3.5, 0);
    handle.rotation.z = Math.PI / 4;
    magnifyingGlass.add(handle);

    scene.add(magnifyingGlass);

    // Create glass layers
    const glassLayers = [];
    layers.forEach((layer, index) => {
      const layerGeometry = new THREE.CircleGeometry(1.8, 64);
      const layerMaterial = new THREE.MeshPhysicalMaterial({
        color: layer.color,
        transparent: true,
        opacity: 0.2,
        metalness: 0.1,
        roughness: 0.1,
        transmission: 0.85,
        thickness: 0.3,
        side: THREE.DoubleSide
      });
      const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);
      layerMesh.position.set(0, 0, 0);
      layerMesh.visible = false;
      scene.add(layerMesh);
      glassLayers.push(layerMesh);

      // Layer ring
      const layerRingGeometry = new THREE.RingGeometry(1.8, 1.9, 64);
      const layerRingMaterial = new THREE.MeshStandardMaterial({
        color: layer.color,
        metalness: 0.9,
        roughness: 0.2,
        emissive: layer.color,
        emissiveIntensity: 0.5
      });
      const layerRing = new THREE.Mesh(layerRingGeometry, layerRingMaterial);
      layerMesh.add(layerRing);
    });

    // Animation
    let startTime = Date.now();
    const animationDuration = {
      rotation: 2000,
      position: 1000,
      layerExpansion: 1500,
      totalDelay: 3500
    };

    const animate = () => {
      requestAnimationFrame(animate);

      const elapsed = Date.now() - startTime;

      // Phase 1: Rotation (0-2000ms)
      if (elapsed < animationDuration.rotation) {
        const progress = elapsed / animationDuration.rotation;
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        magnifyingGlass.rotation.y = eased * Math.PI * 2;
        magnifyingGlass.rotation.z = eased * Math.PI * 0.5;
      }
      // Phase 2: Position to left (2000-3000ms)
      else if (elapsed < animationDuration.rotation + animationDuration.position) {
        const progress = (elapsed - animationDuration.rotation) / animationDuration.position;
        const eased = 1 - Math.pow(1 - progress, 3);
        magnifyingGlass.position.x = -6 * eased;
        magnifyingGlass.position.y = 2 * eased;
        magnifyingGlass.rotation.z = Math.PI * 0.5 + (-Math.PI * 0.2 * eased);
      }
      // Phase 3: Layer expansion (3000-4500ms)
      else if (elapsed < animationDuration.totalDelay + animationDuration.layerExpansion) {
        const progress = (elapsed - animationDuration.totalDelay) / animationDuration.layerExpansion;
        
        glassLayers.forEach((layer, index) => {
          const layerDelay = index * 0.15;
          const layerProgress = Math.max(0, Math.min(1, (progress - layerDelay) / (1 - layerDelay)));
          const eased = 1 - Math.pow(1 - layerProgress, 4); // bounce effect

          if (layerProgress > 0) {
            layer.visible = true;
            const spacing = 2.5;
            const targetX = -6 + (index + 1) * spacing * Math.cos(-Math.PI * 0.2);
            const targetY = 2 + (index + 1) * spacing * Math.sin(-Math.PI * 0.2);
            
            // Bounce effect
            const bounce = Math.sin(layerProgress * Math.PI) * 0.3;
            layer.position.x = -6 + (targetX - (-6)) * eased;
            layer.position.y = 2 + (targetY - 2) * eased + bounce;
            layer.position.z = (index + 1) * 0.1 * eased;
            layer.rotation.z = -Math.PI * 0.2 * eased;
          }
        });

        if (progress >= 1 && !animationComplete) {
          setAnimationComplete(true);
        }
      }

      // Gentle floating animation after complete
      if (animationComplete) {
        const time = Date.now() * 0.001;
        magnifyingGlass.position.y += Math.sin(time * 0.5) * 0.002;
        glassLayers.forEach((layer, index) => {
          layer.position.y += Math.sin(time * 0.5 + index * 0.3) * 0.001;
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [animationComplete]);

  return (
    <div className="spectra-demo">
      <canvas ref={canvasRef} className="three-canvas" />
      
      <div className="content-overlay">
        <div className="hero-section">
          <GlitchText text="SPECTRA" className="title" />
          <div className="subtitle">Autonomous Oil Spill Detection System</div>
        </div>

        {animationComplete && (
          <div className="layers-info">
            {layers.map((layer, index) => (
              <LayerLabel
                key={layer.id}
                layer={layer}
                index={index}
                isHovered={hoveredLayer === layer.id}
                onHover={() => setHoveredLayer(layer.id)}
                onLeave={() => setHoveredLayer(null)}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .spectra-demo {
          width: 100vw;
          height: 100vh;
          background: linear-gradient(135deg, #0a0e1a 0%, #1a1f2e 50%, #0a0e1a 100%);
          position: relative;
          overflow: hidden;
          font-family: 'JetBrains Mono', 'Courier New', monospace;
        }

        .spectra-demo::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(0, 242, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(255, 0, 255, 0.1) 0%, transparent 50%);
          pointer-events: none;
        }

        .spectra-demo::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            repeating-linear-gradient(
              0deg,
              rgba(0, 242, 255, 0.03) 0px,
              transparent 1px,
              transparent 2px,
              rgba(0, 242, 255, 0.03) 3px
            );
          pointer-events: none;
          opacity: 0.3;
        }

        .three-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .content-overlay {
          position: relative;
          z-index: 10;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .hero-section {
          position: absolute;
          top: 60px;
          left: 60px;
          pointer-events: none;
        }

        .title {
          font-size: 72px;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #00f2ff;
          text-shadow: 
            0 0 10px rgba(0, 242, 255, 0.5),
            0 0 20px rgba(0, 242, 255, 0.3),
            0 0 40px rgba(0, 242, 255, 0.2);
          margin: 0;
          font-family: 'Space Mono', monospace;
        }

        .subtitle {
          font-size: 16px;
          color: rgba(0, 242, 255, 0.7);
          letter-spacing: 0.3em;
          margin-top: 10px;
          text-transform: uppercase;
          font-weight: 300;
        }

        .layers-info {
          position: absolute;
          right: 80px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 30px;
          pointer-events: auto;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .layers-info > * {
          animation: fadeInUp 0.6s ease-out backwards;
        }

        .layers-info > *:nth-child(1) { animation-delay: 0.1s; }
        .layers-info > *:nth-child(2) { animation-delay: 0.2s; }
        .layers-info > *:nth-child(3) { animation-delay: 0.3s; }
        .layers-info > *:nth-child(4) { animation-delay: 0.4s; }
        .layers-info > *:nth-child(5) { animation-delay: 0.5s; }
      `}</style>
    </div>
  );
};

const GlitchText = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
  
  const glitch = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => 
        prev.split('').map((char, index) => {
          if (index < iterations) return text[index];
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }).join('')
      );
      
      iterations += 1/3;
      
      if (iterations >= text.length) {
        clearInterval(interval);
        setDisplayText(text);
        setIsGlitching(false);
      }
    }, 30);
  };

  return (
    <div 
      className={className}
      onMouseEnter={glitch}
      style={{ cursor: 'default' }}
    >
      {displayText}
    </div>
  );
};

const LayerLabel = ({ layer, index, isHovered, onHover, onLeave }) => {
  const [displayName, setDisplayName] = useState(layer.name);
  const [isGlitching, setIsGlitching] = useState(false);

  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';

  const glitch = () => {
    if (isGlitching) return;
    setIsGlitching(true);
    
    let iterations = 0;
    const interval = setInterval(() => {
      setDisplayName(prev => 
        layer.name.split('').map((char, idx) => {
          if (idx < iterations) return layer.name[idx];
          if (char === ' ') return ' ';
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }).join('')
      );
      
      iterations += 0.5;
      
      if (iterations >= layer.name.length) {
        clearInterval(interval);
        setDisplayName(layer.name);
        setIsGlitching(false);
      }
    }, 30);
  };

  useEffect(() => {
    if (isHovered) {
      glitch();
    }
  }, [isHovered]);

  return (
    <div 
      className="layer-label"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="layer-name" style={{ color: layer.color }}>
        <span className="layer-index">0{index + 1}</span>
        <span className="layer-text">{displayName}</span>
      </div>
      
      <div className={`layer-details ${isHovered ? 'visible' : ''}`}>
        <div className="detail-line" />
        <div className="detail-content">
          {layer.description}
        </div>
      </div>

      <style jsx>{`
        .layer-label {
          position: relative;
          cursor: pointer;
          user-select: none;
        }

        .layer-name {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.3s ease;
          text-shadow: 
            0 0 10px currentColor,
            0 0 20px currentColor;
        }

        .layer-label:hover .layer-name {
          transform: translateX(-5px);
          text-shadow: 
            0 0 15px currentColor,
            0 0 30px currentColor,
            0 0 45px currentColor;
        }

        .layer-index {
          font-size: 10px;
          opacity: 0.5;
          font-family: 'Courier New', monospace;
        }

        .layer-text {
          font-family: 'Space Mono', monospace;
        }

        .layer-details {
          position: absolute;
          left: -20px;
          top: 50%;
          transform: translateY(-50%) translateX(-100%);
          background: rgba(10, 14, 26, 0.95);
          border: 1px solid ${layer.color};
          border-radius: 4px;
          padding: 16px 20px;
          width: 280px;
          opacity: 0;
          pointer-events: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 0 20px ${layer.color}40,
            inset 0 0 20px rgba(0, 242, 255, 0.05);
        }

        .layer-details.visible {
          opacity: 1;
          transform: translateY(-50%) translateX(-100%) translateX(-10px);
        }

        .detail-line {
          position: absolute;
          right: -20px;
          top: 50%;
          width: 20px;
          height: 1px;
          background: linear-gradient(90deg, ${layer.color}, transparent);
        }

        .detail-content {
          font-size: 12px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 400;
          letter-spacing: 0.02em;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .layer-details.visible .detail-content {
          animation: pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default SpectraDemo;