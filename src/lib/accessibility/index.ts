/**
 * Accessibility Utilities
 *
 * Core utilities for implementing accessible features
 */

/**
 * Announce message to screen readers
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return;

  const id = `sr-announce-${priority}`;
  let announcer = document.getElementById(id);

  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = id;
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.style.cssText = `
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    `;
    document.body.appendChild(announcer);
  }

  // Clear and set message (needed for repeat announcements)
  announcer.textContent = '';
  setTimeout(() => {
    announcer!.textContent = message;
  }, 100);
}

/**
 * Focus management utilities
 */
export const focusManager = {
  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ');

    return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  },

  /**
   * Focus first focusable element in container
   */
  focusFirst(container: HTMLElement): boolean {
    const elements = this.getFocusableElements(container);
    if (elements.length > 0) {
      elements[0].focus();
      return true;
    }
    return false;
  },

  /**
   * Focus last focusable element in container
   */
  focusLast(container: HTMLElement): boolean {
    const elements = this.getFocusableElements(container);
    if (elements.length > 0) {
      elements[elements.length - 1].focus();
      return true;
    }
    return false;
  },

  /**
   * Save current focus and return restore function
   */
  saveFocus(): () => void {
    const activeElement = document.activeElement as HTMLElement | null;
    return () => {
      activeElement?.focus?.();
    };
  },

  /**
   * Trap focus within a container
   */
  trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const elements = this.getFocusableElements(container);
    if (elements.length === 0) return;

    const first = elements[0];
    const last = elements[elements.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  },
};

/**
 * ARIA attribute helpers
 */
export const ariaHelpers = {
  /**
   * Generate unique ID for ARIA relationships
   */
  generateId(prefix = 'aria'): string {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Create describedby relationship
   */
  describeBy(elementId: string, description: string): {
    id: string;
    'aria-describedby': string;
    descriptionProps: { id: string; children: string };
  } {
    const descId = `${elementId}-description`;
    return {
      id: elementId,
      'aria-describedby': descId,
      descriptionProps: { id: descId, children: description },
    };
  },

  /**
   * Create labelledby relationship
   */
  labelBy(elementId: string): {
    id: string;
    labelProps: { id: string; htmlFor: string };
    inputProps: { id: string; 'aria-labelledby': string };
  } {
    const labelId = `${elementId}-label`;
    return {
      id: elementId,
      labelProps: { id: labelId, htmlFor: elementId },
      inputProps: { id: elementId, 'aria-labelledby': labelId },
    };
  },

  /**
   * Create expanded/controls relationship for disclosure
   */
  disclosure(isExpanded: boolean, controlsId: string): {
    triggerProps: {
      'aria-expanded': boolean;
      'aria-controls': string;
    };
    contentProps: {
      id: string;
      hidden: boolean;
    };
  } {
    return {
      triggerProps: {
        'aria-expanded': isExpanded,
        'aria-controls': controlsId,
      },
      contentProps: {
        id: controlsId,
        hidden: !isExpanded,
      },
    };
  },
};

/**
 * Keyboard navigation helpers
 */
export const keyboardHelpers = {
  /**
   * Check if key is navigation key
   */
  isNavigationKey(key: string): boolean {
    return ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key);
  },

  /**
   * Get next index based on arrow key navigation
   */
  getNextIndex(
    currentIndex: number,
    totalItems: number,
    key: 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End',
    orientation: 'horizontal' | 'vertical' = 'vertical',
    wrap = true
  ): number {
    const isNext =
      (orientation === 'vertical' && key === 'ArrowDown') ||
      (orientation === 'horizontal' && key === 'ArrowRight');
    const isPrev =
      (orientation === 'vertical' && key === 'ArrowUp') ||
      (orientation === 'horizontal' && key === 'ArrowLeft');

    if (key === 'Home') return 0;
    if (key === 'End') return totalItems - 1;

    if (isNext) {
      const next = currentIndex + 1;
      return wrap ? next % totalItems : Math.min(next, totalItems - 1);
    }

    if (isPrev) {
      const prev = currentIndex - 1;
      return wrap ? (prev + totalItems) % totalItems : Math.max(prev, 0);
    }

    return currentIndex;
  },

  /**
   * Handle roving tabindex pattern
   */
  handleRovingTabindex(
    elements: HTMLElement[],
    currentIndex: number,
    setCurrentIndex: (index: number) => void,
    event: KeyboardEvent
  ): void {
    if (!this.isNavigationKey(event.key)) return;

    event.preventDefault();
    const nextIndex = this.getNextIndex(
      currentIndex,
      elements.length,
      event.key as 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End'
    );

    setCurrentIndex(nextIndex);
    elements[nextIndex]?.focus();
  },
};

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      const srgb = c / 255;
      return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: [number, number, number], color2: [number, number, number]): number {
    const l1 = this.getLuminance(...color1);
    const l2 = this.getLuminance(...color2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast meets WCAG standards
   */
  meetsWCAG(
    ratio: number,
    level: 'AA' | 'AAA' = 'AA',
    textSize: 'normal' | 'large' = 'normal'
  ): boolean {
    const thresholds = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 },
    };
    return ratio >= thresholds[level][textSize];
  },
};

/**
 * Reduced motion detection
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * High contrast detection
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(prefers-contrast: more)').matches ||
    window.matchMedia('(-ms-high-contrast: active)').matches
  );
}
