import Joi from 'joi';

// Validador para la dirección
const addressSchema = Joi.object({
  street: Joi.string().trim().min(5).max(200).required()
    .messages({
      'string.empty': 'Street address is required',
      'string.min': 'Street address must be at least 5 characters',
      'string.max': 'Street address must not exceed 200 characters'
    }),
  city: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'City is required',
      'string.min': 'City must be at least 2 characters',
      'string.max': 'City must not exceed 100 characters'
    }),
  state: Joi.string().trim().min(2).max(100).required()
    .messages({
      'string.empty': 'State is required',
      'string.min': 'State must be at least 2 characters',
      'string.max': 'State must not exceed 100 characters'
    }),
  postalCode: Joi.string().trim().min(3).max(20).required()
    .messages({
      'string.empty': 'Postal code is required',
      'string.min': 'Postal code must be at least 3 characters',
      'string.max': 'Postal code must not exceed 20 characters'
    }),
  country: Joi.string().trim().min(2).max(100).optional().default('Colombia')
});

// Validador para preferencias de notificación
const notificationPreferencesSchema = Joi.object({
  email: Joi.boolean().default(true),
  sms: Joi.boolean().default(true),
  push: Joi.boolean().default(true)
});

// Validador para preferencias del cliente
const customerPreferencesSchema = Joi.object({
  language: Joi.string().valid('es', 'en').default('es'),
  currency: Joi.string().valid('COP', 'USD', 'EUR').default('COP'),
  notificationPreferences: notificationPreferencesSchema.default({}),
  marketingConsent: Joi.boolean().default(false)
});

// Validador para documentos KYC
const kycDocumentSchema = Joi.object({
  type: Joi.string().valid('national_id', 'passport', 'driving_license', 'address_proof', 'income_proof', 'other').required(),
  filename: Joi.string().trim().min(1).max(255).required(),
  uploadDate: Joi.date().default(Date.now),
  verified: Joi.boolean().default(false),
  verifiedBy: Joi.string().trim().optional(),
  verifiedAt: Joi.date().optional()
});

// Validador para crear un nuevo cliente
export const createCustomerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters',
      'string.max': 'First name must not exceed 50 characters'
    }),
  lastName: Joi.string().trim().min(2).max(50).required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters',
      'string.max': 'Last name must not exceed 50 characters'
    }),
  email: Joi.string().email().lowercase().trim().required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email is required'
    }),
  phone: Joi.string().trim().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number (10-15 digits)',
      'string.empty': 'Phone number is required'
    }),
  dateOfBirth: Joi.date().max('now').required()
    .custom((value, helpers) => {
      const today = new Date();
      let age = today.getFullYear() - value.getFullYear();
      const monthDiff = today.getMonth() - value.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < value.getDate())) {
        age--;
      }
      
      if (age < 18) {
        return helpers.error('any.invalid');
      }
      if (age > 120) {
        return helpers.error('any.invalid');
      }
      
      return value;
    })
    .messages({
      'date.max': 'Date of birth cannot be in the future',
      'any.invalid': 'Customer must be between 18 and 120 years old',
      'any.required': 'Date of birth is required'
    }),
  nationalId: Joi.string().trim().min(8).max(20).required()
    .messages({
      'string.empty': 'National ID is required',
      'string.min': 'National ID must be at least 8 characters',
      'string.max': 'National ID must not exceed 20 characters'
    }),
  passportNumber: Joi.string().trim().min(6).max(15).optional()
    .messages({
      'string.min': 'Passport number must be at least 6 characters',
      'string.max': 'Passport number must not exceed 15 characters'
    }),
  address: addressSchema.required(),
  documents: Joi.array().items(kycDocumentSchema).optional().default([]),
  preferences: customerPreferencesSchema.optional().default({})
});

// Validador para actualizar un cliente
export const updateCustomerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  email: Joi.string().email().lowercase().trim().optional(),
  phone: Joi.string().trim().pattern(/^\+?[\d\s\-\(\)]{10,15}$/).optional(),
  address: addressSchema.optional(),
  preferences: customerPreferencesSchema.optional(),
  passportNumber: Joi.string().trim().min(6).max(15).optional().allow(null, ''),
  // Campos que NO se pueden actualizar directamente por seguridad
  nationalId: Joi.forbidden().messages({
    'any.unknown': 'National ID cannot be updated directly'
  }),
  dateOfBirth: Joi.forbidden().messages({
    'any.unknown': 'Date of birth cannot be updated directly'
  }),
  documents: Joi.forbidden().messages({
    'any.unknown': 'Documents must be updated through dedicated endpoints'
  }),
  emailVerified: Joi.forbidden(),
  phoneVerified: Joi.forbidden(),
  identityVerified: Joi.forbidden(),
  complianceStatus: Joi.forbidden(),
  status: Joi.forbidden()
}).min(1).messages({
  'object.min': 'At least one field must be provided for update'
});

// Validador para parámetros de ID
export const customerIdSchema = Joi.object({
  id: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required()
    .messages({
      'string.pattern.base': 'Invalid customer ID format',
      'any.required': 'Customer ID is required'
    })
});

// Validador para agregar documentos KYC
export const addKycDocumentSchema = Joi.object({
  type: Joi.string().valid('national_id', 'passport', 'driving_license', 'address_proof', 'income_proof', 'other').required(),
  filename: Joi.string().trim().min(1).max(255).required()
});

// Validador para consulta de búsqueda
export const searchCustomerSchema = Joi.object({
  q: Joi.string().trim().min(3).max(100).optional()
    .messages({
      'string.min': 'Search query must be at least 3 characters',
      'string.max': 'Search query must not exceed 100 characters'
    }),
  status: Joi.string().valid('active', 'inactive', 'suspended', 'pending_verification').optional(),
  complianceStatus: Joi.string().valid('pending', 'approved', 'rejected', 'under_review').optional(),
  country: Joi.string().trim().min(2).max(100).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10)
});

// Función helper para validar requests
export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    req.validatedBody = value;
    next();
  };
};

// Función helper para validar parámetros
export const validateParams = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      convert: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors
      });
    }

    req.validatedParams = value;
    next();
  };
};

// Función helper para validar query parameters
export const validateQuery = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      convert: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors
      });
    }

    req.validatedQuery = value;
    next();
  };
};