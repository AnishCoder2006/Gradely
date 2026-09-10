// src/store/store.ts
// Centralized Redux store — the single source of truth for auth + RTK Query cache.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import { baseApi } from './baseApi';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [baseApi.reducerPath]: baseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(baseApi.middleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
