import { createContext, useContext, useState } from 'react';
import type {ReactNode} from 'react';
import * as plansApi from '../api/plans';
import type { Plan } from '../api/plans';

interface PlansContextType {
  plans: Plan[];
  currentPlan: Plan | null;
  loading: boolean;
  error: string | null;
  loadPlans: () => Promise<void>;
  loadPlan: (id: string) => Promise<void>;
  createPlan: (data: Omit<Plan, 'id_plan' | 'creado_en' | 'actualizado_en'>) => Promise<void>;
  updatePlan: (id: string, data: Partial<Plan>) => Promise<void>;
  deletePlan: (id: string) => Promise<void>;
}

const PlansContext = createContext<PlansContextType | undefined>(undefined);

export const PlansProvider = ({ children }: { children: ReactNode }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await plansApi.getAllPlans();
      setPlans(res.data);
    } catch (err) {
      setError('Error al cargar planes');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadPlan = async (id: string) => {
    setLoading(true);
    try {
      const res = await plansApi.getPlanById(id);
      setCurrentPlan(res.data);
    } catch (err) {
      setError('Error al cargar plan');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (data: Omit<Plan, 'id_plan' | 'creado_en' | 'actualizado_en'>) => {
    setLoading(true);
    try {
      const res = await plansApi.createPlan(data);
      setPlans([...plans, res.data]);
    } catch (err) {
      setError('Error al crear plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = async (id: string, data: Partial<Plan>) => {
    setLoading(true);
    try {
      const res = await plansApi.updatePlan(id, data);
      setPlans(plans.map(p => p.id_plan === id ? res.data : p));
      if (currentPlan?.id_plan === id) {
        setCurrentPlan(res.data);
      }
    } catch (err) {
      setError('Error al actualizar plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async (id: string) => {
    setLoading(true);
    try {
      await plansApi.deletePlan(id);
      setPlans(plans.filter(p => p.id_plan !== id));
      if (currentPlan?.id_plan === id) {
        setCurrentPlan(null);
      }
    } catch (err) {
      setError('Error al eliminar plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <PlansContext.Provider
      value={{
        plans,
        currentPlan,
        loading,
        error,
        loadPlans,
        loadPlan,
        createPlan,
        updatePlan,
        deletePlan
      }}
    >
      {children}
    </PlansContext.Provider>
  );
};

export const usePlans = () => {
  const context = useContext(PlansContext);
  if (!context) {
    throw new Error('usePlans debe usarse dentro de PlansProvider');
  }
  return context;
};