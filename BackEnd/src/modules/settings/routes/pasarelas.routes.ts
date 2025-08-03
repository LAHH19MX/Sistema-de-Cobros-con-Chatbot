import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import {
  getPasarelas,
  upsertPasarela,
  updateEstadoPasarela
} from '../controller/pasarelas.controller'
import { upsertPasarelaSchema, updateEstadoSchema } from '../schemas/pasarelas.schemas'

const router = Router()

router.get('/pasarelas', authRequiered, inquilinoOnly, getPasarelas)
router.post('/pasarelas', authRequiered, inquilinoOnly, validateSchema(upsertPasarelaSchema), upsertPasarela)
router.put('/pasarelas/:tipo/estado', authRequiered, inquilinoOnly, validateSchema(updateEstadoSchema), updateEstadoPasarela)

export default router