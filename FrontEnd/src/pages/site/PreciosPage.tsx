import '../../styles/site/PreciosPage.css'
import { usePlans } from '../../context/PlansContext';
import { useEffect } from 'react';
import type { Plan } from '../../api/plans';

const PreciosPage = () => {
  const { plans, loading, error, loadPlans } = usePlans();

  useEffect(() => {
    loadPlans();
  }, []);

  if (loading) return <div className="text-center py-5">Cargando planes...</div>;
  if (error) return <div className="text-center py-5 text-danger">Error: {error}</div>;

  // Función para formatear el precio
  const formatPrice = (price: string) => {
    const numericPrice = parseFloat(price);
    return numericPrice.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    });
  };

  // Función para obtener los beneficios del plan
  const getPlanBenefits = (plan: Plan) => {
    const baseBenefits = [
      `${plan.whatsapp_incluidos} WhatsApp incluidos`,
      `${plan.emails_incluidos} Emails incluidos`,
      plan.acceso_api ? 'Acceso a API' : 'Sin acceso a API'
    ];

    if (plan.max_clientes) {
      baseBenefits.push(`Máx. ${plan.max_clientes} clientes`);
    } else {
      baseBenefits.push('Clientes ilimitados');
    }

    return baseBenefits;
  };

  return (
    <section className="section--plans">
      <div className="container">
        <h2 className="section__title">Elige tu Plan Ideal</h2>
        <p className="section__subtitle">Encuentra el plan perfecto para hacer crecer tu negocio</p>
        
        <div className="section--plans__grid">
          {plans.map((plan) => (
            <div key={plan.id_plan} className="plan-card">
              <div className="plan-card__header">
                <h3 className="plan-card__name">{plan.nombre_plan}</h3>
                <p className="plan-card__tag">
                  {plan.nombre_plan.includes('Básico') && 'Perfecto para empezar'}
                  {plan.nombre_plan.includes('Pro') && 'Para crecer rápido'}
                  {plan.nombre_plan.includes('Premium') && 'Máxima potencia'}
                  {plan.nombre_plan.includes('Élite') && 'Todo sin límites'}
                </p>
              </div>
              
              <div className="plan-card__body">
                <div className="plan-card__price">
                  <span className="plan-card__currency">$</span>
                  {formatPrice(plan.precio_plan).replace(/[$,]/g, '').split('.')[0]}
                  <span className="plan-card__decimals">/mes</span>
                </div>
                
                <ul className="plan-card__benefits">
                  {getPlanBenefits(plan).map((benefit, index) => (
                    <li key={index} className="plan-card__benefit">
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="plan-card__footer">
                <button 
                  className="plan-card__cta"
                  onClick={() => {
                    // Aquí puedes agregar la lógica para seleccionar el plan
                    console.log('Plan seleccionado:', plan.nombre_plan);
                  }}
                >
                  Comprar ahora
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PreciosPage;