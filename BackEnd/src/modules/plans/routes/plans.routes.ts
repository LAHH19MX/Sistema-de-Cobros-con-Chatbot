import { Router } from 'express';
import {
  getAllPlans,
  getPlanById,
  createPlan,
  updatePlan,
  deletePlan
} from '../controller/plans.controller';
import { authRequiered } from '../../../common/middlewares/validate';
import { adminOnly } from '../../../common/middlewares/adminOnly';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { CreatePlanSchema, UpdatePlanSchema } from '../schemas/plans.schemas';

const router = Router();

router.get('/allplans/', getAllPlans);
router.get('/planbyid/:id', authRequiered, adminOnly, getPlanById);
router.post(
  '/',
  authRequiered,
  adminOnly,
  validateSchema(CreatePlanSchema),
  createPlan
);
router.put(
  '/utdplan/:id',
  authRequiered,
  adminOnly,
  validateSchema(UpdatePlanSchema), 
  updatePlan
);
router.delete('/delplan/:id', authRequiered, adminOnly, deletePlan);

export default router;