// === CONFIGURAÇÃO GOOGLE DRIVE ===
const CLIENT_ID = '374929675068-4datkhc3lt6jseb4tuqs8t9hliig2qdl.apps.googleusercontent.com';
const API_KEY = 'AIzaSyADVC6lYfqLPzFjpmMsVWFuTQ7OI_Gg0i8';
const FOLDER_ID = '1BNIIq5c4SiicY68_C03t-xhQu0b2lwOQ';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let gapiInited = false;
let gisInited = false;
let tokenClient;
let historico = JSON.parse(localStorage.getItem('bb-historico-v11')) || [];

// === MATÉRIAS E TÓPICOS ===
const materiasData = [
  { nome: 'LÍNGUA PORTUGUESA', peso: 2, topicos: [
    'Compreensão de textos','Ortografia oficial','Classe e emprego de palavras','Emprego do acento indicativo de crase',
    'Sintaxe da oração e do período','Emprego dos sinais de pontuação','Concordância verbal e nominal','Regência verbal e nominal',
    'Colocação dos pronomes oblíquos átonos'
  ]},
  { nome: 'LÍNGUA INGLESA', peso: 1, topicos: ['Vocabulário fundamental','Aspectos gramaticais básicos']},
  { nome: 'MATEMÁTICA', peso: 2, topicos: [
    'Números inteiros, racionais e reais','Sistema legal de medidas','Razões e proporções','Lógica proposicional',
    'Noções de conjuntos','Relações e funções','Matrizes','Determinantes','Sistemas lineares','Sequências',
    'Progressões aritméticas e geométricas'
  ]},
  { nome: 'ATUALIDADES DO MERCADO FINANCEIRO', peso: 1, topicos: [
    'Bancos na Era Digital','Internet banking','Mobile banking','Open banking','Fintechs','Fintechs/startups/bigtechs',
    'Shadow banking','Blockchain e criptomoedas','PIX e arranjos de pagamento','Transformação digital'
  ]},
  { nome: 'PROBABILIDADE E ESTATÍSTICA', peso: 1, topicos: [
    'Representação tabular e gráfica','Medidas de tendência central e dispersão','Variáveis aleatórias e distribuições',
    'Teorema de Bayes','Probabilidade condicional','Amostragem e inferência'
  ]},
  { nome: 'CONHECIMENTOS BANCÁRIOS', peso: 2, topicos: [
    'Sistema Financeiro Nacional','Mercado financeiro','Política monetária e SELIC','Orçamento público','Produtos bancários',
    'Mercado de câmbio','Taxas de juros','Lavagem de dinheiro','LGPD','Segurança cibernética'
  ]},
  { nome: 'TECNOLOGIA DA INFORMAÇÃO', peso: 3, topicos: [
    'Aprendizagem de máquina','NoSQL e MongoDB','SQL (Postgres)','Data Warehouse','Big Data',
    'Mobile (Java/Kotlin, Swift, React Native)','Estrutura de dados e algoritmos'
  ]}
];

// === INICIALIZAÇÃO ===
window.onload = () => {
  initializeGapi();
  initializeGis();
  renderizarMaterias();
  atualizarTabela();
};

// === GOOGLE DRIVE ===
function initializeGapi() {
  gapi.load('client', async () => {
    await gapi.client.init({
      apiKey: API_KEY,
      discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
  });
}

function initializeGis() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        alert('Erro ao autenticar: ' + resp.error);
      } else {
        carregarUltimoBackup();
      }
    },
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('driveStatus').innerHTML = `
      ✅ Conectado ao Google Drive
      <button class="btn-warning" onclick="exportarParaDrive()">Backup Agora</button>
      <button class="btn-secondary" onclick="carregarUltimoBackup()">Restaurar Último</button>
    `;
  }
}

// === LOGIN ===
function handleLogin() {
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

// === BACKUP ===
async function exportarParaDrive() {
  if (!gapi.client.getToken()) return tokenClient.requestAccessToken({ prompt: 'consent' });

  const dados = { version: 'v11', timestamp: new Date().toISOString(), historico };
  const content = JSON.stringify(dados, null, 2);
  const fileName = `bb-estudo-backup-${new Date().toISOString().slice(0, 10)}.json`;

  const metadata = { name: fileName, parents: [FOLDER_ID], mimeType: 'application/json' };
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";
  const body =
    delimiter + 'Content-Type: application/json\r\n\r\n' +
    JSON.stringify(metadata) + delimiter +
    'Content-Type: application/json\r\n\r\n' +
    content + close_delim;

  try {
    await gapi.client.request({
      path: '/upload/drive/v3/files?uploadType=multipart',
      method: 'POST',
      headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
      body
    });
    alert('✅ Backup salvo no Google Drive!');
  } catch (err) {
    console.error(err);
    alert('❌ Erro ao salvar backup.');
  }
}

async function carregarUltimoBackup() {
  try {
    const res = await gapi.client.drive.files.list({
      q: `'${FOLDER_ID}' in parents and mimeType='application/json'`,
      orderBy: 'createdTime desc',
      pageSize: 1,
      fields: 'files(id, name)'
    });
    if (!res.result.files.length) return alert('Nenhum backup encontrado.');

    const fileId = res.result.files[0].id;
    const file = await gapi.client.drive.files.get({ fileId, alt: 'media' });
    const dados = JSON.parse(file.body);
    historico = dados.historico;
    salvarLocal();
    alert(`📦 Backup restaurado (${new Date(dados.timestamp).toLocaleString('pt-BR')})`);
  } catch (e) {
    console.error(e);
    alert('❌ Erro ao carregar backup.');
  }
}

// === SALVAR LOCAL + AUTO BACKUP ===
function salvarLocal() {
  localStorage.setItem('bb-historico-v11', JSON.stringify(historico));
  atualizarTabela();
  renderizarMaterias();
}

function salvarComBackup() {
  salvarLocal();
  exportarParaDrive();
}

// === FUNÇÕES DE ESTUDO ===
function iniciar(materia, topico) {
  if (historico.find(h => h.materia === materia && h.topico === topico && !h.fim))
    return alert('Tópico já em andamento.');
  historico.push({ materia, topico, inicio: new Date().toISOString(), fim: null, status: 'Em andamento' });
  salvarComBackup();
}

function finalizar(materia, topico) {
  const reg = historico.find(h => h.materia === materia && h.topico === topico && !h.fim);
  if (!reg) return alert('Não iniciado!');
  reg.fim = new Date().toISOString();
  reg.status = 'Concluído';
  salvarComBackup();
}

// === RENDERIZAÇÃO ===
function renderizarMaterias() {
  const container = document.getElementById('materias');
  container.innerHTML = '';
  materiasData.forEach(m => {
    const concluidos = m.topicos.filter(t =>
      historico.some(h => h.materia === m.nome && h.topico === t && h.status === 'Concluído')
    ).length;

    const materiaDiv = document.createElement('div');
    materiaDiv.className = 'materia';
    materiaDiv.innerHTML = `
      <div class="materia-header" onclick="toggleMateria(this)">
        <strong>${m.nome}</strong> <span class="peso">(Peso ${m.peso})</span>
        <small style="opacity:0.8;">${concluidos}/${m.topicos.length}</small>
      </div>
      <div class="materia-content">
        ${m.topicos.map(t => {
          const reg = historico.find(h => h.materia === m.nome && h.topico === t);
          const status = reg ? reg.status : 'Pendente';
          const cor = status === 'Concluído' ? '#d4edda' : status === 'Em andamento' ? '#fff3cd' : '#f8d7da';
          return `
            <div class="topico-item" style="background:${cor};margin:6px 0;padding:8px;border-radius:6px;">
              <div style="flex:1;">${t}</div>
              <div>
                ${!reg ? `<button onclick="iniciar('${m.nome}','${t.replace(/'/g,"\\'")}')">Iniciar</button>` : ''}
                ${reg && !reg.fim ? `<button onclick="finalizar('${m.nome}','${t.replace(/'/g,"\\'")}')">Finalizar</button>` : ''}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    container.appendChild(materiaDiv);
  });
}

function toggleMateria(el) {
  const content = el.nextElementSibling;
  content.style.display = content.style.display === 'block' ? 'none' : 'block';
}

// === HISTÓRICO ===
function atualizarTabela() {
  const tbody = document.getElementById('tabelaHistorico');
  if (!tbody) return;
  tbody.innerHTML = '';
  historico.forEach(h => {
    const fim = h.fim ? new Date(h.fim).toLocaleString('pt-BR') : '-';
    const ini = new Date(h.inicio).toLocaleString('pt-BR');
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${h.materia}</td><td>${h.topico}</td>
      <td>${ini}</td><td>${fim}</td><td>${h.status}</td>
    `;
    tbody.appendChild(tr);
  });
}
