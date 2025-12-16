'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

interface SearchResult {
  id: string;
  type: 'incident' | 'equipment' | 'user' | 'form' | 'schedule' | 'rink' | 'reading';
  title: string;
  subtitle: string;
  url: string;
  icon: string;
  metadata?: Record<string, unknown>;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  ExclamationTriangleIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  DocumentTextIcon,
  BuildingOfficeIcon,
};

const typeLabels: Record<string, string> = {
  incident: 'Incident',
  equipment: 'Equipment',
  user: 'User',
  form: 'Form',
  schedule: 'Schedule',
  rink: 'Rink',
  reading: 'Reading',
};

const typeColors: Record<string, string> = {
  incident: 'bg-red-100 text-red-700',
  equipment: 'bg-blue-100 text-blue-700',
  user: 'bg-purple-100 text-purple-700',
  form: 'bg-green-100 text-green-700',
  schedule: 'bg-yellow-100 text-yellow-700',
  rink: 'bg-ice-100 text-ice-700',
  reading: 'bg-teal-100 text-teal-700',
};

export function GlobalSearch() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=10`);
        const data = await response.json();
        setResults(data.data || []);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard shortcut to open search (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigateToResult(results[selectedIndex]);
      }
    },
    [results, selectedIndex]
  );

  const navigateToResult = (result: SearchResult) => {
    router.push(result.url);
    setIsOpen(false);
    setQuery('');
  };

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || DocumentTextIcon;
    return Icon;
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Search Trigger Button */}
      <button
        onClick={() => {
          setIsOpen(true);
          setTimeout(() => inputRef.current?.focus(), 100);
        }}
        className="flex items-center gap-2 px-3 py-2 text-sm text-rink-500 bg-rink-100 hover:bg-rink-200 rounded-lg transition-colors"
      >
        <MagnifyingGlassIcon className="w-4 h-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-rink-400 bg-white rounded border border-rink-200">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50">
          <div className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-rink-200">
              <MagnifyingGlassIcon className="w-5 h-5 text-rink-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search incidents, equipment, users, forms..."
                className="flex-1 text-base text-rink-900 placeholder-rink-400 bg-transparent border-0 outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-1 text-rink-400 hover:text-rink-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="px-2 py-1 text-xs text-rink-500 bg-rink-100 rounded"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading && (
                <div className="px-4 py-8 text-center text-rink-500">
                  <div className="inline-block w-6 h-6 border-2 border-ice-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-2 text-sm">Searching...</p>
                </div>
              )}

              {!isLoading && query.length >= 2 && results.length === 0 && (
                <div className="px-4 py-8 text-center text-rink-500">
                  <MagnifyingGlassIcon className="w-10 h-10 mx-auto text-rink-300" />
                  <p className="mt-2 text-sm">No results found for "{query}"</p>
                </div>
              )}

              {!isLoading && query.length < 2 && (
                <div className="px-4 py-8 text-center text-rink-500">
                  <p className="text-sm">Type at least 2 characters to search</p>
                </div>
              )}

              {!isLoading && results.length > 0 && (
                <ul className="py-2">
                  {results.map((result, index) => {
                    const Icon = getIcon(result.icon);
                    return (
                      <li key={`${result.type}-${result.id}`}>
                        <button
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            index === selectedIndex
                              ? 'bg-ice-50'
                              : 'hover:bg-rink-50'
                          }`}
                          onClick={() => navigateToResult(result)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          <div
                            className={`p-2 rounded-lg ${typeColors[result.type] || 'bg-rink-100 text-rink-700'}`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-rink-900 truncate">
                              {result.title}
                            </p>
                            <p className="text-xs text-rink-500 truncate">{result.subtitle}</p>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-xs font-medium rounded ${typeColors[result.type] || 'bg-rink-100 text-rink-700'}`}
                          >
                            {typeLabels[result.type]}
                          </span>
                          {index === selectedIndex && (
                            <ArrowRightIcon className="w-4 h-4 text-ice-600" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t border-rink-200 bg-rink-50 text-xs text-rink-500">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-rink-200">↑</kbd>
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-rink-200">↓</kbd>
                  to navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-white rounded border border-rink-200">↵</kbd>
                  to select
                </span>
              </div>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-white rounded border border-rink-200">esc</kbd>
                to close
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
