const pacientes = [];

// Contadores por origem (Issue 2)
let totalJson = 0;
let totalLocal = 0;

// Referências aos elementos do DOM
const formulario = document.getElementById('form-paciente');
const tabela = document.getElementById('tabela-pacientes');
const tabelaContainer = document.getElementById('tabela-container');
const mensagemCarregando = document.getElementById('carregando');
const mensagemVazia = document.getElementById('mensagem-vazia');
const mensagemErro = document.getElementById('mensagem-erro');
const contadorOrigem = document.getElementById('contador-origem');

function adicionarPaciente(nome, email, nascimento, origem = 'local') {
	pacientes.push({ nome, email, nascimento, origem });
	if (origem === 'json') {
		totalJson++;
	} else {
		totalLocal++;
	}
}

function atualizarContador() {
	contadorOrigem.textContent = `JSON: ${totalJson} | Local: ${totalLocal}`;
}

function renderizarTabela() {
	tabela.innerHTML = '';
	atualizarContador();

	if (pacientes.length === 0) {
		// Issue 3: Tratamento de lista vazia
		tabelaContainer.classList.add('d-none');
		mensagemVazia.classList.remove('d-none');
	} else {
		tabelaContainer.classList.remove('d-none');
		mensagemVazia.classList.add('d-none');

		pacientes.forEach((paciente) => {
			const linha = document.createElement('tr');
			linha.innerHTML = `
        <td>${paciente.nome}</td>
        <td>${paciente.email}</td>
        <td>${formatarData(paciente.nascimento)}</td>
      `;
			tabela.appendChild(linha);
		});
	}
}

function formatarData(dataISO) {
	if (!dataISO) return '';
	const partes = dataISO.split('-');
	if (partes.length !== 3) return dataISO;
	const [ano, mes, dia] = partes;
	return `${dia}/${mes}/${ano}`;
}

// Busca os pacientes iniciais a partir do arquivo JSON
async function carregarPacientesIniciais() {
	// Exibe a mensagem de carregamento e esconde os demais alertas
	mensagemCarregando.classList.remove('d-none');
	mensagemCarregando.textContent = 'Carregando pacientes...';
	mensagemErro.classList.add('d-none');
	mensagemVazia.classList.add('d-none');
	tabelaContainer.classList.add('d-none');

	// Issue 1: Simulação de Latência (1 segundo de setTimeout/Promise antes do fetch)
	await new Promise((resolve) => setTimeout(resolve, 1000));

	// Issue 4: Para testar o Erro Amigável, altere a URL para um arquivo inexistente (ex: 'data/pacientes_erro.json')
	const urlFetch = 'data/pacientes.json';

	try {
		const resposta = await fetch(urlFetch);

		if (!resposta.ok) {
			throw new Error(`Erro HTTP: ${resposta.status}`);
		}

		const dados = await resposta.json();

		// Adiciona cada paciente vindo do JSON
		dados.forEach((paciente) => {
			adicionarPaciente(paciente.nome, paciente.email, paciente.nascimento, 'json');
		});

		// Oculta a mensagem de carregamento
		mensagemCarregando.classList.add('d-none');

		// Issue 3: Renderiza a tabela ou a mensagem de lista vazia
		renderizarTabela();

	} catch (erro) {
		console.error('Não foi possível carregar os pacientes:', erro);

		// Oculta mensagem de carregamento
		mensagemCarregando.classList.add('d-none');

		// Issue 4: Mensagem de erro clara e amigável na interface
		mensagemErro.textContent = 'Ops! Não foi possível carregar os dados dos pacientes. Verifique a URL do arquivo ou tente novamente mais tarde.';
		mensagemErro.classList.remove('d-none');
	}
}

formulario.addEventListener('submit', (event) => {
	event.preventDefault();

	const nome = document.getElementById('nome').value;
	const email = document.getElementById('email').value;
	const nascimento = document.getElementById('nascimento').value;

	adicionarPaciente(nome, email, nascimento, 'local');
	renderizarTabela();

	formulario.reset();
});

// Dispara o carregamento dos pacientes
carregarPacientesIniciais();
