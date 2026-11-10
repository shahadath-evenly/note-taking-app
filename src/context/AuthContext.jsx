'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import * as authService from '@/services/auth/auth.service';

const AuthContext = createContext(undefined);

// sessionStorage (not localStorage): cleared when the tab closes, limiting
// how long a stolen token via XSS stays usable, while still surviving a
// page refresh within the same session. The backend's authorization check
// remains authoritative regardless of where the frontend keeps the token.
const TOKEN_STORAGE_KEY = 'secure_notes_token';

function readStoredToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token) {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // Storage may be unavailable (private browsing, etc.); auth state still
    // works for the current page load via in-memory state.
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      const storedToken = readStoredToken();

      if (!storedToken) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await authService.getMe(storedToken);
        if (isMounted) {
          setToken(storedToken);
          setUser(response.data);
        }
      } catch {
        writeStoredToken(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const response = await authService.login(credentials);
    const { user: loggedInUser, token: issuedToken } = response.data;
    writeStoredToken(issuedToken);
    setToken(issuedToken);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (payload) => {
    const response = await authService.register(payload);
    return response.data;
  }, []);

  const logout = useCallback(() => {
    writeStoredToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
