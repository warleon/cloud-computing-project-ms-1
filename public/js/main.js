// Main Application Entry Point
class BankingApp {
    constructor() {
        this.api = new CustomerAPI();
        this.ui = new UIManager();
        this.customerManager = null;
        
        this.init();
    }

    async init() {
        console.log('🏦 Initializing BankCloud Customer Management System...');
        
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.start());
        } else {
            this.start();
        }
    }

    async start() {
        try {
            // Initialize components
            this.customerManager = new CustomerManager(this.api, this.ui);
            
            // Make customer manager globally available
            window.customerManager = this.customerManager;
            
            // Initialize navigation
            this.initializeNavigation();
            
            // Load initial data
            await this.loadInitialData();
            
            // Set up periodic health checks
            this.startHealthChecks();
            
            console.log('✅ BankCloud System initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize BankCloud System:', error);
            this.ui.showToast('Error al inicializar el sistema', 'error');
        }
    }

    initializeNavigation() {
        // Navigation menu items
        const navItems = document.querySelectorAll('.nav-item');
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        
        // Handle main navigation
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const target = item.getAttribute('href').substring(1);
                this.navigateToSection(target);
                
                // Update active state
                navItems.forEach(nav => nav.classList.remove('active'));
                item.classList.add('active');
            });
        });
        
        // Handle sidebar navigation
        sidebarLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('href').substring(1);
                this.navigateToSection(target);
                
                // Update active state
                sidebarLinks.forEach(sidebar => sidebar.classList.remove('active'));
                link.classList.add('active');
            });
        });
    }

    navigateToSection(sectionName) {
        // Hide all content sections
        const sections = document.querySelectorAll('.content-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section based on navigation
        switch (sectionName) {
            case 'dashboard':
            case 'overview':
                document.getElementById('dashboard-section').classList.add('active');
                break;
                
            case 'customers':
            case 'customer-list':
            case 'new-customer':
                document.getElementById('customers-section').classList.add('active');
                if (sectionName === 'new-customer') {
                    setTimeout(() => this.customerManager.showNewCustomerForm(), 300);
                }
                break;
                
            default:
                // Default to dashboard
                document.getElementById('dashboard-section').classList.add('active');
        }
    }

    async loadInitialData() {
        this.ui.showLoading('Cargando datos del sistema...');
        
        try {
            // Load system health status
            await this.checkSystemHealth();
            
            // Load customer statistics for dashboard
            await this.customerManager.updateStats();
            
            // Load initial customer list
            await this.customerManager.loadCustomers(1);
            
        } catch (error) {
            console.error('Error loading initial data:', error);
            this.ui.showToast('Error al cargar datos iniciales', 'error');
        } finally {
            this.ui.hideLoading();
        }
    }

    async checkSystemHealth() {
        try {
            // Check API health
            const healthResult = await this.api.getHealthStatus();
            
            if (healthResult.success) {
                const health = healthResult.data;
                
                // Update API status
                this.ui.updateStatusIndicator(
                    'api-status', 
                    health.status === 'healthy' ? 'online' : 'degraded',
                    health.status === 'healthy' ? 'Operativo' : 'Degradado'
                );
                
                // Update database status
                const dbStatus = health.dependencies?.database || 'unknown';
                this.ui.updateStatusIndicator(
                    'db-status',
                    dbStatus === 'healthy' ? 'online' : 'offline',
                    dbStatus === 'healthy' ? 'Conectado' : 'Desconectado'
                );
                
                // Update external services status
                const externalServices = health.dependencies?.externalServices || {};
                const hasExternalIssues = Object.values(externalServices).some(status => status !== 'healthy');
                
                this.ui.updateStatusIndicator(
                    'external-status',
                    hasExternalIssues ? 'degraded' : 'online',
                    hasExternalIssues ? 'Servicios externos no disponibles' : 'Todos los servicios operativos'
                );
                
            } else {
                // API is not responding
                this.ui.updateStatusIndicator('api-status', 'offline', 'No disponible');
                this.ui.updateStatusIndicator('db-status', 'offline', 'No disponible');
                this.ui.updateStatusIndicator('external-status', 'offline', 'No disponible');
            }
            
        } catch (error) {
            console.error('Health check failed:', error);
            this.ui.updateStatusIndicator('api-status', 'offline', 'Error de conexión');
            this.ui.updateStatusIndicator('db-status', 'offline', 'Error de conexión');
            this.ui.updateStatusIndicator('external-status', 'offline', 'Error de conexión');
        }
    }

    startHealthChecks() {
        // Check system health every 30 seconds
        setInterval(() => {
            this.checkSystemHealth();
        }, 30000);
    }

    // Utility methods
    getCurrentSection() {
        const activeSection = document.querySelector('.content-section.active');
        return activeSection ? activeSection.id : 'dashboard-section';
    }

    showNotification(message, type = 'info') {
        this.ui.showToast(message, type);
    }

    // Error handling
    handleGlobalError(error) {
        console.error('Global application error:', error);
        this.ui.showToast('Ha ocurrido un error inesperado', 'error');
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Unhandled error:', event.error);
    if (window.bankingApp) {
        window.bankingApp.handleGlobalError(event.error);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    if (window.bankingApp) {
        window.bankingApp.handleGlobalError(event.reason);
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.bankingApp = new BankingApp();
});

// Make key classes globally available for debugging
window.CustomerAPI = CustomerAPI;
window.UIManager = UIManager;
window.CustomerManager = CustomerManager;

console.log('🏦 BankCloud Customer Management System loaded');