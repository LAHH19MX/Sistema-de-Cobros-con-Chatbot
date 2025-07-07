const PreciosPage = () => {
  return (
    <section className="section--plans py-5">
      <div className="container">
        <h2 className="section__title mb-5 text-center">Elige tu Plan Ideal</h2>
        <div className="section--plans__grid">
          {/* Plan Básico */}
          <div className="section--plans__item">
            <div className="plan-card">
              <header className="plan-card__header">
                <h3 className="plan-card__name">Básico</h3>
                <p className="plan-card__tag">Perfecto para empezar</p>
              </header>
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>9<span className="plan-card__decimals">.99</span><small>/mes</small>
                </div>
                <ul className="plan-card__benefits">
                  <li className="plan-card__benefit">✔ Acceso ilimitado</li>
                  <li className="plan-card__benefit">✔ 5 GB de almacenamiento</li>
                  <li className="plan-card__benefit">✔ Soporte básico</li>
                  <li className="plan-card__benefit">✔ Actualizaciones mensuales</li>
                </ul>
              </div>
              <div className="plan-card__footer">
                <a href="#" className="btn btn--start plan-card__cta">Comprar ahora</a>
              </div>
            </div>
          </div>

          {/* Plan Pro */}
          <div className="section--plans__item">
            <div className="plan-card">
              <header className="plan-card__header">
                <h3 className="plan-card__name">Pro</h3>
                <p className="plan-card__tag">Para crecer rápido</p>
              </header>
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>19<span className="plan-card__decimals">.99</span><small>/mes</small>
                </div>
                <ul className="plan-card__benefits">
                  <li className="plan-card__benefit">✔ Todo lo de Básico</li>
                  <li className="plan-card__benefit">✔ 50 GB de almacenamiento</li>
                  <li className="plan-card__benefit">✔ Soporte prioritario</li>
                  <li className="plan-card__benefit">✔ Integraciones API</li>
                </ul>
              </div>
              <div className="plan-card__footer">
                <a href="#" className="btn btn--start plan-card__cta">Comprar ahora</a>
              </div>
            </div>
          </div>

          {/* Plan Premium */}
          <div className="section--plans__item">
            <div className="plan-card">
              <header className="plan-card__header">
                <h3 className="plan-card__name">Premium</h3>
                <p className="plan-card__tag">Máxima potencia</p>
              </header>
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>29<span className="plan-card__decimals">.99</span><small>/mes</small>
                </div>
                <ul className="plan-card__benefits">
                  <li className="plan-card__benefit">✔ Todo lo de Pro</li>
                  <li className="plan-card__benefit">✔ 200 GB de almacenamiento</li>
                  <li className="plan-card__benefit">✔ Soporte 24/7</li>
                  <li className="plan-card__benefit">✔ Reportes avanzados</li>
                </ul>
              </div>
              <div className="plan-card__footer">
                <a href="#" className="btn btn--start plan-card__cta">Comprar ahora</a>
              </div>
            </div>
          </div>

          {/* Plan Élite */}
          <div className="section--plans__item">
            <div className="plan-card">
              <header className="plan-card__header">
                <h3 className="plan-card__name">Élite</h3>
                <p className="plan-card__tag">Todo sin límites</p>
              </header>
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>49<span className="plan-card__decimals">.99</span><small>/mes</small>
                </div>
                <ul className="plan-card__benefits">
                  <li className="plan-card__benefit">✔ Todo lo de Premium</li>
                  <li className="plan-card__benefit">✔ Almacenamiento ilimitado</li>
                  <li className="plan-card__benefit">✔ Consultor dedicado</li>
                  <li className="plan-card__benefit">✔ SLA garantizado</li>
                </ul>
              </div>
              <div className="plan-card__footer">
                <a href="#" className="btn btn--start plan-card__cta">Comprar ahora</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PreciosPage;