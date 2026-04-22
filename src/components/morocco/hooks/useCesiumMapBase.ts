import { useEffect, useRef, useState } from 'react';
import 'cesium/Build/Cesium/Widgets/widgets.css';

// Add CSS injection to strip Cesium bottom credits
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .cesium-widget-credits { display: none !important; }
  `;
  document.head.appendChild(style);
}

export function useCesiumMapBase() {
  const cesiumContainer = useRef<HTMLDivElement>(null);
  const [viewer, setViewer] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let activeViewer: any = null;

    const initCesium = async () => {
      // 1. Initial sanity check
      if (!cesiumContainer.current) return;
      
      try {
        // 2. Yield thread to download massive WebGL library
        const Cesium = await import('cesium');
        
        // 3. STRICT CHECK: Did the component unmount while we were downloading?
        if (!isMounted || !cesiumContainer.current) return;
        
        // Define base URL for Cesium workers/assets
        (window as any).CESIUM_BASE_URL = '/cesium/';

        // Initialize viewer with performance settings
        // Disabling most UI widgets to keep it clean and fast
        activeViewer = new Cesium.Viewer(cesiumContainer.current, {
          animation: false,
          timeline: false,
          fullscreenButton: true,
          homeButton: true,
          sceneModePicker: true,
          navigationHelpButton: false,
          baseLayerPicker: true,
          geocoder: true,
          infoBox: false, 
          selectionIndicator: false,
          shouldAnimate: true, // Needed for CallbackProperty animations
        });

        // Optimization: Unlock true 4K High-DPI Resolution
        activeViewer.resolutionScale = window.devicePixelRatio || 1.0;
        
        // --- 4K EXTREME PERFORMANCE TUNING ---
        // At 4K, Anti-Aliasing is mathematically useless. Disabling it saves ~30% GPU memory.
        activeViewer.scene.postProcessStages.fxaa.enabled = false;
        activeViewer.scene.msaaSamples = 1;

        // Disable heavy volumetric atmospheric shaders
        activeViewer.scene.fog.enabled = false;
        activeViewer.scene.skyAtmosphere.show = false;
        
        // Lighting Optimization: Keep globe lit, but disable heavy specular water reflections
        activeViewer.scene.globe.enableLighting = true;
        activeViewer.scene.globe.showWaterEffect = false;
        
        // Terrain Optimization: Slightly reduce terrain geometry detail to save CPU (Imperceptible at 4K)
        activeViewer.scene.globe.maximumScreenSpaceError = 4;
        
        // Performance: Force continuous rendering (required for smooth callback pulsing)
        activeViewer.scene.requestRenderMode = false;
        
        // Disable depth testing against terrain to prevent dots from clipping under Bing Maps
        activeViewer.scene.globe.depthTestAgainstTerrain = false;

        // Start with full Earth view, then fly to Morocco
        activeViewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(0, 0, 20000000),
        });
        
        activeViewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(-7.0926, 31.7917, 3000000),
          duration: 3.0,
          easingFunction: Cesium.EasingFunction.QUADRATIC_IN_OUT
        });

        // 4. Final Strict Check: If unmounted during flyTo calculation, self-destruct
        if (!isMounted) {
            activeViewer.destroy();
            return;
        }

        setIsInitializing(false);
        setViewer(activeViewer);
      } catch (err) {
        console.error('Cesium init failed:', err);
        if (isMounted) setIsInitializing(false);
      }
    };

    initCesium();

    return () => {
      // Flag the effect as dead so async promises abort immediately
      isMounted = false;
      
      // Perform atomic destruction
      if (activeViewer && !activeViewer.isDestroyed()) {
        try {
           activeViewer.destroy();
        } catch (e) {
           console.error('Error destroying Cesium viewer:', e);
        }
      }
    };
  }, []);

  return { cesiumContainer, viewer, isInitializing };
}
