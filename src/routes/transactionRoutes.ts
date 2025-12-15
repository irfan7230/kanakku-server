import express from 'express';
import * as transactionController from '../controllers/transactionController';
import verifyToken from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);
router.post('/', transactionController.createTransaction);
router.get('/', transactionController.getTransactions);
router.delete('/:id', transactionController.deleteTransaction);

export default router;
