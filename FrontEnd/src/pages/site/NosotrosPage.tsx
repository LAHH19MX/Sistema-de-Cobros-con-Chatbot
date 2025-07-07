import '../../styles/site/NosotrosPage.css';
import type { Categoria } from '../../api/dataTypes';

interface NosotrosPageProps {
  categorias: Categoria[];
}

const NosotrosPage: React.FC<NosotrosPageProps> = ({ categorias }) => {
  // Filtrar categorías activas
  const categoriasActivas = categorias.filter(cat => cat.activo_categoria);

  // Separar Misión y Visión si existen
  const mision = categoriasActivas.find(cat => 
    cat.nombre_categoria.toLowerCase().includes('mision') || 
    cat.titulo_categoria?.toLowerCase().includes('mision')
  );
  
  const vision = categoriasActivas.find(cat => 
    cat.nombre_categoria.toLowerCase().includes('vision') || 
    cat.titulo_categoria?.toLowerCase().includes('vision')
  );

  // Si no hay categorías específicas, usar las primeras dos disponibles
  const [primerCategoria, segundaCategoria] = categoriasActivas;
  
  return (
    <>
      {/* SECCIÓN VISIÓN */}
      {(vision || primerCategoria) && (
        <section className="about about--vision py-5">
          <div className="container about__inner">
            <div className="about__content">
              <h2 className="section__title text-center">
                {vision ? 
                  (vision.titulo_categoria || vision.nombre_categoria) : 
                  (primerCategoria.titulo_categoria || primerCategoria.nombre_categoria)
                }
              </h2>
              <p className="section__text">
                {vision ? 
                  (vision.texto_categoria || 'Información no disponible') : 
                  (primerCategoria.texto_categoria || 'Información no disponible')
                }
              </p>
            </div>
            <div className="about__media">
              <img 
                src={vision ? 
                  (vision.imagen_categoria || '/placeholder.jpg') : 
                  (primerCategoria.imagen_categoria || '/placeholder.jpg')
                } 
                alt={vision ? 
                  (vision.titulo_categoria || vision.nombre_categoria) : 
                  (primerCategoria.titulo_categoria || primerCategoria.nombre_categoria)
                } 
                className="about__img" 
              />
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN MISIÓN */}
      {(mision || segundaCategoria) && (
        <section className="about about--mission py-5">
          <div className="container about__inner">
            <div className="about__media">
              <img 
                src={mision ? 
                  (mision.imagen_categoria || '/placeholder.jpg') : 
                  (segundaCategoria ? (segundaCategoria.imagen_categoria || '/placeholder.jpg') : '/placeholder.jpg')
                } 
                alt={mision ? 
                  (mision.titulo_categoria || mision.nombre_categoria) : 
                  (segundaCategoria ? (segundaCategoria.titulo_categoria || segundaCategoria.nombre_categoria) : 'Misión')
                } 
                className="about__img" 
              />
            </div>
            <div className="about__content">
              <h2 className="section__title text-center">
                {mision ? 
                  (mision.titulo_categoria || mision.nombre_categoria) : 
                  (segundaCategoria ? (segundaCategoria.titulo_categoria || segundaCategoria.nombre_categoria) : 'Misión')
                }
              </h2>
              <p className="section__text">
                {mision ? 
                  (mision.texto_categoria || 'Información no disponible') : 
                  (segundaCategoria ? (segundaCategoria.texto_categoria || 'Información no disponible') : 'Información no disponible')
                }
              </p>
            </div>
          </div>
        </section>
      )}

      {/* MENSAJE SI NO HAY CATEGORÍAS */}
      {categoriasActivas.length === 0 && (
        <section className="about-empty py-5">
          <div className="container text-center">
            <h2 className="section__title">Sobre Nosotros</h2>
            <p className="section__text">
              La información sobre nuestra empresa estará disponible próximamente.
            </p>
          </div>
        </section>
      )}
    </>
  );
};

export default NosotrosPage;