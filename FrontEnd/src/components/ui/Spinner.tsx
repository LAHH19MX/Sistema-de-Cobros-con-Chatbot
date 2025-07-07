import React from 'react';

const Spinner: React.FC = () => (
  <div className="d-flex justify-content-center my-4">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Cargando…</span>
    </div>
  </div>
);

export default Spinner;
