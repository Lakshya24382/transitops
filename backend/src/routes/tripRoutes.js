import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createTrip, getTrips, getTripById, updateTrip,
  dispatchTrip, completeTrip, cancelTrip
} from '../controllers/tripController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getTrips);
router.get('/:id', getTripById);

router.post('/', requireRole('Dispatcher', 'Fleet Manager'), createTrip);
router.put('/:id', requireRole('Dispatcher', 'Fleet Manager'), updateTrip);
router.patch('/:id/dispatch', requireRole('Dispatcher', 'Fleet Manager'), dispatchTrip);
router.patch('/:id/complete', requireRole('Dispatcher', 'Fleet Manager'), completeTrip);
router.patch('/:id/cancel', requireRole('Dispatcher', 'Fleet Manager'), cancelTrip);

export default router;
