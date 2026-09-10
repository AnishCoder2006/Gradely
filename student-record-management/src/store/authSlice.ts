// src/store/authSlice.ts
// Single source of truth for the authenticated user & token.
// Persists to the SAME localStorage keys ("auth_token"/"auth_user") that the
// legacy apiClient reads, so existing services keep working unchanged.
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type UserRole = 'admin' | 'teacher' | 'student';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  mfaEnabled?: boolean;
}

export interface LoginResponse {
  mfaRequired?: boolean;
  email?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

const loadFromStorage = (): Pick<AuthState, 'user' | 'token'> => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const raw = localStorage.getItem(USER_KEY);
    const user = raw ? (JSON.parse(raw) as AuthUser) : null;
    if (token && !user) {
      // orphaned token — clean up
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      return { user: null, token: null };
    }
    return { user, token };
  } catch {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    return { user: null, token: null };
  }
};

const persistToStorage = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const initialState: AuthState = (() => {
  const { user, token } = loadFromStorage();
  return {
    user,
    token,
    isAuthenticated: !!user,
    // Flipped to false by the AuthProvider shim once mounted.
    // (Rehydration itself is synchronous from localStorage above.)
    isLoading: true,
  };
})();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ token: string; user: AuthUser }>
    ) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.isAuthenticated = true;
      persistToStorage(action.payload.token, action.payload.user);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      clearStorage();
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setLoading } = authSlice.actions;
export default authSlice.reducer;
