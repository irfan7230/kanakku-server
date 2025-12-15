import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { Transaction } from '../types/models';

const collectionName = 'transactions';

export const createTransaction = async (req: Request, res: Response) => {
    try {
        const { shopId, amount, type, date, note, relatedProductId } = req.body;
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        if (!shopId || amount === undefined || !type) {
            return res.status(400).json({ error: 'Shop ID, Amount, and Type are required' });
        }

        const shopDoc = await db.collection('shops').doc(shopId).get();
        if (!shopDoc.exists || shopDoc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized: Shop access denied' });
        }

        const newTransaction: Transaction = {
            shopId,
            userId,
            amount: Number(amount),
            type: type,
            date: date || new Date().toISOString(),
            note: note || '',
            relatedProductId: relatedProductId || undefined,
            isActive: true,
            createdAt: new Date().toISOString(),
        };

        if (req.body.id) {
            await db.collection(collectionName).doc(req.body.id).set(newTransaction, { merge: true });
            res.status(200).json({ id: req.body.id, ...newTransaction });
        } else {
            const docRef = await db.collection(collectionName).add(newTransaction);
            res.status(201).json({ id: docRef.id, ...newTransaction });
        }
    } catch (error) {
        console.error('Error creating transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
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

        const transactions: Transaction[] = [];
        snapshot.forEach(doc => {
            transactions.push({ id: doc.id, ...doc.data() } as Transaction);
        });

        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const deleteTransaction = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const docRef = db.collection(collectionName).doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        if (doc.data()?.userId !== userId) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        await docRef.update({ isActive: false });
        res.status(200).json({ message: 'Transaction deleted successfully (soft delete)' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
