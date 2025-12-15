import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import Logger from '../config/logger';

const handleError = (err: AppError | Error, req: Request, res: Response, next: NextFunction) => {
    let statusCode = 500;
    let message = 'Internal Server Error';

    if (err instanceof AppError) {
        statusCode = err.statusCode;
        message = err.message;
    } else {
        // For unknown errors, log them
        Logger.error(err);
    }

    // Development: Send stack trace
    if (process.env.NODE_ENV === 'development') {
        return res.status(statusCode).json({
            status: 'error',
            statusCode,
            message: err.message,
            stack: err.stack,
        });
    }

    // Production: Don't leak stack traces
    return res.status(statusCode).json({
        status: 'error',
        message: statusCode === 500 ? 'Something went wrong on the server' : message,
    });
};

export default handleError;
