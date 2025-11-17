# 🎨 Documentação do Frontend

## 📐 Estrutura do Frontend

```
public/
├── index.html           # Página de login/registro
├── dashboard.html       # Dashboard principal do sistema
├── css/
│   └── style.css        # Estilos globais (1200+ linhas)
└── js/
    ├── api.js           # Cliente HTTP para comunicação com API
    ├── auth.js          # Gerenciamento de autenticação JWT
    └── dashboard.js     # Lógica e funcionalidades do dashboard
```

---

## 🖼️ Páginas

### 1. **index.html** - Página de Login/Registro

**Funcionalidades:**
- Login de usuários existentes
- Registro de novos usuários
- Alternância entre modos de login e registro
- Validação de formulários
- Feedback visual de erros

**Estrutura:**
```html
<div class="auth-container">
  <div class="auth-card">
    <h1>Sistema de Gestão de Eventos</h1>
    
    <!-- Formulário de Login -->
    <form id="formLogin">
      <input type="email" placeholder="Email" required>
      <input type="password" placeholder="Senha" required>
      <button type="submit">Entrar</button>
    </form>
    
    <!-- Formulário de Registro -->
    <form id="formRegistro" style="display: none;">
      <!-- Campos de registro -->
    </form>
  </div>
</div>
```

**JavaScript Associado:**
```javascript
// Login
document.getElementById('formLogin').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = e.target.email.value;
  const senha = e.target.senha.value;
  
  const resultado = await API.login(email, senha);
  
  if (resultado.token) {
    Auth.setToken(resultado.token);
    Auth.setUser(resultado.usuario);
    window.location.href = '/dashboard.html';
  }
});
```

---

### 2. **dashboard.html** - Dashboard Principal

**Estrutura:**
```html
<body>
  <!-- Sidebar de Navegação -->
  <aside class="sidebar">
    <div class="logo">
      <i class="fas fa-calendar-alt"></i>
      <h2>Gestão de Eventos</h2>
    </div>
    
    <nav class="menu">
      <a href="#" data-section="eventos" class="menu-item active">
        <i class="fas fa-calendar-check"></i>
        <span>Eventos</span>
      </a>
      <a href="#" data-section="inscricoes">
        <i class="fas fa-ticket-alt"></i>
        <span>Minhas Inscrições</span>
      </a>
      <a href="#" data-section="meus-eventos">
        <i class="fas fa-calendar-plus"></i>
        <span>Meus Eventos</span>
      </a>
      <!-- Outros itens -->
    </nav>
    
    <button class="btn-logout">
      <i class="fas fa-sign-out-alt"></i>
      <span>Sair</span>
    </button>
  </aside>
  
  <!-- Conteúdo Principal -->
  <main class="main-content">
    <header class="topbar">
      <h1 id="pageTitle">Eventos Disponíveis</h1>
      <div class="user-info">
        <span id="userName">Usuário</span>
        <i class="fas fa-user-circle"></i>
      </div>
    </header>
    
    <!-- Seções de Conteúdo -->
    <div class="content">
      <section id="secEventos" class="content-section active">
        <!-- Conteúdo de Eventos -->
      </section>
      
      <section id="secInscricoes" class="content-section">
        <!-- Conteúdo de Inscrições -->
      </section>
      
      <!-- Outras seções -->
    </div>
  </main>
  
  <!-- Modais -->
  <div id="modalNovoEvento" class="modal">
    <!-- Conteúdo do modal -->
  </div>
</body>
```

---

## 🎨 Sistema de Design (CSS)

### **Variáveis CSS**

```css
:root {
  /* Cores Primárias */
  --primary: #6366f1;
  --primary-dark: #4f46e5;
  --primary-light: #818cf8;
  
  /* Cores de Fundo */
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --bg-tertiary: #334155;
  
  /* Gradientes */
  --bg-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --card-gradient: linear-gradient(135deg, #1e293b 0%, #334155 100%);
  
  /* Cores de Status */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;
  
  /* Tipografia */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.5rem;
  --font-size-2xl: 2rem;
  
  /* Espaçamento */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Sombras */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.2);
  --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.3);
  
  /* Transições */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 300ms ease-in-out;
  --transition-slow: 500ms ease-in-out;
  
  /* Bordas */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

---

### **Componentes de UI**

#### **Cards**
```css
.card {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-lg);
  transition: all var(--transition-base);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-xl);
  border-color: var(--primary);
}
```

#### **Botões**
```css
.btn {
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-md);
  font-weight: 600;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: none;
  font-family: var(--font-family);
}

.btn-primary {
  background: var(--bg-gradient);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-success {
  background: var(--success);
  color: white;
}

.btn-danger {
  background: var(--error);
  color: white;
}
```

#### **Badges**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  font-weight: 600;
}

.badge.aberto { background: rgba(16, 185, 129, 0.2); color: #10b981; }
.badge.encerrado { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
.badge.planejado { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
.badge.cancelado { background: rgba(107, 114, 128, 0.2); color: #9ca3af; }
```

#### **Modais**
```css
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.3s ease-out;
}

.modal.active {
  display: flex;
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  padding: 2rem;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease-out;
}
```

---

### **Animações**

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(30px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

/* Aplicação */
.progress-bar {
  animation: shimmer 2s infinite linear;
  background: linear-gradient(
    90deg,
    var(--primary) 0%,
    var(--primary-light) 50%,
    var(--primary) 100%
  );
  background-size: 1000px 100%;
}
```

---

## 📜 JavaScript - Módulos

### **1. api.js** - Cliente API

**Estrutura:**
```javascript
const API_URL = 'http://localhost:3000';

const API = {
  // Autenticação
  login: async (email, senha) => {
    const response = await fetch(`${API_URL}/usuarios/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    return response.json();
  },
  
  register: async (dados) => {
    const response = await fetch(`${API_URL}/usuarios/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    return response.json();
  },
  
  // Eventos
  eventos: {
    listar: async () => {
      const token = Auth.getToken();
      const response = await fetch(`${API_URL}/eventos`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return response.json();
    },
    
    criar: async (dados) => {
      const token = Auth.getToken();
      const response = await fetch(`${API_URL}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dados)
      });
      return response.json();
    },
    
    atualizar: async (id, dados) => { /* ... */ },
    deletar: async (id) => { /* ... */ },
    meusEventos: async (organizadorId) => { /* ... */ }
  },
  
  // Inscrições
  inscricoes: {
    listar: async () => { /* ... */ },
    criar: async (dados) => { /* ... */ },
    cancelar: async (id) => { /* ... */ }
  }
};
```

**Tratamento de Erros:**
```javascript
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.mensagem || 'Erro na requisição');
  }
  
  return data;
};
```

---

### **2. auth.js** - Gestão de Autenticação

```javascript
const Auth = {
  // Armazenar token
  setToken: (token) => {
    localStorage.setItem('token', token);
  },
  
  // Obter token
  getToken: () => {
    return localStorage.getItem('token');
  },
  
  // Remover token
  removeToken: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Armazenar dados do usuário
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Obter dados do usuário
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  // Verificar se está autenticado
  isAuthenticated: () => {
    return !!Auth.getToken();
  },
  
  // Verificar permissão
  hasPermission: (requiredType) => {
    const user = Auth.getUser();
    if (!user) return false;
    
    const hierarchy = {
      'administrador': 3,
      'organizador': 2,
      'participante': 1
    };
    
    return hierarchy[user.tipo] >= hierarchy[requiredType];
  },
  
  // Logout
  logout: () => {
    Auth.removeToken();
    window.location.href = '/index.html';
  }
};

// Proteção de rotas
if (window.location.pathname.includes('dashboard.html') && !Auth.isAuthenticated()) {
  window.location.href = '/index.html';
}
```

---

### **3. dashboard.js** - Lógica do Dashboard

**Navegação entre Seções:**
```javascript
const sectionMap = {
  'eventos': 'secEventos',
  'inscricoes': 'secInscricoes',
  'meus-eventos': 'secMeusEventos',
  'usuarios': 'secUsuarios',
  'auditoria': 'secAuditoria',
  'estatisticas': 'secEstatisticas'
};

const navegarParaSecao = (sectionName) => {
  console.log('[NAV] Navegando para:', sectionName);
  
  const sectionId = sectionMap[sectionName];
  
  if (!sectionId) {
    console.error('[NAV] Seção não encontrada:', sectionName);
    return;
  }
  
  // Esconder todas as seções
  document.querySelectorAll('.content-section').forEach(section => {
    section.classList.remove('active');
  });
  
  // Mostrar seção selecionada
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');
    console.log('[NAV] Seção ativada:', sectionId);
  }
  
  // Atualizar menu
  document.querySelectorAll('.menu-item').forEach(item => {
    item.classList.remove('active');
  });
  
  const activeMenuItem = document.querySelector(`[data-section="${sectionName}"]`);
  if (activeMenuItem) {
    activeMenuItem.classList.add('active');
  }
};

// Event listeners
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const section = item.getAttribute('data-section');
    navegarParaSecao(section);
  });
});
```

**Renderização de Eventos:**
```javascript
const renderizarEventos = (eventos) => {
  const container = document.getElementById('listaEventos');
  
  if (!eventos || eventos.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-calendar-times fa-3x"></i>
        <h3>Nenhum evento disponível</h3>
        <p>Não há eventos cadastrados no momento.</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = eventos.map(evento => `
    <div class="card evento-card" data-evento-id="${evento.id}">
      <div class="card-header">
        <h3>${evento.titulo}</h3>
        <span class="badge ${evento.status}">
          <i class="fas fa-circle"></i>
          ${evento.status}
        </span>
      </div>
      
      <div class="card-body">
        <p class="descricao">${evento.descricao || 'Sem descrição'}</p>
        
        <div class="evento-info">
          <div class="info-item">
            <i class="fas fa-calendar"></i>
            <span>${formatarData(evento.data_evento)}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-user"></i>
            <span>${evento.organizador}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-users"></i>
            <span>${evento.inscritos || 0} / ${evento.vagas} inscritos</span>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-bar" style="width: ${evento.taxa_ocupacao || 0}%"></div>
        </div>
        <p class="ocupacao-text">${(evento.taxa_ocupacao || 0).toFixed(1)}% de ocupação</p>
      </div>
      
      <div class="card-footer">
        <button class="btn btn-primary" onclick="inscreverEvento('${evento.id}')">
          <i class="fas fa-ticket-alt"></i>
          Inscrever-se
        </button>
        <button class="btn btn-secondary" onclick="verDetalhes('${evento.id}')">
          <i class="fas fa-eye"></i>
          Detalhes
        </button>
      </div>
    </div>
  `).join('');
};
```

**Gestão de Modais:**
```javascript
const abrirModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
};

const fecharModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
  }
};

// Event listener para fechar ao clicar fora
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      fecharModal(modal.id);
    }
  });
});
```

---

## 🎯 Funcionalidades Principais

### **1. Sistema de Login/Registro**
- Validação de formulários
- Feedback visual de erros
- Armazenamento seguro de token JWT
- Redirecionamento automático

### **2. Dashboard Interativo**
- Navegação por abas
- Atualização dinâmica de conteúdo
- Sistema de notificações
- Filtros e buscas

### **3. Gestão de Eventos**
- Listagem de eventos disponíveis
- Criação de novos eventos (organizadores)
- Edição e exclusão de eventos
- Visualização de participantes

### **4. Sistema de Inscrições**
- Inscrição em eventos
- Cancelamento de inscrições
- Lista de eventos inscritos
- Status de inscrição

### **5. Visualização de Estatísticas**
- Taxa de ocupação de eventos
- Gráficos de participação
- Relatórios gerenciais

---

## 📱 Responsividade

```css
/* Desktop (padrão) */
@media (min-width: 1024px) {
  .sidebar { width: 280px; }
  .main-content { margin-left: 280px; }
}

/* Tablet */
@media (max-width: 1024px) {
  .sidebar { width: 220px; }
  .evento-card { flex-basis: calc(50% - 1rem); }
}

/* Mobile */
@media (max-width: 768px) {
  .sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.active {
    transform: translateX(0);
  }
  
  .main-content {
    margin-left: 0;
    padding: 1rem;
  }
  
  .evento-card {
    flex-basis: 100%;
  }
}
```

---

## 🔍 Utilitários JavaScript

```javascript
// Formatação de data
const formatarData = (dataISO) => {
  const data = new Date(dataISO);
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Debounce para busca
const debounce = (func, delay) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), delay);
  };
};

// Validação de email
const validarEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

// Exibir notificação
const exibirNotificacao = (mensagem, tipo = 'info') => {
  const notificacao = document.createElement('div');
  notificacao.className = `notificacao ${tipo}`;
  notificacao.textContent = mensagem;
  document.body.appendChild(notificacao);
  
  setTimeout(() => {
    notificacao.classList.add('fadeOut');
    setTimeout(() => notificacao.remove(), 300);
  }, 3000);
};
```

---

📅 **Última atualização**: Novembro 2025
