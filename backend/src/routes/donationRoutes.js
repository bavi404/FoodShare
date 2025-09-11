import express from 'express';
import {
  getDonationsNear,
  createDonation,
  claimDonation,
  updateDonationStatus,
  getDonationById,
  getUserDonations
} from '../controllers/donationController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateDonationCreation, validateDonationClaim, validateDonationUpdate } from '../middleware/validation.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/near', getDonationsNear);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/', validateDonationCreation, createDonation);
router.get('/user', getUserDonations);
router.get('/:donationId', getDonationById);
router.post('/:donationId/claim', validateDonationClaim, claimDonation);
router.patch('/:donationId/status', validateDonationUpdate, updateDonationStatus);

export default router;
