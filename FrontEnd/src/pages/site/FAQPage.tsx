import '../../styles/site/FAQPage.css';
import { useState, useEffect } from 'react';
import type { Categoria, Seccion } from '../../api/dataTypes';
import { useContent } from '../../context/ContentContext';
import * as contenidosApi from '../../api/contenido';

interface FAQPageProps {
  categorias: Categoria[];
  secciones: Seccion[];
}

const FAQPage: React.FC<FAQPageProps> = ({ categorias, secciones }) => {
  const { loadContenidos } = useContent();
  const [seccionesConContenido, setSeccionesConContenido] = useState<Seccion[]>([]);
  const [openAnswers, setOpenAnswers] = useState<Set<string>>(new Set());

  // Cargar contenidos para cada sección
  useEffect(() => {
    const cargarContenidos = async () => {
      const seccionesActualizadas: Seccion[] = [];
      
      for (const seccion of secciones) {
        try {
          await loadContenidos(seccion.id_seccion);
          const contenidosResponse = await contenidosApi.getContenidosBySeccion(seccion.id_seccion);
          seccionesActualizadas.push({
            ...seccion,
            contenido: contenidosResponse.data
          });
        } catch (error) {
          console.error(`Error cargando contenidos para sección ${seccion.id_seccion}:`, error);
          seccionesActualizadas.push({
            ...seccion,
            contenido: []
          });
        }
      }
      
      setSeccionesConContenido(seccionesActualizadas);
    };

    if (secciones.length > 0) {
      cargarContenidos();
    }
  }, [secciones, loadContenidos]);

  // Filtrar categorías activas
  const categoriasActivas = categorias.filter(cat => cat.activo_categoria);

  // Toggle para mostrar/ocultar respuestas
  const toggleAnswer = (seccionId: string) => {
    setOpenAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seccionId)) {
        newSet.delete(seccionId);
      } else {
        newSet.add(seccionId);
      }
      return newSet;
    });
  };

  // Scroll suave a categoría
  const scrollToCategory = (categoriaId: string) => {
    const element = document.getElementById(`categoria-${categoriaId}`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  return (
    <div className="container py-5">
      <div className="row">
        {/* Contenido principal - FAQ */}
        <div className="col-lg-8">
          <h1 className="faq-title">Preguntas Frecuentes</h1>

          {categoriasActivas.map(categoria => {
            // Obtener secciones de esta categoría
            const seccionesCategoria = seccionesConContenido.filter(
              sec => sec.id_categoria === categoria.id_categoria && sec.activo_seccion
            );

            if (seccionesCategoria.length === 0) return null;

            return (
              <div key={categoria.id_categoria} id={`categoria-${categoria.id_categoria}`}>
                <h2 className="category-title">
                  {categoria.titulo_categoria || categoria.nombre_categoria}
                </h2>
                
                {seccionesCategoria.map(seccion => {
                  const isOpen = openAnswers.has(seccion.id_seccion);
                  
                  return (
                    <div key={seccion.id_seccion}>
                      <h3 
                        className="question"
                        onClick={() => toggleAnswer(seccion.id_seccion)}
                      >
                        {seccion.titulo_seccion}
                      </h3>
                      
                      {/* Respuesta usando texto de la sección */}
                      {seccion.texto_seccion && (
                        <p className={`answer ${isOpen ? 'show' : ''}`}>
                          {seccion.texto_seccion}
                        </p>
                      )}
                      
                      {/* Si hay contenidos, mostrar el texto del primer contenido como respuesta adicional */}
                      {seccion.contenido && seccion.contenido.length > 0 && seccion.contenido[0].texto_contenido && (
                        <p className={`answer ${isOpen ? 'show' : ''}`}>
                          {seccion.contenido[0].texto_contenido}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Mensaje si no hay categorías */}
          {categoriasActivas.length === 0 && (
            <div className="text-center py-5">
              <h3 className="category-title">No hay preguntas frecuentes disponibles</h3>
              <p className="answer show">
                Las preguntas frecuentes estarán disponibles próximamente.
              </p>
            </div>
          )}
        </div>

        {/* Sidebar - Menú de temas */}
        <div className="col-lg-4">
          <div className="sidebar">
            <h3 className="sidebar-title text-center">Temas</h3>
            {categoriasActivas.map(categoria => (
              <button
                key={categoria.id_categoria}
                type="button"
                className="topic-link"
                onClick={() => scrollToCategory(categoria.id_categoria)}
              >
                {categoria.titulo_categoria || categoria.nombre_categoria}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQPage;