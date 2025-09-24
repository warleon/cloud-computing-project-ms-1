// UI Utilities and Components
class UIManager {
    constructor() {
        this.toastContainer = document.getElementById('toast-container');
        this.loadingOverlay = document.getElementById('loading-overlay');
    }

    // Loading State Management
    showLoading(message = 'Procesando...') {
        const overlay = this.loadingOverlay;
        const text = overlay.querySelector('p');
        if (text) text.textContent = message;
        overlay.classList.add('active');
    }

    hideLoading() {
        this.loadingOverlay.classList.remove('active');
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 5000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = this.getToastIcon(type);
        
        toast.innerHTML = `
            <i class="${icon}"></i>
            <div>
                <strong>${this.getToastTitle(type)}</strong>
                <p>${message}</p>
            </div>
            <button class="close-toast" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        this.toastContainer.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, duration);

        return toast;
    }

    getToastIcon(type) {
        switch (type) {
            case 'success': return 'fas fa-check-circle';
            case 'error': return 'fas fa-exclamation-circle';
            case 'warning': return 'fas fa-exclamation-triangle';
            default: return 'fas fa-info-circle';
        }
    }

    getToastTitle(type) {
        switch (type) {
            case 'success': return 'Éxito';
            case 'error': return 'Error';
            case 'warning': return 'Advertencia';
            default: return 'Información';
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = 'auto';
        }
    }

    // Form Utilities
    getFormData(formId) {
        const form = document.getElementById(formId);
        const formData = new FormData(form);
        const data = {};
        
        for (let [key, value] of formData.entries()) {
            data[key] = value;
        }
        
        return data;
    }

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
        }
    }

    // Table Utilities
    clearTable(tableId) {
        const tbody = document.querySelector(`#${tableId} tbody`);
        if (tbody) {
            tbody.innerHTML = '<tr class="loading-row"><td colspan="7"><i class="fas fa-spinner fa-spin"></i> Cargando...</td></tr>';
        }
    }

    // Status Indicator Utilities
    updateStatusIndicator(elementId, status, text) {
        const indicator = document.getElementById(elementId);
        const textElement = document.getElementById(`${elementId}-text`);
        
        if (indicator) {
            indicator.className = 'status-indicator';
            indicator.classList.add(status);
        }
        
        if (textElement) {
            textElement.textContent = text;
        }
    }

    // Format Utilities
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    formatPhone(phone) {
        if (!phone) return 'N/A';
        // Simple phone formatting for display
        return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
    }

    // Status Badge Generator
    createStatusBadge(status) {
        const statusMap = {
            'approved': { class: 'approved', text: 'Aprobado' },
            'pending': { class: 'pending', text: 'Pendiente' },
            'rejected': { class: 'rejected', text: 'Rechazado' },
            'inactive': { class: 'inactive', text: 'Inactivo' }
        };

        const config = statusMap[status] || { class: 'inactive', text: status || 'Desconocido' };
        return `<span class="status-badge ${config.class}">${config.text}</span>`;
    }

    // Action Buttons Generator
    createActionButtons(customerId, nationalId) {
        const portalUrl = nationalId ? `/customer-portal/index.html?nationalId=${nationalId}` : '#';
        return `
            <button class="action-btn view" onclick="viewCustomer('${customerId}')" title="Ver detalles">
                <i class="fas fa-eye"></i>
            </button>
            <button class="action-btn portal" onclick="window.open('${portalUrl}', '_blank')" title="Ver Portal Cliente" style="background-color: #10b981; color: white;">
                <i class="fas fa-user-circle"></i>
            </button>
            <button class="action-btn edit" onclick="editCustomer('${customerId}')" title="Editar">
                <i class="fas fa-edit"></i>
            </button>
            <button class="action-btn delete" onclick="confirmDeleteCustomer('${customerId}')" title="Eliminar">
                <i class="fas fa-trash"></i>
            </button>
        `;
    }

    // Pagination Utilities
    updatePagination(currentPage, totalPages, totalItems) {
        document.getElementById('current-page').textContent = currentPage;
        document.getElementById('total-pages').textContent = totalPages;
        
        const prevButton = document.getElementById('prev-page');
        const nextButton = document.getElementById('next-page');
        
        prevButton.disabled = currentPage <= 1;
        nextButton.disabled = currentPage >= totalPages;
        
        // Update page info with item count
        const pageInfo = document.querySelector('.page-info');
        if (pageInfo && totalItems !== undefined) {
            const start = Math.min((currentPage - 1) * 10 + 1, totalItems);
            const end = Math.min(currentPage * 10, totalItems);
            pageInfo.innerHTML = `
                Mostrando ${start}-${end} de ${totalItems} clientes
                <br>
                Página <span id="current-page">${currentPage}</span> de <span id="total-pages">${totalPages}</span>
            `;
        }
    }

    // Animation Utilities
    fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let opacity = 0;
        const timer = setInterval(() => {
            opacity += 50 / duration;
            if (opacity >= 1) {
                clearInterval(timer);
                opacity = 1;
            }
            element.style.opacity = opacity;
        }, 50);
    }

    fadeOut(element, duration = 300) {
        let opacity = 1;
        const timer = setInterval(() => {
            opacity -= 50 / duration;
            if (opacity <= 0) {
                clearInterval(timer);
                element.style.display = 'none';
                opacity = 0;
            }
            element.style.opacity = opacity;
        }, 50);
    }

    // Validation Utilities
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhone(phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
        return phoneRegex.test(phone);
    }

    // Search and Filter Utilities
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}