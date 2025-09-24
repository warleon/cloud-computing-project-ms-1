// API Client for Customer Service
class CustomerAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api';
        this.headers = {
            'Content-Type': 'application/json',
        };
    }

    // Generic API call method
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        try {
            const response = await fetch(url, {
                ...options,
                headers: { ...this.headers, ...options.headers },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return { success: true, data, status: response.status };
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            return { 
                success: false, 
                error: error.message || 'Network error occurred',
                status: error.status || 500 
            };
        }
    }

    // System Health Check
    async getHealthStatus() {
        return await this.makeRequest('/health');
    }

    // Service Information
    async getServiceInfo() {
        return await this.makeRequest('/info');
    }

    // Customer Operations
    async getCustomers(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const endpoint = `/customers${queryString ? `?${queryString}` : ''}`;
        return await this.makeRequest(endpoint);
    }

    async getCustomer(id) {
        return await this.makeRequest(`/customers/${id}`);
    }

    async createCustomer(customerData) {
        return await this.makeRequest('/customers', {
            method: 'POST',
            body: JSON.stringify(customerData),
        });
    }

    async updateCustomer(id, updateData) {
        return await this.makeRequest(`/customers/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
    }

    async deleteCustomer(id) {
        return await this.makeRequest(`/customers/${id}`, {
            method: 'DELETE',
        });
    }

    async getCustomerAccounts(id) {
        return await this.makeRequest(`/customers/${id}/accounts`);
    }

    // Statistics and Analytics
    async getCustomerStats() {
        const result = await this.getCustomers();
        if (!result.success) {
            return { 
                totalCustomers: 0, 
                activeCustomers: 0, 
                compliancePending: 0, 
                linkedAccounts: 0 
            };
        }

        const customers = result.data.data || [];
        
        return {
            totalCustomers: customers.length,
            activeCustomers: customers.filter(c => c.complianceStatus?.status === 'approved').length,
            compliancePending: customers.filter(c => c.complianceStatus?.status === 'pending').length,
            linkedAccounts: customers.reduce((total, c) => total + (c.accountIds?.length || 0), 0)
        };
    }
}