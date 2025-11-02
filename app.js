// === CONFIGURAÇÃO GOOGLE DRIVE ===
const CLIENT_ID = "374929675068-4datkhc3lt6jseb4tuqs8t9hliig2qdl.apps.googleusercontent.com";
const API_KEY = "AIzaSyADVC6lYfqLPzFjpmMsVWFuTQ7OI_Gg0i8";
const FOLDER_ID = "1BNIIq5c4SiicY68_C03t-xhQu0b2lwOQ";
const SCOPES = "https://www.googleapis.com/auth/drive.file";
const DISCOVERY_DOC = "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest";

// === VARIÁVEIS DE ESTADO ===
let historico = [];
let materiasData = [];
let tokenClient;
let gapiInited = false;
let gisInited = false;

// === MATERIAS E TÓPICOS ===
materiasData = [
  { nome: 'LÍNGUA PORTUGUESA', peso: 2, topicos: [
    'Compreensão de textos','Ortografia oficial','Classe e emprego de palavras','Emprego do acento indicativo de crase',
    'Sintaxe da oração e do período','Emprego dos sinais de pontuação','Concordância verbal e nominal','Regência verbal e nominal',
    'Colocação dos pronomes oblíquos átonos'
  ]},
  { nome: 'LÍNGUA INGLESA', peso: 1, topicos: ['Vocabulário fundamental','Aspectos gramaticais básicos']},
  { nome: 'MATEMÁTICA', peso: 2, topicos: ['Números inteiros, racionais e reais','Sistema legal de medidas','Razões e proporções','Lógica proposicional','Noções de conjuntos','Relações e funções','Matrizes','Determinantes','Sistemas lineares','Sequências','Progressões aritméticas e geométricas']},
  { nome: 'ATUALIDADES DO MERCADO FINANCEIRO', peso: 1, topicos: ['Bancos na Era Digital','Internet banking','Mobile banking','Open banking','Fintechs','Fintechs/startups/bigtechs','Shadow banking','Blockchain e criptomoedas','PIX e arranjos de pagamento','Transformação digital']},
  { nome: 'PROBABILIDADE E ESTATÍSTICA', peso: 1, topicos: ['Representação tabular e gráfica','Medidas de tendência central e dispersão','Variáveis aleatórias e distribuições','Teorema de Bayes','Probabilidade condicional','Amostragem e inferência']},
  { nome: 'CONHECIMENTOS BANCÁRIOS', peso: 2, topicos : [ '1 - Sistema Financeiro Nacional: Estrutura do Sistema Financeiro Nacional; Órgãos normativos e instituições supervisoras, executoras e operadoras.', '2 - Mercado financeiro e seus desdobramentos (mercados monetário, de crédito, de capitais e cambial).', '3 - Moeda e política monetária: Políticas monetárias convencionais e não-convencionais (Quantitative Easing); Taxa SELIC e operações compromissadas; O debate sobre os depósitos remunerados dos bancos comerciais no Banco Central do Brasil.', '4 - Orçamento público, títulos do Tesouro Nacional e dívida pública.', '5 - Produtos Bancários: Noções de cartões de crédito e débito, crédito direto ao consumidor, crédito rural, poupança, capitalização, previdência, consórcio, investimentos e seguros.', '6 - Noções de Mercado de capitais.', '7 - Noções de Mercado de Câmbio: Instituições autorizadas a operar e operações básicas.', '8 - Regimes de taxas de câmbio fixas, flutuantes e regimes intermediários.', '9 - Taxas de câmbio nominais e reais.', '10 - Impactos das taxas de câmbio sobre as exportações e importações.', '11 - Diferencial de juros interno e externo, prêmios de risco, fluxo de capitais e seus impactos sobre as taxas de câmbio.', '12 - Dinâmica do Mercado: Operações no mercado interbancário.', '13 - Mercado bancário: Operações de tesouraria, varejo bancário e recuperação de crédito.', '14 - Taxas de juros de curto prazo e a curva de juros; taxas de juros nominais e reais.', '15 - Garantias do Sistema Financeiro Nacional: aval; fiança; penhor mercantil; alienação fiduciária; hipoteca; fianças bancárias.', '16 - Crime de lavagem de dinheiro: conceito e etapas; Prevenção e combate ao crime de lavagem de dinheiro: Lei nº 9.613/98 e suas alterações; Circular nº 3.978, de 23 de janeiro de 2020 e Carta Circular nº 4.001, de 29 de janeiro de 2020 e suas alterações.', '17 - Autorregulação bancária e Normativos SARB.', '18 - Sigilo Bancário: Lei Complementar nº 105/2001 e suas alterações.', '19 - Lei Geral de Proteção de Dados (LGPD): Lei nº 13.709, de 14 de agosto de 2018 e suas alterações.', '20 - Legislação anticorrupção: Lei nº 12.846/2013 e Decreto nº 11.129 de 11/07/2022.', '21 - Segurança cibernética: Resolução CMN nº 4.893, de 26/02/2021.', '22 - Ética aplicada: ética, moral, valores e virtudes; noções de ética empresarial e profissional; gestão da ética nas empresas públicas e privadas; Código de Ética do Banco do Brasil (disponível no sítio do BB na internet).', '23 - Política de Responsabilidade Socioambiental do Banco do Brasil (disponível no sítio do BB na internet).', '24 - ASG (Ambiental, Social e Governança): Economia Sustentável; Financiamentos; Mercado PJ.' ]},
  { nome: 'TECNOLOGIA DA INFORMAÇÃO', peso: 3, topicos: ['Aprendizagem de máquina','NoSQL e MongoDB','SQL (Postgres)','Data Warehouse','Big Data','Mobile (Java/Kotlin, Swift, React Native)','Estrutura de dados e algoritmos'] }
];

// === INICIALIZAÇÃO DO GOOGLE DRIVE ===
function gapiLoaded() {
  gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: [DISCOVERY_DOC],
  });
  gapiInited = true;
  maybeEnableApp();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: handleTokenResponse,
  });
  gisInited = true;
  maybeEnableApp();
}

function handleTokenResponse(resp) {
  if (resp.error) {
    console.error(resp);
    alert("Erro ao autenticar no Google");
    return;
  }
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("appSection").style.display = "block";
  carregarBackupDoDrive();
}

function maybeEnableApp() {
  if (gapiInited && gisInited) {
    document.getElementById("btnLoginGoogle").disabled = false;
  }
}

// === LOGIN GOOGLE ===
function handleLogin() {
  tokenClient.requestAccessToken({ prompt: '' });
}

// === BACKUP ===
async function salvarBackupNoDrive() {
  const dados = { timestamp: new Date().toISOString(), historico };
  const content = JSON.stringify(dados, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const closeDelim = "\r\n--" + boundary + "--";

  const metadata = {
    name: `backup-estudobb-${new Date().toISOString().slice(0,10)}.json`,
    mimeType: "application/json",
    parents: [FOLDER_ID]
  };

  const body = delimiter +
    "Content-Type: application/json\r\n\r\n" +
    JSON.stringify(metadata) +
    delimiter +
    "Content-Type: application/json\r\n\r\n" +
    content +
    closeDelim;

  try {
    await gapi.client.request({
      path: "/upload/drive/v3/files?uploadType=multipart",
      method: "POST",
      params: { supportsAllDrives: true },
      headers: { "Content-Type": "multipart/related; boundary=" + boundary },
      body,
    });
    alert("✅ Backup salvo no Google Drive com sucesso!");
  } catch (err) {
    console.error(err);
    alert("❌ Erro ao salvar backup no Drive.");
  }
}

async function carregarBackupDoDrive() {
  try {
    const response = await gapi.client.drive.files.list({
      q: `'${FOLDER_ID}' in parents and name contains 'backup-estudobb' and trashed=false`,
      orderBy: 'createdTime desc',
      pageSize: 1,
      fields: "files(id, name, createdTime)"
    });
    if (!response.result.files || response.result.files.length === 0) {
      console.log("Nenhum backup encontrado, iniciando vazio.");
      carregarLocal();
      return;
    }
    const fileId = response.result.files[0].id;
    const file = await gapi.client.drive.files.get({
      fileId,
      alt: 'media'
    });
    historico = file.result.historico || [];
    corrigirBackupsAntigos();
    salvarLocal();
    renderizarMaterias();
    atualizarTabela();
    console.log("Backup carregado com sucesso do Drive.");
  } catch (err) {
    console.error("Erro ao carregar backup:", err);
    carregarLocal();
  }
}

// === LOCAL STORAGE ===
function salvarLocal() {
  localStorage.setItem("historico", JSON.stringify(historico));
}

function carregarLocal() {
  historico = JSON.parse(localStorage.getItem("historico")) || [];
  corrigirBackupsAntigos();
  renderizarMaterias();
  atualizarTabela();
}

// === CORRIGIR BACKUPS ANTIGOS ===
function corrigirBackupsAntigos() {
  historico.forEach(h => {
    if (!h.tentativa) h.tentativa = 1;
  });
}

// === RENDERIZAR MATÉRIAS ===
function renderizarMaterias() {
  const container = document.getElementById("materias");
  container.innerHTML = "";
  materiasData.forEach(m => {
    const concluidos = historico.filter(h => h.materia === m.nome && h.status === 'Concluído').length;

    const div = document.createElement("div");
    div.className = "materia";
    div.innerHTML = `
      <div class="materia-header" onclick="toggleMateria(this)">
        <strong>${m.nome}</strong> <span class="peso">(Peso ${m.peso})</span>
        <small style="opacity:0.8;">${concluidos}/${m.topicos.length}</small>
      </div>
      <div class="materia-content">
        ${m.topicos.map(t => {
          const regAtivo = historico.find(h => h.materia === m.nome && h.topico === t && !h.fim);
          const status = regAtivo ? regAtivo.status : 'Pendente';
          const cor = status === 'Concluído' ? '#d4edda' : status === 'Em andamento' ? '#fff3cd' : '#f8d7da';
          return `
            <div class="topico-item" style="background:${cor};margin:6px 0;padding:8px;border-radius:6px;">
              <div style="flex:1;">${t}</div>
              <div>
                <button onclick="iniciar('${m.nome}','${t.replace(/'/g,"\\'")}')">Iniciar</button>
                ${regAtivo && !regAtivo.fim ? `<button onclick="finalizar('${m.nome}','${t.replace(/'/g,"\\'")}')">Finalizar</button>` : ''}
              </div>
            </div>
          `;
        }).join("")}
      </div>
    `;
    container.appendChild(div);
  });
}

// === TOGGLE MATERIA ===
function toggleMateria(el) {
  el.nextElementSibling.classList.toggle("open");
}

// === INICIAR / FINALIZAR TÓPICO ===
function iniciar(materia, topico) {
  const tentativas = historico.filter(h => h.materia === materia && h.topico === topico).length;
  historico.push({
    materia,
    topico,
    inicio: new Date().toISOString(),
    fim: null,
    status: 'Em andamento',
    tentativa: tentativas + 1
  });
  salvarLocal();
  renderizarMaterias();
}

function finalizar(materia, topico) {
  const reg = historico.find(h => h.materia === materia && h.topico === topico && !h.fim);
  if (!reg) return alert("Tópico não iniciado!");
  reg.fim = new Date().toISOString();
  reg.status = 'Concluído';
  salvarLocal();
  salvarBackupNoDrive();
  renderizarMaterias();
  atualizarTabela();
}

// === TABELA DE HISTÓRICO ===
function atualizarTabela() {
  const tbody = document.getElementById("tabelaHistorico");
  tbody.innerHTML = "";
  historico.slice().reverse().forEach((h, i) => {
    const tr = document.createElement("tr");
    const inicio = new Date(h.inicio).toLocaleString('pt-BR');
    const fim = h.fim ? new Date(h.fim).toLocaleString('pt-BR') : '-';
    const duracao = h.fim ? Math.round((new Date(h.fim) - new Date(h.inicio)) / 60000) + ' min' : '-';
    tr.innerHTML = `
      <td>${h.materia}</td>
      <td>${h.topico}</td>
      <td>${inicio}</td>
      <td>${fim}</td>
      <td>${duracao}</td>
      <td>${h.status}</td>
      <td>${h.tentativa}ª vez</td>
    `;
    tbody.appendChild(tr);
  });
}

// === SAIR ===
function logout() {
  google.accounts.id.disableAutoSelect();
  localStorage.clear();
  document.getElementById("loginSection").style.display = "block";
  document.getElementById("appSection").style.display = "none";
}

// === INICIALIZAÇÃO ===
window.onload = function() {
  carregarLocal();
  renderizarMaterias();
  atualizarTabela();
};
