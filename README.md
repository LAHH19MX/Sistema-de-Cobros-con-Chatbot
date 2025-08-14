Sistema de Cobros con Chatbot Estilo YUPIO

Un sistema SaaS completo para la gestión de cobros y deudas que incluye un chatbot inteligente integrado con WhatsApp para atender automáticamente a los deudores.

CARACTERISTICAS PRINCIPALES

- **Sistema SaaS Multi-tenant**: Cada cliente tiene su propio espacio aislado
- **Chatbot Inteligente**: Integrado con WhatsApp usando Dialogflow para consultas automáticas
- **Gestión Completa de Deudas**: Control de clientes y deudas con reportes detallados
- **Enlaces de Pago Inteligentes**: Generación automática via PayPal y Stripe con tracking
- **Dashboard de Ingresos**: Monitoreo de movimientos y análisis financiero
- **Reportes Avanzados**: Generación de reportes de deudas, clientes morosos e ingresos
- **Gestión de Suscripciones**: Administración de planes con control de recursos (WhatsApp, Email, límites)
- **Notificaciones Automatizadas**: Sistema de recordatorios y emails con SendGrid


---- TECNOLOGIAS UTILIZADAS

BEACKEND
- **Node.js** v22.13.0
- **Express.js** - Framework web
- **TypeScript** - Tipado estático
- **Prisma** - ORM para base de datos
- **PostgreSQL** - Base de datos principal

FRONTEND
- **React** v19.1.0 - Biblioteca de UI
- **TypeScript** - Tipado estático
- **React Router** - Enrutamiento
- **Vite** - Bundler y herramientas de desarrollo

INTEGRACIONES
- **Twilio** - API de WhatsApp
- **Dialogflow** - Procesamiento de lenguaje natural para el chatbot
- **Stripe** - Procesamiento de pagos y suscripciones
- **PayPal** - Procesamiento de pagos alternativos
- **SendGrid** - Envío de emails transaccionales

ESTRUCTURA DEL PROYECTO
```
Sistema-de-Cobros-con-Chatbot/
├── README.md
├── backend/
│   ├── src/
│   │   ├── modules/          # Módulos organizados (auth, clientes, deudas, ingresos, etc.)
│   │   │   ├── auth/         # Autenticación (controllers, routes, schemas)
│   │   │   ├── clientes/     # Gestión de clientes
│   │   │   ├── deudas/       # Gestión de deudas
│   │   │   ├── ingresos/     # Control de ingresos
│   │   │   ├── payment-links/ # Enlaces de pago
│   │   │   └── Los demas modulos...
│   │   ├── services/         # Servicios (recordatorios, intents, pagos)
│   │   ├── common/           # Middlewares y configuraciones
│   │   └── utils/            # Utilidades y helpers
│   ├── prisma/
│   │   └── schema.prisma     # Esquema de base de datos
│   ├── credenciales/
│   │   └── dialogflow.json   # Credenciales de Google Dialogflow
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/              # Endpoints y llamadas API
│   │   ├── components/       # Componentes reutilizables
│   │   ├── config/           # Configuraciones del frontend
│   │   ├── context/          # Context providers
│   │   ├── pages/            # Páginas de la aplicación
│   │   ├── styles/           # Estilos globales y CSS
│   │   ├── types/            # Definiciones de TypeScript
│   │   └── utils/            # Utilidades del frontend
│   └── package.json
```

---- INSTALACION Y CONFIGURACIONES ----

PREREQUISITOS
- Node.js v22.13.0 o superior
- PostgreSQL
- Cuenta en Twilio (para WhatsApp)
- Cuenta en Google Cloud (para Dialogflow)
- Cuentas en Stripe y PayPal
- Cuenta en SendGrid

CLONAR REPOSITORIO
```bash
git clone https://github.com/LAHH19MX/Sistema-de-Cobros-con-Chatbot
cd Sistema-de-Cobros-con-Chatbot
```

---- VARIABLES DE ENTORNO DEL BACKEND ----
Crear archivo `.env` en la carpeta `backend/`:
```env
# Base de datos
DATABASE_URL="postgresql://usuario:password@localhost:5432/cobros_db"

# Twilio (WhatsApp)
TWILIO_SID=your_twilio_sid
TWILIO_TOKEN=your_twilio_token

# Google Dialogflow
GOOGLE_CREDENCIALES=./credenciales/dialogflow.json
GOOGLE_ID=your_google_project_id

# SendGrid
SENDGRID_KEY=your_sendgrid_api_key

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Frontend URL
FRONTEND_URL=URL_APUNTANDO_AL_FRONTEND
```

---- CONFIGURAR BASE DE DATOS ----
```bash
# Sincronizar esquema con la base de datos
npx prisma db pull

# Generar el cliente de Prisma
npx prisma generate
```

VARIABLES DE ENTORNO DEL FRONTEND
Crear archivo `.env` en la carpeta `frontend/`:
```env
VITE_API_URL=URL_APUNTANDO_AL_BACKEND
```

---- BASE DE DATOS ----

El proyecto utiliza PostgreSQL como base de datos principal con Prisma como ORM. La base de datos está desplegada en Railway para facilitar el desarrollo.

COMANDOS UTILES DE PRISMA
```bash
# Ver la base de datos en el navegador
npx prisma studio

# Sincronizar cambios del esquema
npx prisma db pull

# Generar cliente actualizado
npx prisma generate
```

---- CHABOT Y INTEGRACIONES ----

FLUJO DEL CHATBOT
1. El usuario envía un mensaje por WhatsApp
2. Twilio recibe el mensaje y lo envía a Dialogflow
3. Dialogflow procesa el mensaje usando NLP
4. El fulfillment webhook apunta al backend para obtener datos
5. Se envía la respuesta personalizada al usuario

WEBHOOKS CONFIGURADOS
- Stripe: Para manejar eventos de suscripciones
- PayPal: Para confirmación de pagos
- Dialogflow: Para el procesamiento del chatbot
- Webhooks personalizados: Para cada inquilino del sistema


---- ARQUITECTURA DEL SISTEMA ----

AUTENTICACION
- Sistema JWT para autenticación de usuarios
- Middleware de verificación en rutas protegidas
- Roles diferenciados de usuario

API DE ENDPOINTS PRINCIPALES
/api/login         # Autenticación 
/api/register      # Registro
/api/clientes      # Gestión de clientes
/api/deudas        # Gestión de deudas y reportes
/api/ingresos      # Dashboard y análisis de ingresos
/api/payment-links # Enlaces de pago y tracking
/api/subscriptions # Administración de suscripciones
/api/webhooks      # Webhooks de integraciones

BASE DE DATOS
- PostgreSQL desplegada en Railway
- Configurar `DATABASE_URL` con la URL de producción

VARIABLES DE ENTORNO DE PRODUCCION
Asegúrate de configurar todas las variables de entorno en tu plataforma de deployment:
- Cambiar URLs de desarrollo por URLs de producción
- Usar claves de API de producción (no de test)
- Configurar CORS apropiadamente

NOTAS IMPORTANTES
- **Seguridad**: Nunca commitear archivos `.env` al repositorio
- **Claves de API**: Usar claves de test para desarrollo y producción para deploy
- **Webhooks**: Cada inquilino tiene webhooks personalizados con sus propias credenciales
- **Dialogflow**: Requiere credenciales JSON de Google Cloud Platform
