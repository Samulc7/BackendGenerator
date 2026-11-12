const arquivoSQL = document.getElementById("arquivoSQL");
const nomeArquivo = document.getElementById("nomeArquivo");
const codigoSQL = document.getElementById("codigoSQL");

const btnAnalisar = document.getElementById("btnAnalisar");
const btnGerar = document.getElementById("btnGerar");

const mensagem = document.getElementById("mensagem");
const resultado = document.getElementById("resultado");
const sucesso = document.getElementById("sucesso");

const nomeBanco = document.getElementById("nomeBanco");
const totalTabelas = document.getElementById("totalTabelas");
const listaTabelas = document.getElementById("listaTabelas");

const localGerado = document.getElementById("localGerado");
const btnBaixar = document.getElementById("btnBaixar");

let sqlAtual = "";
let sqlAnalisado = false;

// Mostrar mensagens
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = "mensagem " + tipo;
}

// Selecionar arquivo SQL
arquivoSQL.addEventListener("change", async () => {
    const arquivo = arquivoSQL.files[0];

    if (!arquivo) return;

    if (!arquivo.name.toLowerCase().endsWith(".sql")) {
        mostrarMensagem("Selecione um arquivo SQL válido.", "erro");
        return;
    }

    sqlAtual = await arquivo.text();
    codigoSQL.value = sqlAtual;
    nomeArquivo.textContent = arquivo.name;

    sqlAnalisado = false;
    btnGerar.disabled = true;
    sucesso.classList.add("oculto");

    mostrarMensagem("Arquivo SQL carregado com sucesso!", "sucesso-msg");
});

// Analisar SQL
btnAnalisar.addEventListener("click", async () => {
    sqlAtual = codigoSQL.value.trim();

    if (!sqlAtual) {
        mostrarMensagem("Informe ou selecione um código SQL.", "erro");
        return;
    }

    try {
        btnAnalisar.disabled = true;
        btnGerar.disabled = true;

        mostrarMensagem("Analisando SQL...", "aviso");

        const resposta = await fetch("/api/analisar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sql: sqlAtual })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao analisar SQL.");
        }

        nomeBanco.textContent = dados.banco;
        totalTabelas.textContent = dados.totalTabelas;

        listaTabelas.innerHTML = "";

        dados.tabelas.forEach(tabela => {
            const item = document.createElement("div");
            item.className = "tabela-item";

            const nome = document.createElement("strong");
            nome.textContent = "🗄️ " + tabela.nome;

            const colunas = document.createElement("span");
            colunas.textContent = tabela.totalColunas + " colunas";

            item.appendChild(nome);
            item.appendChild(colunas);
            listaTabelas.appendChild(item);
        });

        resultado.classList.remove("oculto");
        sucesso.classList.add("oculto");

        sqlAnalisado = true;
        btnGerar.disabled = false;

        mostrarMensagem("SQL analisado com sucesso!", "sucesso-msg");

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    } finally {
        btnAnalisar.disabled = false;
    }
});

// Gerar backend e ZIP
btnGerar.addEventListener("click", async () => {
    if (!sqlAnalisado || !sqlAtual) {
        mostrarMensagem("Analise o SQL antes de gerar o backend.", "erro");
        return;
    }

    try {
        btnGerar.disabled = true;

        mostrarMensagem("Gerando backend e arquivo ZIP...", "aviso");

        const resposta = await fetch("/api/gerar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ sql: sqlAtual })
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(dados.erro || "Erro ao gerar backend.");
        }

        localGerado.textContent = dados.pasta;
        btnBaixar.href = dados.download;

        sucesso.classList.remove("oculto");

        mostrarMensagem(
            "Backend e arquivo ZIP gerados com sucesso!",
            "sucesso-msg"
        );

    } catch (erro) {
        mostrarMensagem(erro.message, "erro");
    } finally {
        btnGerar.disabled = false;
    }
});