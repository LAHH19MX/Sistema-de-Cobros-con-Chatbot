import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as companyApi from '../api/company';
import type { Empresa, RedSocial } from '../api/company';

interface EmpresaUpdateFields {
  nombre_empresa?: string;
  logo_empresa?: string;
  telefono_empresa?: string;
  email_empresa?: string;
  estado_empresa?: string;
  ciudad_empresa?: string;
  codigo_postal_empresa?: string;
  calle_empresa?: string;
  colonia_empresa?: string;
  latitud_empresa?: string;
  longitud_empresa?: string;
}

interface RedSocialUpdateFields {
  nombre_red?: string;
  logo_red?: string;
  enlace?: string;
  id_empresa?: string;
}

interface CompanyContextType {
  empresa: Empresa | null;
  redes: RedSocial[];
  loading: boolean;
  error: string | null;
  loadEmpresa: (id: string) => Promise<void>;
  updateEmpresa: (id: string, data: EmpresaUpdateFields) => Promise<void>;
  loadRedes: () => Promise<void>;
  createRed: (empresaId: string, data: Omit<RedSocial, 'id_red'>) => Promise<void>;
  updateRed: (id: string, data: RedSocialUpdateFields) => Promise<void>;
  deleteRed: (id: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [redes, setRedes] = useState<RedSocial[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmpresa = async (id: string) => {
    setLoading(true);
    try {
      const res = await companyApi.getEmpresa(id);
      setEmpresa(res.data);
    } catch (err) {
      setError('Error al cargar datos de la empresa');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateEmpresa = async (id: string, data: EmpresaUpdateFields) => {
    setLoading(true);
    try {
      if (!empresa) throw new Error('No hay datos de empresa cargados');
      
      const updateData = {
        nombre_empresa: data.nombre_empresa ?? empresa.nombre_empresa,
        email_empresa: data.email_empresa ?? empresa.email_empresa,
        logo_empresa: data.logo_empresa ?? empresa.logo_empresa,
        telefono_empresa: data.telefono_empresa ?? empresa.telefono_empresa,
        estado_empresa: data.estado_empresa ?? empresa.estado_empresa,
        ciudad_empresa: data.ciudad_empresa ?? empresa.ciudad_empresa,
        codigo_postal_empresa: data.codigo_postal_empresa ?? empresa.codigo_postal_empresa,
        calle_empresa: data.calle_empresa ?? empresa.calle_empresa,
        colonia_empresa: data.colonia_empresa ?? empresa.colonia_empresa,
        latitud_empresa: data.latitud_empresa ?? empresa.latitud_empresa,
        longitud_empresa: data.longitud_empresa ?? empresa.longitud_empresa
      };

      const res = await companyApi.updateEmpresa(id, updateData);
      setEmpresa(res.data);
    } catch (err) {
      setError('Error al actualizar empresa');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadRedes = async () => {
    setLoading(true);
    try {
      const res = await companyApi.getAllRedes();
      setRedes(res.data);
    } catch (err) {
      setError('Error al cargar redes sociales');
    } finally {
      setLoading(false);
    }
  };

  const createRed = async (empresaId: string, data: Omit<RedSocial, 'id_red'>) => {
    try {
      const res = await companyApi.createRedSocial(empresaId, data);
      setRedes([...redes, res.data]);
    } catch (err) {
      setError('Error al crear red social');
      throw err;
    }
  };

  const updateRed = async (id: string, data: RedSocialUpdateFields) => {
    try {
      const redExistente = redes.find(r => r.id_red === id);
      if (!redExistente) throw new Error('Red social no encontrada');

      const updateData = {
        nombre_red: data.nombre_red ?? redExistente.nombre_red,
        logo_red: data.logo_red ?? redExistente.logo_red,
        enlace: data.enlace ?? redExistente.enlace,
        id_empresa: data.id_empresa ?? redExistente.id_empresa
      };

      const res = await companyApi.updateRedSocial(id, updateData);
      setRedes(redes.map(red => red.id_red === id ? res.data : red));
    } catch (err) {
      setError('Error al actualizar red');
      throw err;
    }
  };

  const deleteRed = async (id: string) => {
    try {
      await companyApi.deleteRedSocial(id);
      setRedes(redes.filter(red => red.id_red !== id));
    } catch (err) {
      setError('Error al eliminar red');
      throw err;
    }
  };

  return (
    <CompanyContext.Provider
        value={{
            empresa,
            redes,
            loading,
            error,
            loadEmpresa,
            updateEmpresa,
            loadRedes,
            createRed,
            updateRed,
            deleteRed
        }}
    >
      {children}
    </CompanyContext.Provider>
  );
};

export const useCompany = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompany debe usarse dentro de CompanyProvider');
  }
  return context;
};