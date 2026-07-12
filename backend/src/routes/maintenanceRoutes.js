import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createMaintenance, closeMaintenance, getMaintenanceLogs } from '../controllers/maintenanceController.js';

const router = Router();
router.use(requireAuth);

router.get('/', getMaintenanceLogs);
router.post('/', requireRole('Fleet Manager'), createMaintenance);
router.patch('/:id/close', requireRole('Fleet Manager'), closeMaintenance);

export default router;
