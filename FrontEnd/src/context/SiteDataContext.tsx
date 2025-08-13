import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as apartadosApi from '../api/apartados';
import * as categoriasApi from '../api/categorias';
import type { Apartado } from '../api/apartados'; 
import type { Categoria } from '../api/categorias'; 

interface ApartadoUpdateFields {
  nombre_apartado?: string;
  id_empresa?: string;
  id_plantilla?: string;
  activo_apartado?: boolean;
  mostrar_categoria?: boolean;
}

interface CategoriaUpdateFields {
  nombre_categoria?: string;
  titulo_categoria?: string;
  texto_categoria?: string;
  imagen_categoria?: string;
  activo_categoria?: boolean;
}

interface SiteDataContextType {
  // Apartados
  apartados: Apartado[];
  currentApartado: Apartado | null;
  categorias: Categoria[];
  currentCategoria: Categoria | null;
  loading: boolean;
  error: string | null;
  
  // Operaciones de apartados
  loadApartados: () => Promise<void>;
  loadApartado: (id: string) => Promise<void>;
  createApartado: (data: Omit<Apartado, 'id_apartado' | 'fecha_creacion'>) => Promise<void>; 
  updateApartado: (id: string, data: ApartadoUpdateFields) => Promise<void>;
  deleteApartado: (id: string) => Promise<void>;
  
  // Operaciones de categorías
  loadCategorias: (apartadoId: string) => Promise<void>;
  loadCategoria: (id: string) => Promise<void>;
  createCategoria: (apartadoId: string, data: Omit<Categoria, 'id_categoria' | 'fecha_creacion' | 'id_apartado'>) => Promise<void>; 
  updateCategoria: (id: string, data: CategoriaUpdateFields) => Promise<void>;
  deleteCategoria: (id: string) => Promise<void>;
}

const SiteDataContext = createContext<SiteDataContextType | undefined>(undefined);

export const SiteDataProvider = ({ children }: { children: ReactNode }) => {
  const [apartados, setApartados] = useState<Apartado[]>([]);
  const [currentApartado, setCurrentApartado] = useState<Apartado | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [currentCategoria, setCurrentCategoria] = useState<Categoria | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== apartados ==========
  const loadApartados = async () => {
    setLoading(true);
    try {
      const res = await apartadosApi.getAllApartados();
      setApartados(res.data);
    } catch (err) {
      setError('Error al cargar apartados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadApartado = async (id: string) => {
    setLoading(true);
    try {
      const res = await apartadosApi.getApartado(id);
      setCurrentApartado(res.data);
    } catch (err) {
      setError('Error al cargar apartado');
      console.error(err);
      throw err; 
    } finally {
      setLoading(false);
    }
  };

  const createApartado = async (data: Omit<Apartado, 'id_apartado' | 'fecha_creacion'>) => {
    setLoading(true);
    try {
      const res = await apartadosApi.createApartado(data);
      setApartados([...apartados, res.data]);
      // Se eliminó el return res.data
    } catch (err) {
      setError('Error al crear apartado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateApartado = async (id: string, data: ApartadoUpdateFields) => {
    setLoading(true);
    try {
      const apartadoActual = apartados.find(a => a.id_apartado === id) || currentApartado;
      if (!apartadoActual) throw new Error('Apartado no encontrado');

      const updateData = {
        nombre_apartado: data.nombre_apartado ?? apartadoActual.nombre_apartado,
        id_empresa: data.id_empresa ?? apartadoActual.id_empresa,
        id_plantilla: data.id_plantilla ?? apartadoActual.id_plantilla,
        activo_apartado: data.activo_apartado ?? apartadoActual.activo_apartado,
        mostrar_categoria: data.mostrar_categoria ?? apartadoActual.mostrar_categoria
      };

      const res = await apartadosApi.updateApartado(id, updateData);
      setApartados(apartados.map(a => a.id_apartado === id ? res.data : a));
      if (currentApartado?.id_apartado === id) {
        setCurrentApartado(res.data);
      }
    } catch (err) {
      setError('Error al actualizar apartado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteApartado = async (id: string) => {
    setLoading(true);
    try {
      await apartadosApi.deleteApartado(id);
      setApartados(apartados.filter(a => a.id_apartado !== id));
      if (currentApartado?.id_apartado === id) {
        setCurrentApartado(null);
      }
    } catch (err) {
      setError('Error al eliminar apartado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loadCategorias = async (apartadoId: string) => {
    setLoading(true);
    try {
      const res = await categoriasApi.getCategoriasByApartado(apartadoId);
      setCategorias(prevCategorias => {
        const otherCategorias = prevCategorias.filter(c => c.id_apartado !== apartadoId);
        return [...otherCategorias, ...res.data];
      });
    } catch (err) {
      setError('Error al cargar categorías');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCategoria = async (id: string) => {
    setLoading(true);
    try {
      const res = await categoriasApi.getCategoriaById(id);
      setCurrentCategoria(res.data);
    } catch (err) {
      setError('Error al cargar categoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (apartadoId: string, data: Omit<Categoria, 'id_categoria' | 'fecha_creacion' | 'id_apartado'>) => {
    setLoading(true);
    try {
      const res = await categoriasApi.createCategoria(apartadoId, data);
      setCategorias([...categorias, res.data]);
    } catch (err) {
      setError('Error al crear categoría');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateCategoria = async (id: string, data: CategoriaUpdateFields) => {
    setLoading(true);
    try {
      const categoriaActual = categorias.find(c => c.id_categoria === id) || currentCategoria;
      if (!categoriaActual) throw new Error('Categoría no encontrada');

      const updateData = {
        nombre_categoria: data.nombre_categoria ?? categoriaActual.nombre_categoria,
        titulo_categoria: data.titulo_categoria ?? categoriaActual.titulo_categoria,
        texto_categoria: data.texto_categoria ?? categoriaActual.texto_categoria,
        imagen_categoria: data.imagen_categoria ?? categoriaActual.imagen_categoria,
        activo_categoria: data.activo_categoria ?? categoriaActual.activo_categoria
      };

      const res = await categoriasApi.updateCategoria(id, updateData);
      setCategorias(categorias.map(c => c.id_categoria === id ? res.data : c));
      if (currentCategoria?.id_categoria === id) {
        setCurrentCategoria(res.data);
      }
    } catch (err) {
      setError('Error al actualizar categoría');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategoria = async (id: string) => {
    setLoading(true);
    try {
      await categoriasApi.deleteCategoria(id);
      setCategorias(categorias.filter(c => c.id_categoria !== id));
      if (currentCategoria?.id_categoria === id) {
        setCurrentCategoria(null);
      }
    } catch (err) {
      setError('Error al eliminar categoría');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteDataContext.Provider
      value={{
        apartados,
        currentApartado,
        categorias,
        currentCategoria,
        loading,
        error,
        loadApartados,
        loadApartado,
        createApartado,
        updateApartado,
        deleteApartado,
        loadCategorias,
        loadCategoria,
        createCategoria,
        updateCategoria,
        deleteCategoria
      }}
    >
      {children}
    </SiteDataContext.Provider>
  );
};

export const useSiteData = () => {
  const context = useContext(SiteDataContext);
  if (!context) {
    throw new Error('useSiteData debe usarse dentro de SiteDataProvider');
  }
  return context;
};