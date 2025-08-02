// Token handler utility for processing URL tokens and updating localStorage
export function processUrlToken() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const userId = urlParams.get('userId');
  
  if (token && userId) {
    console.log('🔑 Processing URL token:', token, 'for user:', userId);
    
    // Clear any existing wrong token first
    const oldToken = localStorage.getItem('authToken');
    console.log('🗑️ Clearing old token:', oldToken);
    
    // Store new token in localStorage
    localStorage.setItem('authToken', token);
    console.log('✅ New token stored:', token);
    
    // Dispatch auth token changed event
    window.dispatchEvent(new CustomEvent('authTokenChanged'));
    
    // Clean up URL parameters
    const newUrl = window.location.pathname;
    window.history.replaceState({}, document.title, newUrl);
    
    console.log('🧹 URL cleaned, token processing complete');
    return true;
  }
  
  return false;
}

// Process URL token immediately when module loads
if (typeof window !== 'undefined') {
  console.log('🚀 Token handler loaded');
  processUrlToken();
}

// Also process on page visibility change (handles browser back/forward)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      processUrlToken();
    }
  });
}

// Process on window focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    processUrlToken();
  });
}