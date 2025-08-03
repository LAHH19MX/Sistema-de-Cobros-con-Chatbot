import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import { 
  getWidgetsDeudas,
  getDeudas,
  getDeudaById,
  createDeuda,
  updateDeuda,
  generarReporteDeudas
} from '../controller/deudas.controller'
import { createDeudaSchema, updateDeudaSchema } from '../schemas/deudas.schemas'

const router = Router()

router.get('/deudas/widgets', authRequiered, inquilinoOnly, getWidgetsDeudas)

// Rutas CRUD
router.get('/deudas', authRequiered, inquilinoOnly, getDeudas)
router.get('/deudas/:id', authRequiered, inquilinoOnly, getDeudaById)
router.post('/deudas', authRequiered, inquilinoOnly, validateSchema(createDeudaSchema), createDeuda)
router.put('/deudas/:id', authRequiered, inquilinoOnly, validateSchema(updateDeudaSchema), updateDeuda)
//Reporte de deudas(Pendientes y Cobrados)
router.get('/deudas/reporte', authRequiered, inquilinoOnly, generarReporteDeudas)

export default router