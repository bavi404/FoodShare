# FoodShare Backend API

A scalable, real-time geospatial backend for the FoodShare community food-sharing platform.

## Features

- **Real-time Geospatial Queries**: Find donations within specific radius using MongoDB geospatial indexing
- **WebSocket Support**: Real-time updates for map changes and donation events
- **AI Image Recognition**: Automatic food identification using Google Cloud Vision API
- **RESTful API**: Comprehensive API endpoints for all platform functionality
- **Authentication**: JWT-based authentication with user management
- **Rate Limiting**: Built-in rate limiting and security features
- **Error Handling**: Comprehensive error handling and logging

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.IO** for WebSocket connections
- **Google Cloud Vision API** for AI image recognition
- **JWT** for authentication
- **Winston** for logging

## Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 4.4+
- Google Cloud account (for Vision API)

### Installation

1. Clone the repository and navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/foodshare

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Google Cloud Vision API
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
GOOGLE_CLOUD_PROJECT_ID=your-project-id

# AWS S3 (optional, for image storage)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-s3-bucket-name

# Mapbox (optional, for enhanced mapping)
MAPBOX_ACCESS_TOKEN=your-mapbox-access-token
```

## API Endpoints

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### Geospatial Endpoints

#### Get Donations Near Location
```http
GET /api/donations/near?lat=40.7128&lng=-74.0060&radius=10&limit=50
```

#### Create Donation
```http
POST /api/donations
Content-Type: application/json

{
  "title": "Fresh Apples",
  "description": "Organic apples from local farm",
  "foodType": "fruits",
  "quantity": {
    "amount": 5,
    "unit": "kg"
  },
  "weight": 5.0,
  "location": {
    "coordinates": [-74.0060, 40.7128],
    "address": "123 Main St, New York, NY"
  },
  "pickupDateTime": "2024-01-15T14:00:00Z",
  "expirationDate": "2024-01-20"
}
```

#### Claim Donation
```http
POST /api/donations/{donationId}/claim
```

### AI Endpoints

#### Analyze Food Image
```http
POST /api/ai/analyze-image
Content-Type: application/json

{
  "image": "base64_encoded_image_data",
  "options": {
    "extractText": true,
    "detectFood": true,
    "suggestCategory": true
  }
}
```

### User Endpoints

#### Update User Location
```http
PUT /api/users/me/location
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "address": "123 Main St, New York, NY"
}
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:5000` with authentication token.

### Client Events
- `update_location`: Update user location
- `subscribe_nearby`: Subscribe to nearby donation updates
- `unsubscribe_nearby`: Unsubscribe from nearby updates

### Server Events
- `donation_created`: New donation posted nearby
- `donation_claimed`: Donation claimed by someone
- `donation_updated`: Donation status updated
- `system_message`: System-wide notifications

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  firebaseUid: String,
  email: String,
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  location: {
    type: "Point",
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String
  },
  preferences: {
    maxDistance: Number,
    foodTypes: [String],
    notifications: Object
  },
  stats: {
    donationsCreated: Number,
    donationsClaimed: Number,
    totalFoodSaved: Number
  }
}
```

### Donations Collection
```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  foodType: String,
  category: String,
  quantity: {
    amount: Number,
    unit: String
  },
  weight: Number,
  images: [String],
  location: {
    type: "Point",
    coordinates: [lng, lat],
    address: String,
    city: String,
    state: String
  },
  status: String,
  createdBy: ObjectId,
  claimedBy: ObjectId,
  pickupDateTime: Date,
  expirationDate: Date,
  aiGenerated: {
    foodName: String,
    category: String,
    confidence: Number
  }
}
```

## Geospatial Queries

The backend supports efficient geospatial queries using MongoDB's 2dsphere indexing:

```javascript
// Find donations within 5km radius
const donations = await Donation.findNear(
  longitude, 
  latitude, 
  5000, // meters
  { status: 'available' }
);

// Find donations within specific radius
const donations = await Donation.findWithinRadius(
  longitude, 
  latitude, 
  10, // km
  { foodType: 'fruits' }
);
```

## Real-time Features

The WebSocket service provides real-time updates for:

1. **Location-based rooms**: Users are automatically joined to rooms based on their location
2. **Donation events**: Real-time notifications when donations are created, claimed, or updated
3. **User presence**: Track connected users and their locations
4. **Targeted notifications**: Send notifications to specific users or location-based groups

## Error Handling

The API uses consistent error response format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {} // Additional error details
  }
}
```

Common error codes:
- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_REQUIRED`: Missing or invalid token
- `PERMISSION_DENIED`: Insufficient permissions
- `DONATION_NOT_FOUND`: Donation doesn't exist
- `RATE_LIMIT_EXCEEDED`: Too many requests

## Development

### Running Tests
```bash
npm test
```

### Database Migration
```bash
npm run migrate
```

### Seeding Database
```bash
npm run seed
```

### Logs
Logs are stored in the `logs/` directory:
- `error.log`: Error-level logs
- `combined.log`: All logs

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set up proper JWT secrets
4. Configure Google Cloud credentials
5. Set up reverse proxy (nginx)
6. Use PM2 for process management

## Security Features

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation and sanitization
- JWT token authentication
- MongoDB injection prevention

## Performance Optimizations

- Geospatial indexing for location queries
- Connection pooling for MongoDB
- Compression middleware
- Efficient WebSocket room management
- Caching for frequently accessed data

## Monitoring

The API includes health check endpoint:
```http
GET /health
```

Returns server status, uptime, and connected users count.

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass
5. Follow semantic versioning

## License

MIT License - see LICENSE file for details
