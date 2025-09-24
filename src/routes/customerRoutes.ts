import { Router } from 'express';
import CustomerController from '../controllers/CustomerController.js';
import {
  validateRequest,
  validateParams,
  validateQuery,
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  addKycDocumentSchema,
  searchCustomerSchema
} from '../validators/customerValidator.js';

const router = Router();
const customerController = new CustomerController();

/**
 * @route   GET /api/customers/health
 * @desc    Obtener estado de salud del servicio
 * @access  Public
 */
router.get('/health', customerController.getHealthStatus);

/**
 * @route   GET /api/customers
 * @desc    Buscar clientes con filtros y paginación
 * @access  Private
 */
router.get('/', 
  validateQuery(searchCustomerSchema),
  customerController.searchCustomers
);

/**
 * @route   POST /api/customers
 * @desc    Crear un nuevo cliente
 * @access  Private
 */
router.post('/', 
  validateRequest(createCustomerSchema),
  customerController.createCustomer
);

/**
 * @route   GET /api/customers/by-national-id/:nationalId
 * @desc    Obtener cliente por número de identificación nacional
 * @access  Private
 */
router.get('/by-national-id/:nationalId', 
  customerController.getCustomerByNationalId
);

/**
 * @route   GET /api/customers/:id
 * @desc    Obtener detalles de un cliente por ID
 * @access  Private
 */
router.get('/:id', 
  validateParams(customerIdSchema),
  customerController.getCustomerById
);

/**
 * @route   PUT /api/customers/:id
 * @desc    Actualizar información de un cliente
 * @access  Private
 */
router.put('/:id', 
  validateParams(customerIdSchema),
  validateRequest(updateCustomerSchema),
  customerController.updateCustomer
);

/**
 * @route   DELETE /api/customers/:id
 * @desc    Eliminar/desactivar un cliente
 * @access  Private
 */
router.delete('/:id', 
  validateParams(customerIdSchema),
  customerController.deleteCustomer
);

/**
 * @route   GET /api/customers/:id/accounts
 * @desc    Obtener cuentas de un cliente (consulta MS2)
 * @access  Private
 */
router.get('/:id/accounts', 
  validateParams(customerIdSchema),
  customerController.getCustomerAccounts
);

/**
 * @route   POST /api/customers/:id/documents
 * @desc    Agregar documento KYC a un cliente
 * @access  Private
 */
router.post('/:id/documents', 
  validateParams(customerIdSchema),
  validateRequest(addKycDocumentSchema),
  customerController.addKycDocument
);

export default router;