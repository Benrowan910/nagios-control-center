import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthContextType {
  authenticatedInstances: string[];
  authenticateInstance: (instanceId: string) => void;
  logoutInstance: (instanceId: string) => void;
  logoutAllInstances: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authenticatedInstances, setAuthenticatedInstances] = useState<string[]>([]);

  // Load authenticated instances from sessionStorage on component mount
  useEffect(() => {
    const savedAuth = sessionStorage.getItem('authenticatedInstances');
    if (savedAuth) {
      try {
        setAuthenticatedInstances(JSON.parse(savedAuth));
      } catch (e) {
        console.error('Failed to parse authenticated instances from sessionStorage:', e);
        setAuthenticatedInstances([]);
      }
    }
  }, []);

  // Save authenticated instances to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('authenticatedInstances', JSON.stringify(authenticatedInstances));
  }, [authenticatedInstances]);

  const authenticateInstance = (instanceId: string) => {
    setAuthenticatedInstances(prev => {
      if (!prev.includes(instanceId)) {
        return [...prev, instanceId];
      }
      return prev;
    });
  };

  const logoutInstance = (instanceId: string) => {
    setAuthenticatedInstances(prev => prev.filter(id => id !== instanceId));
  };

  const logoutAllInstances = () => {
    setAuthenticatedInstances([]);
  };

  return (
    <AuthContext.Provider value={{ 
      authenticatedInstances, 
      authenticateInstance, 
      logoutInstance,
      logoutAllInstances 
    }}>
      {children}
    </AuthContext.Provider>
  );
};