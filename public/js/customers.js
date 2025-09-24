// Customer Management Module
class CustomerManager {
    constructor(api, ui) {
        this.api = api;
        this.ui = ui;
        this.currentPage = 1;
        this.pageSize = 10;
        this.currentFilters = {};
        this.customers = [];
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('customer-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                this.ui.debounce((e) => this.handleSearch(e.target.value), 500)
            );
        }

        // Filter functionality
        const complianceFilter = document.getElementById('compliance-filter');
        if (complianceFilter) {
            complianceFilter.addEventListener('change', (e) => this.handleFilter(e.target.value));
        }

        // Pagination
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        if (prevButton) prevButton.addEventListener('click', () => this.previousPage());
        if (nextButton) nextButton.addEventListener('click', () => this.nextPage());

        // Modal events
        const modal = document.getElementById('customer-modal');
        const closeModal = modal?.querySelector('.close-modal');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.closeCustomerModal());
        }

        // Form submission
        const form = document.getElementById('customer-form');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Close modal on background click
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeCustomerModal();
                }
            });
        }
    }

    // Load and display customers
    async loadCustomers(page = 1) {
        this.ui.clearTable('customers-table');
        
        const params = {
            page,
            limit: this.pageSize,
            ...this.currentFilters
        };

        const result = await this.api.getCustomers(params);
        
        if (result.success) {
            this.customers = result.data.data || [];
            this.renderCustomersTable();
            this.updatePaginationInfo(result.data);
        } else {
            this.ui.showToast('Error al cargar clientes: ' + result.error, 'error');
            this.renderEmptyTable();
        }
    }

    renderCustomersTable() {
        const tbody = document.getElementById('customers-tbody');
        if (!tbody) return;

        if (this.customers.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #6b7280;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>No se encontraron clientes
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.customers.map(customer => this.createCustomerRow(customer)).join('');
    }

    createCustomerRow(customer) {
        const complianceStatus = customer.complianceStatus?.status || 'pending';
        const accountCount = customer.accountIds?.length || 0;
        const registrationDate = this.ui.formatDate(customer.createdAt);

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #1e40af, #3b82f6); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                            ${customer.personalInfo?.name?.charAt(0).toUpperCase() || 'C'}
                        </div>
                        <div>
                            <div style="font-weight: 600; color: #1f2937;">
                                ${customer.personalInfo?.name || 'Sin nombre'}
                            </div>
                            <div style="font-size: 0.75rem; color: #6b7280;">
                                ID: ${customer._id?.slice(-8) || 'N/A'}
                            </div>
                        </div>
                    </div>
                </td>
                <td>
                    <div style="color: #374151;">${customer.email}</div>
                </td>
                <td>
                    <div style="color: #374151;">${this.ui.formatPhone(customer.phone)}</div>
                </td>
                <td>
                    ${this.ui.createStatusBadge(complianceStatus)}
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 0.25rem;">
                        <i class="fas fa-credit-card" style="color: #f59e0b;"></i>
                        <span style="font-weight: 600; color: #374151;">${accountCount}</span>
                    </div>
                </td>
                <td>
                    <div style="color: #6b7280; font-size: 0.875rem;">${registrationDate}</div>
                </td>
                <td>
                    <div style="display: flex; gap: 0.25rem;">
                        ${this.ui.createActionButtons(customer._id, customer.nationalId)}
                    </div>
                </td>
            </tr>
        `;
    }

    renderEmptyTable() {
        const tbody = document.getElementById('customers-tbody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem; color: #ef4444;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
                        <br>Error al cargar los datos
                    </td>
                </tr>
            `;
        }
    }

    updatePaginationInfo(data) {
        const totalPages = Math.ceil((data.total || 0) / this.pageSize);
        this.ui.updatePagination(this.currentPage, totalPages, data.total);
    }

    // Search functionality
    handleSearch(query) {
        this.currentFilters.search = query.trim();
        this.currentPage = 1;
        this.loadCustomers(this.currentPage);
    }

    // Filter functionality
    handleFilter(complianceStatus) {
        if (complianceStatus) {
            this.currentFilters.complianceStatus = complianceStatus;
        } else {
            delete this.currentFilters.complianceStatus;
        }
        this.currentPage = 1;
        this.loadCustomers(this.currentPage);
    }

    // Pagination
    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadCustomers(this.currentPage);
        }
    }

    nextPage() {
        // This will be validated against total pages in the UI
        this.currentPage++;
        this.loadCustomers(this.currentPage);
    }

    // Modal management
    showNewCustomerForm() {
        this.ui.resetForm('customer-form');
        this.ui.showModal('customer-modal');
    }

    closeCustomerModal() {
        this.ui.hideModal('customer-modal');
    }

    // Form handling
    async handleFormSubmit(event) {
        event.preventDefault();
        
        const formData = this.ui.getFormData('customer-form');
        
        // Validate required fields
        if (!this.validateCustomerData(formData)) {
            return;
        }

        // Transform form data to API format
        const customerData = this.transformFormData(formData);
        
        this.ui.showLoading('Creando cliente...');
        
        const result = await this.api.createCustomer(customerData);
        
        this.ui.hideLoading();
        
        if (result.success) {
            this.ui.showToast('Cliente creado exitosamente', 'success');
            this.closeCustomerModal();
            this.loadCustomers(1); // Refresh the list
            this.updateStats(); // Update dashboard stats
        } else {
            this.ui.showToast('Error al crear cliente: ' + result.error, 'error');
        }
    }

    validateCustomerData(formData) {
        const errors = [];

        if (!formData.name?.trim()) {
            errors.push('El nombre es obligatorio');
        }

        if (!formData.email?.trim()) {
            errors.push('El email es obligatorio');
        } else if (!this.ui.validateEmail(formData.email)) {
            errors.push('El formato del email no es válido');
        }

        if (!formData.phone?.trim()) {
            errors.push('El teléfono es obligatorio');
        } else if (!this.ui.validatePhone(formData.phone)) {
            errors.push('El formato del teléfono no es válido');
        }

        if (errors.length > 0) {
            this.ui.showToast('Errores de validación:\n' + errors.join('\n'), 'error');
            return false;
        }

        return true;
    }

    transformFormData(formData) {
        return {
            email: formData.email.trim(),
            phone: formData.phone.trim(),
            personalInfo: {
                name: formData.name.trim(),
                dateOfBirth: formData.dateOfBirth || null,
                address: formData.address?.trim() || null
            },
            preferences: {
                notifications: {
                    email: formData.emailNotifications === 'on',
                    sms: formData.smsNotifications === 'on'
                },
                marketing: {
                    communications: formData.marketingCommunications === 'on'
                }
            }
        };
    }

    // Customer actions
    async viewCustomer(customerId) {
        this.ui.showLoading('Cargando detalles del cliente...');
        
        const result = await this.api.getCustomer(customerId);
        
        this.ui.hideLoading();
        
        if (result.success) {
            this.showCustomerDetails(result.data);
        } else {
            this.ui.showToast('Error al cargar detalles: ' + result.error, 'error');
        }
    }

    showCustomerDetails(customer) {
        // Create a detailed view modal or navigate to detail page
        const detailsHtml = this.createCustomerDetailsHTML(customer);
        
        // For now, show in a simple alert (you can enhance this with a proper modal)
        const details = `
            Cliente: ${customer.personalInfo?.name || 'Sin nombre'}
            Email: ${customer.email}
            Teléfono: ${customer.phone}
            Estado Compliance: ${customer.complianceStatus?.status || 'pending'}
            Fecha de registro: ${this.ui.formatDate(customer.createdAt)}
        `;
        
        alert(details);
    }

    async editCustomer(customerId) {
        // Load customer data and populate the form for editing
        this.ui.showToast('Funcionalidad de edición próximamente disponible', 'info');
    }

    async confirmDeleteCustomer(customerId) {
        if (confirm('¿Está seguro de que desea eliminar este cliente? Esta acción no se puede deshacer.')) {
            await this.deleteCustomer(customerId);
        }
    }

    async deleteCustomer(customerId) {
        this.ui.showLoading('Eliminando cliente...');
        
        const result = await this.api.deleteCustomer(customerId);
        
        this.ui.hideLoading();
        
        if (result.success) {
            this.ui.showToast('Cliente eliminado exitosamente', 'success');
            this.loadCustomers(this.currentPage);
            this.updateStats();
        } else {
            this.ui.showToast('Error al eliminar cliente: ' + result.error, 'error');
        }
    }

    // Update dashboard statistics
    async updateStats() {
        const stats = await this.api.getCustomerStats();
        
        document.getElementById('total-customers').textContent = stats.totalCustomers;
        document.getElementById('active-customers').textContent = stats.activeCustomers;
        document.getElementById('compliance-pending').textContent = stats.compliancePending;
        document.getElementById('linked-accounts').textContent = stats.linkedAccounts;
    }
}

// Global functions for button event handlers
window.viewCustomer = (customerId) => {
    if (window.customerManager) {
        window.customerManager.viewCustomer(customerId);
    }
};

window.editCustomer = (customerId) => {
    if (window.customerManager) {
        window.customerManager.editCustomer(customerId);
    }
};

window.confirmDeleteCustomer = (customerId) => {
    if (window.customerManager) {
        window.customerManager.confirmDeleteCustomer(customerId);
    }
};

window.showNewCustomerForm = () => {
    if (window.customerManager) {
        window.customerManager.showNewCustomerForm();
    }
};

window.closeCustomerModal = () => {
    if (window.customerManager) {
        window.customerManager.closeCustomerModal();
    }
};