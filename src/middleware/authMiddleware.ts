import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/firebase';

// Extend Express Request to include 'user'
declare global {
    namespace Express {
        interface Request {
            user?: any; // Replace 'any' with DecodedIdToken type if available from firebase-admin
        }
    }
}

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await auth.verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Error verifying auth token:', error);
        return res.status(403).json({ error: 'Unauthorized: Invalid token' });
    }
};

export default verifyToken;
