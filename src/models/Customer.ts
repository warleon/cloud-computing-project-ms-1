import mongoose, { Document, Schema, Model } from 'mongoose';

// Interface para los documentos KYC
interface KYCDocument {
  type: 'national_id' | 'passport' | 'driving_license' | 'address_proof' | 'income_proof' | 'other';
  filename: string;
  uploadDate: Date;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
}

// Interface para la dirección
interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

// Interface para preferencias del cliente
interface CustomerPreferences {
  language: string;
  currency: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  marketingConsent: boolean;
}

// Interface principal del Customer
export interface ICustomer extends Document {
  // Información personal básica
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  
  // Identificación
  nationalId: string;
  passportNumber?: string;
  
  // Dirección
  address: Address;
  
  // Documentos KYC
  documents: KYCDocument[];
  
  // Estados de verificación
  emailVerified: boolean;
  phoneVerified: boolean;
  identityVerified: boolean;
  
  // Preferencias
  preferences: CustomerPreferences;
  
  // Metadatos
  registrationDate: Date;
  lastLoginDate?: Date;
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification';
  
  // Información de compliance
  complianceStatus: 'pending' | 'approved' | 'rejected' | 'under_review';
  complianceNotes?: string;
  complianceCheckedAt?: Date;
  
  // Timestamps automáticos
  createdAt: Date;
  updatedAt: Date;
  
  // Métodos de instancia
  toSafeObject(): any;
}

// Interface para métodos estáticos
interface ICustomerModel extends Model<ICustomer> {
  findByIdentifier(identifier: string): Promise<ICustomer | null>;
}

// Schema para documentos KYC
const kycDocumentSchema = new Schema<KYCDocument>({
  type: {
    type: String,
    enum: ['national_id', 'passport', 'driving_license', 'address_proof', 'income_proof', 'other'],
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  verified: {
    type: Boolean,
    default: false
  },
  verifiedBy: String,
  verifiedAt: Date
});

// Schema para dirección
const addressSchema = new Schema<Address>({
  street: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  state: {
    type: String,
    required: true,
    trim: true
  },
  postalCode: {
    type: String,
    required: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    trim: true,
    default: 'Colombia'
  }
});

// Schema para preferencias
const customerPreferencesSchema = new Schema<CustomerPreferences>({
  language: {
    type: String,
    default: 'es',
    enum: ['es', 'en']
  },
  currency: {
    type: String,
    default: 'COP',
    enum: ['COP', 'USD', 'EUR']
  },
  notificationPreferences: {
    email: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    }
  },
  marketingConsent: {
    type: Boolean,
    default: false
  }
});

// Schema principal del Customer
const customerSchema = new Schema<ICustomer>({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [/^\+?[\d\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    required: true,
    validate: {
      validator: function(value: Date) {
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 18 && age <= 120;
      },
      message: 'Customer must be at least 18 years old'
    }
  },
  nationalId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 8,
    maxlength: 20
  },
  passportNumber: {
    type: String,
    trim: true,
    sparse: true, // Permite múltiples documentos con null
    minlength: 6,
    maxlength: 15
  },
  address: {
    type: addressSchema,
    required: true
  },
  documents: [kycDocumentSchema],
  emailVerified: {
    type: Boolean,
    default: false
  },
  phoneVerified: {
    type: Boolean,
    default: false
  },
  identityVerified: {
    type: Boolean,
    default: false
  },
  preferences: {
    type: customerPreferencesSchema,
    default: () => ({})
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  lastLoginDate: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending_verification'],
    default: 'pending_verification'
  },
  complianceStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'under_review'],
    default: 'pending'
  },
  complianceNotes: String,
  complianceCheckedAt: Date
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

// Índices para optimización de consultas
customerSchema.index({ phone: 1 });
customerSchema.index({ status: 1 });
customerSchema.index({ complianceStatus: 1 });
customerSchema.index({ 'address.country': 1 });

// Middleware pre-save para validaciones adicionales
customerSchema.pre('save', function(next) {
  // Validar que al menos haya un documento de identidad válido
  if (this.isNew && (!this.nationalId && !this.passportNumber)) {
    return next(new Error('At least one identity document is required'));
  }
  next();
});

// Métodos del schema
customerSchema.methods.toSafeObject = function() {
  const obj = this.toObject();
  // Remover información sensible si es necesario
  return obj;
};

// Método estático para buscar por email o nationalId
customerSchema.statics.findByIdentifier = function(identifier: string) {
  return this.findOne({
    $or: [
      { email: identifier },
      { nationalId: identifier }
    ]
  });
};

export const Customer = mongoose.model<ICustomer, ICustomerModel>('Customer', customerSchema);