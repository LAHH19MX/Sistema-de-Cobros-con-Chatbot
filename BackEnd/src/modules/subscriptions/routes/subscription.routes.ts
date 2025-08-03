import { Router } from 'express';
import { 
  createCheckout, 
  getSubscriptionStatus, 
  cancelSubscription, 
  changePlan, 
  getResourceUsage 
} from '../controller/subscription.controller';
import { authRequiered } from '../../../common/middlewares/validate';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { createCheckoutSchema, changePlanSchema } from '../schemas/subscription.schemas';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authRequiered);

// POST /api/subscriptions/checkout - Crear sesión de checkout
router.post('/checkout', validateSchema(createCheckoutSchema), createCheckout);

// GET /api/subscriptions/status - Obtener estado de suscripción
router.get('/status', getSubscriptionStatus);

// GET /api/subscriptions/resources - Obtener uso de recursos
router.get('/resources', getResourceUsage);

// POST /api/subscriptions/change-plan - Cambiar plan
router.post('/change-plan', validateSchema(changePlanSchema), changePlan);

// DELETE /api/subscriptions/cancel - Cancelar suscripción
router.delete('/cancel', cancelSubscription);

export default router;