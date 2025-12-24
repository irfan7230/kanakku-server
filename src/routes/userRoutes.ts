import express from 'express';
import * as userController from '../controllers/userController';
import verifyToken from '../middleware/authMiddleware';

const router = express.Router();
router.use(verifyToken);
router.get('/', userController.getProfile);
router.put('/', userController.updateProfile);
router.delete('/reset', userController.resetUserData);

export default router;
