import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';
dotenv.config();

import shopRoutes from './routes/shopRoutes';
import productRoutes from './routes/productRoutes';
import transactionRoutes from './routes/transactionRoutes';
import userRoutes from './routes/userRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import handleError from './middleware/errorMiddleware';
import Logger from './config/logger';

const app = express();

const morganFormat = ':method :url :status :response-time ms';

// Middlewares
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(compression()); // Compress all responses
app.use(
    morgan(morganFormat, {
        stream: {
            write: (message) => {
                const logObject = {
                    method: message.split(' ')[0],
                    url: message.split(' ')[1],
                    status: message.split(' ')[2],
                    responseTime: message.split(' ')[3],
                };
                Logger.info(JSON.stringify(logObject));
            },
        },
    })
);

// Basic Route
app.get('/', (req: Request, res: Response) => {
    res.send('Kanakku Backend Server is Running (Production Ready)');
});

// Mount Routes
app.use('/api/shops', shopRoutes);
app.use('/api/products', productRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error Handling Middleware (Must be last)
app.use(handleError);

const PORT = process.env.PORT || 3000;

// Catch Uncaught Exceptions
process.on('uncaughtException', (err) => {
    Logger.error('Uncaught Exception! Shutting down...', err);
    process.exit(1);
});

const server = app.listen(PORT, () => {
    Logger.info(`Server running on port ${PORT}`);
});

// Catch Unhandled Rejections
process.on('unhandledRejection', (err: any) => {
    Logger.error('Unhandled Rejection! Shutting down...', err);
    server.close(() => {
        process.exit(1);
    });
});
