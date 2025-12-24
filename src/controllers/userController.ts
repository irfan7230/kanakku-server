import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { BusinessProfile } from '../types/models';

const collectionName = 'users';

export const getProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const docRef = db.collection(collectionName).doc(userId);
        const doc = await docRef.get();

        if (!doc.exists) {
            const defaultProfile: BusinessProfile = {
                uid: userId,
                email: req.user?.email || '',
                name: req.user?.name || '',
            };
            return res.status(200).json({
                ...defaultProfile,
                description: 'Profile not set up'
            });
        }

        res.status(200).json({ uid: userId, ...doc.data() });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, address, phone } = req.body;

        const docRef = db.collection(collectionName).doc(userId);

        await docRef.set({
            email: req.user?.email,
            name: name,
            address: address,
            phone: phone,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const resetUserData = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const BATCH_SIZE = 500;
        let batch = db.batch();
        let operationCount = 0;

        // 1. Hard Delete Shops
        const shopsSnapshot = await db.collection('shops')
            .where('userId', '==', userId)
            .get();

        for (const doc of shopsSnapshot.docs) {
            batch.delete(doc.ref);
            operationCount++;
            if (operationCount >= BATCH_SIZE) {
                await batch.commit();
                batch = db.batch();
                operationCount = 0;
            }
        }

        // 2. Hard Delete Transactions
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', userId)
            .get();

        for (const doc of transactionsSnapshot.docs) {
            batch.delete(doc.ref);
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

        res.status(200).json({ message: 'All user data has been reset successfully' });
    } catch (error) {
        console.error('Error resetting user data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
