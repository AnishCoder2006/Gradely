import { Request, Response, NextFunction } from 'express';
import { ApiErrorResponse } from '../types/response.types';
import logger from '../config/logger';


export const errorHandler = (
    err: any, req: Request, res: Response,
    _next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    logger.error({ err, method: req.method, path: req.path, statusCode }, 'request_failed');

    const response: ApiErrorResponse = {
        success: false,
        message,
        error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    };

    res.status(statusCode).json(response);
};
