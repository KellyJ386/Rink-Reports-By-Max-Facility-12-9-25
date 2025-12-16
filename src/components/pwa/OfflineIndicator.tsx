'use client';

import { useState, useEffect } from 'react';
import { WifiIcon, SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { isOnline, onOnlineStatusChange } from '@/lib/pwa';
import { getPendingSyncCount, processSyncQueue } from '@/lib/pwa/offline-sync';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  position?: 'top' | 'bottom';
  showSyncStatus?: boolean;
}

export function OfflineIndicator({
  position = 'bottom',
  showSyncStatus = true,
}: OfflineIndicatorProps) {
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    setOnline(isOnline());
    setPendingCount(getPendingSyncCount());

    const unsubscribe = onOnlineStatusChange((status) => {
      setOnline(status);
      setShowBanner(true);

      // Auto-hide success banner after 3 seconds
      if (status) {
        setTimeout(() => setShowBanner(false), 3000);
        // Auto-sync when back online
        handleSync();
      }
    });

    return unsubscribe;
  }, []);

  const handleSync = async () => {
    if (syncing || !online) return;

    setSyncing(true);
    try {
      const result = await processSyncQueue();
      setPendingCount(result.remaining);
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Don't show anything if online and no pending items
  if (online && pendingCount === 0 && !showBanner) {
    return null;
  }

  return (
    <>
      {/* Offline Banner */}
      {(!online || showBanner) && (
        <div
          className={cn(
            'fixed left-0 right-0 z-50 transition-transform duration-300',
            position === 'top' ? 'top-0' : 'bottom-0',
            showBanner ? 'translate-y-0' : position === 'top' ? '-translate-y-full' : 'translate-y-full'
          )}
        >
          <div
            className={cn(
              'flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium',
              online
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-yellow-900'
            )}
          >
            {online ? (
              <>
                <WifiIcon className="w-4 h-4" />
                Back online
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-4 h-4" />
                You're offline. Changes will sync when connected.
              </>
            )}
          </div>
        </div>
      )}

      {/* Pending Sync Badge */}
      {showSyncStatus && pendingCount > 0 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={handleSync}
            disabled={!online || syncing}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-full shadow-lg',
              'bg-white dark:bg-gray-800 border dark:border-gray-700',
              'text-sm font-medium',
              !online && 'opacity-60'
            )}
          >
            <ArrowPathIcon
              className={cn(
                'w-4 h-4 text-primary-600',
                syncing && 'animate-spin'
              )}
            />
            <span className="text-gray-700 dark:text-gray-300">
              {syncing ? 'Syncing...' : `${pendingCount} pending`}
            </span>
          </button>
        </div>
      )}
    </>
  );
}

// Minimal offline dot indicator
export function OfflineDot() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(isOnline());
    return onOnlineStatusChange(setOnline);
  }, []);

  if (online) return null;

  return (
    <div className="flex items-center gap-1.5 text-yellow-600 dark:text-yellow-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
      </span>
      <span className="text-xs font-medium">Offline</span>
    </div>
  );
}
