import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { WholesaleShop } from '../types/models';

const collectionName = 'shops';

export const createShop = async (req: Request, res: Response) => {
    try {
        const { name, ownerName, contactNumber, address, upiId } = req.body;
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!name) {
            return res.status(400).json({ error: 'Shop Name is required' });
        }

        const newShop: WholesaleShop = {
            userId,
            name,
            ownerName: ownerName || '',
            contactNumber: contactNumber || '',
            address: address || '',
            upiId: upiId || '',
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        if (req.body.id) {
            // RESTORE / UPSERT MODE
            await db.collection(collectionName).doc(req.body.id).set(newShop, { merge: true });
            res.status(200).json({ id: req.body.id, ...newShop });
        } else {
            // NORMAL CREATE MODE
            const docRef = await db.collection(collectionName).add(newShop);
            res.status(201).json({ id: docRef.id, ...newShop });
        }
    } catch (error) {
        console.error('Error creating shop:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getShops = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const snapshot = await db.collection(collectionName)
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .get();

        if (snapshot.empty) {
            return res.status(200).json([]);
        }

        const shops: WholesaleShop[] = [];
        snapshot.forEach(doc => {
            shops.push({ id: doc.id, ...doc.data() } as WholesaleShop);
        });

        res.status(200).json(shops);
    } catch (error) {
        console.error('Error fetching shops:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateShop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        const updates = req.body;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        delete updates.id;
        delete updates.userId;
        delete updates.createdAt;

        const shopRef = db.collection(collectionName).doc(id);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await shopRef.update(updates);
        res.status(200).json({ id, ...shopDoc.data(), ...updates });
    } catch (error) {
        console.error('Error updating shop:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteShop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const shopRef = db.collection(collectionName).doc(id);
        const shopDoc = await shopRef.get();

        if (!shopDoc.exists) {
            return res.status(404).json({ error: 'Shop not found' });
        }

        if (shopDoc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Batch has a limit of 500 operations. We need to handle this.
        const BATCH_SIZE = 500;
        let batch = db.batch();
        let operationCount = 0;

        batch.update(shopRef, { isActive: false });
        operationCount++;

        // Delete all transactions for this shop
        const transactionsSnapshot = await db.collection('transactions')
            .where('shopId', '==', id)
            .where('userId', '==', userId)
            .get();

        for (const doc of transactionsSnapshot.docs) {
            batch.update(doc.ref, { isActive: false });
            operationCount++;

            if (operationCount >= BATCH_SIZE) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }

        if (operationCount > 0) {
            await batch.commit();
        }

        res.status(200).json({ message: 'Shop and all related data deleted successfully' });
    } catch (error) {
        console.error('Error deleting shop:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
