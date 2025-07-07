import '../../styles/site/SectionGallery.css'

export interface SectionGalleryProps {
  title: string;
  images: string[];
}

const SectionGallery: React.FC<SectionGalleryProps> = ({ title, images }) => (
  <section className="custom-section--galeria">
    <div className="custom-bg-light-gray pt-4">
      <div className="container text-center">
        <h2 className="custom-section__title mb-4">{title}</h2>
        <div className="row justify-content-center g-3">
          {images.map((src, idx) => (
            <div className="col-6" key={idx}>
              <img
                src={src}
                alt={`${title} imagen ${idx + 1}`}
                className="img-fluid custom-section--galeria__img"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SectionGallery;