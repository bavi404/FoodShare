import jwt from 'jsonwebtoken';
import User from '../models/User.js';

class WebSocketService {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // Map of socketId -> user info
    this.userSockets = new Map(); // Map of userId -> Set of socketIds
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for WebSocket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findById(decoded.id).select('_id email profile firstName lastName');
        if (!user) {
          return next(new Error('User not found'));
        }

        // Store user info in socket
        socket.userId = user._id.toString();
        socket.user = user;
        
        next();
      } catch (error) {
        console.error('WebSocket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User ${socket.user.email} connected with socket ${socket.id}`);
      
      // Store user connection
      this.connectedUsers.set(socket.id, {
        userId: socket.userId,
        user: socket.user,
        connectedAt: new Date()
      });

      // Add socket to user's socket set
      if (!this.userSockets.has(socket.userId)) {
        this.userSockets.set(socket.userId, new Set());
      }
      this.userSockets.get(socket.userId).add(socket.id);

      // Join user to their personal room for targeted notifications
      socket.join(`user_${socket.userId}`);

      // Join user to location-based rooms (if they have location)
      this.joinLocationRooms(socket);

      // Handle location updates
      socket.on('update_location', async (data) => {
        try {
          const { latitude, longitude, address } = data;
          
          // Update user location in database
          await User.findByIdAndUpdate(socket.userId, {
            'location.coordinates': [longitude, latitude],
            'location.address': address || '',
            'stats.lastActive': new Date()
          });

          // Leave old location rooms and join new ones
          this.leaveLocationRooms(socket);
          this.joinLocationRooms(socket, { latitude, longitude });

          console.log(`User ${socket.user.email} updated location to ${latitude}, ${longitude}`);
        } catch (error) {
          console.error('Error updating user location:', error);
          socket.emit('error', { message: 'Failed to update location' });
        }
      });

      // Handle subscription to nearby donations
      socket.on('subscribe_nearby', (data) => {
        const { latitude, longitude, radius = 10 } = data;
        
        // Join radius-based room
        const roomName = this.getLocationRoomName(latitude, longitude, radius);
        socket.join(roomName);
        
        console.log(`User ${socket.user.email} subscribed to nearby donations in room ${roomName}`);
      });

      // Handle unsubscription from nearby donations
      socket.on('unsubscribe_nearby', (data) => {
        const { latitude, longitude, radius = 10 } = data;
        
        const roomName = this.getLocationRoomName(latitude, longitude, radius);
        socket.leave(roomName);
        
        console.log(`User ${socket.user.email} unsubscribed from nearby donations in room ${roomName}`);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${socket.user.email} disconnected`);
        
        // Remove from connected users
        this.connectedUsers.delete(socket.id);
        
        // Remove socket from user's socket set
        const userSockets = this.userSockets.get(socket.userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(socket.userId);
          }
        }
      });
    });
  }

  joinLocationRooms(socket, location = null) {
    if (!location && socket.user.location && socket.user.location.coordinates) {
      const [longitude, latitude] = socket.user.location.coordinates;
      location = { latitude, longitude };
    }

    if (location) {
      // Join rooms for different radius levels
      const radii = [1, 5, 10, 25, 50]; // km
      radii.forEach(radius => {
        const roomName = this.getLocationRoomName(location.latitude, location.longitude, radius);
        socket.join(roomName);
      });
    }
  }

  leaveLocationRooms(socket) {
    // Get all rooms the socket is in and leave location-based ones
    const rooms = Array.from(socket.rooms);
    rooms.forEach(room => {
      if (room.startsWith('location_')) {
        socket.leave(room);
      }
    });
  }

  getLocationRoomName(latitude, longitude, radius) {
    // Round coordinates to create consistent room names
    const latRounded = Math.round(latitude * 100) / 100;
    const lngRounded = Math.round(longitude * 100) / 100;
    return `location_${latRounded}_${lngRounded}_${radius}`;
  }

  // Emit donation created event to nearby users
  emitDonationCreated(donation) {
    const { latitude, longitude } = this.getCoordinatesFromDonation(donation);
    
    if (latitude && longitude) {
      // Emit to all radius-based rooms
      const radii = [1, 5, 10, 25, 50];
      radii.forEach(radius => {
        const roomName = this.getLocationRoomName(latitude, longitude, radius);
        this.io.to(roomName).emit('donation_created', {
          type: 'donation_created',
          data: {
            donation: {
              id: donation._id,
              title: donation.title,
              location: donation.location,
              foodType: donation.foodType,
              status: donation.status,
              createdAt: donation.createdAt
            }
          },
          timestamp: new Date().toISOString()
        });
      });
    }
  }

  // Emit donation claimed event
  emitDonationClaimed(donationId, claimedBy) {
    this.io.emit('donation_claimed', {
      type: 'donation_claimed',
      data: {
        donationId,
        claimedBy,
        claimedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  // Emit donation updated event
  emitDonationUpdated(donationId, changes) {
    this.io.emit('donation_updated', {
      type: 'donation_updated',
      data: {
        donationId,
        changes,
        updatedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }

  // Send notification to specific user
  sendUserNotification(userId, event, data) {
    this.io.to(`user_${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users count
  getConnectedUsersCount() {
    return this.connectedUsers.size;
  }

  // Get users in a specific location radius
  getUsersInRadius(latitude, longitude, radius) {
    const roomName = this.getLocationRoomName(latitude, longitude, radius);
    const room = this.io.sockets.adapter.rooms.get(roomName);
    return room ? room.size : 0;
  }

  getCoordinatesFromDonation(donation) {
    if (donation.location && donation.location.coordinates) {
      const [longitude, latitude] = donation.location.coordinates;
      return { latitude, longitude };
    }
    return { latitude: null, longitude: null };
  }

  // Broadcast system message
  broadcastSystemMessage(message, type = 'info') {
    this.io.emit('system_message', {
      type: 'system_message',
      data: {
        message,
        messageType: type,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });
  }
}

export default WebSocketService;
