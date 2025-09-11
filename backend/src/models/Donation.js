import mongoose from 'mongoose';

const donationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 255
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  foodType: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  quantity: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['pieces', 'kg', 'lbs', 'liters', 'gallons', 'boxes', 'bags']
    }
  },
  weight: {
    type: Number,
    required: true,
    min: 0
  },
  images: [{
    type: String, // URLs to uploaded images
    required: false
  }],
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
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
      required: true,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    }
  },
  status: {
    type: String,
    enum: ['available', 'claimed', 'picked-up', 'expired', 'cancelled'],
    default: 'available'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  claimedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  pickupDateTime: {
    type: Date,
    required: true
  },
  expirationDate: {
    type: Date,
    required: true
  },
  aiGenerated: {
    foodName: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      trim: true
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1
    }
  }
}, {
  timestamps: true
});

// Create geospatial index for location queries
donationSchema.index({ location: '2dsphere' });

// Create compound indexes for common queries
donationSchema.index({ status: 1, createdAt: -1 });
donationSchema.index({ foodType: 1, status: 1 });
donationSchema.index({ createdBy: 1, createdAt: -1 });
donationSchema.index({ claimedBy: 1, createdAt: -1 });

// Virtual for distance calculation (will be populated by queries)
donationSchema.virtual('distance').get(function() {
  return this._distance;
});

// Method to check if donation is expired
donationSchema.methods.isExpired = function() {
  return new Date() > this.expirationDate;
};

// Method to check if donation can be claimed
donationSchema.methods.canBeClaimed = function() {
  return this.status === 'available' && !this.isExpired();
};

// Static method to find donations near a location
donationSchema.statics.findNear = function(longitude, latitude, maxDistance = 10000, options = {}) {
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
    ...options
  };

  return this.find(query).populate('createdBy', 'firstName lastName avatar');
};

// Static method to find donations within a radius
donationSchema.statics.findWithinRadius = function(longitude, latitude, radiusKm, options = {}) {
  const radiusInMeters = radiusKm * 1000;
  
  const query = {
    location: {
      $geoWithin: {
        $centerSphere: [[longitude, latitude], radiusInMeters / 6371000] // Convert to radians
      }
    },
    ...options
  };

  return this.find(query).populate('createdBy', 'firstName lastName avatar');
};

// Pre-save middleware to auto-expire donations
donationSchema.pre('save', function(next) {
  if (this.isExpired() && this.status === 'available') {
    this.status = 'expired';
  }
  next();
});

export default mongoose.model('Donation', donationSchema);
