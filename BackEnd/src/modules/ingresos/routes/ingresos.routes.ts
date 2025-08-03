import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { 
  getIngresosGrafica, 
  getPagosCompletados,
  generarReporteIngresos 
} from '../controller/ingresos.controller'

const router = Router()

router.get('/ingresos/grafica', authRequiered, inquilinoOnly, getIngresosGrafica)
router.get('/ingresos/pagos', authRequiered, inquilinoOnly, getPagosCompletados)
router.get('/ingresos/reporte', authRequiered, inquilinoOnly, generarReporteIngresos)

export default router