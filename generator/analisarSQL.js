// Separar comandos SQL respeitando aspas e parênteses
function separarComandos(sql) {
    const comandos = [];
    let atual = "";
    let aspas = null;
    let nivel = 0;

    for (let i = 0; i < sql.length; i++) {
        const c = sql[i];

        if (aspas) {
            atual += c;

            if (c === aspas && sql[i - 1] !== "\\") {
                aspas = null;
            }
            continue;
        }

        if (c === "'" || c === '"' || c === "`") {
            aspas = c;
            atual += c;
            continue;
        }

        if (c === "(") nivel++;
        if (c === ")") nivel--;

        if (c === ";" && nivel === 0) {
            if (atual.trim()) comandos.push(atual.trim());
            atual = "";
        } else {
            atual += c;
        }
    }

    if (atual.trim()) comandos.push(atual.trim());

    return comandos;
}

// Separar campos respeitando parênteses e aspas
function separarCampos(texto) {
    const campos = [];
    let atual = "";
    let aspas = null;
    let nivel = 0;

    for (let i = 0; i < texto.length; i++) {
        const c = texto[i];

        if (aspas) {
            atual += c;

            if (c === aspas && texto[i - 1] !== "\\") {
                aspas = null;
            }
            continue;
        }

        if (c === "'" || c === '"' || c === "`") {
            aspas = c;
            atual += c;
        } else if (c === "(") {
            nivel++;
            atual += c;
        } else if (c === ")") {
            nivel--;
            atual += c;
        } else if (c === "," && nivel === 0) {
            campos.push(atual.trim());
            atual = "";
        } else {
            atual += c;
        }
    }

    if (atual.trim()) campos.push(atual.trim());

    return campos;
}

// Extrair conteúdo entre parênteses
function extrairBloco(sql, inicio) {
    let nivel = 0;
    let aspas = null;

    for (let i = inicio; i < sql.length; i++) {
        const c = sql[i];

        if (aspas) {
            if (c === aspas && sql[i - 1] !== "\\") {
                aspas = null;
            }
            continue;
        }

        if (c === "'" || c === '"') {
            aspas = c;
        } else if (c === "(") {
            nivel++;
        } else if (c === ")") {
            nivel--;

            if (nivel === 0) {
                return sql.substring(inicio + 1, i);
            }
        }
    }

    throw new Error("Parênteses não fechados no SQL.");
}

function limparNome(nome) {
    return nome.trim().replace(/`/g, "");
}

function adicionarChavePrimaria(tabela, colunas) {
    colunas.forEach(nome => {
        nome = limparNome(nome);

        if (!tabela.primaryKey.includes(nome)) {
            tabela.primaryKey.push(nome);
        }

        const coluna = tabela.colunas.find(c => c.nome === nome);

        if (coluna) {
            coluna.primaryKey = true;
            coluna.nullable = false;
        }
    });
}

function adicionarChaveEstrangeira(tabela, chave) {
    const existe = tabela.foreignKeys.some(fk =>
        fk.coluna === chave.coluna &&
        fk.tabelaReferenciada === chave.tabelaReferenciada &&
        fk.colunaReferenciada === chave.colunaReferenciada
    );

    if (!existe) {
        tabela.foreignKeys.push(chave);
    }
}

// Analisar uma coluna
function analisarColuna(definicao) {
    const inicio = definicao.match(
        /^`?([a-zA-Z_]\w*)`?\s+([\s\S]+)$/
    );

    if (!inicio) return null;

    const nome = inicio[1];
    const restante = inicio[2].trim();

    const tipoMatch = restante.match(
        /^([a-zA-Z]+)\s*(\([\s\S]*?\))?([\s\S]*)$/
    );

    if (!tipoMatch) return null;

    const nomeTipo = tipoMatch[1].toUpperCase();
    const complementoTipo = tipoMatch[2] || "";
    const regras = tipoMatch[3] || "";

    const coluna = {
        nome,
        tipo: nomeTipo + complementoTipo,
        nullable: !/\bNOT\s+NULL\b/i.test(regras),
        primaryKey: /\bPRIMARY\s+KEY\b/i.test(regras),
        unique: /\bUNIQUE\b/i.test(regras),
        autoIncrement: /\bAUTO_INCREMENT\b/i.test(regras),
        default: null,
        enum: []
    };

    const defaultMatch = regras.match(/\bDEFAULT\s+/i);

    if (defaultMatch) {
        const inicioDefault = defaultMatch.index + defaultMatch[0].length;
        const valor = regras.substring(inicioDefault).trim();

        if (valor.startsWith("'") || valor.startsWith('"')) {
            const aspas = valor[0];
            let fim = 1;

            while (fim < valor.length) {
                if (valor[fim] === aspas && valor[fim - 1] !== "\\") {
                    break;
                }
                fim++;
            }

            coluna.default = valor.substring(0, fim + 1);
        } else {
            coluna.default = valor.split(/\s+/)[0];
        }
    }

    if (nomeTipo === "ENUM" && complementoTipo) {
        coluna.enum = separarCampos(
            complementoTipo.slice(1, -1)
        ).map(valor =>
            valor.trim().replace(/^(['"])([\s\S]*)\1$/, "$2")
        );
    }

    return coluna;
}

// Analisar chave estrangeira
function analisarChaveEstrangeira(definicao) {
    const fk = definicao.match(
        /^(?:CONSTRAINT\s+`?\w+`?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+(?:`?\w+`?\.)?`?(\w+)`?\s*\(([^)]+)\)/i
    );

    if (!fk) return null;

    return {
        coluna: limparNome(fk[1]),
        tabelaReferenciada: limparNome(fk[2]),
        colunaReferenciada: limparNome(fk[3])
    };
}

// Analisar CREATE TABLE
function analisarTabela(comando) {
    const inicio = comando.match(
        /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:`?\w+`?\.)?`?([a-zA-Z_]\w*)`?\s*\(/i
    );

    if (!inicio) return null;

    const nome = inicio[1];
    const posicao = comando.indexOf("(");
    const conteudo = extrairBloco(comando, posicao);

    const tabela = {
        nome,
        colunas: [],
        primaryKey: [],
        foreignKeys: []
    };

    const definicoes = separarCampos(conteudo);

    definicoes.forEach(definicao => {
        const pk = definicao.match(
            /^(?:CONSTRAINT\s+`?\w+`?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
        );

        if (pk) {
            adicionarChavePrimaria(
                tabela,
                pk[1].split(",")
            );
            return;
        }

        const fk = analisarChaveEstrangeira(definicao);

        if (fk) {
            adicionarChaveEstrangeira(tabela, fk);
            return;
        }

        const coluna = analisarColuna(definicao);

        if (coluna) {
            tabela.colunas.push(coluna);

            if (coluna.primaryKey) {
                adicionarChavePrimaria(tabela, [coluna.nome]);
            }
        }
    });

    return tabela;
}

// Analisar ALTER TABLE
function analisarAlterTable(comando, tabelas) {
    const alter = comando.match(
        /^ALTER\s+TABLE\s+(?:`?\w+`?\.)?`?(\w+)`?\s+([\s\S]+)$/i
    );

    if (!alter) return;

    const nomeTabela = alter[1];
    const operacao = alter[2].trim();

    const tabela = tabelas.find(
        t => t.nome.toLowerCase() === nomeTabela.toLowerCase()
    );

    if (!tabela) return;

    // Chave primária adicionada depois do CREATE TABLE
    const pk = operacao.match(
        /^(?:ADD\s+)?(?:CONSTRAINT\s+`?\w+`?\s+)?PRIMARY\s+KEY\s*\(([^)]+)\)/i
    );

    if (pk) {
        adicionarChavePrimaria(tabela, pk[1].split(","));
        return;
    }

    // Chave estrangeira adicionada depois
    const fk = analisarChaveEstrangeira(
        operacao.replace(/^ADD\s+/i, "")
    );

    if (fk) {
        adicionarChaveEstrangeira(tabela, fk);
    }
}

// Função principal
function analisarSQL(sql) {
    sql = sql
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*--.*$/gm, "");

    const comandos = separarComandos(sql);

    const resultado = {
        banco: null,
        tabelas: []
    };

    comandos.forEach(comando => {
        const banco = comando.match(
            /^CREATE\s+DATABASE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?/i
        );

        if (banco) {
            resultado.banco = banco[1];
            return;
        }

        const uso = comando.match(/^USE\s+`?(\w+)`?/i);

        if (uso) {
            resultado.banco = uso[1];
            return;
        }

        if (/^CREATE\s+TABLE\b/i.test(comando)) {
            const tabelaNova = analisarTabela(comando);

            if (tabelaNova) {
                const existente = resultado.tabelas.find(
                    t => t.nome.toLowerCase() === tabelaNova.nome.toLowerCase()
                );

                if (!existente) {
                    resultado.tabelas.push(tabelaNova);
                }
            }

            return;
        }

        if (/^ALTER\s+TABLE\b/i.test(comando)) {
            analisarAlterTable(comando, resultado.tabelas);
        }
    });

    return resultado;
}

module.exports = analisarSQL;