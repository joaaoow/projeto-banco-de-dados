# 🧪 Documentação de Testes

## 🎯 Estratégia de Testes

Este documento descreve a estratégia de testes para o Sistema de Gestão de Eventos, incluindo testes unitários, de integração e end-to-end.

---

## 📋 Tipos de Testes

### 1. **Testes Unitários**
Testam componentes isolados (funções, models, utils).

### 2. **Testes de Integração**
Testam a interação entre componentes (rotas + models + banco de dados).

### 3. **Testes End-to-End (E2E)**
Testam fluxos completos de usuário.

### 4. **Testes de Carga**
Testam performance sob alta demanda.

---

## 🛠️ Ferramentas Recomendadas

| Ferramenta | Finalidade | Instalação |
|------------|------------|------------|
| **Jest** | Framework de testes | `npm install --save-dev jest` |
| **Supertest** | Testes de API HTTP | `npm install --save-dev supertest` |
| **MongoDB Memory Server** | Mock do MongoDB | `npm install --save-dev mongodb-memory-server` |
| **Artillery** | Testes de carga | `npm install --save-dev artillery` |
| **@faker-js/faker** | Geração de dados fake | `npm install --save-dev @faker-js/faker` |

---

## 📦 Configuração do Jest

### **package.json**
```json
{
  "scripts": {
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "jest --testPathPattern=e2e"
  },
  "jest": {
    "testEnvironment": "node",
    "coverageDirectory": "coverage",
    "collectCoverageFrom": [
      "models/**/*.js",
      "routes/**/*.js",
      "middleware/**/*.js",
      "!**/node_modules/**"
    ],
    "testMatch": [
      "**/__tests__/**/*.test.js"
    ]
  }
}
```

### **jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'models/**/*.js',
    'routes/**/*.js',
    'middleware/**/*.js'
  ],
  testMatch: ['**/__tests__/**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.js'],
  testTimeout: 10000
};
```

---

## 🧪 Estrutura de Testes

```
__tests__/
├── setup.js                    # Configuração global dos testes
├── teardown.js                 # Limpeza após testes
├── unit/                       # Testes unitários
│   ├── models/
│   │   ├── usuarioModel.test.js
│   │   ├── eventoModel.test.js
│   │   └── inscricaoModel.test.js
│   ├── middleware/
│   │   └── auth.test.js
│   └── utils/
│       └── validators.test.js
├── integration/                # Testes de integração
│   ├── usuarios.test.js
│   ├── eventos.test.js
│   ├── inscricoes.test.js
│   └── feedbacks.test.js
├── e2e/                        # Testes end-to-end
│   ├── fluxo-inscricao.test.js
│   ├── fluxo-organizador.test.js
│   └── fluxo-admin.test.js
└── load/                       # Testes de carga
    └── artillery.yml
```

---

## 🔧 Setup e Teardown

### **__tests__/setup.js**
```javascript
const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mysqlConnection;
let mongoServer;

beforeAll(async () => {
  // Configurar MySQL de teste
  mysqlConnection = await mysql.createConnection({
    host: process.env.DB_HOST_TEST || 'localhost',
    user: process.env.DB_USER_TEST || 'root',
    password: process.env.DB_PASSWORD_TEST || '',
    database: process.env.DB_NAME_TEST || 'gestao_eventos_test'
  });
  
  // Criar schema de teste
  const schema = require('../database/schema.sql');
  await mysqlConnection.query(schema);
  
  // Configurar MongoDB em memória
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
  
  console.log('✅ Ambiente de teste configurado');
});

afterAll(async () => {
  // Limpar MySQL
  await mysqlConnection.query('DROP DATABASE IF EXISTS gestao_eventos_test');
  await mysqlConnection.end();
  
  // Limpar MongoDB
  await mongoose.connection.close();
  await mongoServer.stop();
  
  console.log('✅ Ambiente de teste limpo');
});

afterEach(async () => {
  // Limpar dados entre testes
  await mysqlConnection.query('DELETE FROM inscricoes');
  await mysqlConnection.query('DELETE FROM eventos');
  await mysqlConnection.query('DELETE FROM usuarios');
  await mongoose.connection.dropDatabase();
});
```

---

## 🧪 Exemplos de Testes

### **1. Teste Unitário - Model de Usuário**

**__tests__/unit/models/usuarioModel.test.js**
```javascript
const UsuarioModel = require('../../../models/mysql/usuarioModel');
const bcrypt = require('bcryptjs');

describe('UsuarioModel', () => {
  describe('criar', () => {
    it('deve criar um novo usuário com senha hash', async () => {
      const dadosUsuario = {
        nome: 'João Silva',
        email: 'joao@teste.com',
        senha: 'senha123',
        tipo: 'participante',
        grupo_id: 3
      };
      
      const usuario = await UsuarioModel.criar(dadosUsuario);
      
      expect(usuario).toHaveProperty('id');
      expect(usuario.nome).toBe('João Silva');
      expect(usuario.email).toBe('joao@teste.com');
      expect(usuario.senha_hash).not.toBe('senha123');
      
      // Verificar se a senha foi hashada corretamente
      const senhaValida = await bcrypt.compare('senha123', usuario.senha_hash);
      expect(senhaValida).toBe(true);
    });
    
    it('deve gerar ID no formato correto', async () => {
      const dadosUsuario = {
        nome: 'Maria Santos',
        email: 'maria@teste.com',
        senha: 'senha123',
        tipo: 'organizador',
        grupo_id: 2
      };
      
      const usuario = await UsuarioModel.criar(dadosUsuario);
      
      expect(usuario.id).toMatch(/^USR-\d{8}-\d{5}$/);
    });
    
    it('deve lançar erro ao criar usuário com email duplicado', async () => {
      const dadosUsuario = {
        nome: 'Pedro Costa',
        email: 'pedro@teste.com',
        senha: 'senha123',
        tipo: 'participante',
        grupo_id: 3
      };
      
      await UsuarioModel.criar(dadosUsuario);
      
      await expect(UsuarioModel.criar(dadosUsuario))
        .rejects
        .toThrow('Email já está em uso');
    });
  });
  
  describe('buscarPorEmail', () => {
    it('deve retornar usuário quando email existe', async () => {
      await UsuarioModel.criar({
        nome: 'Ana Lima',
        email: 'ana@teste.com',
        senha: 'senha123',
        tipo: 'participante',
        grupo_id: 3
      });
      
      const usuario = await UsuarioModel.buscarPorEmail('ana@teste.com');
      
      expect(usuario).not.toBeNull();
      expect(usuario.email).toBe('ana@teste.com');
    });
    
    it('deve retornar null quando email não existe', async () => {
      const usuario = await UsuarioModel.buscarPorEmail('naoexiste@teste.com');
      expect(usuario).toBeNull();
    });
  });
});
```

---

### **2. Teste de Integração - Rota de Eventos**

**__tests__/integration/eventos.test.js**
```javascript
const request = require('supertest');
const app = require('../../server');
const jwt = require('jsonwebtoken');

describe('Rotas de Eventos', () => {
  let tokenOrganizador;
  let tokenParticipante;
  let organizadorId;
  
  beforeEach(async () => {
    // Criar usuário organizador
    const resOrg = await request(app)
      .post('/usuarios/register')
      .send({
        nome: 'Organizador Teste',
        email: 'org@teste.com',
        senha: 'senha123',
        tipo: 'organizador',
        grupo_id: 2
      });
    
    tokenOrganizador = resOrg.body.token;
    organizadorId = resOrg.body.id;
    
    // Criar usuário participante
    const resPart = await request(app)
      .post('/usuarios/register')
      .send({
        nome: 'Participante Teste',
        email: 'part@teste.com',
        senha: 'senha123',
        tipo: 'participante',
        grupo_id: 3
      });
    
    tokenParticipante = resPart.body.token;
  });
  
  describe('POST /eventos', () => {
    it('deve criar um novo evento (organizador)', async () => {
      const novoEvento = {
        titulo: 'Workshop de Node.js',
        descricao: 'Aprenda Node.js do zero',
        data_evento: '2025-12-01T14:00:00',
        vagas: 30,
        organizador_id: organizadorId,
        categoria_id: 1
      };
      
      const res = await request(app)
        .post('/eventos')
        .set('Authorization', `Bearer ${tokenOrganizador}`)
        .send(novoEvento);
      
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.titulo).toBe('Workshop de Node.js');
      expect(res.body.vagas).toBe(30);
    });
    
    it('deve retornar 401 sem autenticação', async () => {
      const novoEvento = {
        titulo: 'Workshop de Node.js',
        descricao: 'Aprenda Node.js do zero',
        data_evento: '2025-12-01T14:00:00',
        vagas: 30,
        organizador_id: organizadorId,
        categoria_id: 1
      };
      
      const res = await request(app)
        .post('/eventos')
        .send(novoEvento);
      
      expect(res.status).toBe(401);
    });
    
    it('deve retornar 400 com dados inválidos', async () => {
      const eventoInvalido = {
        titulo: 'Workshop',
        // faltando campos obrigatórios
      };
      
      const res = await request(app)
        .post('/eventos')
        .set('Authorization', `Bearer ${tokenOrganizador}`)
        .send(eventoInvalido);
      
      expect(res.status).toBe(400);
    });
  });
  
  describe('GET /eventos', () => {
    beforeEach(async () => {
      // Criar eventos de teste
      await request(app)
        .post('/eventos')
        .set('Authorization', `Bearer ${tokenOrganizador}`)
        .send({
          titulo: 'Evento 1',
          descricao: 'Descrição 1',
          data_evento: '2025-12-01T14:00:00',
          vagas: 30,
          organizador_id: organizadorId,
          categoria_id: 1
        });
      
      await request(app)
        .post('/eventos')
        .set('Authorization', `Bearer ${tokenOrganizador}`)
        .send({
          titulo: 'Evento 2',
          descricao: 'Descrição 2',
          data_evento: '2025-12-15T14:00:00',
          vagas: 50,
          organizador_id: organizadorId,
          categoria_id: 1
        });
    });
    
    it('deve listar todos os eventos', async () => {
      const res = await request(app).get('/eventos');
      
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(2);
      expect(res.body.eventos).toHaveLength(2);
    });
    
    it('deve retornar eventos com dados completos', async () => {
      const res = await request(app).get('/eventos');
      
      const evento = res.body.eventos[0];
      expect(evento).toHaveProperty('id');
      expect(evento).toHaveProperty('titulo');
      expect(evento).toHaveProperty('descricao');
      expect(evento).toHaveProperty('organizador');
      expect(evento).toHaveProperty('vagas_disponiveis');
      expect(evento).toHaveProperty('taxa_ocupacao');
    });
  });
  
  describe('DELETE /eventos/:id', () => {
    let eventoId;
    
    beforeEach(async () => {
      const res = await request(app)
        .post('/eventos')
        .set('Authorization', `Bearer ${tokenOrganizador}`)
        .send({
          titulo: 'Evento para Deletar',
          descricao: 'Será deletado',
          data_evento: '2025-12-01T14:00:00',
          vagas: 30,
          organizador_id: organizadorId,
          categoria_id: 1
        });
      
      eventoId = res.body.id;
    });
    
    it('deve deletar evento (organizador dono)', async () => {
      const res = await request(app)
        .delete(`/eventos/${eventoId}`)
        .set('Authorization', `Bearer ${tokenOrganizador}`);
      
      expect(res.status).toBe(200);
      expect(res.body.mensagem).toContain('deletado com sucesso');
    });
    
    it('deve retornar 403 se não for o dono', async () => {
      const res = await request(app)
        .delete(`/eventos/${eventoId}`)
        .set('Authorization', `Bearer ${tokenParticipante}`);
      
      expect(res.status).toBe(403);
    });
  });
});
```

---

### **3. Teste End-to-End - Fluxo de Inscrição**

**__tests__/e2e/fluxo-inscricao.test.js**
```javascript
const request = require('supertest');
const app = require('../../server');

describe('Fluxo Completo de Inscrição', () => {
  it('deve completar o fluxo: registro → login → criar evento → inscrição', async () => {
    // 1. Registrar organizador
    const resOrg = await request(app)
      .post('/usuarios/register')
      .send({
        nome: 'Organizador',
        email: 'org@fluxo.com',
        senha: 'senha123',
        tipo: 'organizador',
        grupo_id: 2
      });
    
    expect(resOrg.status).toBe(201);
    const tokenOrg = resOrg.body.token;
    const orgId = resOrg.body.id;
    
    // 2. Registrar participante
    const resPart = await request(app)
      .post('/usuarios/register')
      .send({
        nome: 'Participante',
        email: 'part@fluxo.com',
        senha: 'senha123',
        tipo: 'participante',
        grupo_id: 3
      });
    
    expect(resPart.status).toBe(201);
    const tokenPart = resPart.body.token;
    const partId = resPart.body.id;
    
    // 3. Organizador cria evento
    const resEvento = await request(app)
      .post('/eventos')
      .set('Authorization', `Bearer ${tokenOrg}`)
      .send({
        titulo: 'Evento Teste E2E',
        descricao: 'Teste completo',
        data_evento: '2025-12-01T14:00:00',
        vagas: 10,
        organizador_id: orgId,
        categoria_id: 1
      });
    
    expect(resEvento.status).toBe(201);
    const eventoId = resEvento.body.id;
    
    // 4. Participante se inscreve
    const resInscricao = await request(app)
      .post('/inscricoes')
      .set('Authorization', `Bearer ${tokenPart}`)
      .send({
        usuario_id: partId,
        evento_id: eventoId
      });
    
    expect(resInscricao.status).toBe(201);
    expect(resInscricao.body.mensagem).toContain('sucesso');
    
    // 5. Verificar que vaga foi decrementada
    const resEventoAtualizado = await request(app)
      .get(`/eventos/${eventoId}`);
    
    expect(resEventoAtualizado.body.vagas_disponiveis).toBe(9);
    
    // 6. Verificar inscrição na lista do participante
    const resMinhasInscricoes = await request(app)
      .get(`/inscricoes/usuario/${partId}`)
      .set('Authorization', `Bearer ${tokenPart}`);
    
    expect(resMinhasInscricoes.body.total).toBe(1);
    expect(resMinhasInscricoes.body.inscricoes[0].titulo).toBe('Evento Teste E2E');
    
    // 7. Cancelar inscrição
    const inscricaoId = resMinhasInscricoes.body.inscricoes[0].id;
    const resCancelamento = await request(app)
      .put(`/inscricoes/${inscricaoId}/cancelar`)
      .set('Authorization', `Bearer ${tokenPart}`);
    
    expect(resCancelamento.status).toBe(200);
    
    // 8. Verificar que vaga foi restaurada
    const resEventoFinal = await request(app)
      .get(`/eventos/${eventoId}`);
    
    expect(resEventoFinal.body.vagas_disponiveis).toBe(10);
  });
});
```

---

### **4. Teste de Middleware - Autenticação**

**__tests__/unit/middleware/auth.test.js**
```javascript
const jwt = require('jsonwebtoken');
const auth = require('../../../middleware/auth');

describe('Middleware de Autenticação', () => {
  let req, res, next;
  
  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });
  
  it('deve chamar next() com token válido', () => {
    const payload = { id: 'USR-20251117-00001', email: 'teste@teste.com' };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    
    req.headers.authorization = `Bearer ${token}`;
    
    auth(req, res, next);
    
    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual(expect.objectContaining(payload));
  });
  
  it('deve retornar 401 sem token', () => {
    auth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ mensagem: 'Token não fornecido' })
    );
    expect(next).not.toHaveBeenCalled();
  });
  
  it('deve retornar 403 com token inválido', () => {
    req.headers.authorization = 'Bearer token_invalido';
    
    auth(req, res, next);
    
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });
});
```

---

## 📊 Teste de Carga com Artillery

### **__tests__/load/artillery.yml**
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 100
      name: "Sustained load"
  processor: "./processor.js"

scenarios:
  - name: "Fluxo completo de usuário"
    flow:
      - post:
          url: "/usuarios/register"
          json:
            nome: "{{ $randomString() }}"
            email: "{{ $randomString() }}@teste.com"
            senha: "senha123"
            tipo: "participante"
            grupo_id: 3
          capture:
            - json: "$.token"
              as: "token"
      
      - get:
          url: "/eventos"
          headers:
            Authorization: "Bearer {{ token }}"
      
      - get:
          url: "/eventos/disponiveis/lista"
          headers:
            Authorization: "Bearer {{ token }}"
```

**Executar teste de carga:**
```bash
npx artillery run __tests__/load/artillery.yml
```

---

## 📈 Cobertura de Testes

### **Metas de Cobertura**
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

### **Gerar Relatório de Cobertura**
```bash
npm test -- --coverage
```

**Visualizar relatório HTML:**
```bash
open coverage/lcov-report/index.html
```

---

## ✅ Checklist de Testes

### **Funcionalidades a Testar**

#### **Autenticação**
- [ ] Registro de usuário com dados válidos
- [ ] Registro com email duplicado (deve falhar)
- [ ] Login com credenciais válidas
- [ ] Login com credenciais inválidas (deve falhar)
- [ ] Acesso a rotas protegidas sem token (deve falhar)
- [ ] Acesso a rotas protegidas com token inválido (deve falhar)

#### **Eventos**
- [ ] Criar evento (organizador)
- [ ] Criar evento (participante - deve falhar)
- [ ] Listar todos os eventos
- [ ] Buscar evento por ID
- [ ] Atualizar evento (dono)
- [ ] Atualizar evento (não-dono - deve falhar)
- [ ] Deletar evento (dono)
- [ ] Deletar evento (não-dono - deve falhar)

#### **Inscrições**
- [ ] Inscrever em evento aberto
- [ ] Inscrever em evento sem vagas (deve falhar)
- [ ] Inscrever em evento encerrado (deve falhar)
- [ ] Inscrição duplicada (deve falhar)
- [ ] Cancelar inscrição
- [ ] Verificar decremento de vagas após inscrição
- [ ] Verificar incremento de vagas após cancelamento

#### **Triggers**
- [ ] Geração automática de ID de usuário
- [ ] Geração automática de ID de evento
- [ ] Registro de auditoria após INSERT
- [ ] Registro de auditoria após UPDATE
- [ ] Registro de auditoria após DELETE

#### **Procedures**
- [ ] `inscrever_usuario_evento` - sucesso
- [ ] `inscrever_usuario_evento` - sem vagas (deve falhar)
- [ ] `inscrever_usuario_evento` - já inscrito (deve falhar)
- [ ] `relatorio_eventos_organizador` - retorna dados corretos

#### **Functions**
- [ ] `calcular_taxa_ocupacao` - evento vazio (0%)
- [ ] `calcular_taxa_ocupacao` - evento cheio (100%)
- [ ] `calcular_taxa_ocupacao` - evento parcial

---

## 🚀 CI/CD - Integração Contínua

### **GitHub Actions - .github/workflows/tests.yml**
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: gestao_eventos_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '16'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        env:
          DB_HOST_TEST: 127.0.0.1
          DB_USER_TEST: root
          DB_PASSWORD_TEST: password
          DB_NAME_TEST: gestao_eventos_test
          JWT_SECRET: test_secret
        run: npm test
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

## 📝 Boas Práticas

### **1. Nomenclatura de Testes**
```javascript
// ✅ BOM
it('deve criar um novo usuário com senha hashada', () => {});
it('deve retornar 404 quando evento não existe', () => {});

// ❌ RUIM
it('teste de usuário', () => {});
it('funciona', () => {});
```

### **2. Arrange-Act-Assert (AAA)**
```javascript
it('deve inscrever usuário em evento', async () => {
  // Arrange (Preparar)
  const usuario = await criarUsuario();
  const evento = await criarEvento();
  
  // Act (Agir)
  const resultado = await inscreverUsuario(usuario.id, evento.id);
  
  // Assert (Afirmar)
  expect(resultado.status).toBe('confirmado');
  expect(resultado.evento_id).toBe(evento.id);
});
```

### **3. Isolar Testes**
- Cada teste deve ser independente
- Use `beforeEach` para preparar dados
- Use `afterEach` para limpar dados

### **4. Testes Rápidos**
- Mock de APIs externas
- Use banco em memória quando possível
- Evite delays desnecessários

---

📅 **Última atualização**: Novembro 2025
