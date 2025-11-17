# 📡 Documentação da API REST

## Base URL
```
http://localhost:3000
```

---

## 🔐 Autenticação

Todas as rotas protegidas requerem um token JWT no header:
```http
Authorization: Bearer <token>
```

---

## 👥 Usuários

### Registrar Novo Usuário
```http
POST /usuarios/register
```

**Body:**
```json
{
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "senha": "senha123",
  "tipo": "participante",
  "grupo_id": 2
}
```

**Response (201):**
```json
{
  "mensagem": "Usuário registrado com sucesso",
  "id": "USR-20251117-00001",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### Login
```http
POST /usuarios/login
```

**Body:**
```json
{
  "email": "joao@exemplo.com",
  "senha": "senha123"
}
```

**Response (200):**
```json
{
  "mensagem": "Login realizado com sucesso",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": "USR-20251117-00001",
    "nome": "João Silva",
    "email": "joao@exemplo.com",
    "tipo": "participante",
    "grupo_id": 2
  }
}
```

---

### Listar Todos os Usuários 🔒 (Admin)
```http
GET /usuarios
```

**Response (200):**
```json
{
  "total": 10,
  "usuarios": [
    {
      "id": "USR-20251117-00001",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "tipo": "participante",
      "grupo_id": 2
    }
  ]
}
```

---

### Buscar Usuário por ID 🔒
```http
GET /usuarios/:id
```

**Response (200):**
```json
{
  "id": "USR-20251117-00001",
  "nome": "João Silva",
  "email": "joao@exemplo.com",
  "tipo": "participante",
  "grupo_id": 2,
  "data_criacao": "2025-11-17T10:00:00.000Z"
}
```

---

### Estatísticas de Usuários 🔒 (Admin)
```http
GET /usuarios/estatisticas
```

**Response (200):**
```json
{
  "total": 3,
  "estatisticas": [
    {
      "id": "USR-20251117-00001",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "total_inscricoes": 5,
      "inscricoes_confirmadas": 3,
      "inscricoes_canceladas": 2
    }
  ]
}
```

---

### Atualizar Usuário 🔒
```http
PUT /usuarios/:id
```

**Body:**
```json
{
  "nome": "João Pedro Silva",
  "email": "joao.novo@exemplo.com"
}
```

**Response (200):**
```json
{
  "mensagem": "Usuário atualizado com sucesso"
}
```

---

### Deletar Usuário 🔒 (Admin)
```http
DELETE /usuarios/:id
```

**Response (200):**
```json
{
  "mensagem": "Usuário deletado com sucesso",
  "id": "USR-20251117-00001"
}
```

---

## 📅 Eventos

### Listar Todos os Eventos
```http
GET /eventos
```

**Response (200):**
```json
{
  "total": 5,
  "eventos": [
    {
      "id": "EVT-20251117-00001",
      "titulo": "Workshop de Python",
      "descricao": "Aprenda Python do zero",
      "data_evento": "2025-12-01T14:00:00.000Z",
      "vagas": 50,
      "vagas_disponiveis": 35,
      "status": "aberto",
      "organizador": "Maria Santos",
      "organizador_email": "maria@exemplo.com",
      "categoria": "Tecnologia",
      "inscritos": 15,
      "taxa_ocupacao": 30.00
    }
  ]
}
```

---

### Buscar Evento por ID
```http
GET /eventos/:id
```

**Response (200):**
```json
{
  "id": "EVT-20251117-00001",
  "titulo": "Workshop de Python",
  "descricao": "Aprenda Python do zero",
  "data_evento": "2025-12-01T14:00:00.000Z",
  "vagas": 50,
  "vagas_disponiveis": 35,
  "status": "aberto",
  "organizador": "Maria Santos",
  "organizador_email": "maria@exemplo.com",
  "inscritos": 15,
  "taxa_ocupacao": 30.00
}
```

---

### Criar Evento 🔒 (Organizador)
```http
POST /eventos
```

**Body:**
```json
{
  "titulo": "Workshop de Python",
  "descricao": "Aprenda Python do zero",
  "data_evento": "2025-12-01T14:00:00",
  "vagas": 50,
  "organizador_id": "USR-20251117-00001",
  "categoria_id": 1
}
```

**Response (201):**
```json
{
  "mensagem": "Evento criado com sucesso",
  "id": "EVT-20251117-00001",
  "titulo": "Workshop de Python",
  "data_evento": "2025-12-01T14:00:00.000Z",
  "vagas": 50
}
```

---

### Eventos Disponíveis (com vagas)
```http
GET /eventos/disponiveis/lista
```

**Response (200):**
```json
{
  "total": 3,
  "eventos": [
    {
      "id": "EVT-20251117-00001",
      "titulo": "Workshop de Python",
      "descricao": "Aprenda Python do zero",
      "data_evento": "2025-12-01T14:00:00.000Z",
      "vagas": 50,
      "organizador": "Maria Santos",
      "inscritos": 15,
      "vagas_disponiveis": 35
    }
  ]
}
```

---

### Eventos por Organizador 🔒
```http
GET /eventos/organizador/:organizador_id
```

**Response (200):**
```json
{
  "total": 2,
  "eventos": [
    {
      "id": "EVT-20251117-00001",
      "titulo": "Workshop de Python",
      "descricao": "Aprenda Python do zero",
      "data_evento": "2025-12-01T14:00:00.000Z",
      "vagas": 50,
      "vagas_totais": 50,
      "vagas_disponiveis": 35,
      "status": "aberto",
      "total_inscricoes": 15,
      "total_presentes": 0,
      "taxa_ocupacao": 30.00
    }
  ]
}
```

---

### Atualizar Evento 🔒 (Organizador/Owner)
```http
PUT /eventos/:id
```

**Body:**
```json
{
  "titulo": "Workshop Avançado de Python",
  "descricao": "Python para profissionais",
  "data_evento": "2025-12-01T14:00:00",
  "vagas": 60,
  "categoria_id": 1
}
```

**Response (200):**
```json
{
  "mensagem": "Evento atualizado com sucesso",
  "id": "EVT-20251117-00001",
  "titulo": "Workshop Avançado de Python",
  "data_evento": "2025-12-01T14:00:00.000Z",
  "vagas": 60
}
```

---

### Deletar Evento 🔒 (Organizador/Owner)
```http
DELETE /eventos/:id
```

**Response (200):**
```json
{
  "mensagem": "Evento deletado com sucesso",
  "id": "EVT-20251117-00001"
}
```

---

### Participantes do Evento 🔒
```http
GET /eventos/:id/participantes
```

**Response (200):**
```json
{
  "total": 15,
  "participantes": [
    {
      "id": "USR-20251117-00002",
      "nome": "João Silva",
      "email": "joao@exemplo.com",
      "data_inscricao": "2025-11-17T10:00:00.000Z",
      "status": "confirmado"
    }
  ]
}
```

---

## 🎫 Inscrições

### Listar Todas as Inscrições 🔒 (Admin)
```http
GET /inscricoes
```

**Response (200):**
```json
{
  "total": 25,
  "inscricoes": [
    {
      "id": 1,
      "usuario": "João Silva",
      "evento": "Workshop de Python",
      "data_inscricao": "2025-11-17T10:00:00.000Z",
      "status": "confirmado"
    }
  ]
}
```

---

### Inscrições de um Usuário 🔒
```http
GET /inscricoes/usuario/:usuario_id
```

**Response (200):**
```json
{
  "total": 3,
  "inscricoes": [
    {
      "id": 1,
      "titulo": "Workshop de Python",
      "data_evento": "2025-12-01T14:00:00.000Z",
      "status": "confirmado",
      "data_inscricao": "2025-11-17T10:00:00.000Z"
    }
  ]
}
```

---

### Criar Inscrição 🔒
```http
POST /inscricoes
```

**Body:**
```json
{
  "usuario_id": "USR-20251117-00001",
  "evento_id": "EVT-20251117-00001"
}
```

**Response (201):**
```json
{
  "mensagem": "Inscrição realizada com sucesso",
  "usuario_id": "USR-20251117-00001",
  "evento_id": "EVT-20251117-00001",
  "status": "confirmado"
}
```

**Erros Possíveis:**
- `404`: Usuário ou evento não encontrado
- `400`: Evento não está aberto / Sem vagas / Já inscrito

---

### Cancelar Inscrição 🔒
```http
PUT /inscricoes/:id/cancelar
```

**Response (200):**
```json
{
  "mensagem": "Inscrição cancelada com sucesso"
}
```

---

### Marcar Presença 🔒 (Organizador)
```http
PATCH /inscricoes/:id/presenca
```

**Response (200):**
```json
{
  "mensagem": "Presença confirmada"
}
```

---

### Deletar Inscrição 🔒 (Admin)
```http
DELETE /inscricoes/:id
```

**Response (200):**
```json
{
  "mensagem": "Inscrição deletada com sucesso"
}
```

---

## 📝 Feedbacks (MongoDB)

### Listar Todos os Feedbacks 🔒
```http
GET /feedbacks
```

**Response (200):**
```json
{
  "total": 10,
  "feedbacks": [
    {
      "_id": "674a1b2c3d4e5f6a7b8c9d0e",
      "evento_id": "EVT-20251117-00001",
      "usuario_id": "USR-20251117-00001",
      "avaliacao": 5,
      "comentario": "Excelente evento!",
      "data_feedback": "2025-11-17T15:00:00.000Z"
    }
  ]
}
```

---

### Criar Feedback 🔒
```http
POST /feedbacks
```

**Body:**
```json
{
  "evento_id": "EVT-20251117-00001",
  "usuario_id": "USR-20251117-00001",
  "avaliacao": 5,
  "comentario": "Excelente evento!"
}
```

**Response (201):**
```json
{
  "_id": "674a1b2c3d4e5f6a7b8c9d0e",
  "evento_id": "EVT-20251117-00001",
  "usuario_id": "USR-20251117-00001",
  "avaliacao": 5,
  "comentario": "Excelente evento!",
  "data_feedback": "2025-11-17T15:00:00.000Z"
}
```

---

## 📚 Materiais (MongoDB)

### Listar Todos os Materiais 🔒
```http
GET /material
```

**Response (200):**
```json
{
  "total": 5,
  "materiais": [
    {
      "_id": "674a1b2c3d4e5f6a7b8c9d0f",
      "evento_id": "EVT-20251117-00001",
      "titulo": "Slides do Workshop",
      "descricao": "Material de apoio",
      "url": "https://drive.google.com/...",
      "tipo": "slides",
      "data_upload": "2025-11-17T15:00:00.000Z"
    }
  ]
}
```

---

### Criar Material 🔒 (Organizador)
```http
POST /material
```

**Body:**
```json
{
  "evento_id": "EVT-20251117-00001",
  "titulo": "Slides do Workshop",
  "descricao": "Material de apoio",
  "url": "https://drive.google.com/...",
  "tipo": "slides"
}
```

**Response (201):**
```json
{
  "_id": "674a1b2c3d4e5f6a7b8c9d0f",
  "evento_id": "EVT-20251117-00001",
  "titulo": "Slides do Workshop",
  "descricao": "Material de apoio",
  "url": "https://drive.google.com/...",
  "tipo": "slides",
  "data_upload": "2025-11-17T15:00:00.000Z"
}
```

---

## ⚠️ Códigos de Status HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK - Sucesso |
| 201 | Created - Recurso criado |
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Não autenticado |
| 403 | Forbidden - Sem permissão |
| 404 | Not Found - Recurso não encontrado |
| 409 | Conflict - Conflito (ex: email já existe) |
| 500 | Internal Server Error - Erro no servidor |

---

## 🔐 Legenda

- **Público**: Sem autenticação necessária
- 🔒 **Protegido**: Requer token JWT
- 🔒 **(Admin)**: Apenas administradores (grupo_id = 1)
- 🔒 **(Organizador)**: Apenas organizadores ou donos do recurso
- 🔒 **(Owner)**: Apenas o dono do recurso

---

## 📌 Exemplos de Uso com cURL

### Login
```bash
curl -X POST http://localhost:3000/usuarios/login \
  -H "Content-Type: application/json" \
  -d '{"email":"joao@exemplo.com","senha":"senha123"}'
```

### Criar Evento
```bash
curl -X POST http://localhost:3000/eventos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "titulo":"Workshop de Python",
    "descricao":"Aprenda Python",
    "data_evento":"2025-12-01T14:00:00",
    "vagas":50,
    "organizador_id":"USR-20251117-00001",
    "categoria_id":1
  }'
```

### Inscrever-se em Evento
```bash
curl -X POST http://localhost:3000/inscricoes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "usuario_id":"USR-20251117-00001",
    "evento_id":"EVT-20251117-00001"
  }'
```

---

📅 **Última atualização**: Novembro 2025
