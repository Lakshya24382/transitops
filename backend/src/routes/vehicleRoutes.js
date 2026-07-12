import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createVehicle, getVehicles, getAvailableVehicles,
  getVehicleById, updateVehicle, deleteVehicle
} from '../controllers/vehicleController.js';

const router = Router();

router.use(requireAuth);

router.get('/', getVehicles);
router.get('/available', getAvailableVehicles);
router.get('/:id', getVehicleById);

router.post('/', requireRole('Fleet Manager'), createVehicle);
router.put('/:id', requireRole('Fleet Manager'), updateVehicle);
router.delete('/:id', requireRole('Fleet Manager'), deleteVehicle);

export default router;
