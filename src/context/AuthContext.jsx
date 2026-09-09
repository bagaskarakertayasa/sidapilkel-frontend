import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, getUser, setUser } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [user, setUserState] = useState(() => getUser());
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (getToken()) {
        await api.post('/auth/logout');
      }
    } catch {
      // Ignore logout errors
    } finally {
      setToken(null);
      setUser(null);
      setTokenState(null);
      setUserState(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/profile');
      const profile = res.data || res;
      setUser(profile);
      setUserState(profile);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    refreshProfile();

    const handleUnauthorized = () => {
      setTokenState(null);
      setUserState(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [refreshProfile]);

  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    setTokenState(receivedToken);
    setUserState(receivedUser);
    return receivedUser;
  };

  const value = {
    user,
    token,
    role: user?.role,
    isAdminPusat: user?.role === 'ADMIN_PUSAT',
    isAdminDesa: user?.role === 'ADMIN_DESA',
    desaId: user?.desa_id,
    desa: user?.desa,
    isAuthenticated: !!token && !!user,
    loading,
    login,
    logout,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
