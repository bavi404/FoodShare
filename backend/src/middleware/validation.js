import { body, param, query, validationResult } from 'express-validator';

// Validation middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: errors.array()
      }
    });
  }
  next();
};

// Donation creation validation
export const validateDonationCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must be less than 255 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ max: 1000 })
    .withMessage('Description must be less than 1000 characters'),
  
  body('foodType')
    .trim()
    .notEmpty()
    .withMessage('Food type is required')
    .isLength({ max: 100 })
    .withMessage('Food type must be less than 100 characters'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must be less than 100 characters'),
  
  body('quantity.amount')
    .isNumeric()
    .withMessage('Quantity amount must be a number')
    .isFloat({ min: 0 })
    .withMessage('Quantity amount must be positive'),
  
  body('quantity.unit')
    .isIn(['pieces', 'kg', 'lbs', 'liters', 'gallons', 'boxes', 'bags'])
    .withMessage('Invalid quantity unit'),
  
  body('weight')
    .isNumeric()
    .withMessage('Weight must be a number')
    .isFloat({ min: 0 })
    .withMessage('Weight must be positive'),
  
  // Accept either full location.coordinates or lat/lng pair
  body()
    .custom((value, { req }) => {
      const hasGeoArray = Array.isArray(req.body?.location?.coordinates) && req.body.location.coordinates.length === 2;
      const hasLatLng = req.body.lat !== undefined && req.body.lng !== undefined;
      if (!hasGeoArray && !hasLatLng) {
        throw new Error('Provide either location.coordinates [lng,lat] or lat/lng');
      }
      return true;
    }),

  // If coordinates array present, validate it
  body('location.coordinates').optional()
    .isArray({ min: 2, max: 2 }).withMessage('location.coordinates must be [lng, lat]'),
  body('location.coordinates.*').optional().isNumeric().withMessage('Coordinates must be numbers'),
  body('location.coordinates[0]').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
  body('location.coordinates[1]').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),

  // If lat/lng provided, validate them
  body('lat').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('lng').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),

  // Optional address fields
  body('address').optional().trim().isLength({ max: 500 }).withMessage('Address must be less than 500 characters'),
  body('city').optional().trim().isLength({ max: 100 }).withMessage('City too long'),
  body('state').optional().trim().isLength({ max: 100 }).withMessage('State too long'),
  
  body('pickupDateTime')
    .isISO8601()
    .withMessage('Pickup date time must be a valid ISO 8601 date'),
  
  body('expirationDate')
    .isISO8601()
    .withMessage('Expiration date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const pickupDate = new Date(req.body.pickupDateTime);
      const expirationDate = new Date(value);
      if (expirationDate <= pickupDate) {
        throw new Error('Expiration date must be after pickup date');
      }
      return true;
    }),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  
  body('images.*')
    .optional()
    .isString()
    .withMessage('Each image must be a string (URL or base64)'),
  
  handleValidationErrors
];

// Donation claim validation
export const validateDonationClaim = [
  param('donationId')
    .isMongoId()
    .withMessage('Invalid donation ID'),
  
  handleValidationErrors
];

// Donation update validation
export const validateDonationUpdate = [
  param('donationId')
    .isMongoId()
    .withMessage('Invalid donation ID'),
  
  body('status')
    .isIn(['available', 'claimed', 'picked-up', 'expired', 'cancelled'])
    .withMessage('Invalid status value'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  handleValidationErrors
];

// Location query validation
export const validateLocationQuery = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Radius must be between 0.1 and 100 km'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('foodType')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Food type must be less than 100 characters'),
  
  query('status')
    .optional()
    .isIn(['available', 'claimed', 'picked-up', 'expired', 'cancelled'])
    .withMessage('Invalid status value'),
  
  handleValidationErrors
];

// User location update validation
export const validateUserLocationUpdate = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must be less than 500 characters'),
  
  handleValidationErrors
];

// AI image analysis validation
export const validateImageAnalysis = [
  body('image')
    .notEmpty()
    .withMessage('Image is required'),
  
  body('options.extractText')
    .optional()
    .isBoolean()
    .withMessage('extractText must be a boolean'),
  
  body('options.detectFood')
    .optional()
    .isBoolean()
    .withMessage('detectFood must be a boolean'),
  
  body('options.suggestCategory')
    .optional()
    .isBoolean()
    .withMessage('suggestCategory must be a boolean'),
  
  handleValidationErrors
];
