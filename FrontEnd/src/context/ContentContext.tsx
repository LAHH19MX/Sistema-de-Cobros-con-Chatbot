import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import * as seccionesApi from '../api/secciones';
import * as contenidosApi from '../api/contenido';
import type { Seccion } from '../api/secciones';
import type { Contenido } from '../api/contenido';

interface SeccionUpdateFields {
  titulo_seccion?: string;
  texto_seccion?: string;
  imagen_url?: string;
  activo_seccion?: boolean;
  tipo_seccion?: string;
}

interface ContenidoUpdateFields {
  titulo_contenido?: string;
  texto_contenido?: string;
  multimedia_url?: string;
}

interface ContentContextType {
  // Secciones
  secciones: Seccion[];
  currentSeccion: Seccion | null;
  contenidos: Contenido[];
  currentContenido: Contenido | null;
  loading: boolean;
  error: string | null;
  
  // Operaciones de secciones
  loadSecciones: (categoriaId: string) => Promise<void>;
  loadSeccion: (id: string) => Promise<void>;
  createSeccion: (categoriaId: string, data: Omit<Seccion, 'id_seccion' | 'fecha_creacion' | 'id_categoria'>) => Promise<void>;
  updateSeccion: (id: string, data: SeccionUpdateFields) => Promise<void>;
  deleteSeccion: (id: string) => Promise<void>;
  
  // Operaciones de contenidos
  loadContenidos: (seccionId: string) => Promise<void>;
  loadContenido: (id: string) => Promise<void>;
  createContenido: (seccionId: string, data: Omit<Contenido, 'id_contenido' | 'id_seccion'>) => Promise<void>;
  updateContenido: (id: string, data: ContenidoUpdateFields) => Promise<void>;
  deleteContenido: (id: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider = ({ children }: { children: ReactNode }) => {
  const [secciones, setSecciones] = useState<Seccion[]>([]);
  const [currentSeccion, setCurrentSeccion] = useState<Seccion | null>(null);
  const [contenidos, setContenidos] = useState<Contenido[]>([]);
  const [currentContenido, setCurrentContenido] = useState<Contenido | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ========== Operaciones de Secciones ==========
  const loadSecciones = async (categoriaId: string) => {
    setLoading(true);
    try {
      const res = await seccionesApi.getSeccionesByCategoria(categoriaId);
      setSecciones(res.data);
    } catch (err) {
      setError('Error al cargar secciones');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadSeccion = async (id: string) => {
    setLoading(true);
    try {
      const res = await seccionesApi.getSeccionById(id);
      setCurrentSeccion(res.data);
    } catch (err) {
      setError('Error al cargar sección');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSeccion = async (categoriaId: string, data: Omit<Seccion, 'id_seccion' | 'fecha_creacion' | 'id_categoria'>) => {
    setLoading(true);
    try {
      const res = await seccionesApi.createSeccion(categoriaId, {
        ...data,
        activo_seccion: data.activo_seccion ?? true,
        tipo_seccion: data.tipo_seccion ?? 'default'
      });
      setSecciones([...secciones, res.data]);
    } catch (err) {
      setError('Error al crear sección');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateSeccion = async (id: string, data: SeccionUpdateFields) => {
    setLoading(true);
    try {
      const seccionActual = secciones.find(s => s.id_seccion === id) || currentSeccion;
      if (!seccionActual) throw new Error('Sección no encontrada');

      const updateData = {
        titulo_seccion: data.titulo_seccion ?? seccionActual.titulo_seccion,
        texto_seccion: data.texto_seccion ?? seccionActual.texto_seccion,
        imagen_url: data.imagen_url ?? seccionActual.imagen_url,
        activo_seccion: data.activo_seccion ?? seccionActual.activo_seccion,
        tipo_seccion: data.tipo_seccion ?? seccionActual.tipo_seccion
      };

      const res = await seccionesApi.updateSeccion(id, updateData);
      setSecciones(secciones.map(s => s.id_seccion === id ? res.data : s));
      if (currentSeccion?.id_seccion === id) {
        setCurrentSeccion(res.data);
      }
    } catch (err) {
      setError('Error al actualizar sección');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteSeccion = async (id: string) => {
    setLoading(true);
    try {
      await seccionesApi.deleteSeccion(id);
      setSecciones(secciones.filter(s => s.id_seccion !== id));
      if (currentSeccion?.id_seccion === id) {
        setCurrentSeccion(null);
      }
    } catch (err) {
      setError('Error al eliminar sección');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Operaciones de Contenidos 
  const loadContenidos = async (seccionId: string) => {
    setLoading(true);
    try {
      const res = await contenidosApi.getContenidosBySeccion(seccionId);
      setContenidos(res.data);
    } catch (err) {
      setError('Error al cargar contenidos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadContenido = async (id: string) => {
    setLoading(true);
    try {
      const res = await contenidosApi.getContenidoById(id);
      setCurrentContenido(res.data);
    } catch (err) {
      setError('Error al cargar contenido');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createContenido = async (seccionId: string, data: Omit<Contenido, 'id_contenido' | 'id_seccion'>) => {
    setLoading(true);
    try {
      const res = await contenidosApi.createContenido(seccionId, data);
      setContenidos([...contenidos, res.data]);
    } catch (err) {
      setError('Error al crear contenido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateContenido = async (id: string, data: ContenidoUpdateFields) => {
    setLoading(true);
    try {
      const contenidoActual = contenidos.find(c => c.id_contenido === id) || currentContenido;
      if (!contenidoActual) throw new Error('Contenido no encontrado');

      const updateData = {
        titulo_contenido: data.titulo_contenido ?? contenidoActual.titulo_contenido,
        texto_contenido: data.texto_contenido ?? contenidoActual.texto_contenido,
        multimedia_url: data.multimedia_url ?? contenidoActual.multimedia_url
      };

      const res = await contenidosApi.updateContenido(id, updateData);
      setContenidos(contenidos.map(c => c.id_contenido === id ? res.data : c));
      if (currentContenido?.id_contenido === id) {
        setCurrentContenido(res.data);
      }
    } catch (err) {
      setError('Error al actualizar contenido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteContenido = async (id: string) => {
    setLoading(true);
    try {
      await contenidosApi.deleteContenido(id);
      setContenidos(contenidos.filter(c => c.id_contenido !== id));
      if (currentContenido?.id_contenido === id) {
        setCurrentContenido(null);
      }
    } catch (err) {
      setError('Error al eliminar contenido');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentContext.Provider
      value={{
        secciones,
        currentSeccion,
        contenidos,
        currentContenido,
        loading,
        error,
        // Secciones
        loadSecciones,
        loadSeccion,
        createSeccion,
        updateSeccion,
        deleteSeccion,
        // Contenidos
        loadContenidos,
        loadContenido,
        createContenido,
        updateContenido,
        deleteContenido
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent debe usarse dentro de ContentProvider');
  }
  return context;
};