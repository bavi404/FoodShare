import express from 'express';
import {
  updateUserLocation,
  getUserPreferences,
  updateUserPreferences,
  getUserProfile,
  updateUserProfile
} from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserLocationUpdate } from '../middleware/validation.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticateToken);

router.get('/me', getUserProfile);
router.put('/me', updateUserProfile);
router.put('/me/location', validateUserLocationUpdate, updateUserLocation);
router.get('/me/preferences', getUserPreferences);
router.put('/me/preferences', updateUserPreferences);

export default router;
