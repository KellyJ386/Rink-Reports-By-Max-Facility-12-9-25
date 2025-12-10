'use client';

import { useState, useCallback, useMemo, ReactNode } from 'react';
import {
  CheckIcon,
  MinusIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ArrowPathIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { Button } from './Button';

// Types
export interface BulkAction<T> {
  id: string;
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  onExecute: (selectedItems: T[]) => Promise<void> | void;
  confirmMessage?: string;
}

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
  sortable?: boolean;
}

interface BulkActionTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  actions?: BulkAction<T>[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  getRowId?: (item: T) => string;
}

export function BulkActionTable<T extends { id: string }>({
  data,
  columns,
  actions = [],
  isLoading = false,
  emptyMessage = 'No data available',
  onRowClick,
  getRowId = (item) => item.id,
}: BulkActionTableProps<T>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isExecuting, setIsExecuting] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // All items selected?
  const allSelected = useMemo(() => {
    return data.length > 0 && selectedIds.size === data.length;
  }, [data.length, selectedIds.size]);

  // Some items selected?
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && selectedIds.size < data.length;
  }, [data.length, selectedIds.size]);

  // Toggle all selection
  const toggleAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.map(getRowId)));
    }
  }, [allSelected, data, getRowId]);

  // Toggle single item
  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Execute bulk action
  const executeAction = useCallback(
    async (action: BulkAction<T>) => {
      if (selectedIds.size === 0) return;

      if (action.confirmMessage) {
        const confirmed = window.confirm(action.confirmMessage);
        if (!confirmed) return;
      }

      setIsExecuting(true);
      try {
        const selectedItems = data.filter((item) => selectedIds.has(getRowId(item)));
        await action.onExecute(selectedItems);
        clearSelection();
      } catch (error) {
        console.error('Bulk action failed:', error);
      } finally {
        setIsExecuting(false);
        setShowActions(false);
      }
    },
    [selectedIds, data, getRowId, clearSelection]
  );

  // Get nested value
  const getValue = (item: T, key: string): unknown => {
    return key.split('.').reduce((obj: unknown, k: string) => {
      if (obj && typeof obj === 'object' && k in obj) {
        return (obj as Record<string, unknown>)[k];
      }
      return undefined;
    }, item);
  };

  return (
    <div className="bulk-action-table">
      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-ice-50 dark:bg-ice-900/20 border border-ice-200 dark:border-ice-800 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-ice-700 dark:text-ice-300">
              {selectedIds.size} item{selectedIds.size !== 1 ? 's' : ''} selected
            </span>
            <Button variant="ghost" size="sm" onClick={clearSelection}>
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {actions.length <= 3 ? (
              // Show actions directly
              actions.map((action) => (
                <Button
                  key={action.id}
                  variant={action.variant || 'secondary'}
                  size="sm"
                  disabled={isExecuting}
                  onClick={() => executeAction(action)}
                  leftIcon={action.icon}
                >
                  {action.label}
                </Button>
              ))
            ) : (
              // Show dropdown
              <div className="relative">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowActions(!showActions)}
                  rightIcon={<ChevronDownIcon className="w-4 h-4" />}
                >
                  Actions
                </Button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-rink-800 rounded-lg shadow-lg border border-rink-200 dark:border-rink-700 py-1 z-50">
                    {actions.map((action) => (
                      <button
                        key={action.id}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left hover:bg-rink-50 dark:hover:bg-rink-700 text-rink-700 dark:text-rink-300"
                        disabled={isExecuting}
                        onClick={() => executeAction(action)}
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-rink-200 dark:border-rink-700">
        <table className="w-full">
          <thead>
            <tr className="bg-rink-50 dark:bg-rink-800/50">
              {/* Checkbox column */}
              <th className="w-12 px-4 py-3 border-b border-rink-200 dark:border-rink-700">
                <button
                  onClick={toggleAll}
                  className="w-5 h-5 rounded border border-rink-300 dark:border-rink-600 flex items-center justify-center hover:border-ice-500 transition-colors"
                  style={{
                    backgroundColor: allSelected
                      ? 'rgb(14 165 233)'
                      : someSelected
                        ? 'rgb(14 165 233)'
                        : 'transparent',
                  }}
                >
                  {allSelected && <CheckIcon className="w-3 h-3 text-white" />}
                  {someSelected && !allSelected && <MinusIcon className="w-3 h-3 text-white" />}
                </button>
              </th>
              {columns.map((col) => (
                <th
                  key={col.key as string}
                  className="px-4 py-3 text-left text-xs font-semibold text-rink-500 dark:text-rink-400 uppercase tracking-wider border-b border-rink-200 dark:border-rink-700"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rink-100 dark:divide-rink-800">
            {isLoading ? (
              // Loading state
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-4">
                    <div className="w-5 h-5 skeleton rounded" />
                  </td>
                  {columns.map((col) => (
                    <td key={col.key as string} className="px-4 py-4">
                      <div className="h-4 skeleton rounded w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              // Empty state
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-12 text-center text-rink-500 dark:text-rink-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              // Data rows
              data.map((item, index) => {
                const id = getRowId(item);
                const isSelected = selectedIds.has(id);

                return (
                  <tr
                    key={id}
                    className={`
                      transition-colors
                      ${isSelected ? 'bg-ice-50 dark:bg-ice-900/20' : 'hover:bg-rink-50 dark:hover:bg-rink-800/50'}
                      ${onRowClick ? 'cursor-pointer' : ''}
                    `}
                    onClick={(e) => {
                      // Don't trigger row click if clicking checkbox
                      if ((e.target as HTMLElement).closest('button')) return;
                      onRowClick?.(item);
                    }}
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItem(id);
                        }}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-ice-500 border-ice-500'
                            : 'border-rink-300 dark:border-rink-600 hover:border-ice-500'
                        }`}
                      >
                        {isSelected && <CheckIcon className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key as string}
                        className="px-4 py-4 text-sm text-rink-700 dark:text-rink-300"
                      >
                        {col.render
                          ? col.render(item, index)
                          : (getValue(item, col.key as string) as ReactNode) ?? '-'}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Selection summary */}
      {data.length > 0 && (
        <div className="mt-2 text-xs text-rink-500 dark:text-rink-400">
          {selectedIds.size > 0
            ? `${selectedIds.size} of ${data.length} selected`
            : `${data.length} total items`}
        </div>
      )}
    </div>
  );
}

// Pre-defined bulk actions
export const commonBulkActions = {
  delete: <T,>(onDelete: (items: T[]) => Promise<void>): BulkAction<T> => ({
    id: 'delete',
    label: 'Delete',
    icon: <TrashIcon className="w-4 h-4" />,
    variant: 'danger',
    confirmMessage: 'Are you sure you want to delete the selected items?',
    onExecute: onDelete,
  }),

  archive: <T,>(onArchive: (items: T[]) => Promise<void>): BulkAction<T> => ({
    id: 'archive',
    label: 'Archive',
    icon: <ArchiveBoxIcon className="w-4 h-4" />,
    variant: 'secondary',
    onExecute: onArchive,
  }),

  refresh: <T,>(onRefresh: (items: T[]) => Promise<void>): BulkAction<T> => ({
    id: 'refresh',
    label: 'Refresh',
    icon: <ArrowPathIcon className="w-4 h-4" />,
    variant: 'secondary',
    onExecute: onRefresh,
  }),
};

export default BulkActionTable;
