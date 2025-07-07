import '../../styles/site/HomePage.css'
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import SectionRenderer from '../../components/sections/SectionRenderer';
import type { Categoria, Seccion } from '../../api/dataTypes';
import { useContent } from '../../context/ContentContext';
import * as contenidosApi from '../../api/contenido';

interface HomePageProps {
  categorias: Categoria[];
  secciones: Seccion[];
}

export default function HomePage({ categorias, secciones }: HomePageProps) {
  const navigate = useNavigate();
  const { loadContenidos } = useContent();
  const [seccionesConContenido, setSeccionesConContenido] = useState<Seccion[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Separa la primera categoría de las demás
  const [primera, ...resto] = categorias;

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
  }, [secciones]);

  // Prepara los datos para el carrusel
  const slides = resto.map(cat => ({
    idCategoria: cat.id_categoria,
    imgSrc: cat.imagen_categoria || '/placeholder.jpg',
    imgAlt: cat.titulo_categoria || cat.nombre_categoria,
    title: cat.titulo_categoria || cat.nombre_categoria,
    description: cat.texto_categoria || '',
  }));

  // Control del carrusel con estado de React
  useEffect(() => {
    if (slides.length === 0) return;

    const totalDuration = 12000; // 12 segundos en milisegundos
    const slideInterval = totalDuration / slides.length;

    // Función para actualizar el slide activo
    const updateCurrentSlide = () => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    };

    // Configurar CSS animation en slides
    const carruselSlides = document.querySelectorAll<HTMLElement>('.carousel-fade__slide');
    carruselSlides.forEach((slide, idx) => {
      slide.style.animation = `carousel-fade 12s infinite`;
      slide.style.animationDelay = `${(slideInterval * idx) / 1000}s`;
    });

    // Interval para cambiar slide activo
    const interval = setInterval(updateCurrentSlide, slideInterval);

    return () => clearInterval(interval);
  }, [slides.length]);

  // Handlers para los botones
  const handleMoreInfo = (idCategoria: string, title: string) => {
    console.log('🎯 Navegando a categoría:', { idCategoria, title, slideIndex: currentSlide });
    navigate(`/categoria/${idCategoria}`);
  };

  const handleRegister = () => {
    console.log('🎯 Navegando a registro');
    navigate('/register');
  };

  return (
    <>
      {/* Carrusel con las categorías 2…N */}
      {slides.length > 0 && (
        <section className="carousel-fade mb-5">
          {slides.map((slide, idx) => (
            <div 
              className="carousel-fade__slide" 
              key={`slide-${slide.idCategoria}`}
              style={{
                pointerEvents: idx === currentSlide ? 'auto' : 'none',
                zIndex: idx === currentSlide ? 10 : 1
              }}
            >
              <img
                src={slide.imgSrc}
                alt={slide.imgAlt}
                className="carousel-fade__img"
              />
              <div className="carousel-fade__overlay"></div>
              <div className="carousel-fade__content container text-center text-white">
                <h1 className="carousel-fade__title">{slide.title}</h1>
                <p className="carousel-fade__description">
                  {slide.description}
                </p>
                <div className="d-inline-block">
                  <button
                    type="button"
                    className={`btn btn--info me-2 ${idx !== currentSlide ? 'btn--disabled' : ''}`}
                    onClick={() => handleMoreInfo(slide.idCategoria, slide.title)}
                    disabled={idx !== currentSlide}
                  >
                    Más información
                  </button>
                  <button
                    type="button"
                    className={`btn btn--start ${idx !== currentSlide ? 'btn--disabled' : ''}`}
                    onClick={() => handleRegister()}
                    disabled={idx !== currentSlide}
                  >
                    Empieza ahora
                  </button>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Renderiza secciones solo de la primera categoría */}
      {primera && seccionesConContenido
        .filter(sec => sec.id_categoria === primera.id_categoria)
        .map(sec => (
          <SectionRenderer
            key={sec.id_seccion}
            seccion={sec}
          />
        ))}
    </>
  );
}