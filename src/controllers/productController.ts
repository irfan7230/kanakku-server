import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Product } from '../types/models';

const collectionName = 'products';

export const createProduct = async (req: Request, res: Response) => {
    try {
        const { shopId, name, price, quantity, purchasedAt } = req.body;
        console.log('Create Product Body:', req.body);
        console.log('Create Product File:', req.file);

        const userId = req.user?.uid;
        // req.file extends Express.Multer.File which has path property
        const imagePath = req.file ? req.file.path : undefined;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!shopId || !name) {
            return res.status(400).json({ error: 'Shop ID and Name are required' });
        }

        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists || shopDoc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Shop access denied' });
        }

        const newProduct: Product = {
            shopId,
            userId,
            name,
            price: Number(price) || 0,
            quantity: Number(quantity) || 0,
            imagePath: imagePath || '',
            purchasedAt: purchasedAt || new Date().toISOString(),
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        if (req.body.id) {
            await db.collection(collectionName).doc(req.body.id).set(newProduct, { merge: true });
            res.status(200).json({ id: req.body.id, ...newProduct });
        } else {
            // Simply create the product - Products ARE the source of truth for debt
            // No need to create "Purchase" transaction - balance is computed from products directly
            const docRef = await db.collection(collectionName).add(newProduct);
            res.status(201).json({ id: docRef.id, ...newProduct });
        }
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getProducts = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { shopId } = req.query;

        let query = db.collection(collectionName)
            .where('userId', '==', userId)
            .where('isActive', '==', true);

        if (shopId) {
            query = query.where('shopId', '==', shopId as string);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const products: Product[] = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() } as Product);
        });

        res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        const updates = req.body;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        delete updates.id;
        delete updates.userId;
        delete updates.shopId;

        const docRef = db.collection(collectionName).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (doc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await docRef.update(updates);
        res.status(200).json({ id, ...doc.data(), ...updates });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteProduct = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const docRef = db.collection(collectionName).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Product not found' });
        }

        if (doc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const batch = db.batch();
        batch.update(docRef, { isActive: false });

        // Find and delete related transaction (purchase)
        const transactionsSnapshot = await db.collection('transactions')
            .where('relatedProductId', '==', id)
            .where('userId', '==', userId)
            .get();

        transactionsSnapshot.forEach(tDoc => {
            batch.update(tDoc.ref, { isActive: false });
        });

        await batch.commit();
        res.status(200).json({ message: 'Product and related transaction deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
