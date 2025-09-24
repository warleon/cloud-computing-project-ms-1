import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

// Interfaz para errores personalizados
export interface CustomError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
  path?: string;
  value?: any;
  keyPattern?: any;
  keyValue?: any;
}

// Clase para errores de aplicación personalizados
export class AppError extends Error implements CustomError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Manejo de errores de cast de MongoDB (ID inválido)
const handleCastErrorDB = (err: CustomError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

// Manejo de errores de duplicados de MongoDB
const handleDuplicateFieldsDB = (err: CustomError): AppError => {
  const keyValue = err.keyValue || {};
  const duplicateField = Object.keys(keyValue)[0];
  const duplicateValue = duplicateField ? keyValue[duplicateField] : 'unknown';
  
  let message = 'Duplicate field value detected';
  
  // Mensajes específicos para campos comunes
  if (duplicateField === 'email') {
    message = `Email address '${duplicateValue}' is already registered. Please use a different email.`;
  } else if (duplicateField === 'nationalId') {
    message = `National ID '${duplicateValue}' is already registered. Please verify your identity document.`;
  } else if (duplicateField === 'passportNumber') {
    message = `Passport number '${duplicateValue}' is already registered.`;
  } else if (duplicateField) {
    message = `${duplicateField} '${duplicateValue}' already exists. Please use a different value.`;
  }
  
  return new AppError(message, 409);
};

// Manejo de errores de validación de MongoDB
const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map(val => val.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Manejo de errores JWT malformados
const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again!', 401);

// Manejo de errores JWT expirados
const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired! Please log in again.', 401);

// Envío de error en desarrollo
const sendErrorDev = (err: CustomError, res: Response): void => {
  res.status(err.statusCode || 500).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack
  });
};

// Envío de error en producción
const sendErrorProd = (err: CustomError, res: Response): void => {
  // Errores operacionales confiables: enviar mensaje al cliente
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      status: err.status,
      message: err.message
    });
  } else {
    // Error de programación: no revelar detalles al cliente
    console.error('ERROR 💥', err);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!'
    });
  }
};

// Middleware principal de manejo de errores
export const globalErrorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Manejo específico de errores de MongoDB
    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    }
    
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }
    
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error as mongoose.Error.ValidationError);
    }
    
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};

// Middleware para capturar rutas no encontradas
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404);
  next(err);
};

// Wrapper para funciones async para capturar errores automáticamente
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

// Middleware para logging de requests
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? '❌' : '✅';
    
    console.log(
      `${statusColor} ${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`
    );
  });
  
  next();
};

// Función para crear respuestas exitosas consistentes
export const sendSuccess = (
  res: Response,
  data: any,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

// Función para crear respuestas paginadas
export const sendPaginatedResponse = (
  res: Response,
  data: any[],
  totalCount: number,
  page: number,
  limit: number,
  message: string = 'Success'
): void => {
  const totalPages = Math.ceil(totalCount / limit);
  
  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1
    },
    timestamp: new Date().toISOString()
  });
};