import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, CitizenUser } from '../lib/api';

interface CitizenAuthContextType {
  citizen: CitizenUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (data: { name: string; email: string; password: string; phone?: string }) => Promise<string | null>;
  logout: () => void;
}

const CitizenAuthContext = createContext<CitizenAuthContextType | undefined>(undefined);

export function CitizenAuthProvider({ children }: { children: ReactNode }) {
  const [citizen, setCitizen] = useState<CitizenUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api.auth.me()
      .then((session) => {
        if (session.type === 'citizen') {
          setCitizen(session.user as CitizenUser);
        }
      })
      .catch(() => {
        api.setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    try {
      const { token, user } = await api.auth.citizenLogin(email, password);
      api.setToken(token);
      setCitizen(user);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Login failed';
    }
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string }): Promise<string | null> => {
    try {
      const { token, user } = await api.auth.citizenRegister(data);
      api.setToken(token);
      setCitizen(user);
      return null;
    } catch (err) {
      return err instanceof Error ? err.message : 'Registration failed';
    }
  };

  const logout = () => {
    api.setToken(null);
    setCitizen(null);
  };

  return (
    <CitizenAuthContext.Provider value={{ citizen, loading, login, register, logout }}>
      {children}
    </CitizenAuthContext.Provider>
  );
}

export function useCitizenAuth() {
  const context = useContext(CitizenAuthContext);
  if (!context) {
    throw new Error('useCitizenAuth must be used within CitizenAuthProvider');
  }
  return context;
}
