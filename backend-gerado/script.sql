drop database if exists usos_ia;
create database usos_ia;
use usos_ia;
-- DDL Criação das tabelas
create table usuario (
    id int not null auto_increment primary key,
    nome varchar(100) not null,
    email varchar(100) not null unique,
    senha varchar(100) not null
);
create table usoia (
    id int not null auto_increment primary key,
    usuarioId int not null,
    sistema varchar(100) not null,
    tipo enum('Empresa','Escola','Outros') default('Empresa') not null,
    finalidade varchar(100) not null,
    tecnologia varchar(100) not null,
    nivelRisco enum('Baixo','Medio','Alto') default('Baixo') not null,
    revisaoHumana boolean default(true) not null
);
alter table usoia add constraint fk_registra
foreign key (usuarioId) references usuario(id);

-- DML para inserir dados de exemplo nas tabelas
insert into usuario (nome, email, senha) values
('Sofia de Paula', 'maria.oliveira@email.com', password('senha123')),
('Paula Silva', 'paula@email.com', password('senha123')),
('Passos Dias Aguiar', 'passos@email.com', password('senha123'));

insert into usoia(usuarioId, sistema, tipo, finalidade, tecnologia, nivelRisco, revisaoHumana) values
(1, 'Assistente de atendimento', 'Empresa', 'Responder duvidas de clientes', 'IA generativa', 'Baixo', true),
(1, 'Reconhecimento facial', 'Empresa', 'Bater ponto', 'Visao computacional', 'Baixo', true),
(2, 'Biometria', 'Outros', 'Validar identidade', 'Visao computacional', 'Medio', true),
(2, 'Pesquisa de satisfacao', 'Escola', 'Avaliacao do servico de educacao', 'IA generativa', 'Baixo', false),
(3, 'Avaliacao institucional', 'Escola', 'Correcao de gabarito', 'Visao computacional', 'Medio', false);

select * from usuario;
select * from usoia;
show tables;