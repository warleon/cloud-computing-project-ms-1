import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Interfaces para las respuestas de los microservicios
export interface AccountResponse {
  id: string;
  customerId: string;
  accountNumber: string;
  accountType: string;
  balance: number;
  currency: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceCheckRequest {
  customerId: string;
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    nationalId: string;
    dateOfBirth: string;
    address: {
      country: string;
      state: string;
      city: string;
    };
  };
  documents: Array<{
    type: string;
    filename: string;
  }>;
}

export interface ComplianceCheckResponse {
  customerId: string;
  status: 'approved' | 'rejected' | 'under_review' | 'pending';
  riskScore: number;
  notes?: string;
  checkedAt: string;
}

class ExternalServicesClient {
  private static instance: ExternalServicesClient;
  private ms2BaseUrl: string;
  private ms4BaseUrl: string;
  private timeoutMs: number = 5000;

  private constructor() {
    this.ms2BaseUrl = process.env.MS2_ACCOUNTS_URL || 'http://localhost:3001';
    this.ms4BaseUrl = process.env.MS4_COMPLIANCE_URL || 'http://localhost:3003';
  }

  public static getInstance(): ExternalServicesClient {
    if (!ExternalServicesClient.instance) {
      ExternalServicesClient.instance = new ExternalServicesClient();
    }
    return ExternalServicesClient.instance;
  }

  /**
   * Obtiene todas las cuentas de un cliente desde MS2
   */
  public async getCustomerAccounts(customerId: string): Promise<AccountResponse[]> {
    try {
      const response = await axios.get(`${this.ms2BaseUrl}/api/accounts/customer/${customerId}`, {
        timeout: this.timeoutMs,
        headers: {
          'Content-Type': 'application/json',
          'Service-Name': 'ms1-customer-service'
        }
      });

      if (response.data && response.data.success) {
        return response.data.data || [];
      }

      console.warn(`MS2 returned unexpected response format:`, response.data);
      return [];

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error(`❌ Cannot connect to MS2 at ${this.ms2BaseUrl}`);
          throw new Error('Account service is currently unavailable. Please try again later.');
        }
        
        if (error.response?.status === 404) {
          console.log(`ℹ️ No accounts found for customer ${customerId} in MS2`);
          return [];
        }

        if (error.response?.status === 500) {
          console.error(`❌ MS2 internal server error:`, error.response.data);
          throw new Error('Account service error. Please try again later.');
        }

        console.error(`❌ MS2 API error (${error.response?.status}):`, error.message);
        throw new Error(`Account service error: ${error.response?.data?.message || error.message}`);
      }

      console.error('❌ Unexpected error calling MS2:', error);
      throw new Error('Failed to retrieve customer accounts. Please try again later.');
    }
  }

  /**
   * Envía datos del cliente a MS4 para verificación de compliance
   */
  public async triggerComplianceCheck(request: ComplianceCheckRequest): Promise<ComplianceCheckResponse | null> {
    try {
      const response = await axios.post(`${this.ms4BaseUrl}/api/compliance/check`, request, {
        timeout: this.timeoutMs * 2, // Compliance checks pueden tomar más tiempo
        headers: {
          'Content-Type': 'application/json',
          'Service-Name': 'ms1-customer-service'
        }
      });

      if (response.data && response.data.success) {
        return response.data.data;
      }

      console.warn(`MS4 returned unexpected response format:`, response.data);
      return null;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error(`❌ Cannot connect to MS4 at ${this.ms4BaseUrl}`);
          // No lanzamos error para compliance check, ya que es asíncrono
          console.warn('⚠️ Compliance check will be retried later');
          return null;
        }

        if (error.response?.status === 400) {
          console.error(`❌ MS4 validation error:`, error.response.data);
          throw new Error(`Compliance validation error: ${error.response.data?.message || 'Invalid data'}`);
        }

        if (error.response && error.response.status >= 500) {
          console.error(`❌ MS4 server error (${error.response.status}):`, error.response.data);
          // No lanzamos error, solo loggeamos
          console.warn('⚠️ Compliance check will be retried later');
          return null;
        }

        console.error(`❌ MS4 API error (${error.response?.status}):`, error.message);
        console.warn('⚠️ Compliance check will be retried later');
        return null;
      }

      console.error('❌ Unexpected error calling MS4:', error);
      console.warn('⚠️ Compliance check will be retried later');
      return null;
    }
  }

  /**
   * Verifica el estado de salud de MS2
   */
  public async checkMS2Health(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ms2BaseUrl}/health`, {
        timeout: 2000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Verifica el estado de salud de MS4
   */
  public async checkMS4Health(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.ms4BaseUrl}/health`, {
        timeout: 2000
      });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el estado de salud de todos los servicios externos
   */
  public async getServicesHealth(): Promise<{
    ms2: boolean;
    ms4: boolean;
    overall: boolean;
  }> {
    const [ms2Health, ms4Health] = await Promise.allSettled([
      this.checkMS2Health(),
      this.checkMS4Health()
    ]);

    const ms2Status = ms2Health.status === 'fulfilled' ? ms2Health.value : false;
    const ms4Status = ms4Health.status === 'fulfilled' ? ms4Health.value : false;

    return {
      ms2: ms2Status,
      ms4: ms4Status,
      overall: ms2Status && ms4Status
    };
  }

  /**
   * Configuración de timeout personalizado
   */
  public setTimeout(timeoutMs: number): void {
    this.timeoutMs = timeoutMs;
  }

  /**
   * Configuración de URLs de servicios (útil para testing)
   */
  public setServiceUrls(ms2Url?: string, ms4Url?: string): void {
    if (ms2Url) this.ms2BaseUrl = ms2Url;
    if (ms4Url) this.ms4BaseUrl = ms4Url;
  }
}

export default ExternalServicesClient;