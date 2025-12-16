'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, DevicePhoneMobileIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { canInstall, promptInstall, isAppInstalled, setupInstallPrompt } from '@/lib/pwa';

interface InstallPromptProps {
  onDismiss?: () => void;
}

export function InstallPrompt({ onDismiss }: InstallPromptProps) {
  const [showPrompt, setShowPrompt] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Don't show if already installed
    if (isAppInstalled()) return;

    // Set up install prompt listener
    setupInstallPrompt();

    const handlePromptAvailable = () => {
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('install-prompt-dismissed');
      if (!dismissed) {
        setShowPrompt(true);
      }
    };

    const handleAppInstalled = () => {
      setShowPrompt(false);
    };

    window.addEventListener('install-prompt-available', handlePromptAvailable);
    window.addEventListener('app-installed', handleAppInstalled);

    // Check if prompt is already available
    if (canInstall()) {
      handlePromptAvailable();
    }

    return () => {
      window.removeEventListener('install-prompt-available', handlePromptAvailable);
      window.removeEventListener('app-installed', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      const installed = await promptInstall();
      if (installed) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', Date.now().toString());
    onDismiss?.();
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Install MFO App
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add to your home screen for quick access and offline support.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={installing}
              >
                <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                {installing ? 'Installing...' : 'Install'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// iOS-specific install instructions
export function IOSInstallInstructions() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if iOS and not installed
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone;

    if (isIOS && !isStandalone) {
      const dismissed = localStorage.getItem('ios-install-dismissed');
      if (!dismissed) {
        setShow(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('ios-install-dismissed', Date.now().toString());
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/20 rounded-lg">
            <DevicePhoneMobileIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Add to Home Screen
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Tap the share button <span className="inline-block w-5 h-5 align-middle">⎋</span> then
              "Add to Home Screen" for the best experience.
            </p>
          </div>
          <button onClick={handleDismiss} className="p-1">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
