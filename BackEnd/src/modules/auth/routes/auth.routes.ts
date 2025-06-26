import { Router } from 'express';
import { login, logout } from '../controller/auth.controller';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import { loginSchema } from '../schemas/auth.schemas';

const router = Router();

router.post('/login', validateSchema(loginSchema), login);
router.post('/logout', logout);

export default router;
