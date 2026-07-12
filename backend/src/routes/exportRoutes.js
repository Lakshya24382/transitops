import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  exportVehicles, exportDrivers, exportTrips, exportOperationalReport,
  exportVehiclesPDF, exportDriversPDF, exportTripsPDF, exportOperationalReportPDF
} from '../controllers/exportController.js';

const router = Router();
router.use(requireAuth);

// CSV
router.get('/vehicles', requireRole('Fleet Manager'), exportVehicles);
router.get('/drivers', requireRole('Fleet Manager', 'Safety Officer'), exportDrivers);
router.get('/trips', requireRole('Fleet Manager', 'Dispatcher'), exportTrips);
router.get('/operational-report', requireRole('Fleet Manager', 'Financial Analyst'), exportOperationalReport);

// PDF
router.get('/vehicles/pdf', requireRole('Fleet Manager'), exportVehiclesPDF);
router.get('/drivers/pdf', requireRole('Fleet Manager', 'Safety Officer'), exportDriversPDF);
router.get('/trips/pdf', requireRole('Fleet Manager', 'Dispatcher'), exportTripsPDF);
router.get('/operational-report/pdf', requireRole('Fleet Manager', 'Financial Analyst'), exportOperationalReportPDF);

export default router;
