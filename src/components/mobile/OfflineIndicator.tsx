'use client';

import { useState, useEffect } from 'react';
import {
  WifiIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  CloudArrowUpIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { useOfflineStatus, useServiceWorker } from '@/hooks/useOffline';

export function OfflineIndicator() {
  const {
    isOnline,
    queuedChangesCount,
    lastSyncTime,
    triggerSync,
  } = useOfflineStatus();
  const { updateAvailable, skipWaiting } = useServiceWorker();
  const [showDetails, setShowDetails] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Show banner when offline or has queued changes
  const showBanner = !isOnline || queuedChangesCount > 0;

  const handleSync = async () => {
    setIsSyncing(true);
    triggerSync();
    // Wait a bit for sync to process
    setTimeout(() => setIsSyncing(false), 2000);
  };

  if (!showBanner && !updateAvailable) return null;

  return (
    <>
      {/* Offline Banner */}
      {showBanner && (
        <div
          className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium flex items-center justify-between ${
            isOnline
              ? 'bg-yellow-500 text-yellow-900'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {isOnline ? (
              <>
                <CloudArrowUpIcon className="w-5 h-5" />
                <span>
                  {queuedChangesCount} change{queuedChangesCount !== 1 ? 's' : ''} pending sync
                </span>
              </>
            ) : (
              <>
                <WifiIcon className="w-5 h-5" />
                <span>You are offline</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOnline && queuedChangesCount > 0 && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="flex items-center gap-1 px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
              >
                <ArrowPathIcon className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                Sync Now
              </button>
            )}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-2 py-1 bg-white/20 rounded hover:bg-white/30 transition-colors"
            >
              {showDetails ? 'Hide' : 'Details'}
            </button>
          </div>
        </div>
      )}

      {/* Update Available Banner */}
      {updateAvailable && !showBanner && (
        <div className="fixed top-0 left-0 right-0 z-50 px-4 py-2 bg-blue-500 text-white text-sm font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-5 h-5" />
            <span>A new version is available</span>
          </div>
          <button
            onClick={skipWaiting}
            className="px-3 py-1 bg-white text-blue-500 rounded hover:bg-blue-50 transition-colors"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Details Panel */}
      {showDetails && (
        <div
          className={`fixed top-10 left-0 right-0 z-40 px-4 py-3 bg-gray-900 text-white text-sm ${
            showBanner ? 'mt-0' : ''
          }`}
        >
          <div className="max-w-lg mx-auto space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Network Status:</span>
              <span className={isOnline ? 'text-green-400' : 'text-red-400'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Pending Changes:</span>
              <span>{queuedChangesCount}</span>
            </div>
            {lastSyncTime && (
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Sync:</span>
                <span>{lastSyncTime.toLocaleTimeString()}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 pt-2">
              {isOnline
                ? 'Your changes will be synced automatically when possible.'
                : 'Your changes are saved locally and will sync when you reconnect.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
