// API Configuration
const API_URL = 'http://localhost:3000';


const getToken = () => localStorage.getItem('token');


const setToken = (token) => localStorage.setItem('token', token);


const removeToken = () => localStorage.removeItem('token');

const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');


const setUser = (user) => localStorage.setItem('user', JSON.stringify(user));


const removeUser = () => localStorage.removeItem('user');


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

const CategoriasAPI = {
    getAll: () => apiRequest('/categorias'),
    create: (categoria) => apiRequest('/categorias', {
        method: 'POST',
        body: JSON.stringify(categoria)
    })
};


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

const FeedbacksAPI = {
    getAll: () => apiRequest('/feedbacks'),
    
    getByEvento: (eventoId) => apiRequest(`/feedbacks/evento/${eventoId}`),
    
    getMedia: (eventoId) => apiRequest(`/feedbacks/evento/${eventoId}/media`),
    
    create: (feedback) => apiRequest('/feedbacks', {
        method: 'POST',
        body: JSON.stringify(feedback)
    }),
    
    update: (id, feedback) => apiRequest(`/feedbacks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(feedback)
    }),
    
    delete: (id) => apiRequest(`/feedbacks/${id}`, {
        method: 'DELETE'
    })
};

const MaterialAPI = {
    getAll: () => apiRequest('/material'),
    
    getByEvento: (eventoId) => apiRequest(`/material/evento/${eventoId}`),
    
    create: (material) => apiRequest('/material', {
        method: 'POST',
        body: JSON.stringify(material)
    }),
    
    incrementDownload: (id) => apiRequest(`/material/${id}/download`, {
        method: 'PUT'
    }),
    
    delete: (id) => apiRequest(`/material/${id}`, {
        method: 'DELETE'
    })
};

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

function formatDateForInput(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
}
