/**
 * Real-time Communication Module
 *
 * Provides WebSocket-based real-time updates for the MFO application.
 */

export type EventType =
  | 'incident:created'
  | 'incident:updated'
  | 'incident:resolved'
  | 'alert:created'
  | 'alert:acknowledged'
  | 'reading:created'
  | 'form:submitted'
  | 'schedule:updated'
  | 'notification:new'
  | 'user:online'
  | 'user:offline';

export interface RealtimeEvent<T = unknown> {
  type: EventType;
  payload: T;
  timestamp: number;
  facilityId?: string;
  userId?: string;
}

export interface ConnectionState {
  connected: boolean;
  reconnecting: boolean;
  error: string | null;
}

type EventHandler<T = unknown> = (event: RealtimeEvent<T>) => void;
type ConnectionHandler = (state: ConnectionState) => void;

/**
 * Realtime client for WebSocket connections
 */
class RealtimeClient {
  private ws: WebSocket | null = null;
  private url: string;
  private eventHandlers: Map<EventType, Set<EventHandler>> = new Map();
  private connectionHandlers: Set<ConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private connectionState: ConnectionState = {
    connected: false,
    reconnecting: false,
    error: null,
  };

  constructor(url?: string) {
    this.url = url || this.getDefaultUrl();
  }

  private getDefaultUrl(): string {
    if (typeof window === 'undefined') {
      return 'ws://localhost:3001';
    }
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/api/realtime`;
  }

  /**
   * Connect to the WebSocket server
   */
  connect(token?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const url = token ? `${this.url}?token=${token}` : this.url;

    try {
      this.ws = new WebSocket(url);
      this.setupEventListeners();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.clearPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.updateConnectionState({ connected: false, reconnecting: false, error: null });
  }

  /**
   * Send a message to the server
   */
  send<T>(type: EventType, payload: T): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket is not connected');
      return;
    }

    const message: RealtimeEvent<T> = {
      type,
      payload,
      timestamp: Date.now(),
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Subscribe to an event type
   */
  on<T>(type: EventType, handler: EventHandler<T>): () => void {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, new Set());
    }

    this.eventHandlers.get(type)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.eventHandlers.get(type)?.delete(handler as EventHandler);
    };
  }

  /**
   * Subscribe to all events
   */
  onAny(handler: EventHandler): () => void {
    const unsubscribers = (Object.keys(this.eventHandlers) as EventType[]).map(
      (type) => this.on(type, handler)
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }

  /**
   * Subscribe to connection state changes
   */
  onConnection(handler: ConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Immediately call with current state
    handler(this.connectionState);

    return () => {
      this.connectionHandlers.delete(handler);
    };
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateConnectionState({ connected: true, reconnecting: false, error: null });
      this.startPingInterval();
    };

    this.ws.onclose = (event) => {
      this.clearPingInterval();
      this.updateConnectionState({ connected: false, reconnecting: false, error: null });

      // Attempt reconnection if not a clean close
      if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.attemptReconnect();
      }
    };

    this.ws.onerror = () => {
      this.handleError(new Error('WebSocket error'));
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as RealtimeEvent;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };
  }

  private handleMessage(event: RealtimeEvent): void {
    // Handle ping/pong
    if (event.type === 'notification:new' && (event.payload as { type?: string })?.type === 'pong') {
      return;
    }

    // Notify handlers
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach((handler) => handler(event));
    }
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    this.updateConnectionState({
      connected: false,
      reconnecting: false,
      error: errorMessage,
    });
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    this.updateConnectionState({
      connected: false,
      reconnecting: true,
      error: null,
    });

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private updateConnectionState(state: ConnectionState): void {
    this.connectionState = state;
    this.connectionHandlers.forEach((handler) => handler(state));
  }

  private startPingInterval(): void {
    this.pingInterval = setInterval(() => {
      this.send('notification:new', { type: 'ping' });
    }, 30000);
  }

  private clearPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
}

// Singleton instance
let client: RealtimeClient | null = null;

/**
 * Get the realtime client instance
 */
export function getRealtimeClient(): RealtimeClient {
  if (!client) {
    client = new RealtimeClient();
  }
  return client;
}

/**
 * Create a new realtime client (for testing or custom configurations)
 */
export function createRealtimeClient(url?: string): RealtimeClient {
  return new RealtimeClient(url);
}

export { RealtimeClient };
