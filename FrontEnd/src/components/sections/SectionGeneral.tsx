import '../../styles/site/SectionGeneral.css'

export interface Feature {
  heading: string;
  text: string;
  imgSrc: string;
  imgAlt: string;
}

export interface SectionGeneralProps {
  title: string;
  subtitle: string;
  features: Feature[];
}

const SectionGeneral: React.FC<SectionGeneralProps> = ({ title, subtitle, features }) => (
  <section className="custom-section-general mb-5">
    <div className="container">
      <h2 className="custom-section__title">{title}</h2>
      <p className="custom-section__subtitle-section1">{subtitle}</p>

      {features.map((feature, idx) => {
        const isEven = idx % 2 === 0;
        return (
          <div className="row align-items-center mb-4" key={idx}>
            {isEven ? (
              <>
                <div className="col-md-5">
                  <div className="custom-section--features__media">
                    <img
                      src={feature.imgSrc}
                      alt={feature.imgAlt}
                      className="custom-section--features__img"
                    />
                  </div>
                </div>
                <div className="col-md-7">
                  <h3 className="custom-section--features__heading">{feature.heading}</h3>
                  <p className="custom-section--features__text">{feature.text}</p>
                </div>
              </>
            ) : (
              <>
                <div className="col-md-7">
                  <h3 className="custom-section--features__heading">{feature.heading}</h3>
                  <p className="custom-section--features__text">{feature.text}</p>
                </div>
                <div className="col-md-5">
                  <div className="custom-section--features__media">
                    <img
                      src={feature.imgSrc}
                      alt={feature.imgAlt}
                      className="custom-section--features__img"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  </section>
);

export default SectionGeneral;