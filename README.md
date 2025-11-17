# Sistema de Gerenciamento de Eventos de Programação

Sistema completo para gerenciamento de eventos educacionais sobre programação, desenvolvido como Trabalho Final da disciplina de Laboratório de Banco de Dados. Implementa um banco de dados relacional (MySQL) com recursos avançados (triggers, views, procedures, functions) e um banco NoSQL (MongoDB) para dados semi-estruturados.

---

## 📋 Sumário

- [Características](#-características)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Execução](#-execução)
- [Documentação da API](#-documentação-da-api)
- [Banco de Dados](#-banco-de-dados)
- [Segurança](#-segurança)
- [Testes](#-testes)

---

## 🚀 Características

### Funcionalidades Principais
- ✅ Cadastro e autenticação de usuários (alunos e organizadores)
- ✅ Gerenciamento completo de eventos (CRUD)
- ✅ Sistema de inscrições com controle de vagas
- ✅ Feedback e avaliações de eventos (MongoDB)
- ✅ Materiais de apoio aos eventos (MongoDB)
- ✅ Controle de acesso baseado em grupos
- ✅ Auditoria de operações críticas

### Recursos do Banco de Dados
- **Triggers**: Auditoria automática e controle de vagas
- **Views**: Relatórios e estatísticas pré-processadas
- **Procedures**: Operações complexas encapsuladas
- **Functions**: Geração customizada de IDs e cálculos
- **Índices**: Otimização de consultas frequentes
- **Usuários e Permissões**: Controle de acesso sem root

---

## 🛠 Tecnologias Utilizadas

### Backend
- **Node.js** (v16+): Runtime JavaScript
- **Express.js** (v4): Framework web minimalista
- **JWT**: Autenticação stateless com tokens
- **bcryptjs**: Hash seguro de senhas

### Bancos de Dados
- **MySQL** (v8+): Banco relacional principal
  - Armazena dados estruturados (usuários, eventos, inscrições)
  - Triggers para auditoria e validações
  - Views para relatórios
  - Procedures e Functions para lógica de negócio
  
- **MongoDB** (v5+): Banco NoSQL para dados semi-estruturados
  - Armazena feedbacks com tags e comentários
  - Materiais de eventos (arquivos base64, links)
  - Flexibilidade para dados não padronizados

### Frontend
- **HTML5/CSS3/JavaScript**: Interface web simples e funcional
- Localizado na pasta `public/`

---

## 📁 Estrutura do Projeto

```
projeto-banco-de-dados/
├── database/
│   └── schema.sql          # Script completo do banco MySQL
├── middleware/
│   └── auth.js             # Middlewares de autenticação/autorização
├── models/
│   ├── mongo/
│   │   ├── feedbackModel.js   # Schema Mongoose para feedbacks
│   │   └── materialModel.js   # Schema Mongoose para materiais
│   └── mysql/              # (opcional) Models para MySQL
├── routes/
│   ├── auth.js             # Rotas de autenticação (register, login)
│   ├── usuarios.js         # CRUD de usuários
│   ├── eventos.js          # CRUD de eventos
│   ├── inscricoes.js       # Gerenciamento de inscrições
│   ├── feedbacks.js        # Avaliações (MongoDB)
│   └── material.js         # Materiais de apoio (MongoDB)
├── public/                 # Frontend (HTML/CSS/JS)
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── db.js                   # Conexão com MySQL e MongoDB
├── server.js               # Configuração do servidor Express
├── package.json            # Dependências do projeto
├── .env.example            # Exemplo de variáveis de ambiente
├── .gitignore              # Arquivos ignorados pelo git
└── README.md               # Este arquivo

```

---

## ✅ Pré-requisitos

- **Node.js** v16+ e npm ([Download](https://nodejs.org/))
- **MySQL** v8+ ([Download](https://dev.mysql.com/downloads/))
- **MongoDB** v5+ ([Download](https://www.mongodb.com/try/download/community))
- **Git** ([Download](https://git-scm.com/))

---

## 📦 Instalação

### 1. Clone o repositório

```bash
git clone https://github.com/joaaoow/projeto-banco-de-dados.git
cd projeto-banco-de-dados
```

### 2. Instale as dependências

```bash
npm install
```

### 3. Configure o banco de dados MySQL

```bash
# Conecte ao MySQL (com root apenas para configuração inicial)
mysql -u root -p

# Execute o script de criação
mysql -u root -p < database/schema.sql
```

O script cria:
- Banco de dados `eventosdb`
- Todas as tabelas com relacionamentos
- Triggers, Views, Procedures e Functions
- Usuários: `admin_eventos`, `app_eventos`, `readonly_eventos`
- Dados iniciais (grupos e categorias)

### 4. Inicie o MongoDB

```bash
# Windows (instalado como serviço)
net start MongoDB

# Linux/Mac
sudo systemctl start mongod

# Ou via Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

---

## ⚙️ Configuração

### 1. Crie o arquivo `.env`

```bash
cp .env.example .env
```

### 2. Edite `.env` com suas configurações

```env
# Servidor
PORT=3000

# MySQL (use o usuário app_eventos criado pelo script)
MYSQL_HOST=localhost
MYSQL_USER=app_eventos
MYSQL_PASSWORD=App@2024!
MYSQL_DATABASE=eventosdb

# MongoDB
MONGO_URL=mongodb://localhost:27017/eventosdb

# JWT (em produção, use uma chave forte)
JWT_SECRET=sua-chave-secreta-aqui
```

**⚠️ IMPORTANTE**: 
- Nunca use o usuário `root` do MySQL em produção
- Em produção, gere uma chave JWT forte:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```

---

## 🚀 Execução

### Modo Desenvolvimento (com auto-reload)

```bash
npm run dev
```

### Modo Produção

```bash
npm start
```

Servidor rodando em: `http://localhost:3000`

---

## 📚 Documentação da API

### Autenticação (Públicas)

#### Registrar Usuário
```http
POST /auth/register
Content-Type: application/json

{
  "nome": "João Silva",
  "email": "joao@example.com",
  "senha": "senha123",
  "tipo": "aluno"  // ou "organizador"
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "joao@example.com",
  "senha": "senha123"
}

Resposta:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": { ... }
}
```

### Rotas Protegidas (Requerem Token)

**Adicione o token no header:**
```http
Authorization: Bearer SEU_TOKEN_AQUI
```

#### Usuários

```http
GET    /usuarios              # Listar todos
GET    /usuarios/:id          # Buscar por ID
PUT    /usuarios/:id          # Atualizar
DELETE /usuarios/:id          # Deletar
GET    /usuarios/tipo/:tipo   # Filtrar por tipo
```

#### Eventos

```http
GET    /eventos                        # Listar todos
GET    /eventos/:id                    # Buscar por ID
POST   /eventos                        # Criar (só organizador)
PUT    /eventos/:id                    # Atualizar
DELETE /eventos/:id                    # Deletar
GET    /eventos/disponiveis/lista      # Eventos com vagas
GET    /eventos/:id/participantes      # Lista de inscritos
```

#### Inscrições

```http
GET    /inscricoes                     # Listar todas
POST   /inscricoes                     # Criar inscrição
PUT    /inscricoes/:id/cancelar        # Cancelar
PATCH  /inscricoes/:id/presenca        # Marcar presença
DELETE /inscricoes/:id                 # Deletar
```

#### Feedbacks (MongoDB)

```http
GET    /feedbacks                      # Listar todos
POST   /feedbacks                      # Criar feedback
GET    /feedbacks/evento/:evento_id    # Por evento
GET    /feedbacks/evento/:evento_id/media  # Média de notas
PUT    /feedbacks/:id                  # Atualizar
DELETE /feedbacks/:id                  # Deletar
```

#### Materiais (MongoDB)

```http
GET    /material                       # Listar todos
POST   /material                       # Criar material
GET    /material/evento/:evento_id     # Por evento
PUT    /material/:id/download          # Incrementar downloads
```

---

## 🗄️ Banco de Dados

### MySQL - Estrutura

#### Tabelas Principais
- `grupos_usuarios`: Grupos de acesso (admin, organizador, aluno)
- `usuarios`: Dados dos usuários
- `categorias`: Categorias de eventos
- `eventos`: Eventos de programação
- `inscricoes`: Inscrições de usuários em eventos
- `auditoria`: Log de operações críticas

#### Triggers Implementados
1. **trg_auditoria_usuarios_update**: Registra alterações em usuários
2. **trg_atualizar_vagas_cancelamento**: Atualiza vagas ao cancelar/reativar inscrição
3. **trg_inicializar_vagas_evento**: Define vagas_disponiveis = vagas ao criar evento
4. **trg_auditoria_eventos_delete**: Registra exclusão de eventos

#### Views Implementadas
1. **vw_eventos_completos**: Eventos com estatísticas completas
2. **vw_estatisticas_usuarios**: Estatísticas por grupo de usuário

#### Procedures
1. **inscrever_usuario_evento**: Inscrição com validações transacionais
2. **relatorio_eventos_organizador**: Relatório completo por organizador

#### Functions
1. **gerar_id_usuario()**: Gera IDs customizados (USR-YYYYMMDD-XXXXX)
2. **gerar_id_evento()**: Gera IDs customizados (EVT-YYYYMMDD-XXXXX)
3. **calcular_taxa_ocupacao()**: Calcula % de ocupação de evento

#### Índices Justificados
- `idx_email`: Login e verificação de unicidade (alta frequência)
- `idx_data_evento`: Ordenação e filtros por data
- `idx_vagas_disponiveis`: Busca de eventos disponíveis
- `unique_inscricao`: Garante unicidade de inscrição

### MongoDB - Justificativa

**Por que MongoDB para Feedbacks e Materiais?**

1. **Estrutura Flexível**: Feedbacks podem ter tags variáveis, comentários de tamanhos diversos
2. **Sem Schema Rígido**: Materiais podem ser arquivos, links ou ambos
3. **Escalabilidade**: Feedbacks crescem rapidamente, MongoDB escala horizontalmente
4. **Performance**: Leitura rápida de avaliações e materiais sem JOINs
5. **Agregações**: Pipeline de agregação para cálculo de médias e estatísticas

---

## 🔒 Segurança

### Autenticação
- **JWT** com expiração de 24h
- Senhas com **bcrypt** (salt rounds = 10)
- Tokens no header `Authorization: Bearer <token>`

### Controle de Acesso
- **Níveis hierárquicos**:
  - Admin (nível 1): Acesso total
  - Organizador (nível 2): Cria e gerencia eventos
  - Aluno (nível 3): Inscrições e feedback

### Usuários do Banco
- `admin_eventos`: Administração do BD (DBA tasks)
- `app_eventos`: Aplicação (CRUD + procedures)
- `readonly_eventos`: Apenas leitura (relatórios)

**❌ NÃO USE ROOT EM PRODUÇÃO**

---

## 🧪 Testes

### Teste Manual com curl

```bash
# 1. Registrar
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nome":"Teste","email":"teste@example.com","senha":"123456","tipo":"aluno"}'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"teste@example.com","senha":"123456"}'

# 3. Listar eventos (use o token retornado)
curl http://localhost:3000/eventos \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Teste com Postman
1. Importe a coleção `docs/postman_collection.json` (se disponível)
2. Configure variável `{{baseURL}}` = `http://localhost:3000`
3. Execute os testes na ordem: Auth → Eventos → Inscrições

---

## 📖 Documentação Adicional

- [Arquitetura do Sistema](docs/arquitetura.md)
- [API Detalhada](docs/API.md)
- [Bancos de Dados](docs/bancos.md)
- [Frontend](docs/front.md)
- [Testes](docs/testes.md)

---

## 👥 Autores

- Equipe do Trabalho Final - Laboratório de Banco de Dados

---

## 📄 Licença

Este projeto foi desenvolvido para fins acadêmicos.

---

## 🆘 Suporte

Em caso de dúvidas ou problemas:
1. Verifique se todos os serviços estão rodando (MySQL, MongoDB, Node)
2. Confira as configurações no `.env`
3. Consulte os logs do servidor (`npm start`)
4. Revise a documentação do banco em `database/schema.sql`