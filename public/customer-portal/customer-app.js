// Customer Portal Application
class CustomerApp {
    constructor() {
        this.api = new CustomerAPI();
        this.currentView = 'dashboard';
        this.customerData = null;
        this.accounts = [];
        this.transactions = [];
        
        // Don't initialize immediately - wait for DOM to be ready
        // this.init();
    }
    
    async init() {
        try {
            console.log('CustomerApp init starting...');
            
            // Get nationalId from URL parameter or localStorage
            const urlParams = new URLSearchParams(window.location.search);
            const nationalId = urlParams.get('nationalId') || localStorage.getItem('customerNationalId') || '1234567890';
            
            console.log('NationalId to load:', nationalId);
            
            // Load customer data from API
            await this.loadCustomerData(nationalId);
            
            // Initialize app
            await this.loadInitialData();
            this.setupEventListeners();
            this.setupNavigation();
            
            // Show initial view
            this.showView('dashboard');
            
            UIComponents.showToast(`¡Bienvenido ${this.customerData.firstName}!`, 'success');
        } catch (error) {
            console.error('Error initializing app:', error);
            // Fallback to demo data
            this.customerData = {
                id: '12345',
                firstName: 'Juan',
                lastName: 'Pérez',
                email: 'juan.perez@example.com',
                phone: '+34 123 456 789',
                address: 'Calle Ejemplo 123, Madrid',
                customerNumber: 'CLI001234',
                nationalId: '0000000000'
            };
            UIComponents.showToast('Usando datos de demostración', 'warning');
        }
    }
    
    async loadCustomerData(nationalId) {
        try {
            // Store nationalId for future use
            localStorage.setItem('customerNationalId', nationalId);
            
            console.log('Loading customer data for nationalId:', nationalId);
            
            // Call API to get customer by nationalId
            const response = await fetch(`http://localhost:3000/api/customers/by-national-id/${nationalId}`);
            
            console.log('API Response status:', response.status);
            
            if (response.ok) {
                const apiResponse = await response.json();
                console.log('API Response data:', apiResponse);
                
                // Handle both possible response formats
                let customerData = null;
                
                if (apiResponse.success && apiResponse.data) {
                    // Format: { success: true, data: { customer } } or { success: true, data: [{ customer }] }
                    customerData = Array.isArray(apiResponse.data) ? apiResponse.data[0] : apiResponse.data;
                } else if (apiResponse.firstName) {
                    // Direct customer object format
                    customerData = apiResponse;
                }
                
                if (!customerData) {
                    throw new Error(`No customer data found for nationalId: ${nationalId}`);
                }
                
                console.log('Customer data extracted:', customerData);
                
                this.customerData = {
                    id: customerData._id || customerData.id,
                    firstName: customerData.firstName,
                    lastName: customerData.lastName,
                    email: customerData.email,
                    phone: customerData.phone,
                    dateOfBirth: customerData.dateOfBirth,
                    nationalId: customerData.nationalId,
                    address: customerData.address ? 
                        `${customerData.address.street}, ${customerData.address.city}, ${customerData.address.state}` : 
                        'Dirección no disponible',
                    customerNumber: customerData.customerNumber || `CLI${nationalId.slice(-6)}`
                };
                
                console.log('Processed customer data:', this.customerData);
                
                // Update UI with real data
                this.updateUIWithCustomerData();
            } else {
                throw new Error(`Customer not found: ${nationalId}`);
            }
        } catch (error) {
            console.error('Error loading customer data:', error);
            throw error;
        }
    }
    
    updateUIWithCustomerData() {
        console.log('updateUIWithCustomerData called with:', this.customerData);
        
        // Update welcome name
        const welcomeNameEl = document.getElementById('welcome-name');
        console.log('welcome-name element found:', welcomeNameEl);
        console.log('firstName to set:', this.customerData?.firstName);
        
        if (welcomeNameEl) {
            welcomeNameEl.textContent = this.customerData.firstName;
            console.log('welcome name updated to:', welcomeNameEl.textContent);
        } else {
            console.error('welcome-name element not found!');
        }
        
        // Update user name in header
        const userNameEl = document.getElementById('user-name');
        if (userNameEl) {
            userNameEl.textContent = `${this.customerData.firstName} ${this.customerData.lastName}`;
        }
        
        // Update user avatar with initials
        const userAvatarEl = document.getElementById('user-avatar');
        if (userAvatarEl) {
            const initials = `${this.customerData.firstName.charAt(0)}${this.customerData.lastName.charAt(0)}`;
            userAvatarEl.textContent = initials.toUpperCase();
        }
        
        // Update customer info section (we'll add this)
        this.updateCustomerInfoSection();
    }
    
    updateCustomerInfoSection() {
        // Create or update customer info section
        let infoSection = document.getElementById('customer-info-section');
        if (!infoSection) {
            // Find the welcome section to insert after it
            const welcomeSection = document.querySelector('#dashboard-view .mb-8');
            if (welcomeSection) {
                infoSection = document.createElement('div');
                infoSection.id = 'customer-info-section';
                infoSection.className = 'mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4';
                welcomeSection.parentNode.insertBefore(infoSection, welcomeSection.nextSibling);
            }
        }
        
        if (infoSection) {
            infoSection.innerHTML = `
                <div class="flex items-center space-x-4">
                    <div class="flex-shrink-0">
                        <i class="fas fa-user-circle text-blue-600 text-2xl"></i>
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-blue-900">Información del Cliente</h4>
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-envelope mr-2"></i>${this.customerData.email}
                        </p>
                        <p class="text-sm text-blue-700">
                            <i class="fas fa-phone mr-2"></i>${this.customerData.phone}
                        </p>
                        <p class="text-xs text-blue-600 mt-1">
                            <i class="fas fa-id-card mr-1"></i>ID: ${this.customerData.nationalId}
                        </p>
                    </div>
                </div>
            `;
        }
    }
    
    async loadInitialData() {
        try {
            UIComponents.showLoading('Cargando información del cliente...');
            
            // Use mock data for demo
            this.accounts = this.api.generateMockAccounts();
            this.transactions = this.api.generateMockTransactions();
            
            UIComponents.hideLoading();
            
        } catch (error) {
            UIComponents.hideLoading();
            console.error('Error loading initial data:', error);
            UIComponents.showToast('Error al cargar los datos iniciales', 'error');
        }
    }
    
    setupEventListeners() {
        // Logout button
        document.getElementById('logoutBtn')?.addEventListener('click', () => {
            this.handleLogout();
        });
        
        // Profile form submission
        document.getElementById('profileForm')?.addEventListener('submit', (e) => {
            this.handleProfileUpdate(e);
        });
        
        // Navigation menu items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = item.dataset.view;
                if (view) {
                    this.showView(view);
                }
            });
        });
        
        // Quick action buttons
        document.getElementById('transferBtn')?.addEventListener('click', () => {
            this.showTransferModal();
        });
        
        document.getElementById('paymentBtn')?.addEventListener('click', () => {
            this.showPaymentModal();
        });
        
        document.getElementById('depositBtn')?.addEventListener('click', () => {
            this.showDepositModal();
        });
        
        // Account card clicks
        document.addEventListener('click', (e) => {
            if (e.target.closest('.account-card')) {
                const accountId = e.target.closest('.account-card').dataset.accountId;
                this.showAccountDetails(accountId);
            }
        });
        
        // Transaction filters
        document.getElementById('transactionFilter')?.addEventListener('change', (e) => {
            this.filterTransactions(e.target.value);
        });
        
        // Search functionality
        document.getElementById('searchInput')?.addEventListener('input', 
            Utils.debounce((e) => {
                this.searchTransactions(e.target.value);
            }, 300)
        );
        
        // Mobile menu toggle
        document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
            this.toggleMobileMenu();
        });
        
        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => {
            const mobileMenu = document.getElementById('mobileMenu');
            const menuBtn = document.getElementById('mobileMenuBtn');
            if (mobileMenu && !mobileMenu.contains(e.target) && !menuBtn.contains(e.target)) {
                mobileMenu.classList.add('hidden');
            }
        });
    }
    
    setupNavigation() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            const view = e.state?.view || 'dashboard';
            this.showView(view, false);
        });
        
        // Set initial state
        history.replaceState({ view: 'dashboard' }, '', '#dashboard');
    }
    
    showView(viewName, pushState = true) {
        // Hide all views
        document.querySelectorAll('.view').forEach(view => {
            view.classList.add('hidden');
        });
        
        // Show selected view
        const targetView = document.getElementById(`${viewName}View`);
        if (targetView) {
            targetView.classList.remove('hidden');
        }
        
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        // Update browser history
        if (pushState) {
            history.pushState({ view: viewName }, '', `#${viewName}`);
        }
        
        this.currentView = viewName;
        
        // Load view-specific data
        this.loadViewData(viewName);
    }
    
    async loadViewData(viewName) {
        switch (viewName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'accounts':
                this.renderAccounts();
                break;
            case 'transactions':
                this.renderTransactions();
                break;
            case 'profile':
                this.renderProfile();
                break;
        }
    }
    
    renderDashboard() {
        // Update welcome message
        const welcomeElement = document.getElementById('welcomeMessage');
        if (welcomeElement && this.customerData) {
            welcomeElement.textContent = `¡Hola, ${this.customerData.firstName || 'Usuario'}!`;
        }
        
        // Update balance cards
        this.renderBalanceCards();
        
        // Update recent transactions
        this.renderRecentTransactions();
        
        // Update account summary
        this.renderAccountSummary();
    }
    
    renderBalanceCards() {
        const balanceCardsContainer = document.getElementById('balanceCards');
        if (!balanceCardsContainer) return;
        
        const totalBalance = this.accounts.reduce((sum, account) => {
            return sum + (account.balance || 0);
        }, 0);
        
        const availableBalance = this.accounts
            .filter(account => account.type !== 'credit')
            .reduce((sum, account) => sum + (account.balance || 0), 0);
        
        const creditLimit = this.accounts
            .filter(account => account.type === 'credit')
            .reduce((sum, account) => sum + (account.creditLimit || 0), 0);
        
        balanceCardsContainer.innerHTML = `
            <div class="bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-wallet text-xl"></i>
                    </div>
                    <i class="fas fa-eye text-sm opacity-75"></i>
                </div>
                <div>
                    <p class="text-sm opacity-75 mb-1">Saldo Total</p>
                    <p class="text-3xl font-bold">${Utils.formatCurrency(totalBalance)}</p>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-money-bill-wave text-xl"></i>
                    </div>
                    <i class="fas fa-arrow-up text-sm opacity-75"></i>
                </div>
                <div>
                    <p class="text-sm opacity-75 mb-1">Disponible</p>
                    <p class="text-3xl font-bold">${Utils.formatCurrency(availableBalance)}</p>
                </div>
            </div>
            
            <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i class="fas fa-credit-card text-xl"></i>
                    </div>
                    <i class="fas fa-chart-line text-sm opacity-75"></i>
                </div>
                <div>
                    <p class="text-sm opacity-75 mb-1">Límite Crédito</p>
                    <p class="text-3xl font-bold">${Utils.formatCurrency(creditLimit)}</p>
                </div>
            </div>
        `;
    }
    
    renderRecentTransactions() {
        const transactionsContainer = document.getElementById('recentTransactions');
        if (!transactionsContainer) return;
        
        const recentTransactions = this.transactions.slice(0, 5);
        
        if (recentTransactions.length === 0) {
            transactionsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-receipt text-4xl mb-4 opacity-50"></i>
                    <p>No hay transacciones recientes</p>
                </div>
            `;
            return;
        }
        
        transactionsContainer.innerHTML = recentTransactions.map(transaction => 
            UIComponents.createTransactionItem(transaction)
        ).join('');
    }
    
    renderAccountSummary() {
        const accountSummaryContainer = document.getElementById('accountSummary');
        if (!accountSummaryContainer) return;
        
        accountSummaryContainer.innerHTML = this.accounts.map(account => 
            UIComponents.createAccountCard(account)
        ).join('');
    }
    
    renderAccounts() {
        const accountsContainer = document.getElementById('accountsList');
        if (!accountsContainer) return;
        
        if (this.accounts.length === 0) {
            accountsContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-university text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-600 mb-2">No hay cuentas disponibles</h3>
                    <p class="text-gray-500">Contacta con tu banco para abrir una cuenta</p>
                </div>
            `;
            return;
        }
        
        accountsContainer.innerHTML = this.accounts.map(account => `
            <div class="account-card bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition-shadow cursor-pointer" data-account-id="${account.id}">
                ${UIComponents.createAccountCard(account)}
            </div>
        `).join('');
    }
    
    renderTransactions() {
        const transactionsContainer = document.getElementById('transactionsList');
        if (!transactionsContainer) return;
        
        if (this.transactions.length === 0) {
            transactionsContainer.innerHTML = `
                <div class="text-center py-12">
                    <i class="fas fa-receipt text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-medium text-gray-600 mb-2">No hay transacciones</h3>
                    <p class="text-gray-500">Tus transacciones aparecerán aquí</p>
                </div>
            `;
            return;
        }
        
        transactionsContainer.innerHTML = this.transactions.map(transaction => 
            UIComponents.createTransactionItem(transaction)
        ).join('');
    }
    
    renderProfile() {
        if (!this.customerData) return;
        
        // Populate profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            Utils.populateForm(profileForm, this.customerData);
        }
        
        // Update profile display
        const profileDisplay = document.getElementById('profileDisplay');
        if (profileDisplay) {
            profileDisplay.innerHTML = `
                <div class="text-center mb-8">
                    <div class="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i class="fas fa-user text-3xl text-primary-600"></i>
                    </div>
                    <h2 class="text-2xl font-bold text-gray-900">${this.customerData.firstName} ${this.customerData.lastName}</h2>
                    <p class="text-gray-600">${this.customerData.email}</p>
                </div>
            `;
        }
    }
    
    // Event Handlers
    async handleLogout() {
        UIComponents.showToast('¡Gracias por usar nuestro portal!', 'info');
        // For demo purposes, just reload the page
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    async handleProfileUpdate(event) {
        event.preventDefault();
        
        if (!UIComponents.validateForm('profileForm')) {
            UIComponents.showToast('Por favor, completa todos los campos requeridos', 'error');
            return;
        }
        
        try {
            UIComponents.showLoading('Actualizando perfil...');
            
            // Simulate API call for demo
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const formData = Utils.serializeForm(event.target);
            // Update local customer data
            this.customerData = { ...this.customerData, ...formData };
            
            UIComponents.hideLoading();
            UIComponents.showToast('Perfil actualizado correctamente (Demo)', 'success');
            
        } catch (error) {
            UIComponents.hideLoading();
            console.error('Profile update error:', error);
            UIComponents.showToast('Error al actualizar el perfil', 'error');
        }
    }
    
    toggleMobileMenu() {
        const mobileMenu = document.getElementById('mobileMenu');
        if (mobileMenu) {
            mobileMenu.classList.toggle('hidden');
        }
    }
    
    showTransferModal() {
        UIComponents.showToast('Función de transferencia - Demo', 'info');
    }
    
    showPaymentModal() {
        UIComponents.showToast('Función de pagos - Demo', 'info');
    }
    
    showDepositModal() {
        UIComponents.showToast('Función de depósitos - Demo', 'info');
    }
    
    showAccountDetails(accountId) {
        const account = this.accounts.find(acc => acc.id === accountId);
        if (account) {
            UIComponents.showToast(`Detalles de ${account.name} - Demo`, 'info');
        }
    }
    
    filterTransactions(filterType) {
        let filteredTransactions = [...this.transactions];
        
        switch (filterType) {
            case 'income':
                filteredTransactions = this.transactions.filter(t => t.amount > 0);
                break;
            case 'expenses':
                filteredTransactions = this.transactions.filter(t => t.amount < 0);
                break;
            case 'today':
                const today = new Date().toDateString();
                filteredTransactions = this.transactions.filter(t => 
                    new Date(t.date).toDateString() === today
                );
                break;
            case 'week':
                const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                filteredTransactions = this.transactions.filter(t => 
                    new Date(t.date) >= weekAgo
                );
                break;
        }
        
        // Re-render transactions with filtered data
        const transactionsContainer = document.getElementById('transactionsList');
        if (transactionsContainer) {
            transactionsContainer.innerHTML = filteredTransactions.map(transaction => 
                UIComponents.createTransactionItem(transaction)
            ).join('');
        }
    }
    
    searchTransactions(searchTerm) {
        if (!searchTerm.trim()) {
            this.renderTransactions();
            return;
        }
        
        const filteredTransactions = this.transactions.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        const transactionsContainer = document.getElementById('transactionsList');
        if (transactionsContainer) {
            transactionsContainer.innerHTML = filteredTransactions.map(transaction => 
                UIComponents.createTransactionItem(transaction)
            ).join('');
        }
    }
    
    // Data refresh - disabled for demo
    startDataRefresh() {
        // For demo purposes, we don't need auto-refresh
        console.log('Auto-refresh disabled for demo mode');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded - initializing CustomerApp');
    window.customerApp = new CustomerApp();
    await window.customerApp.init();
});

// Export for global access
window.CustomerApp = CustomerApp;