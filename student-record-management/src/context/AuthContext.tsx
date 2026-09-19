import {
  createContext, useContext, useEffect,
  useCallback, ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { clearCredentials, setCredentials, setLoading } from '../store/authSlice';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  mfaEnabled?: boolean;
  role: UserRole;
  approvalStatus?: 'pending' | 'active' | 'inactive' | 'graduated';
}

export interface LoginResponse {
  mfaRequired?: boolean;
  email?: string;
  approvalStatus?: AuthUser['approvalStatus'];
  role?: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResponse>;
  verifyMfa: (email: string, code: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || '/api';
const API = `${API_BASE_URL.replace(/\/$/, '')}/auth`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const isLoading = useAppSelector((state) => state.auth.isLoading);

  useEffect(() => {
    dispatch(setLoading(false));
  }, [dispatch]);

  const persist = useCallback((tokenValue: string, userValue: AuthUser) => {
    dispatch(setCredentials({ token: tokenValue, user: userValue }));
  }, [dispatch]);

  const login = useCallback(async (email: string, password: string): Promise<LoginResponse> => {
    const res = await fetch(`${API}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Login failed');

    if (json.mfaRequired) {
      return { mfaRequired: true, email: json.data.email };
    }

    persist(json.data.token, json.data.user);
    return {
      mfaRequired: false,
      approvalStatus: json.data.user.approvalStatus,
      role: json.data.user.role,
    };
  }, [persist]);

  const verifyMfa = useCallback(async (email: string, code: string) => {
    const res = await fetch(`${API}/mfa/verify-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code }),
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'MFA verification failed');

    persist(json.data.token, json.data.user);
  }, [persist]);

  const register = useCallback(async (
    name: string, email: string,
    password: string, role: UserRole
  ) => {
    const res = await fetch(`${API}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Registration failed');
    persist(json.data.token, json.data.user);
  }, [persist]);

  const logout = useCallback(() => {
    dispatch(clearCredentials());
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user,
      isLoading,
      login,
      verifyMfa,
      register,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};