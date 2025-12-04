import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: number;
  username: string;
  role?: 'user' | 'admin';
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  signup: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw = sessionStorage.getItem('auth_user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('auth_token');
  });

  useEffect(() => {
    if (user) sessionStorage.setItem('auth_user', JSON.stringify(user));
    else sessionStorage.removeItem('auth_user');
  }, [user]);

  useEffect(() => {
    if (token) sessionStorage.setItem('auth_token', token);
    else sessionStorage.removeItem('auth_token');
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Login failed');
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
  };

  const signup = async (username: string, password: string) => {
    const res = await fetch((import.meta.env.VITE_API_URL || 'http://localhost:3000') + '/api/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Signup failed');
    }

    const data = await res.json();
    setUser(data.user);
    setToken(data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
