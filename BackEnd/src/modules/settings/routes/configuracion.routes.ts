import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import { getConfiguracion, updateConfiguracion } from '../controller/configuracion.controller'
import { updateConfiguracionSchema } from '../schemas/configuracion.schemas'

const router = Router()

router.get('/configuracion', authRequiered, inquilinoOnly, getConfiguracion)
router.put('/configuracion', authRequiered, inquilinoOnly, validateSchema(updateConfiguracionSchema), updateConfiguracion)

export default router