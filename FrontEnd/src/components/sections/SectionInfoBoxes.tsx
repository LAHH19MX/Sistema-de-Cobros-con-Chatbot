import React from 'react';
import '../../styles/site/SectionInfoBoxes.css'

export interface BoxItem {
  title: string;
  text: string;
}

export interface SectionInfoBoxesProps {
  title: string;
  subtitle: string;
  boxes: BoxItem[];
}

const SectionInfoBoxes: React.FC<SectionInfoBoxesProps> = ({ title, subtitle, boxes }) => (
  <section className="custom-section--infoBoxes py-5">
    <div className="container text-center">
      <h2 className="custom-section__title mb-3">{title}</h2>
      <p className="custom-section__subtitle mb-4">{subtitle}</p>
      <div className="row justify-content-center g-2">
        {boxes.map((box, idx) => (
          <div className="col-12 col-md-4" key={idx}>
            <div className="custom-info-box p-3">
              <h4 className="custom-info-box__heading mb-2">{box.title}</h4>
              <p className="custom-info-box__text p-3">{box.text}</p>
            </div>
          </div>
        ))}
      </div>
      <hr className="custom-section-divider" />
    </div>
  </section>
);

export default SectionInfoBoxes;