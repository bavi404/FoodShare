// WebSocket Service for Real-time Updates
import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
    this.token = localStorage.getItem('authToken');
  }

  // Connect to WebSocket server using socket.io
  connect() {
    if (this.socket && this.isConnected) return;

    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    const origin = baseUrl.replace(/\/api$/, '');

    this.socket = io(origin, {
      transports: ['websocket'],
      auth: { token: this.token },
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.isConnected = false;
      this.emit('disconnected', { reason });
    });

    // Relay known server events
    ['new-donation', 'donation_created', 'donation_updated', 'donation_claimed', 'system_message', 'error']
      .forEach((event) => {
        this.socket.on(event, (payload) => this.emit(event, payload));
      });
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    // socket.io handles reconnection by default
  }

  // Disconnect from WebSocket server
  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'Client disconnecting');
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Send message to server
  send(event, data = {}) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit(event, data);
  }

  // Update user location
  updateLocation(latitude, longitude, address = '') {
    this.send('update_location', {
      latitude,
      longitude,
      address,
    });
  }

  // Subscribe to nearby donations
  subscribeNearby(latitude, longitude, radius = 10) {
    this.send('subscribe_nearby', {
      latitude,
      longitude,
      radius,
    });
  }

  // Unsubscribe from nearby donations
  unsubscribeNearby(latitude, longitude, radius = 10) {
    this.send('unsubscribe_nearby', {
      latitude,
      longitude,
      radius,
    });
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in WebSocket event callback:', error);
        }
      });
    }
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    localStorage.setItem('authToken', token);
    
    // Reconnect with new token if already connected
    if (this.isConnected) {
      this.disconnect();
      this.connect();
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const wsService = new WebSocketService();

export default wsService;
