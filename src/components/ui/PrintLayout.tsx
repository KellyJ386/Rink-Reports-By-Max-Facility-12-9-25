'use client';

import { ReactNode, useRef } from 'react';
import { PrinterIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';

interface PrintLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  showPrintButton?: boolean;
  orientation?: 'portrait' | 'landscape';
}

export function PrintLayout({
  children,
  title,
  subtitle,
  showPrintButton = true,
  orientation = 'portrait',
}: PrintLayoutProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="print-container">
      {/* Print Button - hidden in print view */}
      {showPrintButton && (
        <div className="no-print mb-4 flex justify-end">
          <Button
            variant="secondary"
            onClick={handlePrint}
            leftIcon={<PrinterIcon className="w-4 h-4" />}
          >
            Print
          </Button>
        </div>
      )}

      {/* Print Content */}
      <div
        ref={printRef}
        className={`print-content ${orientation === 'landscape' ? 'print-landscape' : ''}`}
      >
        {/* Print Header */}
        {(title || subtitle) && (
          <div className="print-header mb-6">
            <div className="flex items-center justify-between">
              <div>
                {title && <h1 className="text-2xl font-bold text-rink-900">{title}</h1>}
                {subtitle && <p className="text-sm text-rink-500 mt-1">{subtitle}</p>}
              </div>
              <div className="print-only text-right">
                <p className="text-xs text-rink-400">
                  Printed: {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <p className="text-xs text-rink-400">Max Facility Operations</p>
              </div>
            </div>
            <hr className="mt-4 border-rink-200" />
          </div>
        )}

        {/* Main Content */}
        {children}

        {/* Print Footer */}
        <div className="print-footer print-only mt-8 pt-4 border-t border-rink-200">
          <div className="flex items-center justify-between text-xs text-rink-400">
            <span>Max Facility Operations - Confidential</span>
            <span>Page <span className="print-page-number"></span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Print-specific table component
interface PrintTableProps {
  headers: string[];
  rows: (string | number | null | undefined)[][];
  caption?: string;
}

export function PrintTable({ headers, rows, caption }: PrintTableProps) {
  return (
    <div className="print-table-container overflow-x-auto">
      {caption && (
        <p className="text-sm font-medium text-rink-700 mb-2">{caption}</p>
      )}
      <table className="print-table w-full border-collapse">
        <thead>
          <tr>
            {headers.map((header, i) => (
              <th
                key={i}
                className="px-3 py-2 text-left text-xs font-semibold text-rink-600 uppercase bg-rink-50 border border-rink-200"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-rink-50'}>
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-3 py-2 text-sm text-rink-700 border border-rink-200"
                >
                  {cell ?? '-'}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Summary statistics component for print
interface PrintStatProps {
  label: string;
  value: string | number;
  unit?: string;
}

export function PrintStats({ stats }: { stats: PrintStatProps[] }) {
  return (
    <div className="print-stats grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <div key={i} className="p-3 bg-rink-50 rounded-lg border border-rink-200">
          <p className="text-xs text-rink-500 uppercase">{stat.label}</p>
          <p className="text-lg font-bold text-rink-900">
            {stat.value}
            {stat.unit && <span className="text-sm font-normal text-rink-500 ml-1">{stat.unit}</span>}
          </p>
        </div>
      ))}
    </div>
  );
}

export default PrintLayout;
