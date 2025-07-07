import '../../styles/site/TerminosPage.css';
import { useState, useEffect } from 'react';
import type { Categoria, Seccion } from '../../api/dataTypes';
import { useCompany } from '../../context/CompanyContext'; // Importamos el contexto

interface TerminosPageProps {
  categorias: Categoria[];
  secciones: Seccion[];
} 

const TerminosPage: React.FC<TerminosPageProps> = ({ categorias, secciones }) => {
  const [seccionesOrdenadas, setSeccionesOrdenadas] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresa } = useCompany(); // Obtenemos los datos de la empresa

  useEffect(() => {
    if (secciones && secciones.length > 0) {
      setSeccionesOrdenadas(secciones);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [secciones]);

  const categoriasActivas = categorias.filter(cat => cat.activo_categoria);

  const formatearFecha = (fecha?: string) => {
    const fechaActual = fecha ? new Date(fecha) : new Date();
    return fechaActual.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const getSeccionesCategoria = (categoriaId: string) => {
    return seccionesOrdenadas.filter(
      sec => sec.id_categoria === categoriaId && sec.activo_seccion
    );
  };

  if (loading) {
    return <div className="container py-5 text-center">Cargando términos...</div>;
  }

  return (
    <div className="terminos-wrapper">
      {/* Header */}
      <div className="terms-header">
        <div className="container">
          <h1 className="terms-title">Términos y Condiciones</h1>
        </div>
      </div>

      {/* Content */}
      <div className="terminos-content">
        <div className="container">
          {categoriasActivas.map((categoria, index) => {
            const seccionesCategoria = getSeccionesCategoria(categoria.id_categoria);
            
            return (
              <div key={categoria.id_categoria} className="category-section">
                <h2 className="category-title2 text-dark">
                  {index + 1}. {categoria.titulo_categoria || categoria.nombre_categoria}
                </h2>
                
                <p className="category-date">
                  Última actualización: {formatearFecha(categoria.fecha_creacion)}
                </p>
                
                {categoria.texto_categoria && (
                  <p className="category-description">
                    {categoria.texto_categoria}
                  </p>
                )}

                {seccionesCategoria.map((seccion, secIndex) => (
                  <div key={seccion.id_seccion} className="terms-point">
                    <h3 className="point-title">
                      {index + 1}.{secIndex + 1}. {seccion.titulo_seccion}
                    </h3>
                    {seccion.texto_seccion && (
                      <p className="point-content">
                        {seccion.texto_seccion}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {categoriasActivas.length === 0 && (
            <div className="text-center py-5">
              <h3 className="category-title2">No hay términos disponibles</h3>
              <p className="category-description">
                Los términos y condiciones estarán disponibles próximamente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer-contact">
        <div className="container">
          <p className="mb-2">
            <strong>¿Tiene preguntas sobre estos términos?</strong>
          </p>
          <p className="mb-0">
            Contáctenos en: <a 
              href={`mailto:${empresa?.email_empresa || 'legal@empresa.com'}`} 
              className="contact-link"
            >
              {empresa?.email_empresa || 'legal@empresa.com'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TerminosPage;