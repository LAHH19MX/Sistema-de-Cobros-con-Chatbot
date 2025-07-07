import React from 'react';
import { Link } from 'react-router-dom';

const Error404: React.FC = () => (
  <section className="error404">
    <div className="container text-center">
      <img
        src="https://sdmntprwestus2.oaiusercontent.com/files/00000000-2990-61f8-83b4-b8e4f03b1575/raw?se=2025-07-01T17%3A39%3A11Z&sp=r&sv=2024-08-04&sr=b&scid=650a76f0-9812-5063-93a6-4ab490fcd878&skoid=30ec2761-8f41-44db-b282-7a0f8809659b&sktid=a48cca56-e6da-484e-a814-9c849652bcb3&skt=2025-06-30T18%3A10%3A29Z&ske=2025-07-01T18%3A10%3A29Z&sks=b&skv=2024-08-04&sig=36iX7T5GnKDz7bkd162BpjgrC6rdghA8G54ScMXsVIg%3D"
        alt="Página no encontrada"
        className="error404__img mb-4"
      />
      <Link to="/" className="error404__btn">
        Volver al inicio
      </Link>
    </div>
  </section>
);

export default Error404;
