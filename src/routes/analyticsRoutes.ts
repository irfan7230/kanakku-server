import express from 'express';
import * as analyticsController from '../controllers/analyticsController';
import verifyToken from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);
router.get('/dashboard', analyticsController.getDashboardSummary);
export default router;
