import { Router } from 'express';
import {
  getApartado,
  createApartado,
  updateApartado,
  deleteApartado,
  getAllCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getAllApartados
} from '../controller/dataThemes.controller';
import { validateSchema } from '../../../common/middlewares/validateSchema';
import {
  createApartadoSchema,
  createCategoriaSchema
} from '../schemas/dataThemes.schemas';
import { authRequiered } from '../../../common/middlewares/validate';
import { adminOnly } from '../../../common/middlewares/adminOnly';

const router = Router();

// Apartado
router.get('/apartado/:id', getApartado);
router.get('/apartados', getAllApartados);
router.post(
    '/apartadoCre',
    authRequiered,
    adminOnly,
    validateSchema(createApartadoSchema),
    createApartado
);
router.put(
    '/apartadoUpd/:id',
    authRequiered,
    adminOnly,
    validateSchema(createApartadoSchema),
    updateApartado
);
router.delete('/apartadoDel/:id', 
    authRequiered, 
    adminOnly,
    deleteApartado
);

// Categoría
router.get('/categorias/:apartadoId', getAllCategorias);
router.get('/categoria/:id', getCategoriaById);
router.post(
    '/categoriaCre/:apartadoId',
    authRequiered,
    adminOnly,
    validateSchema(createCategoriaSchema),
    createCategoria
);
router.put(
    '/categoriaUpd/:id',
    authRequiered,
    adminOnly,
    validateSchema(createCategoriaSchema),
    updateCategoria
);
router.delete('/categoriaDel/:id', 
    authRequiered, 
    adminOnly, 
    deleteCategoria);

export default router;
