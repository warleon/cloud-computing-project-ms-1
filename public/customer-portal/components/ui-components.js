// UI Components Library - Shadcn-inspired components
class UIComponents {
    // Toast notification system
    static showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toast-container');
        const toast = document.createElement('div');
        
        const icons = {
            success: 'fas fa-check-circle text-green-500',
            error: 'fas fa-exclamation-circle text-red-500',
            warning: 'fas fa-exclamation-triangle text-yellow-500',
            info: 'fas fa-info-circle text-blue-500'
        };
        
        const colors = {
            success: 'bg-green-50 border-green-200 text-green-800',
            error: 'bg-red-50 border-red-200 text-red-800',
            warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
            info: 'bg-blue-50 border-blue-200 text-blue-800'
        };
        
        toast.className = `flex items-center p-4 border rounded-lg shadow-lg max-w-sm ${colors[type]} transform translate-x-full transition-transform duration-300`;
        toast.innerHTML = `
            <i class="${icons[type]} mr-3"></i>
            <span class="text-sm font-medium">${message}</span>
            <button class="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 hover:bg-gray-100 transition-colors" onclick="this.parentElement.remove()">
                <i class="fas fa-times text-xs"></i>
            </button>
        `;
        
        toastContainer.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.classList.remove('translate-x-full');
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    }
    
    // Loading overlay
    static showLoading(message = 'Cargando...') {
        const overlay = document.getElementById('loading-overlay');
        const messageElement = overlay.querySelector('span');
        messageElement.textContent = message;
        overlay.classList.remove('hidden');
    }
    
    static hideLoading() {
        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
    }
    
    // Card component
    static createCard({ title, content, icon, color = 'blue' }) {
        return `
            <div class="bg-white rounded-xl shadow-card p-6 hover:shadow-card-hover transition-shadow">
                ${icon ? `
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center">
                            <i class="${icon} text-${color}-600"></i>
                        </div>
                    </div>
                ` : ''}
                ${title ? `<h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>` : ''}
                <div>${content}</div>
            </div>
        `;
    }
    
    // Account card component
    static createAccountCard(account) {
        const cardColors = {
            'checking': 'from-blue-500 to-blue-600',
            'savings': 'from-green-500 to-green-600',
            'credit': 'from-purple-500 to-purple-600',
            'investment': 'from-yellow-500 to-yellow-600'
        };
        
        const cardIcons = {
            'checking': 'fas fa-university',
            'savings': 'fas fa-piggy-bank',
            'credit': 'fas fa-credit-card',
            'investment': 'fas fa-chart-line'
        };
        
        const gradient = cardColors[account.type] || cardColors.checking;
        const icon = cardIcons[account.type] || cardIcons.checking;
        
        return `
            <div class="relative">
                <div class="bg-gradient-to-r ${gradient} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-3">
                            <i class="${icon} text-xl"></i>
                            <div>
                                <h3 class="font-semibold">${account.name}</h3>
                                <p class="text-sm opacity-90">**** ${account.number.slice(-4)}</p>
                            </div>
                        </div>
                        <button class="p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors">
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                    </div>
                    
                    <div class="mb-4">
                        <p class="text-sm opacity-75 mb-1">Saldo disponible</p>
                        <p class="text-2xl font-bold">${this.formatCurrency(account.balance)}</p>
                    </div>
                    
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-xs opacity-75">Válida hasta</p>
                            <p class="text-sm font-medium">${account.expiryDate}</p>
                        </div>
                        <div class="flex space-x-2">
                            <button class="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-full text-xs font-medium transition-colors">
                                Ver detalles
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Transaction item component
    static createTransactionItem(transaction) {
        const isCredit = transaction.amount > 0;
        const amountClass = isCredit ? 'text-green-600' : 'text-red-600';
        const icon = isCredit ? 'fas fa-arrow-down' : 'fas fa-arrow-up';
        
        return `
            <div class="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg transition-colors">
                <div class="flex items-center space-x-4">
                    <div class="w-10 h-10 ${isCredit ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center">
                        <i class="${icon} ${isCredit ? 'text-green-600' : 'text-red-600'} text-sm"></i>
                    </div>
                    <div>
                        <h4 class="font-medium text-gray-900">${transaction.description}</h4>
                        <p class="text-sm text-gray-500">${transaction.category} • ${this.formatDate(transaction.date)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold ${amountClass}">
                        ${isCredit ? '+' : '-'}${this.formatCurrency(Math.abs(transaction.amount))}
                    </p>
                    <p class="text-xs text-gray-500">${transaction.time}</p>
                </div>
            </div>
        `;
    }
    
    // Skeleton loading component
    static createSkeleton(type = 'card') {
        const skeletons = {
            card: `
                <div class="bg-white rounded-xl shadow-card p-6">
                    <div class="animate-pulse">
                        <div class="flex items-center space-x-4 mb-4">
                            <div class="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div class="flex-1">
                                <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div class="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="h-6 bg-gray-200 rounded w-1/3"></div>
                            <div class="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                </div>
            `,
            transaction: `
                <div class="flex items-center justify-between p-4">
                    <div class="animate-pulse flex items-center space-x-4">
                        <div class="w-10 h-10 bg-gray-200 rounded-full"></div>
                        <div>
                            <div class="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                            <div class="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                    </div>
                    <div class="animate-pulse">
                        <div class="h-4 bg-gray-200 rounded w-16 mb-2"></div>
                        <div class="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                </div>
            `
        };
        
        return skeletons[type] || skeletons.card;
    }
    
    // Utility methods
    static formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2
        }).format(amount);
    }
    
    static formatDate(date) {
        return new Intl.DateTimeFormat('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
    
    static formatTime(date) {
        return new Intl.DateTimeFormat('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(date));
    }
    
    // Form validation
    static validateForm(formId) {
        const form = document.getElementById(formId);
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('border-red-500');
                isValid = false;
            } else {
                field.classList.remove('border-red-500');
            }
        });
        
        return isValid;
    }
    
    // Modal system
    static showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
        }
    }
    
    static hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.classList.remove('overflow-hidden');
        }
    }
    
    // Dropdown menu
    static toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }
    
    // Progress bar
    static updateProgress(elementId, percentage) {
        const progressBar = document.getElementById(elementId);
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
    }
    
    // Chart placeholder (for future Chart.js integration)
    static createChartPlaceholder(containerId, type = 'line') {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
                    <div class="text-center">
                        <i class="fas fa-chart-${type} text-4xl text-gray-400 mb-4"></i>
                        <p class="text-gray-500">Gráfico de ${type} próximamente</p>
                    </div>
                </div>
            `;
        }
    }
}

// Export for use in other files
window.UIComponents = UIComponents;