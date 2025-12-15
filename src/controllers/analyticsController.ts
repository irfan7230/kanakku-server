import { Request, Response } from 'express';
import { db } from '../config/firebase';

export const getDashboardSummary = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.uid;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        // Shop Count
        const shopsSnapshot = await db.collection('shops')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .count()
            .get();

        const shopCount = shopsSnapshot.data().count;

        // Transaction Summaries
        const transactionsSnapshot = await db.collection('transactions')
            .where('userId', '==', userId)
            .where('isActive', '==', true)
            .select('amount', 'type')
            .get();

        let totalPurchase = 0;
        let totalPaid = 0;

        transactionsSnapshot.forEach(doc => {
            const data = doc.data();
            const amt = Number(data.amount) || 0;
            if (data.type === 'purchase' || data.type === 0) {
                totalPurchase += amt;
            } else if (data.type === 'payment' || data.type === 1) {
                totalPaid += amt;
            }
        });

        const currentBalance = totalPurchase - totalPaid;

        res.status(200).json({
            shopCount,
            totalPurchase,
            totalPaid,
            currentBalance
        });

    } catch (error) {
        console.error('Error getting dashboard summary:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
