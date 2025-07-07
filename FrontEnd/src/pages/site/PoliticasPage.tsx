import '../../styles/site/PoliticasPage.css';
import { useState, useEffect } from 'react';
import type { Categoria, Seccion } from '../../api/dataTypes';
import { useCompany } from '../../context/CompanyContext'; // Importamos el contexto

interface PoliticasPageProps {
  categorias: Categoria[];
  secciones: Seccion[];
}

const PoliticasPage: React.FC<PoliticasPageProps> = ({ categorias, secciones }) => {
  const [seccionesOrdenadas, setSeccionesOrdenadas] = useState<Seccion[]>([]);
  const [loading, setLoading] = useState(true);
  const { empresa } = useCompany(); // Obtenemos los datos de la empresa

  useEffect(() => {
    // Las secciones ya vienen cargadas desde DynamicPage
    if (secciones && secciones.length > 0) {
      setSeccionesOrdenadas(secciones);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [secciones]);

  // Filtrar categorías activas
  const categoriasActivas = categorias
    .filter(cat => cat.activo_categoria);

  // Función para formatear fecha
  const formatearFecha = (fecha?: string) => {
    const fechaActual = fecha ? new Date(fecha) : new Date();
    return fechaActual.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Función para obtener secciones de una categoría
  const getSeccionesCategoria = (categoriaId: string) => {
    return seccionesOrdenadas.filter(
      sec => sec.id_categoria === categoriaId && sec.activo_seccion
    );
  };

  if (loading) {
    return <div className="container py-5 text-center">Cargando políticas...</div>;
  }

  return (
    <div className="politicas-wrapper">
      {/* Header */}
      <div className="privacy-header">
        <div className="container">
          <h1 className="privacy-title">Políticas de Privacidad</h1>
        </div>
      </div>

      {/* Content */}
      <div className="politicas-content">
        <div className="container">
          {categoriasActivas.map((categoria, index) => {
            const seccionesCategoria = getSeccionesCategoria(categoria.id_categoria);
            
            return (
              <div key={categoria.id_categoria} className="policy-section">
                <h2 className="policy-title">
                  {index + 1}. {categoria.titulo_categoria || categoria.nombre_categoria}
                </h2>
                
                {categoria.texto_categoria && (
                  <p className="policy-description">
                    {categoria.texto_categoria}
                  </p>
                )}
                
                <p className="policy-date">
                  Última actualización: {formatearFecha(categoria.fecha_creacion)}
                </p>

                {/* Secciones como puntos de la política */}
                {seccionesCategoria.map((seccion, secIndex) => (
                  <div key={seccion.id_seccion} className="policy-point">
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

          {/* Mensaje si no hay políticas */}
          {categoriasActivas.length === 0 && (
            <div className="text-center py-5">
              <h3 className="policy-title">No hay políticas disponibles</h3>
              <p className="policy-description">
                Las políticas de privacidad estarán disponibles próximamente.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="footer-contact">
        <div className="container">
          <p className="mb-2">
            <strong>¿Tiene preguntas sobre nuestra política de privacidad?</strong>
          </p>
          <p className="mb-0">
            Contáctenos en: <a 
              href={`mailto:${empresa?.email_empresa || 'privacidad@empresa.com'}`} 
              className="contact-link"
            >
              {empresa?.email_empresa || 'privacidad@empresa.com'}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PoliticasPage;