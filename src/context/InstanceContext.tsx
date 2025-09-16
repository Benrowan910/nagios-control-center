import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { XIInstance } from '../api/instances';
import { getInstances, saveInstance, deleteInstance } from '../utils/db';

interface InstanceContextType {
  instances: XIInstance[];
  addInstance: (instance: XIInstance) => void;
  updateInstance: (instance: XIInstance) => void;
  removeInstance: (id: string) => void;
  loading: boolean;
}

const InstanceContext = createContext<InstanceContextType | undefined>(undefined);

export const useInstances = () => {
  const context = useContext(InstanceContext);
  if (context === undefined) {
    throw new Error('useInstances must be used within an InstanceProvider');
  }
  return context;
};

interface InstanceProviderProps {
  children: ReactNode;
}

export const InstanceProvider: React.FC<InstanceProviderProps> = ({ children }) => {
  const [instances, setInstances] = useState<XIInstance[]>([]);
  const [loading, setLoading] = useState(true);

  // Load instances from IndexedDB on component mount
  useEffect(() => {
    const loadInstances = async () => {
      try {
        setLoading(true);
        const savedInstances = await getInstances();
        setInstances(savedInstances);
      } catch (e) {
        console.error("Error loading instances from DB:", e);
        setInstances([]);
      } finally {
        setLoading(false);
      }
    };

    loadInstances();
  }, []);

  const addInstance = async (instance: XIInstance) => {
    try {
      await saveInstance(instance);
      setInstances(prev => [...prev, instance]);
    } catch (e) {
      console.error("Error saving instance:", e);
    }
  };

  const updateInstance = async (updatedInstance: XIInstance) => {
    try {
      await saveInstance(updatedInstance);
      setInstances(prev => 
        prev.map(instance => 
          instance.id === updatedInstance.id ? updatedInstance : instance
        )
      );
    } catch (e) {
      console.error("Error updating instance:", e);
    }
  };

  const removeInstance = async (id: string) => {
    try {
      await deleteInstance(id);
      setInstances(prev => prev.filter(instance => instance.id !== id));
    } catch (e) {
      console.error("Error deleting instance:", e);
    }
  };

  return (
    <InstanceContext.Provider value={{ instances, addInstance, updateInstance, removeInstance, loading }}>
      {children}
    </InstanceContext.Provider>
  );
};