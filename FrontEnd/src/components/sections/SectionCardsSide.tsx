import '../../styles/site/SectionCardsSide.css'

export interface SideItem {
  imgSrc: string;
  imgAlt: string;
  heading: string;
  text: string;
}

export interface SectionCardsSideProps {
  title: string;
  subtitle: string;
  items: SideItem[];
}

const SectionCardsSide: React.FC<SectionCardsSideProps> = ({ title, subtitle, items }) => (
  <section className="custom-section--two-col py-5">
    <div className="container">
      <h2 className="custom-section__title mb-3">{title}</h2>
      <p className="custom-section__subtitle mb-5">{subtitle}</p>

      <div className="row g-4">
        {items.map((item, idx) => (
          <div className="col-12 col-lg-6" key={idx}>
            <div className="custom-two-col__item d-flex flex-column flex-md-row p-4 custom-for__boxshadow">
              <div className="custom-two-col__media">
                <img
                  src={item.imgSrc}
                  alt={item.imgAlt}
                  className="custom-two-col__img"
                />
              </div>
              <div className="custom-two-col__body">
                <h3 className="custom-two-col__heading">{item.heading}</h3>
                <p className="custom-two-col__text">{item.text}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default SectionCardsSide;