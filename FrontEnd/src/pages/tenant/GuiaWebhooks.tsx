import '../../styles/tenant/GuiaWebhooks.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStripe, faPaypal } from '@fortawesome/free-brands-svg-icons';
import { faCopy, faCheckCircle, faBook, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const GuiaWebhooks = () => {
  const { inquilinoId } = useParams<{ inquilinoId: string }>();
  const navigate = useNavigate();
  const [copiedStripe, setCopiedStripe] = useState(false);
  const [copiedPaypal, setCopiedPaypal] = useState(false);
  const [activeTab, setActiveTab] = useState<'stripe' | 'paypal'>('stripe');

  if (!inquilinoId) {
    return <div className="guia-error">Error: ID de inquilino no proporcionado</div>;
  }

  const baseUrl = 'https://6206d7d0bef2.ngrok-free.app';          
  const stripeWebhookUrl = `${baseUrl}/api/webhooks/stripe/${inquilinoId}`;
  const paypalWebhookUrl = `${baseUrl}/api/webhooks/paypal/${inquilinoId}`;

  const copyToClipboard = (text: string, type: 'stripe' | 'paypal') => {
    navigator.clipboard.writeText(text);
    if (type === 'stripe') {
      setCopiedStripe(true);
      setTimeout(() => setCopiedStripe(false), 2000);
    } else {
      setCopiedPaypal(true);
      setTimeout(() => setCopiedPaypal(false), 2000);
    }
  };

  const handleContinue = () => {
    navigate(-1); // Volver a la página anterior
  };

  return (
    <div className="guia">
      {/* Encabezado */}
      <div className="guia__page-header">
        <h1 className="guia__page-title">
          <FontAwesomeIcon icon={faBook} className="guia__title-icon" />
          Guía de Configuración de Webhooks
        </h1>
        <p className="guia__page-subtitle">
          Configura los webhooks para integrar tus pasarelas de pago correctamente
        </p>
      </div>

      {/* Tabs con fondo blanco */}
      <div className="guia__tabs-container">
        <div className="guia__tabs">
          <button 
            className={`guia__tab ${activeTab === 'stripe' ? 'guia__tab--active' : ''}`}
            onClick={() => setActiveTab('stripe')}
          >
            <FontAwesomeIcon icon={faStripe} className="guia__tab-icon" />
            Stripe
          </button>
          <button 
            className={`guia__tab ${activeTab === 'paypal' ? 'guia__tab--active' : ''}`}
            onClick={() => setActiveTab('paypal')}
          >
            <FontAwesomeIcon icon={faPaypal} className="guia__tab-icon" />
            PayPal
          </button>
        </div>
      </div>

      <div className="guia__main-section">
        {activeTab === 'stripe' && (
          <div className="guia__config-section">
            <h3 className="guia__section-title">
              <FontAwesomeIcon icon={faStripe} className="guia__section-icon" />
              Configuración de Stripe
            </h3>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">1</span> 
                Obtener API Key
              </h4>
              <ol className="guia__step-list">
                <li>Ingresa a <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer">dashboard.stripe.com</a></li>
                <li>Ve a <strong>Developers → API Keys</strong></li>
                <li>Copia tu <strong>Secret key</strong> (sk_test_... o sk_live_...)</li>
                <li>Pégala en el campo "API Key" de la configuración</li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">2</span> 
                Configurar Webhook
              </h4>
              <ol className="guia__step-list">
                <li>En Stripe Dashboard, ve a <strong>Developers → Webhooks</strong></li>
                <li>Click en <strong>"Add endpoint"</strong></li>
                <li>En "Endpoint URL" pega esta URL:
                  <div className="guia__copy-group">
                    <input 
                      type="text" 
                      className="guia__copy-input" 
                      value={stripeWebhookUrl}
                      readOnly
                    />
                    <button 
                      className={`guia__copy-btn ${copiedStripe ? 'guia__copy-btn--copied' : ''}`}
                      onClick={() => copyToClipboard(stripeWebhookUrl, 'stripe')}
                    >
                      <FontAwesomeIcon icon={copiedStripe ? faCheckCircle : faCopy} className="guia__copy-icon" />
                      {copiedStripe ? ' Copiado!' : ' Copiar'}
                    </button>
                  </div>
                </li>
                <li>En "Events to send" selecciona:
                  <ul className="guia__event-list">
                    <li><code>checkout.session.completed</code></li>
                    <li><code>payment_link.updated</code></li>
                  </ul>
                </li>
                <li>Click en <strong>"Add endpoint"</strong></li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">3</span> 
                Obtener Webhook Secret
              </h4>
              <ol className="guia__step-list">
                <li>Después de crear el endpoint, verás "Signing secret"</li>
                <li>Click en <strong>"Reveal"</strong></li>
                <li>Copia el secret (whsec_...)</li>
                <li>Pégalo en el campo "Webhook Secret" de la configuración</li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">4</span> 
                ¡Listo!
              </h4>
              <p>
                Guarda los cambios y Stripe estará configurado.
              </p>
            </div>

            <div className="guia__step-actions">
              <button className="guia__btn guia__btn--primary" onClick={handleContinue}>
                Continuar
                <FontAwesomeIcon icon={faArrowRight} className="guia__btn-icon" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'paypal' && (
          <div className="guia__config-section">
            <h3 className="guia__section-title">
              <FontAwesomeIcon icon={faPaypal} className="guia__section-icon" />
              Configuración de PayPal
            </h3>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">1</span> 
                Obtener Credenciales
              </h4>
              <ol className="guia__step-list">
                <li>Ingresa a <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer">developer.paypal.com</a></li>
                <li>Ve a <strong>My Apps & Credentials</strong></li>
                <li>Selecciona <strong>Sandbox</strong> (o Live para producción)</li>
                <li>Crea una app o selecciona una existente</li>
                <li>Copia:
                  <ul className="guia__event-list">
                    <li><strong>Client ID</strong> → Campo "Client ID"</li>
                    <li><strong>Secret</strong> → Campo "Secret"</li>
                  </ul>
                </li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">2</span> 
                Configurar Webhook
              </h4>
              <ol className="guia__step-list">
                <li>En tu app de PayPal, ve a <strong>Webhooks</strong></li>
                <li>Click en <strong>"Add Webhook"</strong></li>
                <li>En "Webhook URL" pega:
                  <div className="guia__copy-group">
                    <input 
                      type="text" 
                      className="guia__copy-input" 
                      value={paypalWebhookUrl}
                      readOnly
                    />
                    <button 
                      className={`guia__copy-btn ${copiedPaypal ? 'guia__copy-btn--copied' : ''}`}
                      onClick={() => copyToClipboard(paypalWebhookUrl, 'paypal')}
                    >
                      <FontAwesomeIcon icon={copiedPaypal ? faCheckCircle : faCopy} className="guia__copy-icon" />
                      {copiedPaypal ? ' Copiado!' : ' Copiar'}
                    </button>
                  </div>
                </li>
                <li>En "Event types" selecciona:
                  <ul className="guia__event-list">
                    <li><code>Payment capture completed</code></li>
                  </ul>
                </li>
                <li>Click en <strong>"Save"</strong></li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">3</span> 
                Obtener Webhook ID
              </h4>
              <ol className="guia__step-list">
                <li>Después de crear el webhook, verás el ID (WH-...)</li>
                <li>Cópialo y pégalo en el campo "Webhook ID"</li>
              </ol>
            </div>

            <div className="guia__step">
              <h4 className="guia__step-title">
                <span className="guia__step-number">4</span> 
                ¡Listo!
              </h4>
              <p>
                Guarda los cambios y PayPal estará configurado.
              </p>
            </div>

            <div className="guia__step-actions">
              <button className="guia__btn guia__btn--primary" onClick={handleContinue}>
                Continuar
                <FontAwesomeIcon icon={faArrowRight} className="guia__btn-icon" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuiaWebhooks;