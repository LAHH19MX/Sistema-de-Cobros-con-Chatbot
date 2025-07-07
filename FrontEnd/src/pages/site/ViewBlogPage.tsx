import '../../styles/viewBlog.css'
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSiteData } from '../../context/SiteDataContext';
import { useContent } from '../../context/ContentContext';
import { useCompany } from '../../context/CompanyContext';
import { formatDate } from '../../utils/formatters';
import SocialLink from '../../components/ui/SocialLink';
import * as contenidosApi from '../../api/contenido';
import type { Seccion } from '../../api/dataTypes';

export default function ViewBlogPage() {
  const { id } = useParams<{ id: string }>();
  const { categorias, loadCategoria } = useSiteData();
  const { secciones, loadSecciones } = useContent();
  const { redes, loadRedes } = useCompany();
  const [seccionesConContenido, setSeccionesConContenido] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos
  useEffect(() => {
    const loadData = async () => {
      if (id) {
        setLoading(true);
        try {
          // Cargar categoría si no está en memoria
          const categoria = categorias.find(c => c.id_categoria === id);
          if (!categoria) {
            await loadCategoria(id);
          }
          
          // Cargar secciones
          await loadSecciones(id);
          
          // Cargar redes sociales si no están cargadas
          if (redes.length === 0) {
            console.log('Cargando redes sociales...');
            await loadRedes();
          }
        } finally {
          setLoading(false);
        }
      }
    };
    
    loadData();
  }, [id]);

  // Debug: Ver qué redes se cargan
  useEffect(() => {
    console.log('=== DEBUG REDES SOCIALES ===');
    console.log('Redes cargadas:', redes);
    console.log('Cantidad de redes:', redes.length);
    redes.forEach(red => {
      console.log(`Red: ${red.nombre_red}, Logo: ${red.logo_red}, Enlace: ${red.enlace}`);
    });
  }, [redes]);

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
            console.error(`Error cargando contenidos:`, error);
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

  const categoria = categorias.find(c => c.id_categoria === id);

  if (loading) {
    return <div className="container py-5 text-center">Cargando artículo...</div>;
  }

  if (!categoria) {
    return <div className="container py-5 text-center">Artículo no encontrado</div>;
  }

  return (
    <>
      {/* INICIO DEL APARTADO PARA ENCABEZADO BLOG */}
      <section className="blog-hero">
        <div className="container">
          <div className="row g-0">
            {/* IZQUIERDA: título y fecha */}
            <div className="col-md-7 blog-hero__content">
              <h1 className="blog-hero__title">{categoria.titulo_categoria}</h1>
              <time className="blog-hero__date" dateTime={categoria.fecha_creacion || ''}>
                {formatDate(categoria.fecha_creacion || '')}
              </time>
            </div>
            {/* DERECHA: imagen */}
            <div className="col-md-5 blog-hero__media">
              <img
                src={categoria.imagen_categoria || 'https://via.placeholder.com/600x400'}
                alt={categoria.titulo_categoria}
                className="blog-hero__img"
              />
            </div>
          </div>
        </div>
      </section>

      {/* INICIO DEL APARTADO PARA CONTENIDO DE BLOG */}
      <section className="blog-grid-and-aside py-5">
        <div className="container">
          <div className="row">
            {/* IZQUIERDA: TEXTO GRANDE */}
            <div className="col-lg-8 blog-grid-and-aside__text-block">
              {seccionesConContenido.map((seccion) => (
                <div key={seccion.id_seccion} className="mb-5">
                  <h2 className="section__title">{seccion.titulo_seccion}</h2>
                  {seccion.contenido?.map((contenido) => (
                    <div key={contenido.id_contenido}>
                      {contenido.titulo_contenido && (
                        <h3 className="mb-3">{contenido.titulo_contenido}</h3>
                      )}
                      <p className="blog-grid-and-aside__big-text">
                        {contenido.texto_contenido}
                      </p>
                      {contenido.multimedia_url && (
                        <img 
                          src={contenido.multimedia_url} 
                          alt={contenido.titulo_contenido}
                          className="img-fluid mb-4"
                        />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* DERECHA: REDES Y ADS */}
            <div className="col-lg-4 blog-grid-and-aside__aside">
              <h3 className="text-center mb-3">Síguenos en nuestras redes</h3>
              <div className="d-flex justify-content-center gap-3 mb-4">
                {redes.length > 0 ? (
                  redes.map((red) => (
                    <SocialLink
                      key={red.id_red}
                      href={red.enlace}
                      icon={red.logo_red || red.nombre_red.toLowerCase()}
                      className="footer__social-link"
                    />
                  ))
                ) : (
                  <p className="text-muted">No hay redes sociales configuradas</p>
                )}
              </div>
              <div className="blog-grid-and-aside__ad">
                <div className="ad-placeholder d-flex align-items-center justify-content-center">
                  Anuncio
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* FIN DEL APARTADO PARA CONTENIDO DE BLOG */}
    </>
  );
}