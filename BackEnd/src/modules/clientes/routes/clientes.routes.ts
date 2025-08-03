import { Router } from 'express'
import { authRequiered } from '../../../common/middlewares/validate'
import { inquilinoOnly } from '../../../common/middlewares/inquilinoOnly'
import { validateSchema } from '../../../common/middlewares/validateSchema'
import { 
  getClientes, 
  getClienteById, 
  createCliente, 
  updateCliente, 
  deleteCliente 
} from '../controller/clientes.controller'
import { createClienteSchema, updateClienteSchema } from '../schemas/clientes.schemas'

const router = Router()

// Todas las rutas requieren autenticación y ser inquilino
router.get('/clientes', authRequiered, inquilinoOnly, getClientes)
router.get('/clientes/:id', authRequiered, inquilinoOnly, getClienteById)
router.post('/clientes', authRequiered, inquilinoOnly, validateSchema(createClienteSchema), createCliente)
router.put('/clientes/:id', authRequiered, inquilinoOnly, validateSchema(updateClienteSchema), updateCliente)
router.delete('/clientes/:id', authRequiered, inquilinoOnly, deleteCliente)

export default router