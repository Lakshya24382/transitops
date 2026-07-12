import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  exportVehicles, exportDrivers, exportTrips, exportOperationalReport
} from '../controllers/exportController.js';

const router = Router();
router.use(requireAuth);

router.get('/vehicles', requireRole('Fleet Manager'), exportVehicles);
router.get('/drivers', requireRole('Fleet Manager', 'Safety Officer'), exportDrivers);
router.get('/trips', requireRole('Fleet Manager', 'Dispatcher'), exportTrips);
router.get('/operational-report', requireRole('Fleet Manager', 'Financial Analyst'), exportOperationalReport);

export default router;
