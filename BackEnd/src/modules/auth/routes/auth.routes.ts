import { Router } from 'express';
import { login, logout, verify, register } from '../controller/auth.controller';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { loginSchema } from '../schemas/auth.schemas';


const router = Router();

router.post('/login', validateSchema(loginSchema), login);
router.get('/verify', verify);
router.post('/logout', logout);
router.post('/register', register);

export default router;
