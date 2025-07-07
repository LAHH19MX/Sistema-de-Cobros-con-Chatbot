import '../../styles/site/SectionGalleryRounded.css'

export interface SectionGalleryRoundedProps {
  title: string;
  subtitle: string;
  images: string[];
}

const SectionGalleryRounded: React.FC<SectionGalleryRoundedProps> = ({ title, subtitle, images }) => (
  <section className="custom-section--circular-gallery">
    <div className="py-5">
      <div className="container text-center">
        <h2 className="custom-section__title mb-3">{title}</h2>
        <p className="custom-section__subtitle mb-5">{subtitle}</p>
        <div className="row justify-content-center gx-4 gy-4">
          {images.map((src, idx) => (
            <div className="col-6 col-sm-4 col-md-3 col-lg-2" key={idx}>
              <img
                src={src}
                alt={`${title} ${idx + 1}`}
                className="custom-section--circular__img"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default SectionGalleryRounded;