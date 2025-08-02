// Preload critical resources for faster loading
export function preloadCriticalResources() {
  // Preload key API endpoints
  const token = localStorage.getItem('authToken');
  if (token) {
    // Prefetch today's stories
    fetch('/api/stories/today', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }).catch(() => {
      // Silent fail for prefetch
    });

    // Prefetch user auth
    fetch('/api/auth/user', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    }).catch(() => {
      // Silent fail for prefetch  
    });
  }
}

// Initialize preloading when module loads
if (typeof window !== 'undefined') {
  // Preload after a short delay to not block initial render
  setTimeout(preloadCriticalResources, 100);
}