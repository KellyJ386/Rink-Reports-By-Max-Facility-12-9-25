'use client';

import { useState, useRef, useEffect, ReactNode, createContext, useContext } from 'react';
import { QuestionMarkCircleIcon, XMarkIcon, BookOpenIcon } from '@heroicons/react/24/outline';

// Tooltip Component
interface TooltipProps {
  content: string | ReactNode;
  children: ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-rink-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-rink-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-rink-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-rink-800 border-y-transparent border-l-transparent',
  };

  return (
    <div
      className="relative inline-flex"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute z-50 ${positionClasses[position]} animate-in`}
          role="tooltip"
        >
          <div className="bg-rink-800 dark:bg-rink-700 text-white text-xs rounded-lg px-3 py-2 max-w-xs shadow-lg">
            {content}
          </div>
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}

// Help Icon with Tooltip
interface HelpTooltipProps {
  content: string | ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function HelpTooltip({ content, position = 'top' }: HelpTooltipProps) {
  return (
    <Tooltip content={content} position={position}>
      <button
        type="button"
        className="inline-flex items-center justify-center w-4 h-4 text-rink-400 hover:text-rink-600 dark:hover:text-rink-300 transition-colors"
        aria-label="Help"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>
    </Tooltip>
  );
}

// Form Field with Help
interface FormFieldWithHelpProps {
  label: string;
  helpText?: string;
  required?: boolean;
  children: ReactNode;
  error?: string;
}

export function FormFieldWithHelp({
  label,
  helpText,
  required,
  children,
  error,
}: FormFieldWithHelpProps) {
  return (
    <div className="space-y-1.5">
      <label className="form-label flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
        {helpText && <HelpTooltip content={helpText} />}
      </label>
      {children}
      {error && <p className="form-error">{error}</p>}
    </div>
  );
}

// Contextual Help Panel
interface HelpArticle {
  id: string;
  title: string;
  content: ReactNode;
  category: string;
  keywords: string[];
}

const helpArticles: HelpArticle[] = [
  {
    id: 'ice-depth-reading',
    title: 'Recording Ice Depth Readings',
    category: 'Ice Resurfacing',
    keywords: ['ice', 'depth', 'measurement', 'reading'],
    content: (
      <div className="space-y-3">
        <p>Ice depth readings help maintain optimal ice conditions and ensure player safety.</p>
        <h4 className="font-semibold">Best Practices:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Take readings at the same time each day</li>
          <li>Use the 9-point measurement system</li>
          <li>Record surface temperature before measuring</li>
          <li>Note any visible defects or issues</li>
        </ul>
        <h4 className="font-semibold">Target Depths:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>NHL standard: 0.75" - 1.0"</li>
          <li>Recreation: 1.0" - 1.25"</li>
          <li>Figure skating: 1.25" - 1.5"</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'incident-reporting',
    title: 'Reporting Incidents',
    category: 'Incidents',
    keywords: ['incident', 'report', 'safety', 'accident'],
    content: (
      <div className="space-y-3">
        <p>Proper incident documentation is crucial for safety compliance and liability protection.</p>
        <h4 className="font-semibold">When to Report:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Any injury to staff or patrons</li>
          <li>Equipment malfunction or failure</li>
          <li>Property damage</li>
          <li>Near-miss incidents</li>
          <li>Security concerns</li>
        </ul>
        <h4 className="font-semibold">Required Information:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Date, time, and location</li>
          <li>People involved</li>
          <li>Detailed description</li>
          <li>Witnesses (if any)</li>
          <li>Photos/evidence (when safe)</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'refrigeration-monitoring',
    title: 'Refrigeration System Monitoring',
    category: 'Refrigeration',
    keywords: ['refrigeration', 'compressor', 'pressure', 'brine'],
    content: (
      <div className="space-y-3">
        <p>Regular monitoring of the refrigeration system prevents costly breakdowns and maintains ice quality.</p>
        <h4 className="font-semibold">Key Metrics:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Suction pressure: 20-35 PSI</li>
          <li>Discharge pressure: 150-200 PSI</li>
          <li>Brine supply temp: 10-15°F</li>
          <li>Brine return temp: 18-22°F</li>
        </ul>
        <h4 className="font-semibold">Warning Signs:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Pressure readings outside normal range</li>
          <li>Unusual compressor sounds</li>
          <li>Temperature fluctuations</li>
          <li>Oil or refrigerant leaks</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'scheduling',
    title: 'Managing Schedules',
    category: 'Scheduling',
    keywords: ['schedule', 'shift', 'employee', 'time off'],
    content: (
      <div className="space-y-3">
        <p>Efficient scheduling ensures adequate coverage while respecting employee preferences.</p>
        <h4 className="font-semibold">Tips:</h4>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Publish schedules at least 2 weeks in advance</li>
          <li>Consider employee certifications for roles</li>
          <li>Balance overtime across team members</li>
          <li>Use drag-and-drop to quickly adjust shifts</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'keyboard-shortcuts',
    title: 'Keyboard Shortcuts',
    category: 'General',
    keywords: ['keyboard', 'shortcut', 'hotkey'],
    content: (
      <div className="space-y-3">
        <p>Use keyboard shortcuts for faster navigation.</p>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span>Search</span>
            <kbd className="px-2 py-0.5 bg-rink-100 dark:bg-rink-800 rounded text-xs">⌘K</kbd>
          </div>
          <div className="flex justify-between">
            <span>Dashboard</span>
            <kbd className="px-2 py-0.5 bg-rink-100 dark:bg-rink-800 rounded text-xs">G</kbd>
          </div>
          <div className="flex justify-between">
            <span>Incidents</span>
            <kbd className="px-2 py-0.5 bg-rink-100 dark:bg-rink-800 rounded text-xs">⇧I</kbd>
          </div>
          <div className="flex justify-between">
            <span>Settings</span>
            <kbd className="px-2 py-0.5 bg-rink-100 dark:bg-rink-800 rounded text-xs">⌘,</kbd>
          </div>
          <div className="flex justify-between">
            <span>Help</span>
            <kbd className="px-2 py-0.5 bg-rink-100 dark:bg-rink-800 rounded text-xs">?</kbd>
          </div>
        </div>
      </div>
    ),
  },
];

// Help Context for global access
interface HelpContextType {
  isOpen: boolean;
  openHelp: (articleId?: string) => void;
  closeHelp: () => void;
  searchArticles: (query: string) => HelpArticle[];
}

const HelpContext = createContext<HelpContextType | undefined>(undefined);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentArticle, setCurrentArticle] = useState<string | null>(null);

  const openHelp = (articleId?: string) => {
    setCurrentArticle(articleId || null);
    setIsOpen(true);
  };

  const closeHelp = () => {
    setIsOpen(false);
    setCurrentArticle(null);
  };

  const searchArticles = (query: string): HelpArticle[] => {
    const lowerQuery = query.toLowerCase();
    return helpArticles.filter(
      (article) =>
        article.title.toLowerCase().includes(lowerQuery) ||
        article.keywords.some((kw) => kw.includes(lowerQuery)) ||
        article.category.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <HelpContext.Provider value={{ isOpen, openHelp, closeHelp, searchArticles }}>
      {children}
      {isOpen && <HelpPanel currentArticle={currentArticle} onClose={closeHelp} />}
    </HelpContext.Provider>
  );
}

export function useHelp() {
  const context = useContext(HelpContext);
  if (!context) {
    throw new Error('useHelp must be used within a HelpProvider');
  }
  return context;
}

// Help Panel Component
function HelpPanel({
  currentArticle,
  onClose,
}: {
  currentArticle: string | null;
  onClose: () => void;
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(
    currentArticle ? helpArticles.find((a) => a.id === currentArticle) || null : null
  );

  const filteredArticles = searchQuery
    ? helpArticles.filter(
        (a) =>
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.keywords.some((kw) => kw.includes(searchQuery.toLowerCase()))
      )
    : helpArticles;

  // Group by category
  const articlesByCategory = filteredArticles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    },
    {} as Record<string, HelpArticle[]>
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-white dark:bg-rink-900 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-rink-200 dark:border-rink-700">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-ice-500" />
          <h2 className="font-semibold text-rink-900 dark:text-rink-100">Help Center</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-rink-400 hover:text-rink-600 dark:hover:text-rink-300"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-3 border-b border-rink-200 dark:border-rink-700">
        <input
          type="text"
          placeholder="Search help articles..."
          className="form-input"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedArticle(null);
          }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {selectedArticle ? (
          // Article View
          <div className="p-4">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-sm text-ice-600 dark:text-ice-400 hover:underline mb-4"
            >
              ← Back to articles
            </button>
            <h3 className="text-lg font-semibold text-rink-900 dark:text-rink-100 mb-2">
              {selectedArticle.title}
            </h3>
            <span className="text-xs text-rink-500 dark:text-rink-400 bg-rink-100 dark:bg-rink-800 px-2 py-1 rounded">
              {selectedArticle.category}
            </span>
            <div className="mt-4 text-sm text-rink-700 dark:text-rink-300">
              {selectedArticle.content}
            </div>
          </div>
        ) : (
          // Article List
          <div className="p-4 space-y-6">
            {Object.entries(articlesByCategory).map(([category, articles]) => (
              <div key={category}>
                <h3 className="text-xs font-semibold text-rink-500 dark:text-rink-400 uppercase tracking-wider mb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {articles.map((article) => (
                    <button
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="w-full text-left p-3 rounded-lg hover:bg-rink-50 dark:hover:bg-rink-800 transition-colors"
                    >
                      <p className="font-medium text-rink-900 dark:text-rink-100">
                        {article.title}
                      </p>
                      <p className="text-xs text-rink-500 dark:text-rink-400 mt-1">
                        {article.keywords.slice(0, 3).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {filteredArticles.length === 0 && (
              <div className="text-center py-8 text-rink-500 dark:text-rink-400">
                No articles found for "{searchQuery}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-rink-200 dark:border-rink-700 bg-rink-50 dark:bg-rink-800">
        <p className="text-xs text-rink-500 dark:text-rink-400 text-center">
          Need more help?{' '}
          <a href="mailto:support@mfo.dev" className="text-ice-600 dark:text-ice-400 hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

// Floating Help Button
export function HelpButton() {
  const { openHelp } = useHelp();

  return (
    <button
      onClick={() => openHelp()}
      className="fixed bottom-20 lg:bottom-6 right-6 w-12 h-12 bg-ice-500 hover:bg-ice-600 text-white rounded-full shadow-lg flex items-center justify-center transition-colors z-40"
      aria-label="Open help"
    >
      <QuestionMarkCircleIcon className="w-6 h-6" />
    </button>
  );
}

export default { Tooltip, HelpTooltip, FormFieldWithHelp, HelpProvider, useHelp, HelpButton };
