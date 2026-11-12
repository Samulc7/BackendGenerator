
const db = require("../config/database");

async function listar() {
    const [resultado] = await db.query("SELECT * FROM `usoia`");
    return resultado;
}

async function buscarPorId(id) {
    const [resultado] = await db.query(
        "SELECT * FROM `usoia` WHERE `id` = ?",
        [id]
    );
    return resultado[0];
}

async function criar(dados) {
    const [resultado] = await db.query(
        "INSERT INTO `usoia` SET ?",
        [dados]
    );
    return resultado;
}

async function atualizar(id, dados) {
    const [resultado] = await db.query(
        "UPDATE `usoia` SET ? WHERE `id` = ?",
        [dados, id]
    );
    return resultado;
}

async function excluir(id) {
    const [resultado] = await db.query(
        "DELETE FROM `usoia` WHERE `id` = ?",
        [id]
    );
    return resultado;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
