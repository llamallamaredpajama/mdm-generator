import { useState, useCallback, useEffect } from 'react';

export type AnimationPhase = 'idle' | 'expanding' | 'expanded' | 'collapsing';

export interface CardExpansionState {
  expandedCardId: string | null;
  isFullscreen: boolean;
  animationPhase: AnimationPhase;
}

export interface UseCardExpansionReturn extends CardExpansionState {
  expand: (cardId: string, fullscreen?: boolean) => void;
  collapse: () => void;
  isExpanded: (cardId: string) => boolean;
}

const EXPAND_DURATION = 400;
const COLLAPSE_DURATION = 300;

export function useCardExpansion(): UseCardExpansionReturn {
  const [state, setState] = useState<CardExpansionState>({
    expandedCardId: null,
    isFullscreen: false,
    animationPhase: 'idle',
  });

  const expand = useCallback((cardId: string, fullscreen = false) => {
    setState({
      expandedCardId: cardId,
      isFullscreen: fullscreen,
      animationPhase: 'expanding',
    });

    // Transition to expanded after animation completes
    setTimeout(() => {
      setState((prev) => ({
        ...prev,
        animationPhase: 'expanded',
      }));
    }, EXPAND_DURATION);
  }, []);

  const collapse = useCallback(() => {
    setState((prev) => ({
      ...prev,
      animationPhase: 'collapsing',
    }));

    // Reset to idle after animation completes
    setTimeout(() => {
      setState({
        expandedCardId: null,
        isFullscreen: false,
        animationPhase: 'idle',
      });
    }, COLLAPSE_DURATION);
  }, []);

  const isExpanded = useCallback(
    (cardId: string) => state.expandedCardId === cardId,
    [state.expandedCardId]
  );

  // Handle Escape key to collapse
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.expandedCardId !== null) {
        collapse();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.expandedCardId, collapse]);

  // Body scroll lock when fullscreen
  useEffect(() => {
    if (state.isFullscreen && state.animationPhase !== 'collapsing') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [state.isFullscreen, state.animationPhase]);

  return {
    ...state,
    expand,
    collapse,
    isExpanded,
  };
}
