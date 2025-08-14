export const isMobileDevice = (): boolean => {
  // Check for mobile user agents
  const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera: string }).opera;
  
  // Check for mobile patterns in user agent
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  // Check for touch capability and screen size
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;
  
  return mobileRegex.test(userAgent.toLowerCase()) || (hasTouch && isSmallScreen);
};

export const checkMobileRedirect = (pathname: string): string | null => {
  // Don't redirect if already on mobile routes
  if (pathname.startsWith('/mobile') || pathname.startsWith('/collaborate')) {
    return null;
  }
  
  // Don't redirect on auth pages
  if (pathname.startsWith('/auth')) {
    return null;
  }
  
  // Redirect to mobile routes if on mobile device
  if (isMobileDevice()) {
    return '/mobile/now';
  }
  
  return null;
};