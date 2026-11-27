const API_URL = 'http://localhost:3000/pacientes';
const URL_VIACEP = 'https://viacep.com.br/ws';

// Referências do DOM
const form = document.getElementById('form-paciente');
const campoId = document.getElementById('id');
const campoNome = document.getElementById('nome');
const campoEmail = document.getElementById('email');
const campoNascimento = document.getElementById('nascimento');

// Referências dos campos de endereço
const campoCep = document.getElementById('cep');
const campoLogradouro = document.getElementById('logradouro');
const campoCidade = document.getElementById('cidade');
const campoUf = document.getElementById('uf');
const cepAjuda = document.getElementById('cep-ajuda');

const btnSalvar = document.getElementById('btn-salvar');
const btnCancelar = document.getElementById('btn-cancelar');
const tabela = document.getElementById('tabela-pacientes');
const alerta = document.getElementById('alerta');

// --- Funções auxiliares ---

function mostrarAlerta(mensagem, tipo = 'success') {
  alerta.textContent = mensagem;
  alerta.className = `alert alert-${tipo}`;
  setTimeout(() => {
    alerta.className = 'alert d-none';
  }, 4000);
}

function formatarData(dataIso) {
  if (!dataIso) return '—';
  const [ano, mes, dia] = dataIso.split('T')[0].split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarCidadeUf(paciente) {
  if (!paciente.cidade) {
    return '—';
  }
  return paciente.uf ? `${paciente.cidade}/${paciente.uf}` : paciente.cidade;
}

function criarCelula(texto) {
  const td = document.createElement('td');
  td.textContent = texto;
  return td;
}

// --- Integração com ViaCEP ---

async function buscarEndereco(cep) {
  cepAjuda.textContent = 'Buscando endereço...';

  try {
    const resposta = await fetch(`${URL_VIACEP}/${cep}/json/`);

    if (!resposta.ok) {
      throw new Error(`Erro HTTP: ${resposta.status}`);
    }

    const dados = await resposta.json();

    // CEP com formato válido, porém inexistente: a API responde com
    // sucesso HTTP, mas inclui o campo "erro" no JSON.
    if (dados.erro) {
      cepAjuda.textContent = 'CEP não encontrado. Preencha o endereço manualmente.';
      return;
    }

    campoLogradouro.value = dados.logradouro;
    campoCidade.value = dados.localidade; // no ViaCEP, a cidade chama "localidade"
    campoUf.value = dados.uf;
    cepAjuda.textContent = 'Endereço preenchido automaticamente.';
  } catch (erro) {
    console.error(erro);
    cepAjuda.textContent = 'Não foi possível consultar o CEP agora. Preencha manualmente.';
  }
}

campoCep.addEventListener('input', () => {
  campoCep.value = campoCep.value.replace(/\D/g, '').slice(0, 8);

  if (campoCep.value.length === 8) {
    buscarEndereco(campoCep.value);
  } else {
    cepAjuda.textContent = '';
  }
});

// --- CRUD de Pacientes ---

async function carregarPacientes() {
  try {
    const resposta = await fetch(API_URL);
    if (!resposta.ok) throw new Error('Erro ao carregar pacientes');

    const pacientes = await resposta.json();
    renderizarTabela(pacientes);
  } catch (erro) {
    console.error(erro);
    mostrarAlerta('Não foi possível carregar a lista de pacientes.', 'danger');
  }
}

function renderizarTabela(pacientes) {
  tabela.innerHTML = '';

  pacientes.forEach((paciente) => {
    const linha = document.createElement('tr');

    linha.appendChild(criarCelula(paciente.nome));
    linha.appendChild(criarCelula(paciente.email));
    linha.appendChild(criarCelula(formatarData(paciente.nascimento)));
    linha.appendChild(criarCelula(formatarCidadeUf(paciente)));

    const celulaAcoes = document.createElement('td');

    const btnEditar = document.createElement('button');
    btnEditar.textContent = 'Editar';
    btnEditar.className = 'btn btn-sm btn-outline-primary me-2';
    btnEditar.addEventListener('click', () => iniciarEdicao(paciente));

    const btnExcluir = document.createElement('button');
    btnExcluir.textContent = 'Excluir';
    btnExcluir.className = 'btn btn-sm btn-outline-danger';
    btnExcluir.addEventListener('click', () => excluirPaciente(paciente.id));

    celulaAcoes.appendChild(btnEditar);
    celulaAcoes.appendChild(btnExcluir);
    linha.appendChild(celulaAcoes);

    tabela.appendChild(linha);
  });
}

function iniciarEdicao(paciente) {
  campoId.value = paciente.id;
  campoNome.value = paciente.nome;
  campoEmail.value = paciente.email;
  campoNascimento.value = paciente.nascimento.split('T')[0];
  campoCep.value = paciente.cep ?? '';
  campoLogradouro.value = paciente.logradouro ?? '';
  campoCidade.value = paciente.cidade ?? '';
  campoUf.value = paciente.uf ?? '';
  cepAjuda.textContent = '';

  btnSalvar.textContent = 'Atualizar';
  btnCancelar.classList.remove('d-none');
  campoNome.focus();
}

function limparFormulario() {
  form.reset();
  campoId.value = '';
  cepAjuda.textContent = '';
  btnSalvar.textContent = 'Salvar';
  btnCancelar.classList.add('d-none');
}

btnCancelar.addEventListener('click', limparFormulario);

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const id = campoId.value;
  const dados = {
    nome: campoNome.value,
    email: campoEmail.value,
    nascimento: campoNascimento.value,
    cep: campoCep.value,
    logradouro: campoLogradouro.value,
    cidade: campoCidade.value,
    uf: campoUf.value,
  };

  const url = id ? `${API_URL}/${id}` : API_URL;
  const metodo = id ? 'PUT' : 'POST';

  try {
    const resposta = await fetch(url, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados),
    });

    const resultado = await resposta.json();

    if (!resposta.ok) {
      mostrarAlerta(resultado.erro || 'Erro ao salvar paciente.', 'danger');
      return;
    }

    mostrarAlerta(id ? 'Paciente atualizado com sucesso!' : 'Paciente cadastrado com sucesso!');
    limparFormulario();
    carregarPacientes();
  } catch (erro) {
    console.error(erro);
    mostrarAlerta('Falha de comunicação com o servidor.', 'danger');
  }
});

async function excluirPaciente(id) {
  if (!confirm('Tem certeza que deseja excluir este paciente?')) return;

  try {
    const resposta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });

    if (!resposta.ok) {
      const resultado = await resposta.json();
      mostrarAlerta(resultado.erro || 'Erro ao excluir paciente.', 'danger');
      return;
    }

    mostrarAlerta('Paciente excluído com sucesso!');
    carregarPacientes();
  } catch (erro) {
    console.error(erro);
    mostrarAlerta('Falha de comunicação com o servidor.', 'danger');
  }
}

// Inicialização
carregarPacientes();
