import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { getStats, getUltimosEnlaces } from '../controller/dashboard.controller'

const router = Router()

router.get('/stats',authRequiered,inquilinoOnly, getStats)
router.get('/ultimos-enlaces',authRequiered,inquilinoOnly, getUltimosEnlaces)

export default router