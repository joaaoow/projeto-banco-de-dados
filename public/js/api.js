// API Configuration
const API_URL = 'http://localhost:3000';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token in localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Get user from localStorage
const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');

// Set user in localStorage
const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));

// Remove user from localStorage
const removeUser = () => localStorage.removeItem('user');

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// API Request helper
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || data.message || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Auth API
const AuthAPI = {
    register: (userData) => apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
    }),
    
    login: (credentials) => apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    }),
    
    me: () => apiRequest('/auth/me')
};

// Eventos API
const EventosAPI = {
    getAll: () => apiRequest('/eventos'),
    
    getById: (id) => apiRequest(`/eventos/${id}`),
    
    getByOrganizador: (id) => apiRequest(`/eventos/organizador/${id}`),
    
    create: (evento) => apiRequest('/eventos', {
        method: 'POST',
        body: JSON.stringify(evento)
    }),
    
    update: (id, evento) => apiRequest(`/eventos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(evento)
    }),
    
    delete: (id) => apiRequest(`/eventos/${id}`, {
        method: 'DELETE'
    })
};

// Inscrições API
const InscricoesAPI = {
    getAll: () => apiRequest('/inscricoes'),
    
    getByUsuario: (userId) => apiRequest(`/inscricoes/usuario/${userId}`),
    
    create: (inscricao) => apiRequest('/inscricoes', {
        method: 'POST',
        body: JSON.stringify(inscricao)
    }),
    
    cancelar: (id) => apiRequest(`/inscricoes/${id}/cancelar`, {
        method: 'PUT'
    }),
    
    updateStatus: (id, status) => apiRequest(`/inscricoes/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
    }),
    
    delete: (id) => apiRequest(`/inscricoes/${id}`, {
        method: 'DELETE'
    })
};

// Usuários API
const UsuariosAPI = {
    getAll: () => apiRequest('/usuarios'),
    
    getById: (id) => apiRequest(`/usuarios/${id}`),
    
    getByTipo: (tipo) => apiRequest(`/usuarios/tipo/${tipo}`),
    
    getEstatisticas: () => apiRequest('/usuarios/estatisticas'),
    
    update: (id, usuario) => apiRequest(`/usuarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify(usuario)
    }),
    
    delete: (id) => apiRequest(`/usuarios/${id}`, {
        method: 'DELETE'
    })
};

// Auditoria API
const AuditoriaAPI = {
    getAll: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/auditoria${query ? '?' + query : ''}`);
    },
    
    getByUsuario: (userId, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/auditoria/usuario/${userId}${query ? '?' + query : ''}`);
    },
    
    getByOperacao: (operacao, params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/auditoria/operacao/${operacao}${query ? '?' + query : ''}`);
    }
};

// Feedbacks API
const FeedbacksAPI = {
    getAll: () => apiRequest('/feedbacks'),
    
    getByEvento: (eventoId) => apiRequest(`/feedbacks/evento/${eventoId}`),
    
    create: (feedback) => apiRequest('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(feedback)
    })
};

// Material API
const MaterialAPI = {
    getAll: () => apiRequest('/material'),
    
    getByEvento: (eventoId) => apiRequest(`/material/evento/${eventoId}`),
    
    create: (material) => apiRequest('/material', {
        method: 'POST',
        body: JSON.stringify(material)
    }),
    
    delete: (id) => apiRequest(`/material/${id}`, {
        method: 'DELETE'
    })
};

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format date for input datetime-local
function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
