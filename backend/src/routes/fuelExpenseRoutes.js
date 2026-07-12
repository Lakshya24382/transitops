import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  logFuel, getFuelLogs, addExpense, getExpenses, getOperationalCost
} from '../controllers/fuelExpenseController.js';

const router = Router();
router.use(requireAuth);

router.get('/fuel', getFuelLogs);
router.post('/fuel', requireRole('Fleet Manager', 'Financial Analyst'), logFuel);

router.get('/expenses', getExpenses);
router.post('/expenses', requireRole('Fleet Manager', 'Financial Analyst'), addExpense);

router.get('/operational-cost/:vehicle_id', getOperationalCost);

export default router;
