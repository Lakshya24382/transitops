import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createDriver, getDrivers, getAvailableDrivers,
  getDriverById, updateDriver, deleteDriver
} from '../controllers/driverController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getDrivers);
router.get('/available', getAvailableDrivers);
router.get('/:id', getDriverById);

router.post('/', requireRole('Fleet Manager', 'Safety Officer'), createDriver);
router.put('/:id', requireRole('Fleet Manager', 'Safety Officer'), updateDriver);
router.delete('/:id', requireRole('Fleet Manager', 'Safety Officer'), deleteDriver);

export default router;
