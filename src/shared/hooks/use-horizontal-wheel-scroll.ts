'use client';

import { useEffect, useRef } from 'react';

export function useHorizontalWheelScroll<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;

      const maxScrollLeft = element.scrollWidth - element.clientWidth;
      if (maxScrollLeft <= 0) return;

      const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, element.scrollLeft + event.deltaY));
      if (nextScrollLeft === element.scrollLeft) return;

      event.preventDefault();
      element.scrollLeft = nextScrollLeft;
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, []);

  return ref;
}
