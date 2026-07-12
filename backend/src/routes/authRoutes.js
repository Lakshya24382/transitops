import { Router } from 'express';
import { signup, login, me, changePassword, updateProfile } from '../controllers/authController.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);
router.put('/profile', requireAuth, updateProfile);

// User creation is now an admin action, not public self-registration
router.post('/signup', requireAuth, requireRole('Fleet Manager'), signup);

export default router;
