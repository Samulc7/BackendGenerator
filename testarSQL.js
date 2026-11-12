const fs = require("fs");
const path = require("path");

const analisarSQL = require("./generator/analisarSQL");
const gerarBackend = require("./generator/gerarbackend");

try {
    console.log("\n===== BACKEND GENERATOR =====\n");

    const caminhoSQL = path.join(__dirname, "script.sql");

    const sql = fs.readFileSync(caminhoSQL, "utf8");

    const resultado = analisarSQL(sql);

    console.log("Banco identificado:", resultado.banco);

    console.log("\nTabelas encontradas:\n");

    resultado.tabelas.forEach(tabela => {
        console.log("Tabela:", tabela.nome);
        console.log("Chave primária:", tabela.primaryKey);
        console.log("Colunas:", tabela.colunas);
        console.log("Chaves estrangeiras:", tabela.foreignKeys);
        console.log("--------------------------------");
    });

    console.log("\n===== GERANDO BACKEND =====\n");

    const pastaGerada = gerarBackend(resultado, sql);

    console.log("Backend gerado com sucesso!");
    console.log("Pasta:", pastaGerada);

} catch (erro) {
    console.error("\nERRO:", erro.message);
}