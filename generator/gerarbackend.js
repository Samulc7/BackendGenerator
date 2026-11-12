const fs = require("fs");
const path = require("path");

function corrigirChavesPrimarias(sql, estrutura) {
    const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?[\w]+`?\.)?`?([\w]+)`?\s*\(/gi;

    let match;

    while ((match = regex.exec(sql)) !== null) {
        const nomeTabela = match[1];
        const inicio = regex.lastIndex;

        let nivel = 1;
        let fim = inicio;

        while (fim < sql.length && nivel > 0) {
            if (sql[fim] === "(") nivel++;
            if (sql[fim] === ")") nivel--;
            fim++;
        }

        const conteudo = sql.substring(inicio, fim - 1);
        const partes = conteudo.split(",");
        const chaves = [];

        for (const parte of partes) {
            const declaracao = parte.match(/PRIMARY\s+KEY\s*\(([^)]+)\)/i);

            if (declaracao) {
                declaracao[1].split(",").forEach(coluna => {
                    chaves.push(coluna.trim().replace(/`/g, ""));
                });
            }
        }

        if (chaves.length === 0) {
            for (const parte of partes) {
                const declaracao = parte.match(
                    /^\s*`?(\w+)`?[\s\S]*?\bPRIMARY\s+KEY\b/i
                );

                if (declaracao) {
                    chaves.push(declaracao[1]);
                }
            }
        }

        const tabela = estrutura.tabelas.find(
            item => item.nome.toLowerCase() === nomeTabela.toLowerCase()
        );

        if (tabela) {
            tabela.primaryKey = chaves;

            if (Array.isArray(tabela.colunas)) {
                tabela.colunas.forEach(coluna => {
                    coluna.primaryKey = chaves.includes(coluna.nome);
                });
            }
        }
    }

    return estrutura;
}

function gerarBackend(estrutura, sqlOriginal) {
    if (!estrutura || !Array.isArray(estrutura.tabelas)) {
        throw new Error("Estrutura SQL inválida.");
    }

    if (!sqlOriginal || !sqlOriginal.trim()) {
        throw new Error("O SQL original não foi informado.");
    }

    estrutura = corrigirChavesPrimarias(sqlOriginal, estrutura);

    if (estrutura.tabelas.length === 0) {
        throw new Error("Nenhuma tabela foi encontrada.");
    }

    estrutura.tabelas.forEach(tabela => {
        if (!Array.isArray(tabela.primaryKey) || tabela.primaryKey.length !== 1) {
            throw new Error(
                "Não foi possível identificar a chave primária da tabela " +
                tabela.nome + ". Verifique o CREATE TABLE no SQL."
            );
        }
    });

    const pasta = path.join(__dirname, "..", "backend-gerado");

    fs.rmSync(pasta, { recursive: true, force: true });

    const criarPasta = nome => {
        fs.mkdirSync(path.join(pasta, nome), { recursive: true });
    };

    ["config", "models", "controllers", "routes"].forEach(criarPasta);

    const escrever = (local, conteudo) => {
        fs.writeFileSync(path.join(pasta, local), conteudo, "utf8");
    };

    escrever("config/database.js", `
const mysql = require("mysql2/promise");
require("dotenv").config();

const conexao = mysql.createPool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

module.exports = conexao;
`);

    estrutura.tabelas.forEach(tabela => {
        const nome = tabela.nome;
        const chave = tabela.primaryKey[0];

        const model = `
const db = require("../config/database");

async function listar() {
    const [resultado] = await db.query("SELECT * FROM \`${nome}\`");
    return resultado;
}

async function buscarPorId(id) {
    const [resultado] = await db.query(
        "SELECT * FROM \`${nome}\` WHERE \`${chave}\` = ?",
        [id]
    );
    return resultado[0];
}

async function criar(dados) {
    const [resultado] = await db.query(
        "INSERT INTO \`${nome}\` SET ?",
        [dados]
    );
    return resultado;
}

async function atualizar(id, dados) {
    const [resultado] = await db.query(
        "UPDATE \`${nome}\` SET ? WHERE \`${chave}\` = ?",
        [dados, id]
    );
    return resultado;
}

async function excluir(id) {
    const [resultado] = await db.query(
        "DELETE FROM \`${nome}\` WHERE \`${chave}\` = ?",
        [id]
    );
    return resultado;
}

module.exports = { listar, buscarPorId, criar, atualizar, excluir };
`;

        escrever(`models/${nome}.js`, model);

        const controller = `
const model = require("../models/${nome}");

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
`;

        escrever(`controllers/${nome}.js`, controller);

        const routes = `
const express = require("express");
const router = express.Router();
const controller = require("../controllers/${nome}");

router.get("/", controller.listar);
router.get("/:id", controller.buscar);
router.post("/", controller.criar);
router.patch("/:id", controller.atualizar);
router.delete("/:id", controller.excluir);

module.exports = router;
`;

        escrever(`routes/${nome}.js`, routes);
    });

    let importsRotas = "";
    let usosRotas = "";

    estrutura.tabelas.forEach(tabela => {
        importsRotas += `const ${tabela.nome}Routes = require("./routes/${tabela.nome}");\n`;
        usosRotas += `app.use("/api/${tabela.nome}", ${tabela.nome}Routes);\n`;
    });

    escrever("server.js", `
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

${importsRotas}

app.get("/", (req, res) => {
    res.json({ mensagem: "Backend gerado funcionando!" });
});

${usosRotas}

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    console.log("Servidor rodando na porta " + PORT);
});
`);

    escrever("package.json", JSON.stringify({
        name: "backend-gerado",
        version: "1.0.0",
        main: "server.js",
        scripts: {
            start: "node server.js",
            dev: "node --watch server.js"
        },
        dependencies: {
            cors: "^2.8.5",
            dotenv: "^16.4.5",
            express: "^5.1.0",
            mysql2: "^3.14.0"
        }
    }, null, 4));

    escrever(".env", `
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=${estrutura.banco || "gestao_residuos"}
PORT=3001
`);

    escrever(".gitignore", "node_modules\n.env\n");

    escrever("script.sql", sqlOriginal);

    return pasta;
}

module.exports = gerarBackend;