import { Request,Response,NextFunction } from  'express';
import { ApiErrorResponse } from '../types/response.types';


export const errorHandler=(
    err:any,req:Request,res:Response,
    next:NextFunction
)=>{
    console.error('Error:',err);

    const statusCode=err.statusCode || 500;
    const message=err.message || 'Internal Server Error';

    const response:ApiErrorResponse={
        success:false,
        message,
        error:process.env.NODE_ENV==='development'?err.stack:undefined,
    };

    res.status(statusCode).json(response);
    };
