import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import { getPerfil, updatePerfil, changePassword } from '../controller/perfil.controller'
import { updatePerfilSchema, changePasswordSchema } from '../schemas/perfil.schemas'

const router = Router()

router.get('/perfil', authRequiered, inquilinoOnly, getPerfil)
router.put('/perfil', authRequiered, inquilinoOnly, validateSchema(updatePerfilSchema), updatePerfil)
router.put('/perfil/password', authRequiered, inquilinoOnly, validateSchema(changePasswordSchema), changePassword)

export default router