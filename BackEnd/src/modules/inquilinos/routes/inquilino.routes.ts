import { Router } from 'express';
import {
  getAllInquilinosWithPlans,
  getInquilinoByIdWithPlan,
  updateInquilino,
  getPlanStatistics
} from '../controller/inquilino.controller';
import { authRequiered } from '../../../common/middlewares/validate';
import { adminOnly } from '../../../common/middlewares/adminOnly';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { updateInquilinoSchema } from '../schemas/inquilino.schemas';

const router = Router();

router.get('/tenantplans', authRequiered, adminOnly, getAllInquilinosWithPlans);
router.get('/stats/plans', authRequiered, adminOnly, getPlanStatistics);
router.get('/tenantplan/:id', authRequiered, adminOnly, getInquilinoByIdWithPlan);
router.put('/utdtenant/:id',authRequiered,adminOnly,validateSchema(updateInquilinoSchema),updateInquilino);

export default router;
