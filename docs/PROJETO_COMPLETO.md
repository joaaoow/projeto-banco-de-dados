# 📚 Documentação Completa do Sistema

## 📦 Dependências do Projeto

```json
{
  "express": "^4.18.2",          // Framework web
  "mysql2": "^3.6.0",            // Driver MySQL
  "mongoose": "^7.5.0",          // ODM MongoDB
  "bcryptjs": "^2.4.3",          // Hash de senhas
  "jsonwebtoken": "^9.0.2",      // JWT auth
  "dotenv": "^16.3.1",           // Variáveis de ambiente
  "cors": "^2.8.5"               // CORS middleware
}
```

## 🎯 Fluxo de Autenticação

```
1. Usuário faz registro/login
2. Backend valida credenciais
3. Gera JWT token
4. Frontend armazena no localStorage
5. Todas as requisições incluem token no header
6. Middleware valida token antes de processar request
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais

#### `usuarios`
- id (VARCHAR PK)
- nome, email, senha
- tipo (ENUM: participante, organizador)
- grupo_id (FK categorias)

#### `eventos`
- id (VARCHAR PK)
- titulo, descricao
- data_evento, vagas, vagas_disponiveis
- status (ENUM: planejado, aberto, encerrado, cancelado)
- organizador_id (FK usuarios)

#### `inscricoes`
- id (INT PK)
- usuario_id, evento_id
- status (ENUM: confirmado, cancelado, presente)
- data_inscricao

### Triggers

1. **trg_usuarios_auditoria** - Audita INSERT/UPDATE/DELETE em usuarios
2. **trg_eventos_auditoria** - Audita INSERT/UPDATE/DELETE em eventos
3. **trg_inscricao_insert** - Decrementa vagas_disponiveis ao criar inscrição
4. **trg_inscricao_delete** - Incrementa vagas_disponiveis ao cancelar

### Views

1. **vw_eventos_completos** - JOIN de eventos + usuarios + categorias + count inscrições
2. **vw_estatisticas_usuarios** - Estatísticas agregadas por usuário

### Procedures

1. **inscrever_usuario_evento(usuario_id, evento_id, OUT status)** - Lógica completa de inscrição
2. **relatorio_eventos_organizador(organizador_id)** - Eventos de um organizador com estatísticas

### Functions

1. **gerar_id_usuario()** - Gera ID formato USR-YYYYMMDD-XXXXX
2. **gerar_id_evento()** - Gera ID formato EVT-YYYYMMDD-XXXXX
3. **calcular_taxa_ocupacao(evento_id)** - Calcula % de ocupação

## 🔐 Níveis de Acesso

### Participante
- ✅ Ver eventos
- ✅ Inscrever-se
- ✅ Gerenciar suas inscrições
- ❌ Criar eventos
- ❌ Ver auditoria

### Organizador
- ✅ Tudo do participante
- ✅ Criar eventos
- ✅ Editar seus eventos
- ✅ Ver inscritos em seus eventos
- ❌ Ver auditoria completa

### Admin (grupo_id = 1)
- ✅ Acesso total
- ✅ Gerenciar usuários
- ✅ Ver logs de auditoria
- ✅ Estatísticas completas
- ✅ Deletar qualquer evento

## 🎨 Arquitetura Frontend

```
Login (index.html)
    ↓
Auth JWT
    ↓
Dashboard (dashboard.html)
    ├── Eventos (todos os usuários)
    ├── Minhas Inscrições (participantes)
    ├── Meus Eventos (organizadores)
    ├── Usuários (admin)
    ├── Auditoria (admin)
    └── Estatísticas (admin)
```

## 📡 Endpoints da API

### Públicos (sem autenticação)
- POST /usuarios/register
- POST /usuarios/login

### Protegidos (requer JWT)

#### Eventos
- GET /eventos - Lista todos
- GET /eventos/:id - Detalhes
- POST /eventos - Criar (organizador)
- PUT /eventos/:id - Atualizar (organizador/owner)
- DELETE /eventos/:id - Deletar (organizador/owner)
- GET /eventos/organizador/:id - Eventos de um organizador

#### Inscrições
- GET /inscricoes - Todas (admin)
- GET /inscricoes/usuario/:id - De um usuário
- POST /inscricoes - Nova inscrição
- PUT /inscricoes/:id/cancelar - Cancelar
- DELETE /inscricoes/:id - Deletar (admin)

#### Usuários
- GET /usuarios - Todos (admin)
- GET /usuarios/:id - Por ID
- GET /usuarios/estatisticas - Estatísticas (admin)
- PUT /usuarios/:id - Atualizar
- DELETE /usuarios/:id - Deletar (admin)

## 🚀 Performance

### Índices Criados
```sql
idx_usuarios_email
idx_usuarios_tipo
idx_eventos_data
idx_eventos_organizador
idx_inscricoes_usuario
idx_inscricoes_evento
```

### Otimizações
- Views para queries complexas frequentes
- Procedures para lógica de negócio no BD
- Triggers para manter integridade
- Conexão pool para MySQL
- JWT stateless (sem session storage)

## 🔄 Fluxo de Inscrição

```
1. Usuário clica "Inscrever-se"
2. Frontend chama POST /inscricoes
3. Backend chama PROCEDURE inscrever_usuario_evento
4. Procedure valida:
   - Evento existe?
   - Evento está aberto?
   - Há vagas?
   - Usuário já inscrito?
5. Se OK: INSERT + Trigger decrementa vagas
6. Retorna status de sucesso/erro
7. Frontend atualiza UI
```

## 🎨 Design System

### Cores
```css
--primary: #8b5cf6       /* Roxo */
--secondary: #6366f1     /* Azul */
--success: #10b981       /* Verde */
--danger: #ef4444        /* Vermelho */
--warning: #f59e0b       /* Amarelo */
--info: #3b82f6          /* Azul claro */
```

### Tipografia
- Fonte: Inter (Google Fonts)
- Pesos: 400, 500, 600, 700, 800

### Componentes
- Cards com gradientes
- Botões com hover effects
- Modais animados
- Progress bars com shimmer
- Badges coloridos por status
- Alertas com ícones

## 🛠️ Manutenção

### Logs
- Console.log no servidor para debug
- Auditoria no MySQL para rastreamento

### Backup
- Pasta .backup/ para arquivos antigos
- Exportar BD regularmente

### Atualizações
- npm update (dependências)
- Testar em ambiente local
- Migrar BD se necessário

## 📝 Próximos Passos (Opcional)

- [ ] Paginação nos listagens
- [ ] Filtros avançados
- [ ] Upload de imagens
- [ ] Email notifications
- [ ] Dashboard com charts
- [ ] Export para PDF/Excel
- [ ] Testes automatizados
- [ ] Docker container
- [ ] CI/CD pipeline

---

📅 **Última atualização**: Novembro 2025
