/**
 * Tests for keyboard shortcuts hook
 */

import { renderHook, act } from '@testing-library/react';
import { useKeyboardShortcuts, formatShortcut, Shortcut } from '@/hooks/useKeyboardShortcuts';

describe('formatShortcut', () => {
  // Mock navigator.platform for Mac
  const originalPlatform = navigator.platform;

  afterEach(() => {
    Object.defineProperty(navigator, 'platform', {
      value: originalPlatform,
      writable: true,
    });
  });

  it('should format a simple key', () => {
    const shortcut: Shortcut = {
      key: 'k',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toBe('K');
  });

  it('should format key with meta modifier', () => {
    const shortcut: Shortcut = {
      key: 'k',
      meta: true,
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    // On non-Mac, it should show Win+K
    expect(result).toMatch(/K/);
  });

  it('should format key with ctrl modifier', () => {
    const shortcut: Shortcut = {
      key: 's',
      ctrl: true,
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toMatch(/Ctrl/);
    expect(result).toMatch(/S/);
  });

  it('should format key with shift modifier', () => {
    const shortcut: Shortcut = {
      key: 'i',
      shift: true,
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toMatch(/Shift/);
    expect(result).toMatch(/I/);
  });

  it('should format key with alt modifier', () => {
    const shortcut: Shortcut = {
      key: 'n',
      alt: true,
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toMatch(/Alt/);
    expect(result).toMatch(/N/);
  });

  it('should format Escape key', () => {
    const shortcut: Shortcut = {
      key: 'Escape',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toBe('Esc');
  });

  it('should format arrow keys', () => {
    const upShortcut: Shortcut = {
      key: 'ArrowUp',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    expect(formatShortcut(upShortcut)).toBe('↑');

    const downShortcut: Shortcut = {
      key: 'ArrowDown',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    expect(formatShortcut(downShortcut)).toBe('↓');
  });

  it('should format Enter key', () => {
    const shortcut: Shortcut = {
      key: 'Enter',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    expect(formatShortcut(shortcut)).toBe('↵');
  });

  it('should format Space key', () => {
    const shortcut: Shortcut = {
      key: ' ',
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    expect(formatShortcut(shortcut)).toBe('Space');
  });

  it('should format multiple modifiers', () => {
    const shortcut: Shortcut = {
      key: 'k',
      ctrl: true,
      shift: true,
      description: 'Test',
      category: 'general',
      action: jest.fn(),
    };
    const result = formatShortcut(shortcut);
    expect(result).toMatch(/Ctrl/);
    expect(result).toMatch(/Shift/);
    expect(result).toMatch(/K/);
  });
});

describe('useKeyboardShortcuts', () => {
  it('should register keyboard event listener', () => {
    const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    const action = jest.fn();

    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));

    expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

    unmount();
    addEventListenerSpy.mockRestore();
  });

  it('should remove event listener on unmount', () => {
    const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    const action = jest.fn();

    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    const { unmount } = renderHook(() => useKeyboardShortcuts(shortcuts));
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    removeEventListenerSpy.mockRestore();
  });

  it('should trigger action on matching key press', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: false,
        metaKey: false,
        altKey: false,
        shiftKey: false,
      });
      window.dispatchEvent(event);
    });

    expect(action).toHaveBeenCalled();
  });

  it('should not trigger action when disabled', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts, false));

    act(() => {
      const event = new KeyboardEvent('keydown', { key: 'k' });
      window.dispatchEvent(event);
    });

    expect(action).not.toHaveBeenCalled();
  });

  it('should match modifier keys correctly', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        meta: true,
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Press k without meta - should not trigger
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: false,
      });
      window.dispatchEvent(event);
    });
    expect(action).not.toHaveBeenCalled();

    // Press k with meta - should trigger
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        metaKey: true,
      });
      window.dispatchEvent(event);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should match shift modifier correctly', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'i',
        shift: true,
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    // Press i without shift - should not trigger
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        shiftKey: false,
      });
      window.dispatchEvent(event);
    });
    expect(action).not.toHaveBeenCalled();

    // Press i with shift - should trigger
    act(() => {
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        shiftKey: true,
      });
      window.dispatchEvent(event);
    });
    expect(action).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple shortcuts', () => {
    const action1 = jest.fn();
    const action2 = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'a',
        description: 'Action 1',
        category: 'general',
        action: action1,
      },
      {
        key: 'b',
        description: 'Action 2',
        category: 'general',
        action: action2,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
    });
    expect(action1).toHaveBeenCalled();
    expect(action2).not.toHaveBeenCalled();

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'b' }));
    });
    expect(action2).toHaveBeenCalled();
  });

  it('should prevent default on matching shortcut', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'k',
        meta: true,
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      cancelable: true,
    });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should be case-insensitive for key matching', () => {
    const action = jest.fn();
    const shortcuts: Shortcut[] = [
      {
        key: 'K',
        description: 'Test',
        category: 'general',
        action,
      },
    ];

    renderHook(() => useKeyboardShortcuts(shortcuts));

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }));
    });

    expect(action).toHaveBeenCalled();
  });
});

describe('Shortcut categories', () => {
  it('should support navigation category', () => {
    const shortcut: Shortcut = {
      key: 'g',
      description: 'Go to dashboard',
      category: 'navigation',
      action: jest.fn(),
    };
    expect(shortcut.category).toBe('navigation');
  });

  it('should support actions category', () => {
    const shortcut: Shortcut = {
      key: 'n',
      description: 'New item',
      category: 'actions',
      action: jest.fn(),
    };
    expect(shortcut.category).toBe('actions');
  });

  it('should support search category', () => {
    const shortcut: Shortcut = {
      key: 'k',
      meta: true,
      description: 'Open search',
      category: 'search',
      action: jest.fn(),
    };
    expect(shortcut.category).toBe('search');
  });

  it('should support general category', () => {
    const shortcut: Shortcut = {
      key: '?',
      shift: true,
      description: 'Show help',
      category: 'general',
      action: jest.fn(),
    };
    expect(shortcut.category).toBe('general');
  });
});
