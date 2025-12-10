'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

// Shortcut definition
export interface Shortcut {
  key: string; // e.g., 'k', 'n', 'Escape'
  ctrl?: boolean;
  meta?: boolean; // Cmd on Mac, Win on Windows
  alt?: boolean;
  shift?: boolean;
  description: string;
  category: 'navigation' | 'actions' | 'search' | 'general';
  action: () => void;
}

// Check if element is editable
const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;
  const tagName = element.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  return element.getAttribute('contenteditable') === 'true';
};

// Format shortcut for display
export const formatShortcut = (shortcut: Shortcut): string => {
  const parts: string[] = [];
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrl) parts.push(isMac ? '⌃' : 'Ctrl');
  if (shortcut.meta) parts.push(isMac ? '⌘' : 'Win');
  if (shortcut.alt) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shift) parts.push(isMac ? '⇧' : 'Shift');

  // Format key
  let keyDisplay = shortcut.key.toUpperCase();
  if (shortcut.key === 'Escape') keyDisplay = 'Esc';
  if (shortcut.key === 'ArrowUp') keyDisplay = '↑';
  if (shortcut.key === 'ArrowDown') keyDisplay = '↓';
  if (shortcut.key === 'ArrowLeft') keyDisplay = '←';
  if (shortcut.key === 'ArrowRight') keyDisplay = '→';
  if (shortcut.key === 'Enter') keyDisplay = '↵';
  if (shortcut.key === ' ') keyDisplay = 'Space';

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
};

// Hook for keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Shortcut[], enabled = true) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Skip if in editable element
      if (isEditableElement(document.activeElement)) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && metaMatch && altMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.action();
          break;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Pre-defined shortcuts for common navigation
export function useNavigationShortcuts() {
  const router = useRouter();
  const [showHelp, setShowHelp] = useState(false);

  const shortcuts: Shortcut[] = [
    // Navigation
    {
      key: 'g',
      description: 'Go to Dashboard',
      category: 'navigation',
      action: () => router.push('/dashboard'),
    },
    {
      key: 'i',
      shift: true,
      description: 'Go to Incidents',
      category: 'navigation',
      action: () => router.push('/dashboard/incidents'),
    },
    {
      key: 'r',
      shift: true,
      description: 'Go to Ice Resurfacing',
      category: 'navigation',
      action: () => router.push('/dashboard/ice-resurfacing'),
    },
    {
      key: 's',
      shift: true,
      description: 'Go to Schedule',
      category: 'navigation',
      action: () => router.push('/dashboard/schedule'),
    },
    {
      key: 'e',
      shift: true,
      description: 'Go to Equipment',
      category: 'navigation',
      action: () => router.push('/dashboard/equipment'),
    },
    {
      key: 'f',
      shift: true,
      description: 'Go to Forms',
      category: 'navigation',
      action: () => router.push('/dashboard/forms'),
    },
    {
      key: ',',
      meta: true,
      description: 'Go to Settings',
      category: 'navigation',
      action: () => router.push('/dashboard/settings'),
    },

    // Actions
    {
      key: 'n',
      description: 'New item (context-aware)',
      category: 'actions',
      action: () => {
        // This can be overridden by individual pages
        const newButton = document.querySelector('[data-shortcut="new"]') as HTMLButtonElement;
        if (newButton) newButton.click();
      },
    },

    // Search
    {
      key: 'k',
      meta: true,
      description: 'Open search',
      category: 'search',
      action: () => {
        const searchButton = document.querySelector('[data-shortcut="search"]') as HTMLButtonElement;
        if (searchButton) searchButton.click();
      },
    },
    {
      key: '/',
      description: 'Focus search',
      category: 'search',
      action: () => {
        const searchInput = document.querySelector('[data-shortcut="search-input"]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
    },

    // General
    {
      key: '?',
      shift: true,
      description: 'Show keyboard shortcuts',
      category: 'general',
      action: () => setShowHelp((prev) => !prev),
    },
    {
      key: 'Escape',
      description: 'Close modal/dialog',
      category: 'general',
      action: () => {
        const closeButton = document.querySelector('[data-shortcut="close"]') as HTMLButtonElement;
        if (closeButton) closeButton.click();
      },
    },
  ];

  useKeyboardShortcuts(shortcuts);

  return { shortcuts, showHelp, setShowHelp };
}

// Component to display shortcuts help
export function KeyboardShortcutsHelp({
  shortcuts,
  onClose,
}: {
  shortcuts: Shortcut[];
  onClose: () => void;
}) {
  const categories = {
    navigation: 'Navigation',
    actions: 'Actions',
    search: 'Search',
    general: 'General',
  };

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, Shortcut[]>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-rink-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-rink-200 dark:border-rink-700">
          <h2 className="text-lg font-semibold text-rink-900 dark:text-rink-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            data-shortcut="close"
            className="p-1 text-rink-400 hover:text-rink-600 dark:hover:text-rink-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
          {Object.entries(categories).map(([category, label]) => {
            const categoryShortcuts = groupedShortcuts[category];
            if (!categoryShortcuts?.length) return null;

            return (
              <div key={category} className="mb-6 last:mb-0">
                <h3 className="text-sm font-semibold text-rink-500 dark:text-rink-400 uppercase tracking-wider mb-3">
                  {label}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-rink-50 dark:hover:bg-rink-700/50"
                    >
                      <span className="text-sm text-rink-700 dark:text-rink-300">
                        {shortcut.description}
                      </span>
                      <kbd className="px-2 py-1 text-xs font-mono bg-rink-100 dark:bg-rink-700 text-rink-600 dark:text-rink-300 rounded border border-rink-200 dark:border-rink-600">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="px-6 py-3 bg-rink-50 dark:bg-rink-900 border-t border-rink-200 dark:border-rink-700">
          <p className="text-xs text-rink-500 dark:text-rink-400 text-center">
            Press <kbd className="px-1 py-0.5 bg-white dark:bg-rink-800 rounded border border-rink-200 dark:border-rink-700 text-xs">?</kbd> anytime to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}
