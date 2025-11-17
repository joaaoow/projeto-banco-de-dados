-- ============================================================
-- TRABALHO FINAL - LABORATÓRIO DE BANCO DE DADOS
-- Sistema de Eventos de Programação
-- ============================================================

-- Criação do banco de dados
CREATE DATABASE IF NOT EXISTS eventosdb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE eventosdb;

-- ============================================================
-- 1. TABELAS
-- ============================================================

-- Tabela de grupos de usuários (controle de permissões)
CREATE TABLE IF NOT EXISTS grupos_usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nome do grupo (admin, organizador, aluno)',
    descricao TEXT COMMENT 'Descrição das permissões do grupo',
    nivel_acesso INT NOT NULL COMMENT 'Nível hierárquico (1=admin, 2=organizador, 3=aluno)',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nivel_acesso (nivel_acesso)
) ENGINE=InnoDB COMMENT='Grupos de usuários para controle de acesso';

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(20) PRIMARY KEY COMMENT 'ID customizado gerado por function',
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(255) NOT NULL COMMENT 'Hash da senha (bcrypt recomendado)',
    grupo_id INT NOT NULL,
    tipo ENUM('aluno', 'organizador', 'admin') DEFAULT 'aluno',
    ativo BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (grupo_id) REFERENCES grupos_usuarios(id) ON DELETE RESTRICT,
    INDEX idx_email (email),
    INDEX idx_grupo (grupo_id),
    INDEX idx_tipo (tipo)
) ENGINE=InnoDB COMMENT='Usuários do sistema';

-- Tabela de categorias de eventos
CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Categorias dos eventos';

-- Tabela de eventos
CREATE TABLE IF NOT EXISTS eventos (
    id VARCHAR(20) PRIMARY KEY COMMENT 'ID customizado gerado por function',
    titulo VARCHAR(200) NOT NULL,
    descricao TEXT,
    data_evento DATETIME NOT NULL,
    vagas INT NOT NULL CHECK (vagas > 0),
    vagas_disponiveis INT NOT NULL,
    organizador_id VARCHAR(20) NOT NULL,
    categoria_id INT,
    status ENUM('planejado', 'aberto', 'encerrado', 'cancelado') DEFAULT 'planejado',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id) ON DELETE RESTRICT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL,
    INDEX idx_data_evento (data_evento),
    INDEX idx_organizador (organizador_id),
    INDEX idx_categoria (categoria_id),
    INDEX idx_status (status),
    INDEX idx_vagas_disponiveis (vagas_disponiveis)
) ENGINE=InnoDB COMMENT='Eventos de programação';

-- Tabela de inscrições
CREATE TABLE IF NOT EXISTS inscricoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id VARCHAR(20) NOT NULL,
    evento_id VARCHAR(20) NOT NULL,
    data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmado', 'cancelado', 'presente', 'ausente') DEFAULT 'confirmado',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_inscricao (usuario_id, evento_id),
    INDEX idx_usuario (usuario_id),
    INDEX idx_evento (evento_id),
    INDEX idx_status (status),
    INDEX idx_data_inscricao (data_inscricao)
) ENGINE=InnoDB COMMENT='Inscrições de usuários em eventos';

-- Tabela de log de auditoria
CREATE TABLE IF NOT EXISTS auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tabela VARCHAR(50) NOT NULL,
    operacao ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    usuario_id VARCHAR(20),
    registro_id VARCHAR(50),
    dados_anteriores JSON,
    dados_novos JSON,
    data_operacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tabela (tabela),
    INDEX idx_usuario (usuario_id),
    INDEX idx_data (data_operacao)
) ENGINE=InnoDB COMMENT='Log de auditoria de operações críticas';

-- ============================================================
-- 2. FUNCTIONS
-- ============================================================

-- Function para gerar IDs customizados para usuários (formato: USR-YYYYMMDD-XXXXX)
DELIMITER //
CREATE FUNCTION gerar_id_usuario()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE novo_id VARCHAR(20);
    DECLARE contador INT;
    DECLARE data_parte VARCHAR(8);
    
    SET data_parte = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Conta usuários criados hoje
    SELECT COUNT(*) + 1 INTO contador
    FROM usuarios
    WHERE id LIKE CONCAT('USR-', data_parte, '%');
    
    SET novo_id = CONCAT('USR-', data_parte, '-', LPAD(contador, 5, '0'));
    
    RETURN novo_id;
END//
DELIMITER ;

-- Function para gerar IDs customizados para eventos (formato: EVT-YYYYMMDD-XXXXX)
DELIMITER //
CREATE FUNCTION gerar_id_evento()
RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
    DECLARE novo_id VARCHAR(20);
    DECLARE contador INT;
    DECLARE data_parte VARCHAR(8);
    
    SET data_parte = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Conta eventos criados hoje
    SELECT COUNT(*) + 1 INTO contador
    FROM eventos
    WHERE id LIKE CONCAT('EVT-', data_parte, '%');
    
    SET novo_id = CONCAT('EVT-', data_parte, '-', LPAD(contador, 5, '0'));
    
    RETURN novo_id;
END//
DELIMITER ;

-- Function para calcular taxa de ocupação de um evento
DELIMITER //
CREATE FUNCTION calcular_taxa_ocupacao(evento_id_param VARCHAR(20))
RETURNS DECIMAL(5,2)
READS SQL DATA
BEGIN
    DECLARE vagas_totais INT;
    DECLARE vagas_ocupadas INT;
    DECLARE taxa DECIMAL(5,2);
    
    SELECT vagas INTO vagas_totais
    FROM eventos
    WHERE id = evento_id_param;
    
    SELECT COUNT(*) INTO vagas_ocupadas
    FROM inscricoes
    WHERE evento_id = evento_id_param AND status = 'confirmado';
    
    IF vagas_totais > 0 THEN
        SET taxa = (vagas_ocupadas / vagas_totais) * 100;
    ELSE
        SET taxa = 0;
    END IF;
    
    RETURN taxa;
END//
DELIMITER ;

-- ============================================================
-- 3. PROCEDURES
-- ============================================================

-- Procedure para inscrever usuário em evento (com validações)
DELIMITER //
CREATE PROCEDURE inscrever_usuario_evento(
    IN p_usuario_id VARCHAR(20),
    IN p_evento_id VARCHAR(20),
    OUT p_status VARCHAR(100)
)
BEGIN
    DECLARE v_vagas_disponiveis INT;
    DECLARE v_inscricao_existente INT;
    DECLARE v_evento_status VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status = 'ERRO: Falha na transação';
    END;
    
    START TRANSACTION;
    
    -- Verifica se evento existe e está aberto
    SELECT status, vagas_disponiveis 
    INTO v_evento_status, v_vagas_disponiveis
    FROM eventos
    WHERE id = p_evento_id
    FOR UPDATE;
    
    IF v_evento_status IS NULL THEN
        SET p_status = 'ERRO: Evento não encontrado';
        ROLLBACK;
    ELSEIF v_evento_status != 'aberto' THEN
        SET p_status = 'ERRO: Evento não está aberto para inscrições';
        ROLLBACK;
    ELSEIF v_vagas_disponiveis <= 0 THEN
        SET p_status = 'ERRO: Evento sem vagas disponíveis';
        ROLLBACK;
    ELSE
        -- Verifica se usuário já está inscrito
        SELECT COUNT(*) INTO v_inscricao_existente
        FROM inscricoes
        WHERE usuario_id = p_usuario_id AND evento_id = p_evento_id;
        
        IF v_inscricao_existente > 0 THEN
            SET p_status = 'ERRO: Usuário já inscrito neste evento';
            ROLLBACK;
        ELSE
            -- Insere inscrição
            INSERT INTO inscricoes (usuario_id, evento_id, status)
            VALUES (p_usuario_id, p_evento_id, 'confirmado');
            
            -- Atualiza vagas disponíveis
            UPDATE eventos
            SET vagas_disponiveis = vagas_disponiveis - 1
            WHERE id = p_evento_id;
            
            SET p_status = 'SUCESSO: Inscrição realizada';
            COMMIT;
        END IF;
    END IF;
END//
DELIMITER ;

-- Procedure para gerar relatório de eventos de um organizador
DELIMITER //
CREATE PROCEDURE relatorio_eventos_organizador(
    IN p_organizador_id VARCHAR(20)
)
BEGIN
    SELECT 
        e.id,
        e.titulo,
        e.data_evento,
        e.vagas,
        e.vagas_disponiveis,
        e.status,
        COUNT(i.id) as total_inscricoes,
        SUM(CASE WHEN i.status = 'presente' THEN 1 ELSE 0 END) as total_presentes,
        calcular_taxa_ocupacao(e.id) as taxa_ocupacao_pct
    FROM eventos e
    LEFT JOIN inscricoes i ON e.id = i.evento_id AND i.status = 'confirmado'
    WHERE e.organizador_id = p_organizador_id
    GROUP BY e.id, e.titulo, e.data_evento, e.vagas, e.vagas_disponiveis, e.status
    ORDER BY e.data_evento DESC;
END//
DELIMITER ;

-- ============================================================
-- 4. TRIGGERS
-- ============================================================

-- Trigger para auditoria de alterações em usuários
DELIMITER //
CREATE TRIGGER trg_auditoria_usuarios_update
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabela, operacao, usuario_id, registro_id, dados_anteriores, dados_novos)
    VALUES (
        'usuarios',
        'UPDATE',
        NEW.id,
        NEW.id,
        JSON_OBJECT(
            'nome', OLD.nome,
            'email', OLD.email,
            'grupo_id', OLD.grupo_id,
            'tipo', OLD.tipo,
            'ativo', OLD.ativo
        ),
        JSON_OBJECT(
            'nome', NEW.nome,
            'email', NEW.email,
            'grupo_id', NEW.grupo_id,
            'tipo', NEW.tipo,
            'ativo', NEW.ativo
        )
    );
END//
DELIMITER ;

-- Trigger para atualizar vagas disponíveis quando inscrição é cancelada
DELIMITER //
CREATE TRIGGER trg_atualizar_vagas_cancelamento
AFTER UPDATE ON inscricoes
FOR EACH ROW
BEGIN
    IF OLD.status = 'confirmado' AND NEW.status = 'cancelado' THEN
        UPDATE eventos
        SET vagas_disponiveis = vagas_disponiveis + 1
        WHERE id = NEW.evento_id;
    END IF;
    
    IF OLD.status = 'cancelado' AND NEW.status = 'confirmado' THEN
        UPDATE eventos
        SET vagas_disponiveis = vagas_disponiveis - 1
        WHERE id = NEW.evento_id;
    END IF;
END//
DELIMITER ;

-- Trigger para inicializar vagas_disponiveis igual a vagas ao criar evento
DELIMITER //
CREATE TRIGGER trg_inicializar_vagas_evento
BEFORE INSERT ON eventos
FOR EACH ROW
BEGIN
    SET NEW.vagas_disponiveis = NEW.vagas;
END//
DELIMITER ;

-- Trigger para auditoria de exclusão de eventos
DELIMITER //
CREATE TRIGGER trg_auditoria_eventos_delete
BEFORE DELETE ON eventos
FOR EACH ROW
BEGIN
    INSERT INTO auditoria (tabela, operacao, usuario_id, registro_id, dados_anteriores)
    VALUES (
        'eventos',
        'DELETE',
        OLD.organizador_id,
        OLD.id,
        JSON_OBJECT(
            'titulo', OLD.titulo,
            'data_evento', OLD.data_evento,
            'vagas', OLD.vagas,
            'status', OLD.status
        )
    );
END//
DELIMITER ;

-- ============================================================
-- 5. VIEWS
-- ============================================================

-- View para listar eventos com informações completas e estatísticas
CREATE OR REPLACE VIEW vw_eventos_completos AS
SELECT 
    e.id,
    e.titulo,
    e.descricao,
    e.data_evento,
    e.vagas,
    e.vagas_disponiveis,
    e.status,
    u.nome AS organizador_nome,
    u.email AS organizador_email,
    c.nome AS categoria_nome,
    COUNT(DISTINCT i.id) AS total_inscricoes,
    SUM(CASE WHEN i.status = 'confirmado' THEN 1 ELSE 0 END) AS inscricoes_confirmadas,
    SUM(CASE WHEN i.status = 'presente' THEN 1 ELSE 0 END) AS presencas,
    ROUND((COUNT(DISTINCT CASE WHEN i.status = 'confirmado' THEN i.id END) / e.vagas * 100), 2) AS taxa_ocupacao,
    e.criado_em
FROM eventos e
INNER JOIN usuarios u ON e.organizador_id = u.id
LEFT JOIN categorias c ON e.categoria_id = c.id
LEFT JOIN inscricoes i ON e.id = i.evento_id
GROUP BY e.id, e.titulo, e.descricao, e.data_evento, e.vagas, e.vagas_disponiveis, 
         e.status, u.nome, u.email, c.nome, e.criado_em;

-- View para estatísticas de usuários por grupo
CREATE OR REPLACE VIEW vw_estatisticas_usuarios AS
SELECT 
    g.id AS grupo_id,
    g.nome AS grupo_nome,
    g.nivel_acesso,
    COUNT(u.id) AS total_usuarios,
    SUM(CASE WHEN u.ativo = TRUE THEN 1 ELSE 0 END) AS usuarios_ativos,
    SUM(CASE WHEN u.ativo = FALSE THEN 1 ELSE 0 END) AS usuarios_inativos,
    COUNT(DISTINCT CASE WHEN u.tipo = 'organizador' THEN e.id END) AS eventos_criados,
    COUNT(DISTINCT i.id) AS total_inscricoes
FROM grupos_usuarios g
LEFT JOIN usuarios u ON g.id = u.grupo_id
LEFT JOIN eventos e ON u.id = e.organizador_id
LEFT JOIN inscricoes i ON u.id = i.usuario_id
GROUP BY g.id, g.nome, g.nivel_acesso;

-- ============================================================
-- 6. ÍNDICES (JUSTIFICATIVA)
-- ============================================================

/*
JUSTIFICATIVA DOS ÍNDICES CRIADOS:

1. idx_email (usuarios): 
   - Usado frequentemente em login e verificação de unicidade
   - Melhora performance de queries WHERE email = ?

2. idx_grupo (usuarios): 
   - JOIN frequente com grupos_usuarios
   - Filtros por grupo de usuário

3. idx_data_evento (eventos):
   - Ordenação e filtros por data são comuns
   - Busca de eventos futuros/passados

4. idx_organizador (eventos):
   - JOIN com usuarios e filtros por organizador
   - Relatórios de eventos por organizador

5. idx_vagas_disponiveis (eventos):
   - Busca de eventos com vagas (WHERE vagas_disponiveis > 0)
   - Filtro muito usado na listagem de eventos

6. unique_inscricao (inscricoes):
   - Garante integridade (usuário não pode se inscrever 2x no mesmo evento)
   - Acelera verificação de inscrição existente

7. idx_status (inscricoes):
   - Filtros por status de inscrição (confirmado, presente, etc)
   - Agregações e contagens por status
*/

-- ============================================================
-- 7. DADOS INICIAIS
-- ============================================================

-- Inserir grupos de usuários
INSERT INTO grupos_usuarios (nome, descricao, nivel_acesso) VALUES
('admin', 'Administradores do sistema com acesso total', 1),
('organizador', 'Organizadores de eventos, podem criar e gerenciar eventos', 2),
('aluno', 'Alunos participantes, podem se inscrever em eventos', 3);

-- Inserir categorias
INSERT INTO categorias (nome, descricao) VALUES
('Web Development', 'Eventos relacionados a desenvolvimento web'),
('Mobile', 'Desenvolvimento de aplicativos móveis'),
('Data Science', 'Ciência de dados, ML e IA'),
('DevOps', 'Infraestrutura, CI/CD e automação'),
('Segurança', 'Segurança da informação e ethical hacking');

-- ============================================================
-- 8. USUÁRIOS DO BANCO DE DADOS (SEM ROOT)
-- ============================================================

-- Criar usuários do banco de dados
CREATE USER IF NOT EXISTS 'admin_eventos'@'localhost' IDENTIFIED BY 'Admin@2024!';
CREATE USER IF NOT EXISTS 'app_eventos'@'localhost' IDENTIFIED BY 'App@2024!';
CREATE USER IF NOT EXISTS 'readonly_eventos'@'localhost' IDENTIFIED BY 'Read@2024!';

-- Permissões para admin (DBA tasks, exceto root)
GRANT ALL PRIVILEGES ON eventosdb.* TO 'admin_eventos'@'localhost';
GRANT CREATE USER, RELOAD, PROCESS ON *.* TO 'admin_eventos'@'localhost';

-- Permissões para aplicação (operações normais)
GRANT SELECT, INSERT, UPDATE, DELETE ON eventosdb.* TO 'app_eventos'@'localhost';
GRANT EXECUTE ON eventosdb.* TO 'app_eventos'@'localhost';

-- Permissões para leitura apenas (relatórios, analytics)
GRANT SELECT ON eventosdb.* TO 'readonly_eventos'@'localhost';

FLUSH PRIVILEGES;

-- ============================================================
-- FIM DO SCRIPT
-- ============================================================
