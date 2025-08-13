import '../../styles/site/SectionGallery.css';

export interface SectionGalleryProps {
  title: string;
  images: string[]; 
}

// Función para extraer el ID de YouTube de diferentes formatos de URL
const getYoutubeId = (url: string): string | null => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const SectionGallery: React.FC<SectionGalleryProps> = ({ title, images }) => (
  <section className="custom-section--galeria ">
    <div className="custom-bg-light-gray pt-4 pb-5">
      <div className="container text-center">
        <h2 className="custom-section__title mb-4">{title}</h2>
        <div className="row justify-content-center g-3">
          {images.map((src, idx) => {
            const videoId = getYoutubeId(src);
            
            return (
              <div className="col-6" key={idx}>
                {videoId ? (
                  <div className="ratio ratio-16x9">
                    <iframe
                      src={`https://www.youtube.com/embed/${videoId}`}
                      title={`${title} video ${idx + 1}`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="custom-section--galeria__video"
                    ></iframe>
                  </div>
                ) : (
                  <div className="invalid-video-placeholder">
                    URL de YouTube inválida
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default SectionGallery;