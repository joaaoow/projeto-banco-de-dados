# 💾 Documentação de Bancos de Dados

## 🗄️ Arquitetura de Dados Híbrida

Este projeto utiliza uma **arquitetura híbrida** de bancos de dados:
- **MySQL 8+**: Dados estruturados e relacionais
- **MongoDB 5+**: Dados semi-estruturados e flexíveis

---

## 📊 MySQL - Banco Relacional

### 🔧 Configuração

**Requisitos:**
- MySQL 8.0 ou superior
- Modo SQL: `ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION`

**Configuração (.env):**
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha
DB_NAME=gestao_eventos
DB_PORT=3306
```

---

## 📋 Estrutura de Tabelas

### 1. **Tabela: `grupos`**
Define os níveis de acesso no sistema.

```sql
CREATE TABLE grupos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  descricao TEXT
);
```

**Dados Padrão:**
| id | nome | descricao |
|----|------|-----------|
| 1 | Administrador | Acesso total ao sistema |
| 2 | Organizador | Pode criar e gerenciar eventos |
| 3 | Participante | Pode se inscrever em eventos |

---

### 2. **Tabela: `usuarios`**
Armazena dados de todos os usuários do sistema.

```sql
CREATE TABLE usuarios (
  id VARCHAR(20) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  tipo ENUM('administrador', 'organizador', 'participante') NOT NULL,
  grupo_id INT NOT NULL,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (grupo_id) REFERENCES grupos(id)
);
```

**Campos:**
- `id`: Formato `USR-YYYYMMDD-XXXXX` (gerado automaticamente)
- `senha_hash`: Hash bcrypt da senha (nunca armazenada em texto plano)
- `tipo`: Define o tipo de usuário
- `grupo_id`: Referência ao nível de permissão

**Índices:**
```sql
CREATE INDEX idx_email ON usuarios(email);
CREATE INDEX idx_tipo ON usuarios(tipo);
```

---

### 3. **Tabela: `categorias`**
Classificação dos eventos.

```sql
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  descricao TEXT
);
```

**Exemplos de Categorias:**
- Tecnologia
- Esportes
- Cultura
- Educação
- Negócios

---

### 4. **Tabela: `eventos`**
Informações sobre os eventos do sistema.

```sql
CREATE TABLE eventos (
  id VARCHAR(20) PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  data_evento DATETIME NOT NULL,
  vagas INT NOT NULL CHECK (vagas > 0),
  vagas_disponiveis INT,
  organizador_id VARCHAR(20) NOT NULL,
  categoria_id INT NOT NULL,
  status ENUM('planejado', 'aberto', 'encerrado', 'cancelado') DEFAULT 'aberto',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organizador_id) REFERENCES usuarios(id),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);
```

**Campos:**
- `id`: Formato `EVT-YYYYMMDD-XXXXX` (gerado automaticamente)
- `vagas_disponiveis`: Atualizado automaticamente por triggers
- `status`: Controla o ciclo de vida do evento

**Índices:**
```sql
CREATE INDEX idx_data_evento ON eventos(data_evento);
CREATE INDEX idx_status ON eventos(status);
CREATE INDEX idx_organizador ON eventos(organizador_id);
```

---

### 5. **Tabela: `inscricoes`**
Relacionamento entre usuários e eventos.

```sql
CREATE TABLE inscricoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id VARCHAR(20) NOT NULL,
  evento_id VARCHAR(20) NOT NULL,
  data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmado', 'cancelado') DEFAULT 'confirmado',
  presenca BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  UNIQUE KEY uk_usuario_evento (usuario_id, evento_id)
);
```

**Campos:**
- `presenca`: Marcado pelo organizador durante o evento
- `status`: Permite cancelamento de inscrições
- `uk_usuario_evento`: Impede inscrições duplicadas

**Índices:**
```sql
CREATE INDEX idx_usuario_inscricao ON inscricoes(usuario_id);
CREATE INDEX idx_evento_inscricao ON inscricoes(evento_id);
CREATE INDEX idx_status_inscricao ON inscricoes(status);
```

---

### 6. **Tabela: `auditoria`**
Registra ações críticas no sistema.

```sql
CREATE TABLE auditoria (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tabela VARCHAR(50) NOT NULL,
  operacao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  usuario_id VARCHAR(20),
  registro_id VARCHAR(50),
  dados_antigos JSON,
  dados_novos JSON,
  data_operacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

**Campos:**
- `tabela`: Nome da tabela afetada
- `dados_antigos`/`dados_novos`: JSON com os dados antes/depois
- Permite rastreamento completo de alterações

**Índices:**
```sql
CREATE INDEX idx_tabela_auditoria ON auditoria(tabela);
CREATE INDEX idx_data_auditoria ON auditoria(data_operacao);
CREATE INDEX idx_usuario_auditoria ON auditoria(usuario_id);
```

---

## ⚡ Triggers (Gatilhos Automáticos)

### 1. **Trigger: `before_insert_usuario`**
Gera ID automático para novos usuários.

```sql
CREATE TRIGGER before_insert_usuario
BEFORE INSERT ON usuarios
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = gerar_id_usuario();
  END IF;
END;
```

**Função auxiliar:**
```sql
CREATE FUNCTION gerar_id_usuario()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE novo_id VARCHAR(20);
  DECLARE contador INT;
  
  SELECT COUNT(*) + 1 INTO contador
  FROM usuarios
  WHERE DATE(data_criacao) = CURDATE();
  
  SET novo_id = CONCAT('USR-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(contador, 5, '0'));
  RETURN novo_id;
END;
```

**Exemplo de ID gerado:** `USR-20251117-00001`

---

### 2. **Trigger: `before_insert_evento`**
Gera ID automático e inicializa vagas disponíveis.

```sql
CREATE TRIGGER before_insert_evento
BEFORE INSERT ON eventos
FOR EACH ROW
BEGIN
  IF NEW.id IS NULL OR NEW.id = '' THEN
    SET NEW.id = gerar_id_evento();
  END IF;
  SET NEW.vagas_disponiveis = NEW.vagas;
END;
```

**Função auxiliar:**
```sql
CREATE FUNCTION gerar_id_evento()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  DECLARE novo_id VARCHAR(20);
  DECLARE contador INT;
  
  SELECT COUNT(*) + 1 INTO contador
  FROM eventos
  WHERE DATE(data_criacao) = CURDATE();
  
  SET novo_id = CONCAT('EVT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(contador, 5, '0'));
  RETURN novo_id;
END;
```

---

### 3. **Trigger: `after_insert_inscricao`**
Decrementa vagas disponíveis após inscrição confirmada.

```sql
CREATE TRIGGER after_insert_inscricao
AFTER INSERT ON inscricoes
FOR EACH ROW
BEGIN
  IF NEW.status = 'confirmado' THEN
    UPDATE eventos
    SET vagas_disponiveis = vagas_disponiveis - 1
    WHERE id = NEW.evento_id;
    
    INSERT INTO auditoria (tabela, operacao, usuario_id, registro_id, dados_novos)
    VALUES ('inscricoes', 'INSERT', NEW.usuario_id, NEW.id, 
            JSON_OBJECT('evento_id', NEW.evento_id, 'status', NEW.status));
  END IF;
END;
```

---

### 4. **Trigger: `after_update_inscricao`**
Ajusta vagas ao cancelar inscrição.

```sql
CREATE TRIGGER after_update_inscricao
AFTER UPDATE ON inscricoes
FOR EACH ROW
BEGIN
  IF OLD.status = 'confirmado' AND NEW.status = 'cancelado' THEN
    UPDATE eventos
    SET vagas_disponiveis = vagas_disponiveis + 1
    WHERE id = NEW.evento_id;
  END IF;
END;
```

---

## 📊 Views (Visualizações)

### 1. **View: `vw_eventos_completos`**
Dados completos de eventos com informações do organizador.

```sql
CREATE VIEW vw_eventos_completos AS
SELECT 
  e.id,
  e.titulo,
  e.descricao,
  e.data_evento,
  e.vagas,
  e.vagas_disponiveis,
  e.status,
  u.nome AS organizador,
  u.email AS organizador_email,
  c.nome AS categoria,
  COUNT(i.id) AS inscritos,
  calcular_taxa_ocupacao(e.id) AS taxa_ocupacao
FROM eventos e
JOIN usuarios u ON e.organizador_id = u.id
JOIN categorias c ON e.categoria_id = c.id
LEFT JOIN inscricoes i ON e.id = i.evento_id AND i.status = 'confirmado'
GROUP BY e.id, e.titulo, e.descricao, e.data_evento, e.vagas, 
         e.vagas_disponiveis, e.status, u.nome, u.email, c.nome;
```

**Uso:**
```sql
SELECT * FROM vw_eventos_completos WHERE status = 'aberto';
```

---

### 2. **View: `vw_estatisticas_usuarios`**
Estatísticas de participação por usuário.

```sql
CREATE VIEW vw_estatisticas_usuarios AS
SELECT 
  u.id,
  u.nome,
  u.email,
  COUNT(i.id) AS total_inscricoes,
  SUM(CASE WHEN i.status = 'confirmado' THEN 1 ELSE 0 END) AS inscricoes_confirmadas,
  SUM(CASE WHEN i.status = 'cancelado' THEN 1 ELSE 0 END) AS inscricoes_canceladas,
  SUM(CASE WHEN i.presenca = TRUE THEN 1 ELSE 0 END) AS eventos_participados
FROM usuarios u
LEFT JOIN inscricoes i ON u.id = i.usuario_id
WHERE u.tipo = 'participante'
GROUP BY u.id, u.nome, u.email;
```

**Uso:**
```sql
SELECT * FROM vw_estatisticas_usuarios ORDER BY total_inscricoes DESC LIMIT 10;
```

---

## 🔧 Stored Procedures (Procedimentos)

### 1. **Procedure: `inscrever_usuario_evento`**
Lógica completa de inscrição em evento.

```sql
DELIMITER //
CREATE PROCEDURE inscrever_usuario_evento(
  IN p_usuario_id VARCHAR(20),
  IN p_evento_id VARCHAR(20)
)
BEGIN
  DECLARE v_vagas_disponiveis INT;
  DECLARE v_status VARCHAR(20);
  DECLARE v_ja_inscrito INT;
  
  -- Verifica se usuário já está inscrito
  SELECT COUNT(*) INTO v_ja_inscrito
  FROM inscricoes
  WHERE usuario_id = p_usuario_id 
    AND evento_id = p_evento_id 
    AND status = 'confirmado';
  
  IF v_ja_inscrito > 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Usuário já inscrito neste evento';
  END IF;
  
  -- Verifica vagas e status do evento
  SELECT vagas_disponiveis, status INTO v_vagas_disponiveis, v_status
  FROM eventos
  WHERE id = p_evento_id;
  
  IF v_status != 'aberto' THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Evento não está aberto para inscrições';
  END IF;
  
  IF v_vagas_disponiveis <= 0 THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não há vagas disponíveis';
  END IF;
  
  -- Realiza a inscrição
  INSERT INTO inscricoes (usuario_id, evento_id, status)
  VALUES (p_usuario_id, p_evento_id, 'confirmado');
  
  SELECT 'Inscrição realizada com sucesso' AS mensagem;
END //
DELIMITER ;
```

**Uso:**
```sql
CALL inscrever_usuario_evento('USR-20251117-00001', 'EVT-20251117-00001');
```

---

### 2. **Procedure: `relatorio_eventos_organizador`**
Relatório completo de eventos de um organizador.

```sql
DELIMITER //
CREATE PROCEDURE relatorio_eventos_organizador(
  IN p_organizador_id VARCHAR(20)
)
BEGIN
  SELECT 
    e.id,
    e.titulo,
    e.descricao,
    e.data_evento,
    e.vagas AS vagas_totais,
    e.vagas_disponiveis,
    e.status,
    COUNT(DISTINCT i.id) AS total_inscricoes,
    SUM(CASE WHEN i.presenca = TRUE THEN 1 ELSE 0 END) AS total_presentes,
    calcular_taxa_ocupacao(e.id) AS taxa_ocupacao
  FROM eventos e
  LEFT JOIN inscricoes i ON e.id = i.evento_id AND i.status = 'confirmado'
  WHERE e.organizador_id = p_organizador_id
  GROUP BY e.id, e.titulo, e.descricao, e.data_evento, e.vagas, 
           e.vagas_disponiveis, e.status
  ORDER BY e.data_evento DESC;
END //
DELIMITER ;
```

**Uso:**
```sql
CALL relatorio_eventos_organizador('USR-20251117-00001');
```

---

## 📐 Functions (Funções)

### 1. **Function: `calcular_taxa_ocupacao`**
Calcula a porcentagem de ocupação de um evento.

```sql
CREATE FUNCTION calcular_taxa_ocupacao(p_evento_id VARCHAR(20))
RETURNS DECIMAL(5,2)
DETERMINISTIC
BEGIN
  DECLARE v_vagas INT;
  DECLARE v_inscritos INT;
  DECLARE v_taxa DECIMAL(5,2);
  
  SELECT vagas INTO v_vagas
  FROM eventos
  WHERE id = p_evento_id;
  
  SELECT COUNT(*) INTO v_inscritos
  FROM inscricoes
  WHERE evento_id = p_evento_id AND status = 'confirmado';
  
  IF v_vagas > 0 THEN
    SET v_taxa = (v_inscritos / v_vagas) * 100;
  ELSE
    SET v_taxa = 0;
  END IF;
  
  RETURN v_taxa;
END;
```

**Uso:**
```sql
SELECT titulo, calcular_taxa_ocupacao(id) AS ocupacao
FROM eventos
WHERE status = 'aberto';
```

---

## 📄 MongoDB - Banco NoSQL

### 🔧 Configuração

**Requisitos:**
- MongoDB 5.0 ou superior
- Mongoose 6.x para ODM

**Configuração (.env):**
```env
MONGO_URI=mongodb://localhost:27017/gestao_eventos
```

---

## 📋 Collections (Coleções)

### 1. **Collection: `feedbacks`**
Avaliações flexíveis de eventos.

**Schema (Mongoose):**
```javascript
{
  evento_id: { type: String, required: true },
  usuario_id: { type: String, required: true },
  avaliacao: { type: Number, min: 1, max: 5, required: true },
  comentario: { type: String },
  tags: [String],
  data_feedback: { type: Date, default: Date.now }
}
```

**Exemplo de Documento:**
```json
{
  "_id": "674a1b2c3d4e5f6a7b8c9d0e",
  "evento_id": "EVT-20251117-00001",
  "usuario_id": "USR-20251117-00002",
  "avaliacao": 5,
  "comentario": "Excelente workshop! Muito bem organizado.",
  "tags": ["educativo", "bem-organizado", "recomendo"],
  "data_feedback": "2025-11-17T15:30:00.000Z"
}
```

**Índices:**
```javascript
feedbackSchema.index({ evento_id: 1 });
feedbackSchema.index({ usuario_id: 1 });
feedbackSchema.index({ avaliacao: -1 });
```

---

### 2. **Collection: `materiais`**
Materiais de apoio dos eventos.

**Schema (Mongoose):**
```javascript
{
  evento_id: { type: String, required: true },
  titulo: { type: String, required: true },
  descricao: { type: String },
  url: { type: String, required: true },
  tipo: { type: String, enum: ['slides', 'video', 'documento', 'link', 'outro'] },
  tamanho: Number,
  formato: String,
  data_upload: { type: Date, default: Date.now }
}
```

**Exemplo de Documento:**
```json
{
  "_id": "674a1b2c3d4e5f6a7b8c9d0f",
  "evento_id": "EVT-20251117-00001",
  "titulo": "Slides do Workshop de Python",
  "descricao": "Material de apoio completo",
  "url": "https://drive.google.com/...",
  "tipo": "slides",
  "formato": "PDF",
  "tamanho": 2048576,
  "data_upload": "2025-11-17T16:00:00.000Z"
}
```

**Índices:**
```javascript
materialSchema.index({ evento_id: 1 });
materialSchema.index({ tipo: 1 });
```

---

## 🔐 Backup e Restore

### MySQL
```bash
# Backup completo
mysqldump -u root -p gestao_eventos > backup_gestao_eventos.sql

# Restore
mysql -u root -p gestao_eventos < backup_gestao_eventos.sql
```

### MongoDB
```bash
# Backup
mongodump --db gestao_eventos --out /caminho/backup/

# Restore
mongorestore --db gestao_eventos /caminho/backup/gestao_eventos/
```

---

## 📊 Diagrama ER (Entity Relationship)

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│   grupos    │       │  usuarios   │       │ categorias  │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ id (PK)     │───┐   │ id (PK)     │   ┌───│ id (PK)     │
│ nome        │   └──→│ nome        │   │   │ nome        │
│ descricao   │       │ email       │   │   │ descricao   │
└─────────────┘       │ senha_hash  │   │   └─────────────┘
                      │ tipo        │   │
                      │ grupo_id(FK)│   │
                      └─────────────┘   │
                            │           │
                            │           │
                      ┌─────▼───────────▼────┐
                      │      eventos         │
                      ├──────────────────────┤
                      │ id (PK)              │
                      │ titulo               │
                      │ descricao            │
                      │ data_evento          │
                      │ vagas                │
                      │ vagas_disponiveis    │
                      │ organizador_id (FK)  │
                      │ categoria_id (FK)    │
                      │ status               │
                      └──────────┬───────────┘
                                 │
                                 │
                      ┌──────────▼───────────┐
                      │    inscricoes        │
                      ├──────────────────────┤
                      │ id (PK)              │
                      │ usuario_id (FK)      │
                      │ evento_id (FK)       │
                      │ data_inscricao       │
                      │ status               │
                      │ presenca             │
                      └──────────────────────┘
```

---

📅 **Última atualização**: Novembro 2025
