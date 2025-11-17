# 🏗️ Arquitetura do Sistema

## 📐 Visão Geral

Este sistema segue uma arquitetura **MVC (Model-View-Controller)** com camadas bem definidas e separação de responsabilidades.

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (View)                      │
│  HTML5 + CSS3 + Vanilla JavaScript + Font Awesome       │
└─────────────────┬───────────────────────────────────────┘
                  │ HTTP Requests (Fetch API)
                  │ JSON Data
┌─────────────────▼───────────────────────────────────────┐
│               MIDDLEWARE (Controller)                    │
│  Express.js + JWT Auth + CORS + Body Parser             │
└─────────────────┬───────────────────────────────────────┘
                  │
        ┌─────────┴──────────┐
        │                    │
┌───────▼──────┐    ┌────────▼───────┐
│  MySQL 8+    │    │  MongoDB 5+    │
│  (Relational)│    │  (NoSQL)       │
└──────────────┘    └────────────────┘
```

---

## 📂 Estrutura de Diretórios

```
projeto-banco-de-dados/
│
├── database/              # Scripts SQL e schema
│   └── schema.sql         # Schema completo (482 linhas)
│
├── middleware/            # Middlewares Express
│   └── auth.js            # Autenticação JWT
│
├── models/                # Camada de dados
│   ├── mysql/             # Models MySQL
│   │   ├── usuarioModel.js
│   │   ├── eventoModel.js
│   │   └── inscricaoModel.js
│   └── mongo/             # Models MongoDB
│       ├── feedbackModel.js
│       └── materialModel.js
│
├── routes/                # Camada de rotas (Controllers)
│   ├── usuarios.js        # CRUD de usuários
│   ├── eventos.js         # CRUD de eventos
│   ├── inscricoes.js      # Gestão de inscrições
│   ├── feedbacks.js       # Feedbacks (MongoDB)
│   ├── material.js        # Materiais (MongoDB)
│   ├── auditoria.js       # Logs de auditoria
│   └── relatorios.js      # Relatórios do sistema
│
├── public/                # Frontend estático
│   ├── index.html         # Página de login
│   ├── dashboard.html     # Dashboard principal
│   ├── css/
│   │   └── style.css      # Estilos (1200+ linhas)
│   └── js/
│       ├── api.js         # Cliente API
│       ├── auth.js        # Gestão de JWT
│       └── dashboard.js   # Lógica do dashboard
│
├── .env                   # Variáveis de ambiente
├── db.js                  # Conexões de banco de dados
├── server.js              # Entry point do servidor
├── package.json           # Dependências do projeto
└── README.md              # Documentação principal
```

---

## 🔄 Fluxo de Dados

### 1️⃣ Fluxo de Autenticação

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│ Cliente │─────>│ POST     │─────>│ Usuario │─────>│ MySQL    │
│         │      │ /login   │      │ Model   │      │          │
└─────────┘      └──────────┘      └─────────┘      └──────────┘
     │                                   │
     │           ┌──────────────────────┐│
     │<──────────│  JWT Token           ││
     │           │  + User Data         ││
     │           └──────────────────────┘│
     │                                    │
     │  ┌─────────────────────────────────▼──┐
     │  │ Token armazenado no localStorage   │
     │  └────────────────────────────────────┘
     │
     ▼ Próximas requisições incluem:
  Authorization: Bearer <token>
```

---

### 2️⃣ Fluxo de Criação de Evento

```
┌─────────┐      ┌──────────┐      ┌─────────┐      ┌──────────┐
│ Cliente │─────>│ POST     │─────>│ Auth    │─────>│ Valida   │
│         │      │ /eventos │      │ Middlw. │      │ JWT      │
└─────────┘      └──────────┘      └─────────┘      └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │ Evento   │
                                    │ Model    │
                                    └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │ MySQL    │
                                    │ INSERT   │
                                    └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │ Trigger  │
                                    │ gera ID  │
                                    └──────────┘
                                           │
                                           ▼
                                    ┌──────────┐
                                    │ Auditoria│
                                    │ registra │
                                    └──────────┘
```

---

### 3️⃣ Fluxo de Inscrição em Evento

```
┌─────────┐      ┌──────────┐      ┌─────────┐
│ Cliente │─────>│ POST     │─────>│ Auth    │
│         │      │/inscricoes│      │         │
└─────────┘      └──────────┘      └─────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │ Inscricao│
                                 │ Model    │
                                 └──────────┘
                                        │
                                        ▼
                                 ┌──────────┐
                                 │ Procedure│
                                 │ inscrever│
                                 │_usuario  │
                                 └──────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    │                   │                   │
                    ▼                   ▼                   ▼
             ┌──────────┐        ┌──────────┐       ┌──────────┐
             │ Valida   │        │ Decrementa│       │ Registra │
             │ vagas    │        │ vagas     │       │ auditoria│
             │ status   │        │ (trigger) │       │ (trigger)│
             └──────────┘        └──────────┘       └──────────┘
```

---

## 🛡️ Camada de Segurança

### Middleware de Autenticação (`middleware/auth.js`)

```javascript
┌─────────────────────────────────────┐
│   Requisição HTTP com JWT           │
└─────────────┬───────────────────────┘
              │
              ▼
       ┌──────────────┐
       │ Verifica     │────> Token ausente? ──> 401 Unauthorized
       │ header       │
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ jwt.verify() │────> Token inválido? ──> 403 Forbidden
       └──────┬───────┘
              │
              ▼
       ┌──────────────┐
       │ Decodifica   │
       │ payload      │
       └──────┬───────┘
              │
              ▼
       req.user = {id, email, tipo, grupo_id}
              │
              ▼
       next() ──────────> Continua para rota
```

---

## 💾 Camada de Dados

### Arquitetura de Banco de Dados Híbrida

#### **MySQL (Dados Estruturados)**
- **Usuários**: Informações de login, perfil, permissões
- **Eventos**: Dados dos eventos, organizadores, vagas
- **Inscrições**: Relacionamento usuário-evento
- **Categorias**: Classificação de eventos
- **Grupos**: Níveis de permissão
- **Auditoria**: Logs de ações críticas

#### **MongoDB (Dados Semi-Estruturados)**
- **Feedbacks**: Avaliações flexíveis com comentários
- **Materiais**: Links, arquivos, metadados variáveis

---

## 🔧 Tecnologias e Ferramentas

### Backend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| Node.js | 16+ | Runtime JavaScript |
| Express.js | 4.x | Framework web |
| MySQL2 | 2.3+ | Driver MySQL |
| Mongoose | 6.x | ODM para MongoDB |
| JWT | 9.x | Autenticação stateless |
| bcryptjs | 2.x | Hash de senhas |
| dotenv | 16.x | Variáveis de ambiente |
| CORS | 2.x | Cross-Origin Resource Sharing |

### Frontend
| Tecnologia | Versão | Função |
|------------|--------|--------|
| HTML5 | - | Estrutura |
| CSS3 | - | Estilização |
| JavaScript (ES6+) | - | Lógica do cliente |
| Font Awesome | 6.4.0 | Ícones |
| Google Fonts | - | Tipografia (Inter) |

---

## 🎯 Padrões de Projeto

### 1. **Repository Pattern** (Models)
```javascript
// models/mysql/usuarioModel.js
class UsuarioModel {
  async criar(dados) { /* ... */ }
  async buscarPorEmail(email) { /* ... */ }
  async buscarPorId(id) { /* ... */ }
  async atualizar(id, dados) { /* ... */ }
  async deletar(id) { /* ... */ }
}
```

### 2. **Router Pattern** (Routes)
```javascript
// routes/usuarios.js
const router = express.Router();
router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/', auth, controller.listar);
```

### 3. **Middleware Chain**
```javascript
// Exemplo de cadeia de middlewares
app.use(cors());
app.use(express.json());
app.use('/usuarios', auth, validacao, usuariosRouter);
```

### 4. **Factory Pattern** (Geração de IDs)
```sql
-- Functions que geram IDs customizados
CREATE FUNCTION gerar_id_usuario()
CREATE FUNCTION gerar_id_evento()
```

---

## 🚀 Estratégias de Performance

### 1. **Indexes no MySQL**
```sql
-- Índices para queries frequentes
CREATE INDEX idx_email ON usuarios(email);
CREATE INDEX idx_data_evento ON eventos(data_evento);
CREATE INDEX idx_status ON eventos(status);
CREATE INDEX idx_usuario_evento ON inscricoes(usuario_id, evento_id);
```

### 2. **Views Materializadas**
```sql
-- Views para consultas complexas
CREATE VIEW vw_eventos_completos AS ...
CREATE VIEW vw_estatisticas_usuarios AS ...
```

### 3. **Stored Procedures**
```sql
-- Lógica de negócio no banco
CALL inscrever_usuario_evento(usuario_id, evento_id);
CALL relatorio_eventos_organizador(organizador_id);
```

### 4. **Connection Pooling**
```javascript
// db.js - Pool de conexões MySQL
const pool = mysql.createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST,
  // ...
});
```

---

## 🔐 Níveis de Acesso

| Grupo | ID | Tipo | Permissões |
|-------|----|----|------------|
| Admin | 1 | administrador | Acesso total ao sistema |
| Organizador | 2 | organizador | Criar/gerenciar eventos, ver inscrições |
| Participante | 3 | participante | Inscrever-se, avaliar, visualizar |

---

## 📊 Diagrama de Classes Simplificado

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Usuario    │       │  Evento     │       │  Inscricao  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id          │       │ id          │       │ id          │
│ nome        │       │ titulo      │       │ usuario_id  │◄──┐
│ email       │◄──┐   │ descricao   │◄──┐   │ evento_id   │   │
│ senha_hash  │   │   │ data_evento │   │   │ status      │   │
│ tipo        │   │   │ vagas       │   │   │ data_insc.  │   │
│ grupo_id    │   │   │ organizador │───┘   └─────────────┘   │
└─────────────┘   │   │ status      │                         │
                  │   └─────────────┘                         │
                  │                                            │
                  └────────────────────────────────────────────┘
```

---

## 🌐 API REST Endpoints

### Estrutura de URL
```
/usuarios/*           - Gestão de usuários
/eventos/*            - Gestão de eventos
/inscricoes/*         - Gestão de inscrições
/feedbacks/*          - Avaliações (MongoDB)
/material/*           - Materiais (MongoDB)
/auditoria/*          - Logs do sistema
/relatorios/*         - Relatórios gerenciais
```

---

## 🧪 Estratégia de Testes

### Tipos de Teste Implementáveis
1. **Testes Unitários**: Models e funções isoladas
2. **Testes de Integração**: Rotas + Banco de dados
3. **Testes End-to-End**: Fluxos completos (login → inscrição)
4. **Testes de Carga**: Performance com múltiplas requisições

### Ferramentas Recomendadas
- **Jest**: Framework de testes
- **Supertest**: Testes de API HTTP
- **MongoDB Memory Server**: Mock do MongoDB
- **MySQL Test Database**: Banco de testes isolado

---

## 🔄 Fluxo de Deploy

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│ Desenvolvimento│─────>│ Staging      │─────>│ Produção     │
│ (localhost)   │      │ (teste)      │      │ (servidor)   │
└──────────────┘      └──────────────┘      └──────────────┘
     │                      │                      │
     ▼                      ▼                      ▼
 MySQL local          MySQL staging          MySQL prod
 MongoDB local        MongoDB staging        MongoDB prod
```

---

## 📈 Escalabilidade Futura

### Melhorias Possíveis
1. **Microserviços**: Separar eventos, usuários, inscrições
2. **Cache**: Redis para queries frequentes
3. **CDN**: Servir assets estáticos
4. **Load Balancer**: Distribuir requisições
5. **Message Queue**: RabbitMQ para processos assíncronos
6. **ElasticSearch**: Busca avançada de eventos

---

📅 **Última atualização**: Novembro 2025
