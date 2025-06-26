// src/modules/site/routes/company.routes.ts
import { Router } from 'express'
import {
  getEmpresa,
  updateEmpresa,
  addRedSocial,
  getAllRedes,
  getRedSocialById,
  updateRedSocial,
  deleteRedSocial
} from '../controller/company.controller'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import { createCompanySchema, createRedSocialSchema } from '../schemas/company.schemas'
import { authRequiered } from '../../../common/middlewares/validate'
import { adminOnly } from '../../../common/middlewares/adminOnly'

const router = Router()

// datos de la empresa
router.get('/empresa/:id', getEmpresa)
router.put(
  '/empresaUpd/:id',
  authRequiered,
  adminOnly,
  validateSchema(createCompanySchema),
  updateEmpresa
)
router.post(
  '/redesCre/:empresaId',
  authRequiered,
  adminOnly,
  validateSchema(createRedSocialSchema),
  addRedSocial
)

// para redes
router.get('/redes', getAllRedes)
router.get('/redes/:id', getRedSocialById)

router.put(
  '/redesUpd/:id',
  authRequiered,
  adminOnly,
  validateSchema(createRedSocialSchema),
  updateRedSocial
)

router.delete('/redesDel/:id', 
  authRequiered, adminOnly, 
  deleteRedSocial)

export default router