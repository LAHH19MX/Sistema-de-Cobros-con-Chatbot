import React from 'react';
import SectionGeneral from './SectionGeneral';
import SectionCards from './SectionCards';
import SectionCardsSide from './SectionCardsSide';
import SectionGallery from './SectionGallery';
import SectionGalleryRounded from './SectionGalleryRounded';
import SectionTabs from './SectionTabs';
import SectionInfoBoxes from './SectionInfoBoxes';

// Tipos mejorados con valores por defecto en las interfaces
export interface Contenido {
  id_contenido: string;
  id_seccion: string;
  titulo_contenido: string;
  texto_contenido?: string; // Hacer opcional
  multimedia_url?: string;  // Hacer opcional
}

export interface Seccion {
  id_seccion: string;
  titulo_seccion: string;
  texto_seccion?: string;
  imagen_url?: string;
  activo_seccion?: boolean;
  tipo_seccion: string;
  id_categoria?: string;
  contenido?: Contenido[];  
}

// Tipo para los datos mapeados
interface ContenidoMapeado {
  id: string;
  titulo: string;
  texto: string;
  multimedia: string;
  altText: string;
}

interface SectionRendererProps {
  seccion: Seccion;
}

const SectionRenderer: React.FC<SectionRendererProps> = ({ seccion }) => {
  // Desestructuración con valores por defecto
  const { 
    tipo_seccion, 
    titulo_seccion, 
    texto_seccion = '', 
    contenido = [] 
  } = seccion;

  // Función de mapeo segura con tipos explícitos
  const mapearContenido = (items: Contenido[]): ContenidoMapeado[] => {
    return items.map(item => ({
      id: item.id_contenido,
      titulo: item.titulo_contenido,
      texto: item.texto_contenido || '',
      multimedia: item.multimedia_url || '',
      altText: item.titulo_contenido
    }));
  };

  const contenidoMapeado = mapearContenido(contenido);

  // Props comunes para todas las secciones
  const commonProps = {
    title: titulo_seccion,
    subtitle: texto_seccion
  };

  // Renderizado condicional mejorado
  switch (tipo_seccion) {
    case 'General':
      return (
        <SectionGeneral
          {...commonProps}
          features={contenidoMapeado.map(item => ({
            heading: item.titulo,
            text: item.texto,
            imgSrc: item.multimedia,
            imgAlt: item.altText
          }))}
        />
      );

    case 'Cards':
      return (
        <SectionCards
          {...commonProps}
          cards={contenidoMapeado.map(item => ({
            imgSrc: item.multimedia,
            imgAlt: item.altText,
            title: item.titulo,
            text: item.texto
          }))}
        />
      );

    case 'CardsSide':
      return (
        <SectionCardsSide
          {...commonProps}
          items={contenidoMapeado.map(item => ({
            imgSrc: item.multimedia,
            imgAlt: item.altText,
            heading: item.titulo,
            text: item.texto
          }))}
        />
      );

    case 'Gallery':
      return (
        <SectionGallery
          title={titulo_seccion}
          images={contenidoMapeado.map(item => item.multimedia)}
        />
      );

    case 'GalleryRounded':
      return (
        <SectionGalleryRounded
          {...commonProps}
          images={contenidoMapeado.map(item => item.multimedia)}
        />
      );

    case 'Tabs':
      return (
        <SectionTabs
          {...commonProps}
          tabs={contenidoMapeado.map(item => ({
            imgSrc: item.multimedia,
            imgAlt: item.altText,
            heading: item.titulo,
            text: item.texto
          }))}
        />
      );

    case 'InfoBoxes':
      return (
        <SectionInfoBoxes
          {...commonProps}
          boxes={contenidoMapeado.map(item => ({
            title: item.titulo,
            text: item.texto
          }))}
        />
      );

    default:
      return (
        <SectionGeneral
          {...commonProps}
          features={contenidoMapeado.map(item => ({
            heading: item.titulo,
            text: item.texto,
            imgSrc: item.multimedia,
            imgAlt: item.altText
          }))}
        />
      );
  }
};

export default SectionRenderer;