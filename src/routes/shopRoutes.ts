import express from 'express';
import * as shopController from '../controllers/shopController';
import verifyToken from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);
router.post('/', shopController.createShop);
router.get('/', shopController.getShops);
router.put('/:id', shopController.updateShop);
router.delete('/:id', shopController.deleteShop);

export default router;
