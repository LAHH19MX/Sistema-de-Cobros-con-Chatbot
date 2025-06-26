import { Router } from 'express';
import {
  getSeccion,
  getAllSecciones,
  createSeccion,
  updateSeccion,
  deleteSeccion,
  getAllContenidos,
  getContenidoById,
  createContenido,
  updateContenido,
  deleteContenido
} from '../controller/dataContent.controller';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import {
  createSeccionSchema,
  createContenidoSchema
} from '../schemas/dataContent.schemas';
import { authRequiered } from '../../../common/middlewares/validate';
import { adminOnly } from '../../../common/middlewares/adminOnly';

const router = Router();

// Sección
router.get('/seccion/:id', getSeccion);
router.get('/secciones/:categoriaId', getAllSecciones);
router.post(
    '/seccionCre/:categoriaId',
    authRequiered,
    adminOnly,
    validateSchema(createSeccionSchema),
    createSeccion
);
router.put(
    '/seccionUpd/:id',
    authRequiered,
    adminOnly,
    validateSchema(createSeccionSchema),
    updateSeccion
);
router.delete('/seccionDel/:id', 
    authRequiered, 
    adminOnly, 
    deleteSeccion
);

// Contenido
router.get('/contenidos/:seccionId', getAllContenidos);
router.get('/contenido/:id', getContenidoById);
router.post(
    '/contenidoCre/:seccionId',
    authRequiered,
    adminOnly,
    validateSchema(createContenidoSchema),
    createContenido
);
router.put(
    '/contenidoUpd/:id',
    authRequiered,
    adminOnly,
    validateSchema(createContenidoSchema),
    updateContenido
);
router.delete('/contenidoDel/:id', 
    authRequiered, 
    adminOnly, 
    deleteContenido
);

export default router;
