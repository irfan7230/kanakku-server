import express from 'express';
import * as productController from '../controllers/productController';
import verifyToken from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware';

const router = express.Router();
router.use(verifyToken);
router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);
router.put('/:id', productController.updateProduct);
router.delete('/:id', productController.deleteProduct);

export default router;
