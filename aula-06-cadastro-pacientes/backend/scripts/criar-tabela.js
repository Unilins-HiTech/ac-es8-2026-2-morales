const fs = require('fs');
const path = require('path');
const pool = require('../banco');

// A ordem importa: cada script depende do anterior.
// Ferramentas de "migrations" automatizam exatamente isso.
const ARQUIVOS_SQL = ['schema.sql', '002-adicionar-endereco.sql'];

async function aplicarScripts() {
  try {
    for (const arquivo of ARQUIVOS_SQL) {
      const sql = fs.readFileSync(path.join(__dirname, arquivo), 'utf8');
      await pool.query(sql);
      console.log(`Script aplicado: ${arquivo}`);
    }
  } finally {
    await pool.end(); // fecha as conexões para o script terminar
  }
}

aplicarScripts().catch((erro) => {
  console.error('Falha ao aplicar os scripts:', erro);
  process.exit(1);
});
