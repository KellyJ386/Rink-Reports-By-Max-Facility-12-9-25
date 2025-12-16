'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import {
  focusManager,
  announceToScreenReader,
  prefersReducedMotion,
  keyboardHelpers,
} from '@/lib/accessibility';

/**
 * Hook for managing focus trap in modals and dialogs
 */
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save current focus
    restoreFocusRef.current = focusManager.saveFocus();

    // Focus first element in container
    const timer = setTimeout(() => {
      if (containerRef.current) {
        focusManager.focusFirst(containerRef.current);
      }
    }, 0);

    // Handle keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (containerRef.current) {
        focusManager.trapFocus(containerRef.current, event);
      }

      // Close on Escape
      if (event.key === 'Escape') {
        event.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      restoreFocusRef.current();
    };
  }, [isActive]);

  return { containerRef };
}

/**
 * Hook for screen reader announcements
 */
export function useAnnounce() {
  const announce = useCallback(
    (message: string, priority: 'polite' | 'assertive' = 'polite') => {
      announceToScreenReader(message, priority);
    },
    []
  );

  const announcePolite = useCallback((message: string) => {
    announce(message, 'polite');
  }, [announce]);

  const announceAssertive = useCallback((message: string) => {
    announce(message, 'assertive');
  }, [announce]);

  return { announce, announcePolite, announceAssertive };
}

/**
 * Hook for roving tabindex pattern (menus, toolbars, etc.)
 */
export function useRovingTabindex<T extends HTMLElement>(itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);
  const itemRefs = useRef<(T | null)[]>([]);

  const setRef = useCallback((index: number) => (el: T | null) => {
    itemRefs.current[index] = el;
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!keyboardHelpers.isNavigationKey(event.key)) return;

      const elements = itemRefs.current.filter(Boolean) as T[];
      keyboardHelpers.handleRovingTabindex(
        elements,
        activeIndex,
        setActiveIndex,
        event.nativeEvent
      );
    },
    [activeIndex]
  );

  const getItemProps = useCallback(
    (index: number) => ({
      ref: setRef(index),
      tabIndex: index === activeIndex ? 0 : -1,
      onKeyDown: handleKeyDown,
    }),
    [activeIndex, handleKeyDown, setRef]
  );

  return {
    activeIndex,
    setActiveIndex,
    getItemProps,
    handleKeyDown,
  };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return reducedMotion;
}

/**
 * Hook for managing focus visibility (keyboard vs mouse)
 */
export function useFocusVisible() {
  const [isFocusVisible, setIsFocusVisible] = useState(false);
  const hadKeyboardEventRef = useRef(false);

  useEffect(() => {
    const handleKeyDown = () => {
      hadKeyboardEventRef.current = true;
    };

    const handlePointerDown = () => {
      hadKeyboardEventRef.current = false;
    };

    const handleFocus = () => {
      if (hadKeyboardEventRef.current) {
        setIsFocusVisible(true);
      }
    };

    const handleBlur = () => {
      setIsFocusVisible(false);
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('focus', handleFocus, true);
    document.addEventListener('blur', handleBlur, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('focus', handleFocus, true);
      document.removeEventListener('blur', handleBlur, true);
    };
  }, []);

  return isFocusVisible;
}

/**
 * Hook for scroll locking (for modals)
 */
export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isLocked]);
}

/**
 * Hook for auto-focusing an element on mount
 */
export function useAutoFocus<T extends HTMLElement>(shouldFocus = true) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (shouldFocus && ref.current) {
      ref.current.focus();
    }
  }, [shouldFocus]);

  return ref;
}

/**
 * Hook for managing ID relationships (aria-labelledby, aria-describedby)
 */
export function useAriaIds(prefix = 'aria') {
  const idRef = useRef(`${prefix}-${Math.random().toString(36).substr(2, 9)}`);

  const ids = {
    root: idRef.current,
    label: `${idRef.current}-label`,
    description: `${idRef.current}-description`,
    error: `${idRef.current}-error`,
  };

  const getLabelledBy = (...args: (keyof typeof ids)[]) =>
    args.map((key) => ids[key]).join(' ');

  return { ids, getLabelledBy };
}
