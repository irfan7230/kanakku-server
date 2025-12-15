import multer from 'multer';
import cloudinary from '../config/cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'kanakku_products',
        allowedFormats: ['jpg', 'png', 'jpeg', 'webp'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    } as any, // Type assertion for params as library types might be strict/incomplete
});

const upload = multer({ storage: storage });

export default upload;
