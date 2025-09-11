import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  profile: {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20
    },
    avatar: {
      type: String, // URL to avatar image
      default: null
    }
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      default: [0, 0],
      validate: {
        validator: function(coords) {
          return coords.length === 2 && 
                 coords[0] >= -180 && coords[0] <= 180 && // longitude
                 coords[1] >= -90 && coords[1] <= 90; // latitude
        },
        message: 'Invalid coordinates'
      }
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      default: ''
    },
    state: {
      type: String,
      trim: true,
      default: ''
    },
    zipCode: {
      type: String,
      trim: true,
      default: ''
    }
  },
  preferences: {
    maxDistance: {
      type: Number,
      default: 10, // km
      min: 1,
      max: 100
    },
    foodTypes: [{
      type: String,
      enum: ['fruits', 'vegetables', 'meals', 'bakery', 'dairy', 'meat', 'seafood', 'grains', 'beverages', 'other']
    }],
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      },
      nearbyDonations: {
        type: Boolean,
        default: true
      },
      donationUpdates: {
        type: Boolean,
        default: true
      }
    }
  },
  stats: {
    donationsCreated: {
      type: Number,
      default: 0
    },
    donationsClaimed: {
      type: Number,
      default: 0
    },
    totalFoodSaved: {
      type: Number,
      default: 0 // kg
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
userSchema.index({ location: '2dsphere' });

// Create compound indexes
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ 'preferences.foodTypes': 1 });
userSchema.index({ isActive: 1, 'stats.lastActive': -1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.profile.firstName} ${this.profile.lastName}`;
});

// Virtual for distance calculation (will be populated by queries)
userSchema.virtual('distance').get(function() {
  return this._distance;
});

// Method to update last active timestamp
userSchema.methods.updateLastActive = function() {
  this.stats.lastActive = new Date();
  return this.save();
};

// Method to increment donation stats
userSchema.methods.incrementDonationStats = function(type, foodWeight = 0) {
  if (type === 'created') {
    this.stats.donationsCreated += 1;
  } else if (type === 'claimed') {
    this.stats.donationsClaimed += 1;
    this.stats.totalFoodSaved += foodWeight;
  }
  return this.save();
};

// Method to check if user is within distance of a location
userSchema.methods.isWithinDistance = function(longitude, latitude, maxDistanceKm) {
  if (!this.location.coordinates || this.location.coordinates[0] === 0) {
    return false;
  }

  const R = 6371; // Earth's radius in kilometers
  const dLat = (latitude - this.location.coordinates[1]) * Math.PI / 180;
  const dLon = (longitude - this.location.coordinates[0]) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(this.location.coordinates[1] * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= maxDistanceKm;
};

// Static method to find users near a location
userSchema.statics.findNear = function(longitude, latitude, maxDistance = 10000, options = {}) {
  const query = {
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    isActive: true,
    ...options
  };

  return this.find(query);
};

// Pre-save middleware to validate location
userSchema.pre('save', function(next) {
  // If coordinates are [0, 0], set location to null
  if (this.location.coordinates[0] === 0 && this.location.coordinates[1] === 0) {
    this.location = undefined;
  }
  next();
});

export default mongoose.model('User', userSchema);
