const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver").default || require("archiver");

const analisarSQL = require("./generator/analisarSQL");
const gerarBackend = require("./generator/gerarBackend");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "frontend")));

app.get("/api", (req, res) => {
    res.json({ mensagem: "Backend Generator funcionando!" });
});

// Analisar SQL
app.post("/api/analisar", (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql || !sql.trim()) {
            return res.status(400).json({
                erro: "Informe um código SQL."
            });
        }

        const resultado = analisarSQL(sql);

        if (!resultado.tabelas || resultado.tabelas.length === 0) {
            return res.status(400).json({
                erro: "Nenhuma tabela encontrada no SQL."
            });
        }

        res.json({
            mensagem: "SQL analisado com sucesso!",
            banco: resultado.banco || "banco_gerado",
            totalTabelas: resultado.tabelas.length,
            tabelas: resultado.tabelas.map(tabela => ({
                nome: tabela.nome,
                totalColunas: tabela.colunas.length
            }))
        });
    } catch (erro) {
        res.status(500).json({ erro: erro.message });
    }
});

// Criar ZIP
function criarArquivoZIP(pastaOrigem, arquivoDestino) {
    return new Promise((resolve, reject) => {
        const saida = fs.createWriteStream(arquivoDestino);
        const zip = archiver("zip", {
            zlib: { level: 9 }
        });

        saida.on("close", resolve);
        saida.on("error", reject);
        zip.on("error", reject);

        zip.pipe(saida);
        zip.directory(pastaOrigem, false);
        zip.finalize();
    });
}

// Gerar backend
app.post("/api/gerar", async (req, res) => {
    try {
        const { sql } = req.body;

        if (!sql || !sql.trim()) {
            return res.status(400).json({
                erro: "Informe um código SQL."
            });
        }

        const resultado = analisarSQL(sql);

        if (!resultado.tabelas || resultado.tabelas.length === 0) {
            return res.status(400).json({
                erro: "Nenhuma tabela encontrada no SQL."
            });
        }

        const pastaGerada = gerarBackend(resultado, sql);

        const arquivoZIP = path.join(__dirname, "backend-gerado.zip");

        await criarArquivoZIP(pastaGerada, arquivoZIP);

        res.json({
            mensagem: "Backend gerado com sucesso!",
            pasta: pastaGerada,
            download: "/api/baixar"
        });
    } catch (erro) {
        console.error(erro);

        res.status(500).json({
            erro: erro.message
        });
    }
});

// Baixar ZIP
app.get("/api/baixar", (req, res) => {
    const arquivoZIP = path.join(__dirname, "backend-gerado.zip");

    if (!fs.existsSync(arquivoZIP)) {
        return res.status(404).json({
            erro: "Gere o backend antes de baixar."
        });
    }

    res.download(arquivoZIP, "backend-gerado.zip");
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando em http://localhost:${PORT}`);
});