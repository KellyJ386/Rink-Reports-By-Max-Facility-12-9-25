'use client';

import { useState, useEffect } from 'react';
import {
  DevicePhoneMobileIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if previously dismissed
    const dismissedAt = localStorage.getItem('pwa-install-dismissed');
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt);
      // Show again after 7 days
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // Listen for install prompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  if (!showPrompt || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install MFO App
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Install the app for quick access and offline support
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-2 mt-4">
          <button
            onClick={handleDismiss}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Not Now
          </button>
          <button
            onClick={handleInstall}
            className="flex-1 px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Install
          </button>
        </div>
      </div>
    </div>
  );
}

// iOS-specific install instructions
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS Safari
    const isIOSSafari =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !window.matchMedia('(display-mode: standalone)').matches;

    setIsIOS(isIOSSafari);

    // Check if dismissed
    const dismissed = localStorage.getItem('ios-install-dismissed');
    if (!dismissed && isIOSSafari) {
      setTimeout(() => setShow(true), 5000);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('ios-install-dismissed', 'true');
  };

  if (!show || !isIOS) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Add to Home Screen
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Tap the{' '}
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mx-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L12 15M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <path d="M3 15V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V15" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
              </span>{' '}
              share button, then select &quot;Add to Home Screen&quot;
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
