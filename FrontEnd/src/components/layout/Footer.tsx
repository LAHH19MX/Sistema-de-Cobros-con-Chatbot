import '../../styles/site/Footer.css'
import React from 'react';
import { Link } from 'react-router-dom';

export interface FooterSection {
  title: string;
  links: Array<{ name: string; url: string }>;
}

export interface SocialLink {
  url: string;
  iconClass: string;
}

export interface FooterProps {
  /** Secciones con títulos y enlaces */
  sections: FooterSection[];
  /** Líneas de dirección */
  addressLines: string[];
  /** URL al mapa */
  mapUrl: string;
  /** Array de redes sociales */
  socialLinks: SocialLink[];
  /** Texto de copyright */
  copyright: string;
}

const Footer: React.FC<FooterProps> = ({
  sections,
  addressLines,
  mapUrl,
  socialLinks,
  copyright,
}) => (
  <footer className="footer">
    <div className="container">
      <div className="row">
        {/* Secciones dinámicas */}
        <div className="col-md-9">
          <div className="row">
            {sections.map((sec, idx) => (
              <div className="col-6 col-lg-4 mb-4 footer__section" key={idx}>
                <h5 className="footer__title">{sec.title}</h5>
                <ul className="footer__list list-unstyled">
                  {sec.links.map(link => (
                    <li key={link.name}>
                      <Link className="footer__link" to={link.url}>
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Contacto */}
        <div className="col-md-3 mb-4 footer__section">
          <h5 className="footer__title">Contacto</h5>
          <address className="footer__address text-white">
            {addressLines.map((line, index) => (
              <React.Fragment key={index}>
                {line}
                {index < addressLines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </address>
          {mapUrl !== '#' && (
            <a 
              href={mapUrl} 
              className="footer__map-link d-block mt-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <i className="fas fa-map-marker-alt" /> Ver mapa
            </a>
          )}
        </div>
      </div>

      {/* Divider */}
      <hr className="footer__divider" />

      {/* Footer bottom */}
      <div className="row align-items-center footer__apt-2">
        <div className="col-md-6 text-center text-md-start mb-3 mb-md-0">
          <small className="footer__copyright">
            {copyright}
          </small>
        </div>
        <div className="col-md-6 text-center text-md-end">
          {socialLinks.map(sl => (
            <a
              href={sl.url}
              className="footer__social-link me-3"
              key={sl.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visitar ${sl.url}`}
            >
              <i className={sl.iconClass} />
            </a>
          ))}
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;