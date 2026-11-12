
const db = require("../config/database");

async function listar() {
    const [resultado] = await db.query("SELECT * FROM `usuario`");
    return resultado;
}

async function buscarPorId(id) {
    const [resultado] = await db.query(
        "SELECT * FROM `usuario` WHERE `id` = ?",
        [id]
    );
    return resultado[0];
}

async function criar(dados) {
    const [resultado] = await db.query(
        "INSERT INTO `usuario` SET ?",
        [dados]
    );
    return resultado;
}

async function atualizar(id, dados) {
    const [resultado] = await db.query(
        "UPDATE `usuario` SET ? WHERE `id` = ?",
        [dados, id]
    );
    return resultado;
}

async function excluir(id) {
    const [resultado] = await db.query(
        "DELETE FROM `usuario` WHERE `id` = ?",
        [id]
    );
    return resultado;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
