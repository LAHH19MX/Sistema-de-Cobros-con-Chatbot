import '../../styles/site/SectionTabs.css'

export interface TabItem {
  imgSrc: string;
  imgAlt: string;
  heading: string;
  text: string;
}

export interface SectionTabsProps {
  title: string;
  subtitle: string;
  tabs: TabItem[];
}

const SectionTabs: React.FC<SectionTabsProps> = ({ title, subtitle, tabs }) => (
  <section className="custom-section--tabs py-5">
    <div className="container text-center">
      <h2 className="custom-section__title mb-3">{title}</h2>
      <p className="custom-section__subtitle mb-5">{subtitle}</p>

      <ul className="custom-tabs__list">
        {tabs.map((tab, idx) => (
          <li className="custom-tabs__item" key={idx}>
            <img
              src={tab.imgSrc}
              alt={tab.imgAlt}
              className="custom-tabs__img mb-3"
            />
            <h4 className="custom-tabs__heading mb-2">{tab.heading}</h4>
            <p className="custom-tabs__text">{tab.text}</p>
          </li>
        ))}
      </ul>

      <hr className="custom-section-divider" />
    </div>
  </section>
);

export default SectionTabs;