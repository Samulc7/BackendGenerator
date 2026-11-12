DROP DATABASE IF EXISTS gestao_residuos;
CREATE DATABASE gestao_residuos;
USE gestao_residuos;

CREATE TABLE usuario (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL
);

CREATE TABLE ocorrencia (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    local VARCHAR(100) NOT NULL,
    tipoResiduo VARCHAR(50) NOT NULL,
    nivelRisco ENUM('Baixo', 'Medio', 'Alto') DEFAULT 'Medio' NOT NULL,
    data DATE DEFAULT (CURDATE()) NOT NULL,
    status ENUM('Novo', 'Tratado', 'Pendente') DEFAULT 'Novo' NOT NULL
);

ALTER TABLE ocorrencia
ADD CONSTRAINT fk_registra
FOREIGN KEY (usuarioId) REFERENCES usuario(id);

INSERT INTO usuario (nome, email, senha) VALUES
('Maria Oliveira', 'maria.oliveira@email.com', 'senha123'),
('João Silva', 'joao.silva@email.com', 'senha123'),
('Ana Souza', 'ana.souza@email.com', 'senha123');

INSERT INTO ocorrencia (usuarioId, local, tipoResiduo, nivelRisco, status) VALUES
(1, 'Avenida Osmar Contato, 120', 'Eletrônico', 'Alto', 'Novo'),
(2, 'Rua Osmar Motta, 1313', 'Veículo usado', 'Baixo', 'Pendente'),
(1, 'Rua Lucas Trado, 15', 'Eletrônico', 'Alto', 'Tratado'),
(2, 'Rua Rolando da Rocha, S/N', 'Móvel usado', 'Medio', 'Novo'),
(3, 'Rua Jacinto Melo, 101', 'Hospitalar', 'Alto', 'Novo');

DROP DATABASE IF EXISTS gestao_residuos;
CREATE DATABASE gestao_residuos;
USE gestao_residuos;

CREATE TABLE usuario (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    senha VARCHAR(100) NOT NULL
);

CREATE TABLE ocorrencia (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuarioId INT NOT NULL,
    local VARCHAR(100) NOT NULL,
    tipoResiduo VARCHAR(50) NOT NULL,
    nivelRisco ENUM('Baixo', 'Medio', 'Alto') DEFAULT 'Medio' NOT NULL,
    data DATE DEFAULT (CURDATE()) NOT NULL,
    status ENUM('Novo', 'Tratado', 'Pendente') DEFAULT 'Novo' NOT NULL
);

ALTER TABLE ocorrencia
ADD CONSTRAINT fk_registra
FOREIGN KEY (usuarioId) REFERENCES usuario(id);

INSERT INTO usuario (nome, email, senha) VALUES
('Maria Oliveira', 'maria.oliveira@email.com', 'senha123'),
('João Silva', 'joao.silva@email.com', 'senha123'),
('Ana Souza', 'ana.souza@email.com', 'senha123');

INSERT INTO ocorrencia (usuarioId, local, tipoResiduo, nivelRisco, status) VALUES
(1, 'Avenida Osmar Contato, 120', 'Eletrônico', 'Alto', 'Novo'),
(2, 'Rua Osmar Motta, 1313', 'Veículo usado', 'Baixo', 'Pendente'),
(1, 'Rua Lucas Trado, 15', 'Eletrônico', 'Alto', 'Tratado'),
(2, 'Rua Rolando da Rocha, S/N', 'Móvel usado', 'Medio', 'Novo'),
(3, 'Rua Jacinto Melo, 101', 'Hospitalar', 'Alto', 'Novo');