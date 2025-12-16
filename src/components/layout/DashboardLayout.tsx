'use client';

import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useNavigationShortcuts, KeyboardShortcutsHelp } from '@/hooks/useKeyboardShortcuts';

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { shortcuts, showHelp, setShowHelp } = useNavigationShortcuts();

  return (
    <div className="min-h-screen bg-rink-50 dark:bg-rink-900">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-72">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="py-6">
          <div className="px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showHelp && (
        <KeyboardShortcutsHelp shortcuts={shortcuts} onClose={() => setShowHelp(false)} />
      )}
    </div>
  );
}
