'use client';

let cachedPromise: Promise<any> | null = null;

export function loadCesium(): Promise<any> {
  if (cachedPromise) return cachedPromise;

  if (typeof window === 'undefined') {
    cachedPromise = Promise.reject(new Error('Cesium can only be loaded in the browser'));
    return cachedPromise;
  }

  const w = window as any;
  if (w.Cesium) {
    cachedPromise = Promise.resolve(w.Cesium);
    return cachedPromise;
  }

  cachedPromise = new Promise((resolve, reject) => {
    w.CESIUM_BASE_URL = '/cesium/';

    if (!document.querySelector('link[href="/cesium/Widgets/widgets.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/cesium/Widgets/widgets.css';
      document.head.appendChild(link);
    }

    const existing = document.querySelector('script[data-cesium-bundle]') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(w.Cesium));
      existing.addEventListener('error', () => reject(new Error('Failed to load /cesium/Cesium.js')));
      return;
    }

    const script = document.createElement('script');
    script.src = '/cesium/Cesium.js';
    script.async = true;
    script.dataset.cesiumBundle = 'true';
    script.onload = () => {
      if (w.Cesium) resolve(w.Cesium);
      else reject(new Error('Cesium loaded but global was not exposed'));
    };
    script.onerror = () => reject(new Error('Failed to load /cesium/Cesium.js'));
    document.head.appendChild(script);
  });

  return cachedPromise;
}
