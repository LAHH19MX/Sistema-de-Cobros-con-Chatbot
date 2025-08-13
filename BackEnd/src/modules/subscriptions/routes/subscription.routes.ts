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

router.post('/checkout', validateSchema(createCheckoutSchema), createCheckout);
router.get('/status', getSubscriptionStatus);
router.get('/resources', getResourceUsage);
router.post('/change-plan', validateSchema(changePlanSchema), changePlan);
router.post('/cancel', cancelSubscription);

export default router;