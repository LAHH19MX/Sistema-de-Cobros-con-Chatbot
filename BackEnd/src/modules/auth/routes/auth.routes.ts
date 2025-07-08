import { Router } from 'express';
import { login, logout, verify } from '../controller/auth.controller';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { loginSchema } from '../schemas/auth.schemas';


const router = Router();

router.post('/login', validateSchema(loginSchema), login);
router.get('/verify', verify);
router.post('/logout', logout);
//register router.pos('/regiter', register)

export default router;
