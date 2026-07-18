
export interface User {
    id:string;
    name:string;
    email:string;
    role:'admin'|'teacher'| 'student';
    avatar?:string;
}
export interface AuthState {
    user:User | null;
    isAuthenticated:boolean;
    isLoading:boolean;
}
export interface LoginCredentials{
    email:string;
    password:string;
}