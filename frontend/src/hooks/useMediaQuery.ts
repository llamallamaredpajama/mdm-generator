import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for responsive viewport detection using CSS media queries.
 * Handles SSR gracefully by returning false when window is undefined.
 *
 * @param query - CSS media query string (e.g., '(max-width: 767px)')
 * @returns boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Handle SSR - return false if window is undefined
  const getMatches = useCallback((): boolean => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  const [matches, setMatches] = useState<boolean>(getMatches);

  useEffect(() => {
    // Bail out if SSR
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    // Update state with current match
    const handleChange = (): void => {
      setMatches(mediaQueryList.matches);
    };

    // Set initial value
    handleChange();

    // Modern browsers support addEventListener
    if (mediaQueryList.addEventListener) {
      mediaQueryList.addEventListener('change', handleChange);
      return () => {
        mediaQueryList.removeEventListener('change', handleChange);
      };
    } else {
      // Fallback for older browsers (Safari < 14)
      mediaQueryList.addListener(handleChange);
      return () => {
        mediaQueryList.removeListener(handleChange);
      };
    }
  }, [query]);

  return matches;
}

/**
 * Convenience hook to check if user prefers reduced motion.
 * Useful for disabling animations when user has accessibility settings enabled.
 *
 * @returns boolean - true if user prefers reduced motion
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Convenience hook for common mobile breakpoint.
 * Returns true for viewports under 768px.
 *
 * @returns boolean - true if viewport is mobile-sized
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Convenience hook for tablet breakpoint.
 * Returns true for viewports between 768px and 1023px.
 *
 * @returns boolean - true if viewport is tablet-sized
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Convenience hook for desktop breakpoint.
 * Returns true for viewports 1024px and above.
 *
 * @returns boolean - true if viewport is desktop-sized
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export default useMediaQuery;
