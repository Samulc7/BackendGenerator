
const model = require("../models/usuario");

async function listar(req, res) {
    try {
        res.json(await model.listar());
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function buscar(req, res) {
    try {
        const resultado = await model.buscarPorId(req.params.id);
        if (!resultado) {
            return res.status(404).json({ erro: "Registro não encontrado." });
        }
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function criar(req, res) {
    try {
        const resultado = await model.criar(req.body);
        res.status(201).json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function atualizar(req, res) {
    try {
        const resultado = await model.atualizar(req.params.id, req.body);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

async function excluir(req, res) {
    try {
        const resultado = await model.excluir(req.params.id);
        res.json(resultado);
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
}

module.exports = { listar, buscar, criar, atualizar, excluir };
