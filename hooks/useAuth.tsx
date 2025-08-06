import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Tipo para el contexto
type AuthContextType = {
  userId: string | null;
  login: (id: string) => Promise<void>;
  logout: () => Promise<void>;
};

// Crear el contexto
const AuthContext = createContext<AuthContextType>({
  userId: null,
  login: async () => {},
  logout: async () => {},
});

// Provider que contiene toda la lógica y expone el contexto
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const loadUserId = async () => {
      const storedId = await AsyncStorage.getItem('userId');
      if (storedId) setUserId(storedId);
    };
    loadUserId();
  }, []);

  const login = async (id: string) => {
    await AsyncStorage.setItem('userId', id);
    setUserId(id);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('userId');
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto
export const useAuth = () => useContext(AuthContext);
