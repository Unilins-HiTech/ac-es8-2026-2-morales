require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./banco');

const app = express();
const PORTA = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Colunas retornadas nas consultas (agora inclui o endereço)
const COLUNAS = 'id, nome, email, nascimento, cep, logradouro, cidade, uf';

// --- Funções auxiliares de validação e tratamento ---

function idValido(id) {
  return Number.isInteger(id) && id > 0;
}

function dadosValidos(corpo) {
  if (!corpo) return false;
  const { nome, email, nascimento } = corpo;
  return Boolean(
    nome && String(nome).trim() !== '' &&
    email && String(email).trim() !== '' &&
    nascimento && String(nascimento).trim() !== ''
  );
}

// Converte texto vazio em null (o banco guarda NULL, não "")
function textoOuNulo(valor) {
  const texto = String(valor ?? '').trim();
  return texto === '' ? null : texto;
}

// Lê os campos de endereço do corpo da requisição
function lerEndereco(corpo) {
  const cep = textoOuNulo(corpo.cep);
  const uf = textoOuNulo(corpo.uf);

  return {
    cep: cep === null ? null : cep.replace(/\D/g, ''), // só dígitos
    logradouro: textoOuNulo(corpo.logradouro),
    cidade: textoOuNulo(corpo.cidade),
    uf: uf === null ? null : uf.toUpperCase(),
  };
}

// O backend valida de novo, mesmo que o frontend já tenha validado
function enderecoValido({ cep, uf }) {
  const cepOk = cep === null || /^\d{8}$/.test(cep);
  const ufOk = uf === null || /^[A-Z]{2}$/.test(uf);
  return cepOk && ufOk;
}

function tratarErro(res, erro) {
  console.error(erro);

  // Código 23505 no PostgreSQL = violação de unicidade (UNIQUE)
  if (erro.code === '23505') {
    return res.status(409).json({ erro: 'Já existe um paciente cadastrado com este e-mail' });
  }

  // Código 22007 / 22008 = formato de data inválido
  if (erro.code === '22007' || erro.code === '22008') {
    return res.status(400).json({ erro: 'Data de nascimento inválida' });
  }

  return res.status(500).json({ erro: 'Erro interno no servidor' });
}

// --- Rotas da API ---

// READ ALL — GET /pacientes
app.get('/pacientes', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT ${COLUNAS} FROM pacientes ORDER BY id DESC`
    );
    res.json(resultado.rows);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// READ ONE — GET /pacientes/:id
app.get('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const resultado = await pool.query(
      `SELECT ${COLUNAS} FROM pacientes WHERE id = $1`,
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// CREATE — POST /pacientes
app.post('/pacientes', async (req, res) => {
  if (!dadosValidos(req.body)) {
    return res.status(400).json({ erro: 'Nome, e-mail e nascimento são obrigatórios' });
  }

  const { nome, email, nascimento } = req.body;
  const endereco = lerEndereco(req.body);

  if (!enderecoValido(endereco)) {
    return res.status(400).json({ erro: 'CEP deve ter 8 dígitos e UF deve ter 2 letras' });
  }

  try {
    const resultado = await pool.query(
      `INSERT INTO pacientes (nome, email, nascimento, cep, logradouro, cidade, uf)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${COLUNAS}`,
      [nome.trim(), email.trim(), nascimento, endereco.cep, endereco.logradouro, endereco.cidade, endereco.uf]
    );

    res.status(201).json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// UPDATE — PUT /pacientes/:id
app.put('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  if (!dadosValidos(req.body)) {
    return res.status(400).json({ erro: 'Nome, e-mail e nascimento são obrigatórios' });
  }

  const { nome, email, nascimento } = req.body;
  const endereco = lerEndereco(req.body);

  if (!enderecoValido(endereco)) {
    return res.status(400).json({ erro: 'CEP deve ter 8 dígitos e UF deve ter 2 letras' });
  }

  try {
    const resultado = await pool.query(
      `UPDATE pacientes
          SET nome = $1, email = $2, nascimento = $3,
              cep = $4, logradouro = $5, cidade = $6, uf = $7
        WHERE id = $8
        RETURNING ${COLUNAS}`,
      [nome.trim(), email.trim(), nascimento, endereco.cep, endereco.logradouro, endereco.cidade, endereco.uf, id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.json(resultado.rows[0]);
  } catch (erro) {
    tratarErro(res, erro);
  }
});

// DELETE — DELETE /pacientes/:id
app.delete('/pacientes/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!idValido(id)) {
    return res.status(400).json({ erro: 'ID inválido' });
  }

  try {
    const resultado = await pool.query(
      'DELETE FROM pacientes WHERE id = $1 RETURNING id',
      [id]
    );

    if (resultado.rowCount === 0) {
      return res.status(404).json({ erro: 'Paciente não encontrado' });
    }

    res.status(204).send();
  } catch (erro) {
    tratarErro(res, erro);
  }
});

app.listen(PORTA, () => {
  console.log(`Servidor rodando em http://localhost:${PORTA}`);
});
