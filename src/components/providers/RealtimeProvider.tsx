'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useSession } from 'next-auth/react';
import {
  getRealtimeClient,
  type ConnectionState,
  type RealtimeClient,
} from '@/lib/realtime';

interface RealtimeContextValue {
  client: RealtimeClient;
  connectionState: ConnectionState;
  isConnected: boolean;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(
  undefined
);

interface RealtimeProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

export function RealtimeProvider({
  children,
  autoConnect = true,
}: RealtimeProviderProps) {
  const { data: session } = useSession();
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    connected: false,
    reconnecting: false,
    error: null,
  });

  const client = getRealtimeClient();

  useEffect(() => {
    // Subscribe to connection state changes
    const unsubscribe = client.onConnection(setConnectionState);

    // Auto-connect when authenticated
    if (autoConnect && session?.user) {
      client.connect();
    }

    return () => {
      unsubscribe();
    };
  }, [client, autoConnect, session?.user]);

  // Disconnect when session ends
  useEffect(() => {
    if (!session?.user) {
      client.disconnect();
    }
  }, [client, session?.user]);

  const value: RealtimeContextValue = {
    client,
    connectionState,
    isConnected: connectionState.connected,
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext(): RealtimeContextValue {
  const context = useContext(RealtimeContext);
  if (context === undefined) {
    throw new Error(
      'useRealtimeContext must be used within a RealtimeProvider'
    );
  }
  return context;
}

/**
 * Connection status indicator component
 */
export function ConnectionStatus({ className }: { className?: string }) {
  const { connectionState } = useRealtimeContext();

  const statusConfig = {
    connected: {
      color: 'bg-green-500',
      text: 'Connected',
    },
    reconnecting: {
      color: 'bg-yellow-500 animate-pulse',
      text: 'Reconnecting...',
    },
    disconnected: {
      color: 'bg-red-500',
      text: connectionState.error || 'Disconnected',
    },
  };

  const status = connectionState.connected
    ? 'connected'
    : connectionState.reconnecting
    ? 'reconnecting'
    : 'disconnected';

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      <span
        className={`w-2 h-2 rounded-full ${config.color}`}
        aria-hidden="true"
      />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        {config.text}
      </span>
    </div>
  );
}

export default RealtimeProvider;
