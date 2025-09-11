# Database Schema for Real-Time Geospatial Platform

## Current Firebase Schema Issues
- No geospatial indexing
- Limited query capabilities for radius-based searches
- No spatial data optimization

## Proposed Schema Design

### Option 1: MongoDB with Geospatial Support (Recommended)
```javascript
// Users Collection
{
  _id: ObjectId,
  uid: String, // Firebase UID
  email: String,
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  location: {
    type: "Point",
    coordinates: [lng, lat], // GeoJSON format
    address: String,
    city: String,
    state: String,
    zipCode: String
  },
  preferences: {
    maxDistance: Number, // km
    foodTypes: [String],
    notifications: Boolean
  },
  createdAt: Date,
  updatedAt: Date
}

// Donations Collection
{
  _id: ObjectId,
  title: String,
  description: String,
  foodType: String,
  category: String, // e.g., "fruits", "vegetables", "meals"
  quantity: {
    amount: Number,
    unit: String // "pieces", "kg", "lbs"
  },
  weight: Number, // kg
  images: [String], // URLs to uploaded images
  location: {
    type: "Point",
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String
  },
  status: String, // "available", "claimed", "picked-up", "expired"
  createdBy: ObjectId, // Reference to Users
  claimedBy: ObjectId, // Reference to Users
  pickupDateTime: Date,
  expirationDate: Date,
  aiGenerated: {
    foodName: String,
    category: String,
    confidence: Number
  },
  createdAt: Date,
  updatedAt: Date
}

// Real-time Events Collection (for WebSocket)
{
  _id: ObjectId,
  type: String, // "donation_created", "donation_claimed", "donation_updated"
  donationId: ObjectId,
  userId: ObjectId,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  timestamp: Date,
  data: Object // Additional event-specific data
}
```

### Option 2: PostgreSQL with PostGIS Extension
```sql
-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    location GEOGRAPHY(POINT, 4326), -- PostGIS geography type
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    zip_code VARCHAR(20),
    max_distance INTEGER DEFAULT 10, -- km
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Donations Table
CREATE TABLE donations (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    food_type VARCHAR(100) NOT NULL,
    category VARCHAR(100),
    quantity_amount DECIMAL(10,2),
    quantity_unit VARCHAR(50),
    weight_kg DECIMAL(10,2),
    images TEXT[], -- Array of image URLs
    location GEOGRAPHY(POINT, 4326),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    status VARCHAR(50) DEFAULT 'available',
    created_by INTEGER REFERENCES users(id),
    claimed_by INTEGER REFERENCES users(id),
    pickup_datetime TIMESTAMP,
    expiration_date DATE,
    ai_food_name VARCHAR(255),
    ai_category VARCHAR(100),
    ai_confidence DECIMAL(3,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create spatial indexes
CREATE INDEX idx_users_location ON users USING GIST (location);
CREATE INDEX idx_donations_location ON donations USING GIST (location);
CREATE INDEX idx_donations_status ON donations (status);
CREATE INDEX idx_donations_created_at ON donations (created_at);

-- Real-time Events Table
CREATE TABLE realtime_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    donation_id INTEGER REFERENCES donations(id),
    user_id INTEGER REFERENCES users(id),
    location GEOGRAPHY(POINT, 4326),
    event_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## Geospatial Query Examples

### MongoDB Queries
```javascript
// Find donations within 5km radius
db.donations.find({
  location: {
    $near: {
      $geometry: {
        type: "Point",
        coordinates: [lng, lat]
      },
      $maxDistance: 5000 // meters
    }
  },
  status: "available"
})

// Find donations by food type within radius
db.donations.find({
  location: {
    $geoWithin: {
      $centerSphere: [[lng, lat], radiusInRadians]
    }
  },
  foodType: "fruits",
  status: "available"
})
```

### PostgreSQL/PostGIS Queries
```sql
-- Find donations within 5km radius
SELECT *, ST_Distance(location, ST_Point(lng, lat)::geography) as distance
FROM donations
WHERE ST_DWithin(location, ST_Point(lng, lat)::geography, 5000)
AND status = 'available'
ORDER BY distance;

-- Find donations by food type within radius
SELECT *, ST_Distance(location, ST_Point(lng, lat)::geography) as distance
FROM donations
WHERE ST_DWithin(location, ST_Point(lng, lat)::geography, 5000)
AND food_type = 'fruits'
AND status = 'available'
ORDER BY distance;
```

## Migration Strategy

1. **Phase 1**: Set up new database alongside Firebase
2. **Phase 2**: Create data migration scripts
3. **Phase 3**: Implement dual-write pattern
4. **Phase 4**: Switch reads to new database
5. **Phase 5**: Remove Firebase dependency
