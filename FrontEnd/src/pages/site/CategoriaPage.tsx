import '../../styles/site/CategoriaPage.css'
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useContent } from '../../context/ContentContext';
import { useSiteData } from '../../context/SiteDataContext';
import SectionRenderer from '../../components/sections/SectionRenderer';
import * as contenidosApi from '../../api/contenido';
import type { Seccion } from '../../api/dataTypes';

export default function CategoriaPage() {
  const { id } = useParams<{ id: string }>();
  const { 
    loadCategoria,
    currentCategoria,
    categorias
  } = useSiteData();
  
  const { 
    secciones, 
    loadSecciones 
  } = useContent();

  const [seccionesConContenido, setSeccionesConContenido] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoriaActual, setCategoriaActual] = useState(currentCategoria || categorias.find(c => c.id_categoria === id));

  // Cargar categoría y sus secciones
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          // Buscar en categorías ya cargadas
          const categoriaEncontrada = categorias.find(c => c.id_categoria === id);
          
          if (categoriaEncontrada) {
            if (isMounted) setCategoriaActual(categoriaEncontrada);
          } else {
            // Si no está en memoria, cargarla individualmente
            await loadCategoria(id);
            // Después de cargar, actualizar con la categoría correcta
            const nuevaCategoria = categorias.find(c => c.id_categoria === id) || currentCategoria;
            if (isMounted && nuevaCategoria) setCategoriaActual(nuevaCategoria);
          }
          
          // Cargar secciones de esta categoría
          await loadSecciones(id);
        } finally {
          if (isMounted) setLoading(false);
        }
      }
    };
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [id]); // Solo dependencia de id

  // Sincronizar cuando currentCategoria cambie
  useEffect(() => {
    if (currentCategoria && currentCategoria.id_categoria === id) {
      setCategoriaActual(currentCategoria);
    }
  }, [currentCategoria, id]);

  // Cargar contenidos cuando las secciones cambien
  useEffect(() => {
    const cargarContenidos = async () => {
      if (secciones.length > 0 && id) {
        const seccionesDeCategoria = secciones.filter(s => s.id_categoria === id);
        
        const seccionesActualizadas: Seccion[] = [];
        
        for (const seccion of seccionesDeCategoria) {
          try {
            const contenidosResponse = await contenidosApi.getContenidosBySeccion(seccion.id_seccion);
            seccionesActualizadas.push({
              ...seccion,
              contenido: contenidosResponse.data
            });
          } catch (error) {
            seccionesActualizadas.push({
              ...seccion,
              contenido: []
            });
          }
        }
        setSeccionesConContenido(seccionesActualizadas);
      }
    };

    cargarContenidos();
  }, [secciones, id]);

  if (loading) {
    return <div className="container py-5 text-center custom-categoria-loading text-white">Cargando categoría...</div>;
  }

  if (!categoriaActual) {
    return <div className="container py-5 text-center custom-categoria-error text-white">Categoría no encontrada</div>;
  }

  return (
    <div className="custom-categoria-page">
      {/* Banner de la categoría */}
      <section className="custom-ad-banner">
        <img
          src={categoriaActual.imagen_categoria}
          alt={`Banner ${categoriaActual.titulo_categoria}`}
          className="custom-ad-banner__img"
        />
        <div className="custom-ad-banner__overlay"></div>
        <div className="custom-ad-banner__content container">
          <h2 className="custom-ad-banner__title">{categoriaActual.titulo_categoria}</h2>
          <p className="custom-ad-banner__text">
            {categoriaActual.texto_categoria}
          </p>
        </div>
      </section>

      {/* Renderizar secciones de esta categoría */}
      <div className="custom-categoria-sections">
        {seccionesConContenido
          .filter(seccion => seccion.id_categoria === id)
          .map(seccion => (
            <SectionRenderer 
              key={seccion.id_seccion}
              seccion={seccion}
            />
          ))}
      </div>
    </div>
  );
}