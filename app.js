// === CONFIGURAÇÃO GOOGLE DRIVE ===
const CLIENT_ID = 'S374929675068-4datkhc3lt6jseb4tuqs8t9hliig2qdl.apps.googleusercontent.com'; // ← Substitua
const API_KEY = 'AIzaSyADVC6lYfqLPzFjpmMsVWFuTQ7OI_Gg0i8';     // ← Substitua
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FILE_ID = '1BNIIq5c4SiicY68_C03t-xhQu0b2lwOQ';      // ← ID do arquivo no Drive

let tokenClient;
let gapiInited = false, gisInited = false;

// === MATÉRIAS ===
const materias = [
  {nome:'LÍNGUA PORTUGUESA',topicos:['Compreensão de textos','Ortografia oficial','Classe e emprego de palavras','Emprego do acento indicativo de crase','Sintaxe da oração e do período','Emprego dos sinais de pontuação','Concordância verbal e nominal','Regência verbal e nominal','Colocação dos pronomes oblíquos átonos'],peso:2},
  {nome:'LÍNGUA INGLESA',topicos:['Vocabulário fundamental','Aspectos gramaticais básicas'],peso:1},
  {nome:'MATEMÁTICA',topicos:['Números inteiros, racionais e reais','Sistema legal de medidas','Razões e proporções','Lógica proposicional','Noções de conjuntos','Relações e funções','Matrizes','Determinantes','Sistemas lineares','Sequências','Progressões aritméticas e geométricas'],peso:2},
  {nome:'ATUALIDADES DO MERCADO FINANCEIRO',topicos:['Bancos na Era Digital','Internet banking e Mobile banking','Open banking','Fintechs, startups e big techs','Shadow banking','Blockchain e criptomoedas','PIX e arranjos de pagamento','Transformação digital no sistema financeiro'],peso:1},
  {nome:'PROBABILIDADE E ESTATÍSTICA',topicos:['Representação tabular e gráfica','Medidas de tendência central e dispersão','Variáveis aleatórias e distribuições','Teorema de Bayes e probabilidade condicional','Distribuição binomial e normal','Noções de amostragem e inferência estatística'],peso:1},
  {nome:'CONHECIMENTOS BANCÁRIOS',topicos:['Sistema Financeiro Nacional','Mercado financeiro','Política monetária e SELIC','Orçamento público e dívida pública','Produtos bancários','Mercado de câmbio','Taxas de juros e curva de juros','Lavagem de dinheiro e LGPD','Segurança cibernética e responsabilidade socioambiental'],peso:2},
  {nome:'TECNOLOGIA DA INFORMAÇÃO',topicos:['Aprendizagem de máquina','Banco de dados SQL e NoSQL','Big Data','Desenvolvimento Mobile','Estrutura de dados e algoritmos','Ferramentas e linguagens para dados'],peso:3}
];

let historico = [];

// === DOM ===
const $ = id => document.getElementById(id);

// === INICIALIZAÇÃO ===
function init() {
  loadGapi();
  loadGis();
}

function loadGapi() {
  const script = document.createElement('script');
  script.src = 'https://apis.google.com/js/api.js';
  script.onload = () => {
    gapi.load('client', async () => {
      await gapi.client.init({ apiKey: API_KEY, discoveryDocs: [DISCOVERY_DOC] });
      gapiInited = true;
      maybeBootstrap();
    });
  };
  document.body.appendChild(script);
}

function loadGis() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.onload = () => { gisInited = true; maybeBootstrap(); };
  document.body.appendChild(script);
}

function maybeBootstrap() {
  if (gapiInited && gisInited) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: () => carregarDoDrive()
    });
    autenticar();
  }
}

function autenticar() {
  if (gapi.client.getToken()) {
    carregarDoDrive();
  } else {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
}

// === DRIVE: SALVAR E CARREGAR ===
async function carregarDoDrive() {
  try {
    const response = await gapi.client.drive.files.get({
      fileId: FILE_ID,
      alt: 'media'
    });
    historico = JSON.parse(response.body) || [];
    status('Sincronizado com Google Drive');
  } catch (e) {
    historico = JSON.parse(localStorage.getItem('bb-local') || '[]');
    status('Offline (usando cache local)');
  }
  atualizar();
}

async function salvarNoDrive() {
  try {
    const content = JSON.stringify(historico);
    await gapi.client.request({
      path: `/upload/drive/v3/files/${FILE_ID}`,
      method: 'PATCH',
      params: { uploadType: 'media' },
      body: content
    });
    localStorage.setItem('bb-local', content);
    status('Salvo no Google Drive');
  } catch (e) {
    localStorage.setItem('bb-local', JSON.stringify(historico));
    status('Erro ao salvar no Drive');
  }
}

// === UI ===
function status(txt) {
  const el = $('syncStatus');
  el.textContent = txt;
  el.style.color = txt.includes('Erro') ? 'red' : txt.includes('Offline') ? 'orange' : '#004aad';
}

function atualizar() {
  atualizarTabela();
  atualizarEstatisticas();
  renderizarMaterias();
}

function atualizarTabela() {
  const tbody = $('tabelaHistorico');
  tbody.innerHTML = '';
  historico.forEach((h, i) => {
    const min = h.fim ? Math.round((new Date(h.fim) - new Date(h.inicio)) / 60000) : '-';
    const tr = document.createElement('tr');
    tr.className = h.status === 'Concluído' ? 'concluido' : h.status === 'Em andamento' ? 'andamento' : '';
    tr.innerHTML = `<td>${h.materia}</td><td>${h.topico}</td><td>${fmt(h.inicio)}</td><td>${h.fim ? fmt(h.fim) : '-'}</td><td>${min}</td><td>${h.status}</td><td><button class="btn-peq" style="background:#dc3545;color:white;" onclick="excluir(${i})">X</button></td>`;
    tbody.appendChild(tr);
  });
}

function excluir(i) {
  if (confirm('Excluir registro?')) {
    historico.splice(i, 1);
    salvarNoDrive();
  }
}

function atualizarEstatisticas() {
  const hoje = new Date().toISOString().slice(0,10);
  let hojeMin = 0, semanaMin = 0, concluidos = 0, pesoTotal = 0, pesoFeito = 0;
  const inicioSemana = new Date(); 
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay() + 1); 
  inicioSemana.setHours(0,0,0,0);

  materias.forEach(m => pesoTotal += m.peso * m.topicos.length);

  historico.forEach(h => {
    if (h.fim) {
      const mins = Math.round((new Date(h.fim) - new Date(h.inicio)) / 60000);
      if (h.inicio.slice(0,10) === hoje) hojeMin += mins;
      if (new Date(h.inicio) >= inicioSemana) semanaMin += mins;
      if (h.status === 'Concluído') {
        concluidos++;
        const m = materias.find(x => x.nome === h.materia);
        if (m) pesoFeito += m.peso;
      }
    }
  });

  const prog = pesoTotal ? Math.round((pesoFeito / pesoTotal) * 100) : 0;
  $('tempoHoje').textContent = hojeMin;
  $('tempoSemana').textContent = semanaMin;
  $('topicosConcluidos').textContent = concluidos;
  $('progressoGeral').textContent = prog;
}

function renderizarMaterias() {
  const container = $('materias');
  container.innerHTML = '';
  materias.forEach(m => {
    const concluidos = m.topicos.filter(t => historico.some(h => h.materia === m.nome && h.topico === t && h.status === 'Concluído')).length;
    const div = document.createElement('div');
    div.className = 'materia';
    div.innerHTML = `
      <div class="m-header" onclick="toggle(this)">
        <div>${m.nome} <small>(Peso: ${m.peso}) ${concluidos}/${m.topicos.length}</small></div>
        <span>Down Arrow</span>
      </div>
      <div class="m-content">
        ${m.topicos.map(t => {
          const r = historico.find(h => h.materia === m.nome && h.topico === t);
          const st = r?.status || 'Pendente';
          const cls = st === 'Concluído' ? 'concluido' : st === 'Em andamento' ? 'andamento' : 'pendente';
          return `<div class="topico">
            <div class="status ${cls}"></div>
            <div style="flex:1">${t}</div>
            <div class="acoes">
              ${!r?.inicio ? `<button class="btn-peq btn-verde" onclick="iniciar('${m.nome}','${esc(t)}')">Iniciar</button>` : ''}
              ${r?.inicio && !r?.fim ? `<button class="btn-peq" style="background:#ffc107;color:#212529;" onclick="finalizar('${m.nome}','${esc(t)}')">Finalizar</button>` : ''}
              <button class="btn-peq btn-cinza" onclick="nota('${m.nome}','${esc(t)}','${esc(r?.nota||"")}')">Nota</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
    container.appendChild(div);
  });
}

function toggle(el) {
  const content = el.nextElementSibling;
  const arrow = el.querySelector('span');
  content.classList.toggle('open');
  arrow.textContent = content.classList.contains('open') ? 'Up Arrow' : 'Down Arrow';
}

function esc(s) { return s.replace(/'/g, "\\'"); }
function fmt(iso) { return new Date(iso).toLocaleString('pt-BR', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}); }

// === AÇÕES ===
function iniciar(m, t) {
  if (historico.some(h => h.materia === m && h.topico === t && !h.fim)) return alert('Já em andamento!');
  historico.push({materia: m, topico: t, inicio: new Date().toISOString(), status: 'Em andamento', nota: ''});
  salvarNoDrive();
}

function finalizar(m, t) {
  const r = historico.find(h => h.materia === m && h.topico === t && !h.fim);
  if (!r) return alert('Não iniciado!');
  r.fim = new Date().toISOString();
  r.status = 'Concluído';
  salvarNoDrive();
}

function resetarProgresso() {
  if (confirm('Resetar TODO o progresso?')) {
    historico = historico.map(h => ({...h, inicio: null, fim: null, status: 'Pendente', nota: ''}));
    salvarNoDrive();
  }
}

let notaAtual = {};
function nota(m, t, n) {
  notaAtual = {m, t};
  $('notaText').value = n;
  $('notaModal').style.display = 'flex';
}

function salvarNota() {
  const n = $('notaText').value;
  const r = historico.find(h => h.materia === notaAtual.m && h.topico === notaAtual.t);
  if (r) r.nota = n;
  salvarNoDrive();
  fecharModal();
}

function fecharModal() {
  $('notaModal').style.display = 'none';
}

// === EVENTOS ===
document.addEventListener('DOMContentLoaded', () => {
  $('btnReset').onclick = resetarProgresso;
  $('btnCancelarNota').onclick = fecharModal;
  $('btnSalvarNota').onclick = salvarNota;
  init();
});