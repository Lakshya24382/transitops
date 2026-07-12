import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getDashboardKPIs, getVehicleStatusBreakdown, getRecentTrips } from '../controllers/dashboardController.js';

const router = Router();
router.use(requireAuth);

router.get('/kpis', getDashboardKPIs);
router.get('/vehicle-status', getVehicleStatusBreakdown);
router.get('/recent-trips', getRecentTrips);

export default router;
