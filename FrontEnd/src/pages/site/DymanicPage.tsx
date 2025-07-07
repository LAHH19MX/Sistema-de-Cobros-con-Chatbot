import { useParams } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useSiteData } from '../../context/SiteDataContext'; 
import Spinner from '../../components/ui/Spinner';
import Error404 from '../Error404.tsx';
import HomePage from './HomePage';
import BlogPage from './BlogPage.tsx';
import PreciosPage from './PreciosPage.tsx';
import NosotrosPage from './NosotrosPage.tsx';
import FAQPage from './FAQPage.tsx';
import TerminosPage from './TerminosPage.tsx';
import PoliticasPage from './PoliticasPage.tsx';
import CategoriaPage from './CategoriaPage.tsx';
import type { Categoria, Seccion } from '../../api/dataTypes';
import * as seccionesApi from '../../api/secciones';

// Mapa de plantillas UUID -> Componente
const PLANTILLA_COMPONENTS: Record<string, React.ComponentType<any>> = {
  'b04f6bcf-33c5-41ee-9454-98302bfbc930': HomePage,
  '2c9a6d51-3965-4383-ad3a-784bc5794545': BlogPage,
  'd55bd5d7-876f-4a11-8b1b-6acd83aa3407': CategoriaPage,
  '50d449f8-0143-46f1-baeb-f43c66193898': PreciosPage,
  'd3492653-a06e-4bf7-a4cf-b932b756da12': NosotrosPage,
  'c7636b14-2c44-48f9-a68d-46d1d19fc38c': FAQPage,
  'd06799f2-5a41-49e4-bc6e-b71ef25460fd': TerminosPage,
  '67537c80-0fcb-45d5-863b-ca8c2ce32d53': PoliticasPage,
};

interface PageProps {
  apartado: {
    id_apartado: string;
    id_plantilla: string;
    nombre_apartado: string;
    mostrar_categoria?: boolean;
    activo_apartado?: boolean;
  };
  categorias: Categoria[];
  secciones: Seccion[];
}

export default function DynamicPage({ slug: propSlug }: { slug?: string }) {
  const { slug } = useParams<{ slug: string }>();
  const { 
    apartados,
    loadApartados,
    loadApartado,
    categorias,
    loadCategorias 
  } = useSiteData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allSecciones, setAllSecciones] = useState<Seccion[]>([]);
  const [dataReady, setDataReady] = useState(false);
  const loadingRef = useRef(false);

  const targetSlug = slug || propSlug || 'inicio';

  // Cargar apartados inicialmente
  useEffect(() => {
    if (apartados.length === 0 && !loadingRef.current) {
      loadingRef.current = true;
      loadApartados();
    }
  }, []);

  // Cargar datos del apartado específico
  useEffect(() => {
    const loadPageData = async () => {
      if (apartados.length === 0) return;
      
      // Primero intentamos encontrar por slug exacto
      let apartadoTarget = apartados.find(
        a => a.nombre_apartado.toLowerCase() === targetSlug.toLowerCase()
      );

      // Si no encontramos, verificamos si es una ruta especial
      if (!apartadoTarget) {
        if (targetSlug === 'nosotros') {
          apartadoTarget = apartados.find(
            a => a.id_plantilla === 'd3492653-a06e-4bf7-a4cf-b932b756da12'
          );
        } else if (targetSlug === 'faq') {
          apartadoTarget = apartados.find(
            a => a.id_plantilla === 'c7636b14-2c44-48f9-a68d-46d1d19fc38c'
          );
        } else if (targetSlug === 'terminos') {
          apartadoTarget = apartados.find(
            a => a.id_plantilla === 'd06799f2-5a41-49e4-bc6e-b71ef25460fd'
          );
        } else if (targetSlug === 'politicas') {
          apartadoTarget = apartados.find(
            a => a.id_plantilla === '67537c80-0fcb-45d5-863b-ca8c2ce32d53'
          );
        }
      }

      if (!apartadoTarget) {
        setError('404');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        await Promise.all([
          loadApartado(apartadoTarget.id_apartado),
          loadCategorias(apartadoTarget.id_apartado)
        ]);
        
      } catch (err) {
        console.error("Error cargando datos:", err);
        setError(err instanceof Error ? err.message : "Error al cargar los datos");
        setLoading(false);
      }
    };

    loadPageData();
  }, [targetSlug, apartados]);

  // Cargar todas las secciones cuando las categorías estén listas
  useEffect(() => {
    const loadAllSections = async () => {
      const categoriasDelApartado = apartados.find(
        a => a.nombre_apartado.toLowerCase() === targetSlug.toLowerCase() ||
             (targetSlug === 'nosotros' && a.id_plantilla === 'd3492653-a06e-4bf7-a4cf-b932b756da12') ||
             (targetSlug === 'faq' && a.id_plantilla === 'c7636b14-2c44-48f9-a68d-46d1d19fc38c') ||
             (targetSlug === 'terminos' && a.id_plantilla === 'd06799f2-5a41-49e4-bc6e-b71ef25460fd') ||
             (targetSlug === 'politicas' && a.id_plantilla === '67537c80-0fcb-45d5-863b-ca8c2ce32d53')
      )?.id_apartado;

      if (!categoriasDelApartado) return;

      const categoriasActuales = categorias.filter(
        c => c.id_apartado === categoriasDelApartado
      );

      try {
        const promesasSecciones = categoriasActuales.map(categoria => 
          seccionesApi.getSeccionesByCategoria(categoria.id_categoria)
            .then(response => response.data)
            .catch(error => {
              console.error(`Error cargando secciones:`, error);
              return [];
            })
        );
        
        const resultados = await Promise.all(promesasSecciones);
        setAllSecciones(resultados.flat());
        setDataReady(true);
      } catch (error) {
        console.error('Error cargando secciones:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (categorias.length > 0) {
      loadAllSections();
    }
  }, [categorias, targetSlug, apartados]);

  if (loading) return <Spinner />;
  if (error === '404') return <Error404 />;
  if (error) return <div className="alert alert-danger">{error}</div>;
  
  // Buscar el apartado actual con la misma lógica de búsqueda
  const apartadoActual = apartados.find(
    a => a.nombre_apartado.toLowerCase() === targetSlug.toLowerCase() ||
         (targetSlug === 'nosotros' && a.id_plantilla === 'd3492653-a06e-4bf7-a4cf-b932b756da12') ||
         (targetSlug === 'faq' && a.id_plantilla === 'c7636b14-2c44-48f9-a68d-46d1d19fc38c') ||
         (targetSlug === 'terminos' && a.id_plantilla === 'd06799f2-5a41-49e4-bc6e-b71ef25460fd') ||
         (targetSlug === 'politicas' && a.id_plantilla === '67537c80-0fcb-45d5-863b-ca8c2ce32d53')
  );
  
  if (!apartadoActual || !dataReady) return <Spinner />;

  const pageData: PageProps = {
    apartado: apartadoActual,
    categorias: categorias.filter(c => c.id_apartado === apartadoActual.id_apartado),
    secciones: allSecciones
  };

  const Component = PLANTILLA_COMPONENTS[apartadoActual.id_plantilla] || HomePage;
  
  return <Component {...pageData} />;
}