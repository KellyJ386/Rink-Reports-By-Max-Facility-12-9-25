'use client';

import { Button } from '@/components/ui/Button';
import { WifiIcon } from '@heroicons/react/24/outline';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-rink-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-ice-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiIcon className="w-10 h-10 text-ice-600" />
        </div>
        <h1 className="text-2xl font-bold text-rink-900 mb-2">You're Offline</h1>
        <p className="text-rink-600 mb-6">
          It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
        </p>
        <div className="space-y-3">
          <Button onClick={handleRetry} className="w-full">
            Try Again
          </Button>
          <p className="text-sm text-rink-500">
            Don't worry - any data you've entered will be saved and synced when you're back online.
          </p>
        </div>

        <div className="mt-8 p-4 bg-white rounded-lg border border-rink-200">
          <h3 className="font-medium text-rink-900 mb-2">Available Offline:</h3>
          <ul className="text-sm text-rink-600 space-y-1 text-left">
            <li>• View cached forms and checklists</li>
            <li>• Complete and save form submissions</li>
            <li>• View recent activity</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
