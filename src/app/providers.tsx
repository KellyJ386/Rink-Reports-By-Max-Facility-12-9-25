'use client';

import { SessionProvider } from 'next-auth/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode, Suspense } from 'react';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { HelpProvider } from '@/components/ui/HelpSystem';
import { WebVitals } from '@/components/providers/WebVitals';
import { createQueryClient } from '@/lib/queryClient';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  // Create query client with optimized configuration
  const [queryClient] = useState(() => createQueryClient());

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="mfo-theme">
          <HelpProvider>
            {children}
          </HelpProvider>
        </ThemeProvider>
        {/* Performance monitoring */}
        <Suspense fallback={null}>
          <WebVitals />
        </Suspense>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} position="bottom" />
        )}
      </QueryClientProvider>
    </SessionProvider>
  );
}
