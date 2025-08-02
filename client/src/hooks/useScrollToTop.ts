import { useEffect } from 'react';

export function useScrollToTopImmediate() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
}

export function useScrollToTop() {
  useEffect(() => {
    const timer = setTimeout(() => {
      window.scrollTo(0, 0);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
}