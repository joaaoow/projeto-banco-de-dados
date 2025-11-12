CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    senha VARCHAR(255),
    tipo ENUM('aluno', 'organizador')
);

CREATE TABLE eventos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200),
    descricao TEXT,
    data_evento DATETIME,
    vagas INT,
    organizador_id INT,
    FOREIGN KEY (organizador_id) REFERENCES usuarios(id)
);

CREATE TABLE inscricoes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    evento_id INT,
    data_inscricao DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('confirmado', 'cancelado', 'presente'),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (evento_id) REFERENCES eventos(id)
);

CREATE TABLE categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50)
);