import type { Request, Response, NextFunction } from 'express';
import { Customer } from '../models/Customer.js';
import type { ICustomer } from '../models/Customer.js';
import { AppError, catchAsync, sendSuccess, sendPaginatedResponse } from '../middleware/errorHandler.js';
import ExternalServicesClient from '../services/externalServices.js';
import type { ComplianceCheckRequest } from '../services/externalServices.js';
import mongoose from 'mongoose';

// Extender interfaces de Express para incluir campos validados
declare global {
  namespace Express {
    interface Request {
      validatedBody?: any;
      validatedParams?: any;
      validatedQuery?: any;
    }
  }
}

class CustomerController {
  private externalServices: ExternalServicesClient;

  constructor() {
    this.externalServices = ExternalServicesClient.getInstance();
  }

  /**
   * Crear un nuevo cliente
   * POST /customers
   */
  public createCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const customerData = req.validatedBody;

    // Verificar unicidad de email y nationalId
    const existingCustomer = await Customer.findOne({
      $or: [
        { email: customerData.email },
        { nationalId: customerData.nationalId }
      ]
    });

    if (existingCustomer) {
      if (existingCustomer.email === customerData.email) {
        return next(new AppError('Email address is already registered', 409));
      }
      if (existingCustomer.nationalId === customerData.nationalId) {
        return next(new AppError('National ID is already registered', 409));
      }
    }

    // Crear el cliente
    const newCustomer = new Customer(customerData);
    await newCustomer.save();

    // Trigger de compliance check de forma asíncrona
    this.triggerComplianceCheckAsync(newCustomer);

    // Respuesta exitosa
    sendSuccess(res, newCustomer.toObject(), 'Customer created successfully', 201);
  });

  /**
   * Obtener un cliente por ID
   * GET /customers/:id
   */
  public getCustomerById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.validatedParams;

    const customer = await Customer.findById(id);
    
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    sendSuccess(res, customer.toObject(), 'Customer retrieved successfully');
  });

  /**
   * Obtener cliente por número de identificación nacional
   * GET /customers/by-national-id/:nationalId
   */
  public getCustomerByNationalId = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { nationalId } = req.params;

    if (!nationalId) {
      return next(new AppError('National ID is required', 400));
    }

    const customer = await Customer.findOne({ nationalId });
    
    if (!customer) {
      return next(new AppError('Customer not found with this National ID', 404));
    }

    sendSuccess(res, customer.toObject(), 'Customer retrieved successfully');
  });

  /**
   * Actualizar información de un cliente
   * PUT /customers/:id
   */
  public updateCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.validatedParams;
    const updateData = req.validatedBody;

    // Si se está actualizando el email, verificar unicidad
    if (updateData.email) {
      const existingCustomer = await Customer.findOne({
        email: updateData.email,
        _id: { $ne: id }
      });

      if (existingCustomer) {
        return next(new AppError('Email address is already in use by another customer', 409));
      }
    }

    const customer = await Customer.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    sendSuccess(res, customer.toObject(), 'Customer updated successfully');
  });

  /**
   * Obtener cuentas de un cliente (consultando MS2)
   * GET /customers/:id/accounts
   */
  public getCustomerAccounts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.validatedParams;

    // Verificar que el cliente existe
    const customer = await Customer.findById(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    try {
      // Consultar cuentas en MS2
      const accounts = await this.externalServices.getCustomerAccounts(id);
      
      const responseData = {
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email
        },
        accounts
      };

      sendSuccess(res, responseData, `Retrieved ${accounts.length} accounts for customer`);
    } catch (error) {
      // El error ya viene formateado desde externalServices
      return next(new AppError((error as Error).message, 503));
    }
  });

  /**
   * Buscar clientes con filtros y paginación
   * GET /customers
   */
  public searchCustomers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { q, status, complianceStatus, country, page, limit } = req.validatedQuery;

    // Construir filtro de búsqueda
    const filter: any = {};

    if (q) {
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
        { nationalId: { $regex: q, $options: 'i' } }
      ];
    }

    if (status) {
      filter.status = status;
    }

    if (complianceStatus) {
      filter.complianceStatus = complianceStatus;
    }

    if (country) {
      filter['address.country'] = { $regex: country, $options: 'i' };
    }

    // Contar total de documentos
    const totalCount = await Customer.countDocuments(filter);

    // Obtener documentos paginados
    const skip = (page - 1) * limit;
    const customers = await Customer.find(filter)
      .select('-documents -__v') // Excluir campos sensibles/innecesarios
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const safeCustomers = customers.map(customer => customer.toObject());

    sendPaginatedResponse(
      res,
      safeCustomers,
      totalCount,
      page,
      limit,
      `Retrieved ${customers.length} customers`
    );
  });

  /**
   * Agregar documento KYC a un cliente
   * POST /customers/:id/documents
   */
  public addKycDocument = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.validatedParams;
    const documentData = req.validatedBody;

    const customer = await Customer.findById(id);
    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    // Agregar el documento
    customer.documents.push({
      type: documentData.type,
      filename: documentData.filename,
      uploadDate: new Date(),
      verified: false
    });

    await customer.save();

    // Si es un documento de identidad, podríamos triggear una nueva verificación
    if (['national_id', 'passport', 'driving_license'].includes(documentData.type)) {
      this.triggerComplianceCheckAsync(customer);
    }

    sendSuccess(res, customer.toObject(), 'Document added successfully');
  });

  /**
   * Obtener estadísticas de salud del servicio
   * GET /health
   */
  public getHealthStatus = catchAsync(async (req: Request, res: Response) => {
    const dbStatus = mongoose.connection.readyState === 1;
    const servicesHealth = await this.externalServices.getServicesHealth();

    const healthData = {
      status: dbStatus && servicesHealth.overall ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        ms2_accounts: servicesHealth.ms2,
        ms4_compliance: servicesHealth.ms4
      },
      version: '1.0.0',
      uptime: process.uptime()
    };

    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthData);
  });

  /**
   * Trigger compliance check de forma asíncrona
   * No bloquea la respuesta al cliente
   */
  private async triggerComplianceCheckAsync(customer: ICustomer): Promise<void> {
    try {
      const complianceRequest: ComplianceCheckRequest = {
        customerId: customer.id,
        customerData: {
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          nationalId: customer.nationalId,
          dateOfBirth: customer.dateOfBirth.toISOString(),
          address: {
            country: customer.address.country,
            state: customer.address.state,
            city: customer.address.city
          }
        },
        documents: customer.documents.map(doc => ({
          type: doc.type,
          filename: doc.filename
        }))
      };

      // Ejecutar de forma asíncrona sin esperar
      setImmediate(async () => {
        try {
          const complianceResult = await this.externalServices.triggerComplianceCheck(complianceRequest);
          
          if (complianceResult) {
            // Actualizar estado de compliance en la base de datos
            await Customer.findByIdAndUpdate(customer._id, {
              complianceStatus: complianceResult.status,
              complianceNotes: complianceResult.notes,
              complianceCheckedAt: new Date(complianceResult.checkedAt)
            });

            console.log(`✅ Compliance check completed for customer ${customer._id}: ${complianceResult.status}`);
          } else {
            console.warn(`⚠️ Compliance check failed for customer ${customer._id}, will be retried later`);
          }
        } catch (error) {
          console.error(`❌ Error in async compliance check for customer ${customer._id}:`, error);
        }
      });

    } catch (error) {
      console.error('❌ Error setting up compliance check:', error);
    }
  }

  /**
   * Eliminar cliente (soft delete)
   * DELETE /customers/:id
   */
  public deleteCustomer = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.validatedParams;

    const customer = await Customer.findByIdAndUpdate(
      id,
      { status: 'inactive' },
      { new: true }
    );

    if (!customer) {
      return next(new AppError('Customer not found', 404));
    }

    sendSuccess(res, null, 'Customer deactivated successfully');
  });
}

export default CustomerController;