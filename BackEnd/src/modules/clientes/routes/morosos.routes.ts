import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { getMorosos, getMorosoById, enviarNotificacionMoroso,
    generarReporteMorosos
} from '../controller/morosos.controller'

const router = Router()

router.get('/morosos', authRequiered, inquilinoOnly, getMorosos)
router.get('/morosos/:id', authRequiered, inquilinoOnly, getMorosoById)
router.post('/morosos/:id/notificar', authRequiered, inquilinoOnly, enviarNotificacionMoroso)
router.get('/morosos/reporte', authRequiered, inquilinoOnly, generarReporteMorosos)
export default router