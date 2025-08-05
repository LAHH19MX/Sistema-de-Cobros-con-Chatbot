import { Router } from 'express';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import {
  solicitarRecuperacionSchema,
  validarCodigoSchema,
  reenviarCodigoSchema,
  restablecerPasswordSchema
} from '../schemas/recuperacion.schema';
import {
  solicitarRecuperacion,
  validarCodigo,
  reenviarCodigo,
  restablecerPassword
} from '../controller/recuperacion.controller';

const router = Router();

router.post('/solicitar-recuperacion', validateSchema(solicitarRecuperacionSchema), solicitarRecuperacion);
router.post('/validar-codigo', validateSchema(validarCodigoSchema), validarCodigo);
router.post('/reenviar-codigo', validateSchema(reenviarCodigoSchema), reenviarCodigo);
router.post('/restablecer-password', validateSchema(restablecerPasswordSchema), restablecerPassword);

export default router;