import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../middleware/requireAuth.js';
import {
  getProfile,
  putProfile,
  putPassword,
  putPreferences,
} from '../controllers/admin.controller.js';

const router = Router();

router.use(requireAuth);

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many password change attempts. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/profile', getProfile);
router.put('/profile', putProfile);
router.put('/password', passwordLimiter, putPassword);
router.put('/preferences', putPreferences);

export default router;