import '../../styles/site/SectionCards.css'

export interface CardItem {
  imgSrc: string;
  imgAlt: string;
  title: string;
  text: string;
}

export interface SectionCardsProps {
  title: string;
  subtitle: string;
  cards: CardItem[];
}

const SectionCards: React.FC<SectionCardsProps> = ({ title, subtitle, cards }) => (
  <section className="custom-section--cards2 py-5">
    <div className="container">
      <h2 className="custom-section__title">{title}</h2>
      <p className="custom-section__subtitle mb-5">{subtitle}</p>

      <div className="row justify-content-center">
        {cards.map((card, idx) => (
          <div className="col-6 col-sm-4 col-md-3" key={idx}>
            <div className="card custom-section--cards__card mb-3 p-3">
              <img
                src={card.imgSrc}
                alt={card.imgAlt}
                className="custom-section--cards__img mb-3 mx-auto"
              />
              <h4 className="custom-section--cards__title mb-2">{card.title}</h4>
              <p className="custom-section--cards__text">{card.text}</p>
            </div>
          </div>
        ))}
      </div>

      <hr className="custom-section-divider" />
    </div>
  </section>
);

export default SectionCards;