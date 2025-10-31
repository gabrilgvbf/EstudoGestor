// app.js (ES module)
const CLIENT_ID = '374929675068-4datkhc3lt6jseb4tuqs8t9hliig2qdl.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const DRIVE_FILE_NAME = 'bb-estudo-backup.json'; // único arquivo usado no appDataFolder

// ---------- Dados iniciais (materias/tópicos completos) ----------
const materiasData = [
  { nome: 'LÍNGUA PORTUGUESA', peso: 2, topicos: [
    'Compreensão de textos','Ortografia oficial','Classe e emprego de palavras','Emprego do acento indicativo de crase',
    'Sintaxe da oração e do período','Emprego dos sinais de pontuação','Concordância verbal e nominal','Regência verbal e nominal',
    'Colocação dos pronomes oblíquos átonos'
  ]},
  { nome: 'LÍNGUA INGLESA', peso: 1, topicos: ['Vocabulário fundamental','Aspectos gramaticais básicos']},
  { nome: 'MATEMÁTICA', peso: 2, topicos: ['Números inteiros, racionais e reais','Sistema legal de medidas','Razões e proporções','Lógica proposicional','Noções de conjuntos','Relações e funções','Matrizes','Determinantes','Sistemas lineares','Sequências','Progressões aritméticas e geométricas']},
  { nome: 'ATUALIDADES DO MERCADO FINANCEIRO', peso: 1, topicos: ['Bancos na Era Digital','Internet banking','Mobile banking','Open banking','Fintechs','Fintechs/startups/bigtechs','Shadow banking','Blockchain e criptomoedas','PIX e arranjos de pagamento','Transformação digital']},
  { nome: 'PROBABILIDADE E ESTATÍSTICA', peso: 1, topicos: ['Representação tabular e gráfica','Medidas de tendência central e dispersão','Variáveis aleatórias e distribuições','Teorema de Bayes','Probabilidade condicional','Amostragem e inferência']},
  { nome: 'CONHECIMENTOS BANCÁRIOS', peso: 2, topicos: ['Sistema Financeiro Nacional','Mercado financeiro','Política monetária e SELIC','Orçamento público','Produtos bancários','Mercado de câmbio','Taxas de juros','Lavagem de dinheiro','LGPD','Segurança cibernética']},
  { name: 'TECNOLOGIA DA INFORMAÇÃO', peso: 3, topicos: ['Aprendizagem de máquina','NoSQL e MongoDB','SQL (Postgres)','Data Warehouse','Big Data','Mobile (Java/Kotlin, Swift, React Native)','Estrutura de dados e algoritmos'] }
];

// ---------- Estado da aplicação ----------
let profile = null;
let tokenClient = null;
let gapiInited = false;
let gisInited = false;
let lastDriveFileId = localStorage.getItem('bb-drive-fileid') || null;
let historico = JSON.parse(localStorage.getItem('bb-historico-vfinal')) || [];

// ---------- UI refs ----------
const loginDiv = document.getElementById('login');
const appDiv = document.getElementById('app');
const userNameEl = document.getElementById('userName');
const userEmailEl = document.getElementById('userEmail');
const driveStatusEl = document.getElementById('driveStatus');
const lastBackupInfoEl = document.getElementById('lastBackupInfo');
const materiasContainer = document.getElementById('materiasContainer');
const historicoTableBody = document.querySelector('#historicoTable tbody');
const popupEl = document.getElementById('popup');
const btnBackup = document.getElementById('btnBackup');
const btnRestore = document.getElementById('btnRestore');
const btnSignOut = document.getElementById('btnSignOut');
const btnGerarCiclo = document.getElementById('btnGerarCiclo');
const selectCiclo = document.getElementById('cicloTempo');

// ---------- Init GSI button (Google Identity Services) ----------
window.onload = () => {
  // render GSI button
  window.google?.accounts?.id?.initialize({
    client_id: CLIENT_ID,
    callback: handleGsiCredential
  });
  window.google?.accounts?.id?.renderButton(document.getElementById('g_id_button') || document.getElementById('g_id_button'), {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'signin_with',
    shape: 'rectangular'
  });

  // load gapi
  gapi.load('client', async () => {
    try {
      await gapi.client.init({ discoveryDocs: [DISCOVERY_DOC] });
    } catch(e) {
      console.warn('gapi client init warning', e);
    }
    gapiInited = true;
    updateDriveStatus();
  });

  // token client for Drive scopes
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) {
        console.error('token error', resp);
      } else {
        // token available: update UI and try restore
        updateDriveStatus();
        restoreLatestBackup().catch(()=>{});
      }
    }
  });

  // wire buttons
  btnBackup.addEventListener('click', () => realizarBackup(true));
  btnRestore.addEventListener('click', () => restoreLatestBackup(true));
  btnSignOut.addEventListener('click', signOut);
  btnGerarCiclo.addEventListener('click', gerarCiclo);

  // show local data immediately while Drive loads
  renderApp();
  renderHistorico();
  updateLastBackupInfoFromLocal();
};

// ---------- GSI callback ----------
async function handleGsiCredential(response) {
  // response.credential is a JWT (ID token) — decode basic info
  const idToken = response.credential;
  const payload = parseJwt(idToken);
  profile = { name: payload.name, email: payload.email, picture: payload.picture };
  // show app
  showApp();
  // request Drive token silently (do not prompt) so user can accept Drive on demand
  // we'll ask for Drive scope only when doing backup/restores
  updateDriveStatus();
  // attempt restoring last backup (will prompt for Drive consent if needed)
  await restoreLatestBackup().catch(()=>{});
}

// ---------- Helpers ----------
function parseJwt (token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(window.atob(base64))));
  } catch(e) { return {}; }
}

function showApp(){
  loginDiv.style.display = 'none';
  appDiv.style.display = 'block';
  userNameEl.textContent = profile?.name || '';
  userEmailEl.textContent = profile?.email || '';
  updateDriveStatus();
  renderApp();
  renderHistorico();
}

function showLogin(){
  loginDiv.style.display = 'flex';
  appDiv.style.display = 'none';
  profile = null;
  userNameEl.textContent = '';
  userEmailEl.textContent = '';
}

// sign out (simply remove profile and clear local UI; GSI provides no direct sign-out via token revoke here)
function signOut(){
  // remove GSI auto select
  try { google.accounts.id.disableAutoSelect(); } catch(e){}
  // clear profile
  profile = null;
  showLogin();
}

// update Drive UI status
function updateDriveStatus(){
  const token = gapi.client.getToken && gapi.client.getToken();
  if (token && token.access_token) {
    driveStatusEl.textContent = 'Drive: conectado';
  } else {
    driveStatusEl.textContent = 'Drive: não conectado (consentimento necessário para backups)';
  }
}

// ---------- Backup helpers (single file in appDataFolder) ----------
async function requestDriveTokenInteractive(){
  return new Promise((resolve,reject) => {
    try {
      tokenClient.requestAccessToken({ prompt: 'consent' });
      // wait for token to appear (short poll)
      let attempts = 0;
      const iv = setInterval(() => {
        const tok = gapi.client.getToken && gapi.client.getToken();
        attempts++;
        if (tok && tok.access_token) { clearInterval(iv); resolve(tok); }
        if (attempts > 20) { clearInterval(iv); reject(new Error('timeout token')); }
      }, 300);
    } catch(e){ reject(e); }
  });
}

// upload or update single file
async function uploadBackupToDrive(payload){
  // ensure token
  const tok = gapi.client.getToken && gapi.client.getToken();
  if (!tok || !tok.access_token) {
    await requestDriveTokenInteractive();
  }
  const content = JSON.stringify(payload, null, 2);
  const boundary = '-------314159265358979323846';
  const delimiter = "\r\n--" + boundary + "\r\n";
  const close_delim = "\r\n--" + boundary + "--";
  const metadata = { name: DRIVE_FILE_NAME, mimeType: 'application/json', parents: ['appDataFolder'] };
  const body = delimiter + 'Content-Type: application/json\r\n\r\n' + JSON.stringify(metadata) + delimiter +
               'Content-Type: application/json\r\n\r\n' + content + close_delim;

  // if we have lastDriveFileId try update
  if (lastDriveFileId) {
    try {
      const resp = await gapi.client.request({
        path: `/upload/drive/v3/files/${lastDriveFileId}?uploadType=multipart`,
        method: 'PATCH',
        headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
        body: body
      });
      return resp;
    } catch(e){
      console.warn('update failed, will create new', e);
      lastDriveFileId = null;
      localStorage.removeItem('bb-drive-fileid');
    }
  }
  // try find existing
  try {
    const find = await gapi.client.drive.files.list({ spaces:'appDataFolder', q:`name='${DRIVE_FILE_NAME}' and mimeType='application/json'`, pageSize:1, fields:'files(id,name,createdTime)'});
    if (find.result.files && find.result.files.length) {
      lastDriveFileId = find.result.files[0].id;
      localStorage.setItem('bb-drive-fileid', lastDriveFileId);
      // update now
      const resp = await gapi.client.request({
        path: `/upload/drive/v3/files/${lastDriveFileId}?uploadType=multipart`,
        method: 'PATCH',
        headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
        body: body
      });
      return resp;
    }
  } catch(e){ console.warn('find existing failed', e); }

  // else create new
  const resp = await gapi.client.request({
    path: '/upload/drive/v3/files?uploadType=multipart',
    method: 'POST',
    headers: { 'Content-Type': 'multipart/related; boundary=' + boundary },
    body: body
  });
  lastDriveFileId = (resp.result && resp.result.id) || null;
  if (lastDriveFileId) localStorage.setItem('bb-drive-fileid', lastDriveFileId);
  return resp;
}

async function realizarBackup(notify=false){
  const payload = { version:'vfinal', timestamp: new Date().toISOString(), historico };
  // always save local fallback
  localStorage.setItem('bb-last-local-backup', JSON.stringify(payload));
  try {
    await uploadBackupToDrive(payload);
    localStorage.setItem('bb-last-backup-meta', JSON.stringify({ timestamp: payload.timestamp, source: 'Drive' }));
    updateLastBackupInfoFromLocal();
    if (notify) showPopup('Backup salvo no Drive');
  } catch(e){
    console.warn('backup drive failed', e);
    localStorage.setItem('bb-last-backup-meta', JSON.stringify({ timestamp: payload.timestamp, source: 'Local' }));
    updateLastBackupInfoFromLocal();
    if (notify) showPopup('Backup salvo localmente (falha no Drive)');
  }
}

async function restoreLatestBackup(promptConfirm=false){
  // try Drive first (if token available or user authorizes)
  try {
    // ensure token (interactive)
    await requestDriveTokenInteractive().catch(()=>{});
    const filesRes = await gapi.client.drive.files.list({ spaces:'appDataFolder', q:`name='${DRIVE_FILE_NAME}'`, orderBy:'createdTime desc', pageSize:1, fields:'files(id,name,createdTime)' });
    const files = filesRes.result.files || [];
    if (files.length) {
      const id = files[0].id;
      const file = await gapi.client.drive.files.get({ fileId: id, alt: 'media' });
      const data = typeof file.body === 'string' ? JSON.parse(file.body) : file.result;
      if (data && data.historico) {
        if (!promptConfirm || confirm('Restaurar último backup do Drive?')) {
          historico = data.historico;
          localStorage.setItem('bb-historico-vfinal', JSON.stringify(historico));
          lastDriveFileId = id;
          localStorage.setItem('bb-drive-fileid', id);
          localStorage.setItem('bb-last-backup-meta', JSON.stringify({ timestamp: data.timestamp || new Date().toISOString(), source: 'Drive' }));
          showPopup('Backup restaurado do Drive');
          renderHistorico();
          updateLastBackupInfoFromLocal();
          return true;
        }
      }
    }
  } catch(e){
    console.warn('restore drive failed', e);
    // fallthrough to local
  }

  // try local fallback
  const local = localStorage.getItem('bb-last-local-backup');
  if (local) {
    const data = JSON.parse(local);
    if (data && data.historico) {
      if (!promptConfirm || confirm('Restaurar último backup local?')) {
        historico = data.historico;
        localStorage.setItem('bb-historico-vfinal', JSON.stringify(historico));
        localStorage.setItem('bb-last-backup-meta', JSON.stringify({ timestamp: data.timestamp, source: 'Local' }));
        showPopup('Backup restaurado localmente');
        renderHistorico();
        updateLastBackupInfoFromLocal();
        return true;
      }
    }
  }
  alert('Nenhum backup disponível para restaurar.');
  return false;
}

function updateLastBackupInfoFromLocal(){
  const meta = localStorage.getItem('bb-last-backup-meta');
  if (meta) {
    const m = JSON.parse(meta);
    lastBackupInfoEl.textContent = `Último backup: ${new Date(m.timestamp).toLocaleString()} (${m.source})`;
  } else {
    lastBackupInfoEl.textContent = 'Último backup: nenhum';
  }
}

// ---------- App UI / Historico operations ----------
function renderApp(){
  // render materias (simple list)
  materiasContainer.innerHTML = '';
  materiasData.forEach((m, i) => {
    const div = document.createElement('div');
    div.className = 'materia';
    const header = document.createElement('div');
    header.className = 'materia-header';
    header.innerHTML = `<div>${m.nome}</div><div>Peso ${m.peso}</div>`;
    header.addEventListener('click', () => {
      const c = div.querySelector('.materia-content');
      c.style.display = c.style.display === 'block' ? 'none' : 'block';
    });
    const content = document.createElement('div');
    content.className = 'materia-content';
    content.style.display = 'none';
    m.topicos.forEach(t => {
      const tr = document.createElement('div');
      tr.className = 'topico';
      const status = historico.find(h => h.materia === m.nome && h.topico === t && h.status === 'Concluído') ? 'Concluído' : (historico.find(h => h.materia === m.nome && h.topico === t && !h.fim) ? 'Em andamento' : 'Pendente');
      tr.innerHTML = `<div>${t} <small style="margin-left:8px;color:#666">${status}</small></div>
                      <div>
                        <button onclick="startTopic('${escapeStr(m.nome)}','${escapeStr(t)}')">Iniciar</button>
                        <button onclick="finishTopic('${escapeStr(m.nome)}','${escapeStr(t)}')">Finalizar</button>
                      </div>`;
      content.appendChild(tr);
    });
    div.appendChild(header);
    div.appendChild(content);
    materiasContainer.appendChild(div);
  });
}

function renderHistorico(){
  historicoTableBody.innerHTML = '';
  historico.forEach(h => {
    const tr = document.createElement('tr');
    const dur = h.fim ? Math.round((new Date(h.fim) - new Date(h.inicio))/60000) + ' min' : '-';
    tr.innerHTML = `<td>${h.materia}</td><td>${h.topico}</td><td>${h.inicio?formatDate(h.inicio):'-'}</td><td>${h.fim?formatDate(h.fim):'-'}</td><td>${dur}</td><td>${h.status}</td>`;
    historicoTableBody.appendChild(tr);
  });
  updateStats();
}

function updateStats(){
  const hoje = new Date().toISOString().slice(0,10);
  let tempoHoje = 0, concluidos = 0;
  historico.forEach(h => {
    if (h.fim){
      const mins = Math.round((new Date(h.fim) - new Date(h.inicio))/60000);
      if (h.inicio.slice(0,10) === hoje) tempoHoje += mins;
      if (h.status === 'Concluído') concluidos++;
    }
  });
  document.getElementById('tempoHoje').textContent = tempoHoje;
  document.getElementById('topicosConcluidos').textContent = concluidos;
  // progresso: % of concluded topics over total topics
  const totalTopics = materiasData.reduce((s,m)=>s+m.topicos.length,0);
  document.getElementById('progressoGeral').textContent = totalTopics ? Math.round((concluidos/totalTopics)*100) + '%' : '0%';
  // tempo semana placeholder
  document.getElementById('tempoSemana').textContent = '—';
}

// ---------- Topic start/finish which trigger automatic backup ----------
window.startTopic = function(materia, topico){
  materia = unescapeStr(materia); topico = unescapeStr(topico);
  // check if already in progress
  if (historico.find(h => h.materia === materia && h.topico === topico && !h.fim)) {
    showPopup('Tópico já em andamento');
    return;
  }
  historico.push({ materia, topico, inicio: new Date().toISOString(), fim: null, status: 'Em andamento' });
  localStorage.setItem('bb-historico-vfinal', JSON.stringify(historico));
  renderHistorico();
  // automatic backup
  realizarBackup(false).catch(()=>{});
};

window.finishTopic = function(materia, topico){
  materia = unescapeStr(materia); topico = unescapeStr(topico);
  const reg = historico.find(h => h.materia === materia && h.topico === topico && !h.fim);
  if (!reg) { showPopup('Tópico não iniciado'); return; }
  reg.fim = new Date().toISOString();
  reg.status = 'Concluído';
  localStorage.setItem('bb-historico-vfinal', JSON.stringify(historico));
  renderHistorico();
  realizarBackup(false).catch(()=>{});
};

// ---------- Cycle (simple) ----------
function gerarCiclo(){
  const totalMin = parseInt(selectCiclo.value,10) || 30;
  // select pending topics
  const pendentes = [];
  materiasData.forEach(m=>{
    m.topicos.forEach(t=>{
      const concluido = historico.some(h=>h.materia===m.nome && h.topico===t && h.status==='Concluído');
      if(!concluido) pendentes.push({ materia: m.nome, topico: t, peso: m.peso });
    });
  });
  if (!pendentes.length) return showPopup('Nenhum tópico pendente — ótimo!');
  const pesoTotal = pendentes.reduce((s,p)=>s+p.peso,0);
  let html = 'Ciclo gerado:\\n';
  pendentes.forEach(p=>{
    const minutos = Math.max(3, Math.round((p.peso/pesoTotal)*totalMin));
    html += `• ${p.materia} — ${p.topico}: ${minutos} min\\n`;
  });
  alert(html);
}

// ---------- Utilities ----------
function formatDate(iso){ return new Date(iso).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}); }
function showPopup(txt){ popupEl.textContent = txt; popupEl.style.display = 'block'; setTimeout(()=>popupEl.style.display='none',4500); }
function escapeStr(s){ return encodeURIComponent(s); }
function unescapeStr(s){ return decodeURIComponent(s); }

// ---------- End ----------
