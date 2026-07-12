import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getFuelEfficiency, getFleetUtilization, getOperationalCostSummary,
  getVehicleROI, getTopCostliestVehicles, getMonthlyRevenue
} from '../controllers/analyticsController.js';

const router = Router();
router.use(requireAuth);
router.use(requireRole('Fleet Manager', 'Financial Analyst'));

router.get('/fuel-efficiency', getFuelEfficiency);
router.get('/fleet-utilization', getFleetUtilization);
router.get('/operational-cost', getOperationalCostSummary);
router.get('/vehicle-roi', getVehicleROI);
router.get('/top-costliest', getTopCostliestVehicles);
router.get('/monthly-revenue', getMonthlyRevenue);

export default router;
