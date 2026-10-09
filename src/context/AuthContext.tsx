import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthUser } from '../shared/types.ts';

interface AuthContextType {
  isAuthenticated: boolean;
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (oldPass: string, newPass: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY_AUTH_USER = 'vshn_auth_user';
const STORAGE_KEY_AUTH_TOKEN = 'vshn_auth_token';
const STORAGE_KEY_PASSWORD = 'vshn_admin_password';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY_AUTH_TOKEN));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_AUTH_USER);
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Initialize baseline demo password if not already set
  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY_PASSWORD)) {
      localStorage.setItem(STORAGE_KEY_PASSWORD, 'vshn1996');
    }
  }, []);

  const login = async (username: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || 'vshn1996';
      const cleanUser = username.trim().toLowerCase();

      // Accepts 'harish' or 'admin' with the current password
      const isValidUser = cleanUser === 'harish' || cleanUser === 'admin';
      const isValidPass = pass === storedPassword;

      if (!isValidUser || !isValidPass) {
        setIsLoading(false);
        return { success: false, error: 'Invalid username or password' };
      }

      const activeUser: AuthUser = {
        id: 'usr-admin-1',
        username: 'harish',
        name: 'Harish Kumar',
        role: 'admin',
      };
      const activeToken = 'vshn-local-session-' + Date.now();

      localStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(activeUser));
      localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, activeToken);

      setUser(activeUser);
      setToken(activeToken);
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = async () => {
    localStorage.removeItem(STORAGE_KEY_AUTH_USER);
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
    setToken(null);
    setUser(null);
  };

  const changePassword = async (oldPass: string, newPass: string): Promise<{ success: boolean; error?: string }> => {
    const storedPassword = localStorage.getItem(STORAGE_KEY_PASSWORD) || 'vshn1996';

    if (oldPass !== storedPassword) {
      return { success: false, error: 'Current password is incorrect' };
    }

    if (newPass.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters' };
    }

    localStorage.setItem(STORAGE_KEY_PASSWORD, newPass);
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!token && !!user,
        user,
        token,
        isLoading,
        login,
        logout,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
