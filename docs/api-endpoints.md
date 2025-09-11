# API Endpoints for Real-Time Geospatial Platform

## Base URL
```
https://api.foodshare.com/v1
```

## Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Geospatial Endpoints

### 1. Get Donations Near Location
```http
GET /donations/near?lat={latitude}&lng={longitude}&radius={radius_km}&limit={limit}
```

**Parameters:**
- `lat` (required): Latitude
- `lng` (required): Longitude  
- `radius` (optional): Search radius in kilometers (default: 10)
- `limit` (optional): Maximum results (default: 50)
- `foodType` (optional): Filter by food type
- `status` (optional): Filter by status (default: "available")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "donation_123",
      "title": "Fresh Apples",
      "description": "Organic apples from local farm",
      "foodType": "fruits",
      "category": "fruits",
      "quantity": {
        "amount": 5,
        "unit": "kg"
      },
      "weight": 5.0,
      "images": ["https://...", "https://..."],
      "location": {
        "coordinates": [lng, lat],
        "address": "123 Main St, City, State",
        "city": "City",
        "state": "State"
      },
      "status": "available",
      "createdBy": {
        "id": "user_123",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://..."
      },
      "pickupDateTime": "2024-01-15T14:00:00Z",
      "expirationDate": "2024-01-20",
      "distance": 2.5, // km from search point
      "createdAt": "2024-01-10T10:00:00Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 50,
    "hasMore": false
  }
}
```

### 2. Create Donation
```http
POST /donations
```

**Request Body:**
```json
{
  "title": "Fresh Apples",
  "description": "Organic apples from local farm",
  "foodType": "fruits",
  "category": "fruits",
  "quantity": {
    "amount": 5,
    "unit": "kg"
  },
  "weight": 5.0,
  "images": ["base64_encoded_image_1", "base64_encoded_image_2"],
  "location": {
    "coordinates": [lng, lat],
    "address": "123 Main St, City, State"
  },
  "pickupDateTime": "2024-01-15T14:00:00Z",
  "expirationDate": "2024-01-20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "donation_123",
    "title": "Fresh Apples",
    "status": "available",
    "createdAt": "2024-01-10T10:00:00Z",
    "aiGenerated": {
      "foodName": "Apples",
      "category": "fruits",
      "confidence": 0.95
    }
  }
}
```

### 3. Claim Donation
```http
POST /donations/{donation_id}/claim
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "donation_123",
    "status": "claimed",
    "claimedBy": "user_456",
    "claimedAt": "2024-01-10T11:00:00Z"
  }
}
```

### 4. Update Donation Status
```http
PATCH /donations/{donation_id}/status
```

**Request Body:**
```json
{
  "status": "picked-up",
  "notes": "Successfully picked up"
}
```

## Real-Time WebSocket Events

### Connection
```javascript
const ws = new WebSocket('wss://api.foodshare.com/v1/realtime?token=<jwt_token>');
```

### Event Types

#### 1. Donation Created
```json
{
  "type": "donation_created",
  "data": {
    "donation": {
      "id": "donation_123",
      "title": "Fresh Apples",
      "location": {
        "coordinates": [lng, lat]
      },
      "foodType": "fruits",
      "status": "available",
      "createdAt": "2024-01-10T10:00:00Z"
    }
  },
  "timestamp": "2024-01-10T10:00:00Z"
}
```

#### 2. Donation Claimed
```json
{
  "type": "donation_claimed",
  "data": {
    "donationId": "donation_123",
    "claimedBy": "user_456",
    "claimedAt": "2024-01-10T11:00:00Z"
  },
  "timestamp": "2024-01-10T11:00:00Z"
}
```

#### 3. Donation Updated
```json
{
  "type": "donation_updated",
  "data": {
    "donationId": "donation_123",
    "changes": {
      "status": "picked-up"
    },
    "updatedAt": "2024-01-10T12:00:00Z"
  },
  "timestamp": "2024-01-10T12:00:00Z"
}
```

## AI Image Recognition Endpoints

### 1. Analyze Food Image
```http
POST /ai/analyze-image
```

**Request Body:**
```json
{
  "image": "base64_encoded_image",
  "options": {
    "extractText": true,
    "detectFood": true,
    "suggestCategory": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "foodItems": [
      {
        "name": "Apples",
        "category": "fruits",
        "confidence": 0.95,
        "boundingBox": {
          "x": 100,
          "y": 150,
          "width": 200,
          "height": 180
        }
      }
    ],
    "extractedText": "Fresh Organic Apples - 5kg",
    "suggestedFormData": {
      "title": "Fresh Organic Apples",
      "foodType": "fruits",
      "category": "fruits",
      "quantity": {
        "amount": 5,
        "unit": "kg"
      }
    }
  }
}
```

## User Management Endpoints

### 1. Update User Location
```http
PUT /users/me/location
```

**Request Body:**
```json
{
  "location": {
    "coordinates": [lng, lat],
    "address": "123 Main St, City, State"
  }
}
```

### 2. Get User Preferences
```http
GET /users/me/preferences
```

**Response:**
```json
{
  "success": true,
  "data": {
    "maxDistance": 10,
    "foodTypes": ["fruits", "vegetables", "meals"],
    "notifications": {
      "email": true,
      "push": true,
      "nearbyDonations": true
    }
  }
}
```

## Error Responses

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid location coordinates",
    "details": {
      "field": "location.coordinates",
      "value": "invalid_coords"
    }
  },
  "timestamp": "2024-01-10T10:00:00Z"
}
```

### Common Error Codes
- `VALIDATION_ERROR`: Invalid request data
- `AUTHENTICATION_REQUIRED`: Missing or invalid JWT token
- `PERMISSION_DENIED`: User doesn't have permission for action
- `DONATION_NOT_FOUND`: Donation doesn't exist
- `DONATION_ALREADY_CLAIMED`: Donation is no longer available
- `LOCATION_NOT_FOUND`: Invalid location coordinates
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `INTERNAL_SERVER_ERROR`: Server error
