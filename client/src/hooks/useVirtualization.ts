import { useMemo, useState, useCallback, useRef, useEffect } from 'react';

// Virtual scrolling hook for large lists
export function useVirtualization<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 5,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  const virtualItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );

    const visibleItems = [];
    for (let i = Math.max(0, startIndex - overscan); i <= endIndex; i++) {
      visibleItems.push({
        index: i,
        item: items[i],
        top: i * itemHeight,
        height: itemHeight,
      });
    }

    return visibleItems;
  }, [items, itemHeight, containerHeight, scrollTop, overscan]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    virtualItems,
    totalHeight,
    scrollElementRef,
    handleScroll,
  };
}

// Intersection observer hook for lazy loading
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [ref, setRef] = useState<Element | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, options]);

  return { ref: setRef, isIntersecting };
}