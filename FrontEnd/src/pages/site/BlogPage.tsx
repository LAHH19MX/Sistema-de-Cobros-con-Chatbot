import '../../styles/blog.css'
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/formatters';
import { useCompany } from '../../context/CompanyContext';
import SocialLink from '../../components/ui/SocialLink';
import type { Categoria } from '../../api/categorias';

interface BlogPageProps {
  categorias: Categoria[];
}

const BlogPage = ({ categorias }: BlogPageProps) => {
  const { redes, loadRedes } = useCompany();
  const primeros4 = categorias.slice(0, 4);
  const [destacado, ...laterales] = primeros4;

  // Cargar redes sociales
  useEffect(() => {
    if (redes.length === 0) {
      loadRedes();
    }
  }, []);

  return (
    <>
      {/* SECCIÓN DESTACADO + LATERALES */}
      <section className="container my-5">
        <div className="row g-4">
          {destacado && (
            <div className="col-12 col-lg-6">
              <Link
                to={`/blog/${destacado.id_categoria}`}
                className="blog-primary-item d-block text-white text-decoration-none"
              >
                <figure className="mb-3">
                  <img
                    src={destacado.imagen_categoria}
                    alt={destacado.titulo_categoria}
                    className="img-fluid"
                  />
                </figure>
                <h2 className="mb-2">{destacado.titulo_categoria}</h2>
                <p className="blog-desc mb-2">{destacado.texto_categoria}</p>
                <time dateTime={destacado.fecha_creacion}>
                  {formatDate(destacado.fecha_creacion || '')}
                </time>
              </Link>
            </div>
          )}
          <div className="col-12 col-lg-6">
            <div className="blog-side-list d-flex flex-column gap-3">
              {laterales.map(cat => (
                <Link
                  key={cat.id_categoria}
                  to={`/blog/${cat.id_categoria}`}
                  className="blog-side-item d-flex text-decoration-none"
                >
                  <img
                    src={cat.imagen_categoria}
                    alt={cat.titulo_categoria}
                    className="flex-shrink-0 me-3"
                    style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                  />
                  <div>
                    <h5 className="mb-1">{cat.titulo_categoria}</h5>
                    <p className="blog-desc mb-1">{cat.texto_categoria}</p>
                    <time dateTime={cat.fecha_creacion}>
                      {formatDate(cat.fecha_creacion || '')}
                    </time>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          <hr className="section-divider" />
        </div>
      </section>

      {/* SECCIÓN GRID DE BLOGS + ASIDE */}
      <section className="blog-grid-and-aside py-5">
        <div className="container">
          <div className="row">
            {/* IZQUIERDA: GRID DE TODOS LOS POSTS */}
            <div className="col-lg-8">
              <div className="row g-4">
                {categorias.map(cat => (
                  <div className="col-md-6" key={cat.id_categoria}>
                    <Link
                      to={`/blog/${cat.id_categoria}`}
                      className="blog-item d-block text-white text-decoration-none"
                    >
                      <img
                        src={cat.imagen_categoria}
                        alt={cat.titulo_categoria}
                        className="img-fluid mb-2"
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <time dateTime={cat.fecha_creacion} className="d-block mb-1">
                        {formatDate(cat.fecha_creacion || '')}
                      </time>
                      <h3 className="mb-1 text-center">{cat.titulo_categoria}</h3>
                      <p className="blog-desc mb-2">{cat.texto_categoria}</p>
                      <hr className="blog-item-divider" />
                    </Link>
                  </div>
                ))}
              </div>
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
                  Anuncios
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default BlogPage;