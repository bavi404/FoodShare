import express from 'express';
import { analyzeImage } from '../controllers/aiController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateImageAnalysis } from '../middleware/validation.js';

const router = express.Router();

// All AI routes require authentication
router.use(authenticateToken);

router.post('/analyze-image', validateImageAnalysis, analyzeImage);

export default router;
