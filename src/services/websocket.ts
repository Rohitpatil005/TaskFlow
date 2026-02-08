export interface WebSocketMessage {
  type: 'task-created' | 'task-updated' | 'task-deleted' | 'task-reordered' | 'connection';
  data: any;
  timestamp: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectDelay = 5000;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private isConnecting = false;
  private connected = false;

  constructor() {
    this.url = import.meta.env.VITE_WS_URL || 'ws://localhost:3001';
  }

  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isConnecting || this.connected) {
        resolve();
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.url);

        // Set a timeout for connection attempts
        const timeout = setTimeout(() => {
          if (!this.connected) {
            console.warn('WebSocket connection timeout - backend may not be running');
            this.isConnecting = false;
            this.ws?.close();
            resolve(); // Resolve anyway to allow app to work without WebSocket
          }
        }, 5000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          console.log('WebSocket connected');
          this.connected = true;
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connection', { connected: true });
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.emit(message.type, message.data);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          console.warn('WebSocket error:', error instanceof Event ? 'Connection failed' : error);
          this.isConnecting = false;
          resolve(); // Resolve to allow app to continue without WebSocket
        };

        this.ws.onclose = () => {
          clearTimeout(timeout);
          console.log('WebSocket disconnected');
          this.connected = false;
          this.isConnecting = false;
          this.emit('connection', { connected: false });
          this.attemptReconnect(resolve);
        };
      } catch (error) {
        this.isConnecting = false;
        console.warn('WebSocket creation failed:', error);
        resolve(); // Resolve to allow app to continue
      }
    });
  }

  private attemptReconnect(resolve: () => void) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(() => {
        this.connect().catch((error) => {
          console.warn('Reconnection failed:', error);
        });
      }, this.reconnectDelay);
    } else {
      console.warn('Max WebSocket reconnection attempts reached. App will work without real-time updates.');
      resolve();
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
    }
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
