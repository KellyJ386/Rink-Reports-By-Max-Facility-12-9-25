'use client';

import { useState, useRef, useEffect } from 'react';
import { ArrowDownTrayIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { exportToCsv, exportToExcel, ExportColumn } from '@/lib/export';

interface ExportButtonProps<T extends Record<string, unknown>> {
  data: T[];
  columns: ExportColumn<T>[];
  filename: string;
  sheetName?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function ExportButton<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  sheetName,
  disabled = false,
  variant = 'secondary',
  size = 'md',
}: ExportButtonProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportCsv = () => {
    exportToCsv(data, columns, { filename, sheetName });
    setIsOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(data, columns, { filename, sheetName });
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <Button
        variant={variant}
        size={size}
        disabled={disabled || data.length === 0}
        onClick={() => setIsOpen(!isOpen)}
        rightIcon={<ChevronDownIcon className="w-4 h-4" />}
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
        Export
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-rink-200 py-1 z-50">
          <button
            className="w-full px-4 py-2 text-left text-sm text-rink-700 hover:bg-rink-50 flex items-center gap-2"
            onClick={handleExportCsv}
          >
            <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM8.5 14.5v3h1v-3h-1zm2 0v3h.5l1-1.5 1 1.5h.5v-3h-1v1.5l-.5-.75-.5.75V14.5h-1zm4 0v3h2v-1h-1v-2h-1z" />
            </svg>
            Export as CSV
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm text-rink-700 hover:bg-rink-50 flex items-center gap-2"
            onClick={handleExportExcel}
          >
            <svg className="w-5 h-5 text-green-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 2l5 5h-5V4zM7 17v-1h2l1.5-2.5L12 16h2v1h-2.5l-1-1.67L9.5 17H7zm0-4v-1h2l1.5-2.5L12 12h2v1h-2.5l-1-1.67L9.5 13H7z" />
            </svg>
            Export as Excel
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
