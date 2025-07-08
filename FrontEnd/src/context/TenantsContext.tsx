import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as api from '../api/inquilino';
import type { 
  InquilinoListado, 
  InquilinoDetalle, 
  UpdateInquilinoInput 
} from '../api/inquilino';

interface InquilinosContextType {
  inquilinos: InquilinoListado[];
  currentInquilino: InquilinoDetalle | null;
  loading: boolean;
  error: string | null;
  loadInquilinos: () => Promise<void>;
  loadInquilino: (id: string) => Promise<void>;
  updateInquilino: (id: string, data: UpdateInquilinoInput) => Promise<void>;
}

const InquilinosContext = createContext<InquilinosContextType | undefined>(undefined);

export const InquilinosProvider = ({ children }: { children: ReactNode }) => {
  const [inquilinos, setInquilinos] = useState<InquilinoListado[]>([]);
  const [currentInquilino, setCurrentInquilino] = useState<InquilinoDetalle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInquilinos = async () => {
    setLoading(true);
    try {
      const res = await api.getAllInquilinos();
      setInquilinos(res.data);
    } catch (err) {
      setError('Error al cargar inquilinos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadInquilino = async (id: string) => {
    setLoading(true);
    try {
      const res = await api.getInquilinoById(id);
      setCurrentInquilino(res.data);
    } catch (err) {
      setError('Error al cargar inquilino');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateInquilino = async (id: string, data: UpdateInquilinoInput) => {
  setLoading(true);
  try {
    const res = await api.updateInquilino(id, data);
    
    // Actualizar listado (versión simplificada y segura)
    setInquilinos(prev => prev.map(inq => {
      if (inq.id !== id) return inq;
      
      return {
        ...inq,
        nombre: data.nombre_inquilino || inq.nombre,
        apellido_paterno: data.apellido_paterno || inq.apellido_paterno,
        apellido_materno: data.apellido_materno ?? inq.apellido_materno,
        estado: data.estado_inquilino ?? inq.estado,
        telefono: data.telefono_inquilino ?? inq.telefono,
        ...(res.data.suscripcion ? {
          suscripcion: {
            estado: res.data.suscripcion.estado,
            fecha_inicio: res.data.suscripcion.fecha_inicio,
            fecha_renovacion: res.data.suscripcion.fecha_renovacion,
            plan: {
              nombre: res.data.suscripcion.plan.nombre,
              precio: res.data.suscripcion.plan.precio
            }
          }
        } : {})
      };
    }));

        // Actualizar detalle si es el mismo
    if (currentInquilino?.id_inquilino === id) {
        setCurrentInquilino(res.data);
    }
    } catch (err) {
        setError('Error al actualizar inquilino');
        throw err;
    } finally {
        setLoading(false);
    }
    };
  return (
    <InquilinosContext.Provider
      value={{
        inquilinos,
        currentInquilino,
        loading,
        error,
        loadInquilinos,
        loadInquilino,
        updateInquilino
      }}
    >
      {children}
    </InquilinosContext.Provider>
  );
};

export const useInquilinos = () => {
  const context = useContext(InquilinosContext);
  if (!context) {
    throw new Error('useInquilinos debe usarse dentro de InquilinosProvider');
  }
  return context;
};