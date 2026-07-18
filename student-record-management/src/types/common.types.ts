export interface  BaseEntity{
    _id:string;
    createdAt:Date;
    updatedAt:Date;
    

}
export type Theme = 'light' | 'dark';
export type Gender = 'male' | 'female' | 'other';
// src/types/common.types.ts
export type Status = 'pending' | 'active' | 'inactive' | 'graduated';
export type Priority='low'| 'medium' | 'high';
export type Grade = 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';

export class ApiError extends Error{

    constructor(
        message:string,
        public statusCode?:number
    ){
        super(message);
        this.name='ApiError';
    }
}
export interface ApiResponse<T=any>{

    success:boolean;
    data:T;
    message?:string;
    pagination?:{
        page:number;
        limit:number;
        total:number;
        totalPages:number;
        

    };
}

export interface PaginationParams{
    page:number;
    limit:number;
    sortBy?:string;
    sortOrder?:'asc' | 'desc';
}
