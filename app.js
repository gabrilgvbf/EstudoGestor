// === FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyBxNiw-EW4-URuu_7EZk4N4k_lJ3wuzUzM",
  authDomain: "estudobb-c7f2c.firebaseapp.com",
  projectId: "estudobb-c7f2c",
  databaseURL: "https://estudobb-c7f2c-default-rtdb.firebaseio.com"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// === MATÉRIAS ===
const materias = [ /* (mesmo array de antes) */ ];

// === VARIÁVEIS ===
let historico = [], user = null, ref = null;
let cicloAtual = [], indiceAtual = 0, timerCiclo = null, tempoRestante = 0, cicloPausado = false;

// === DOM ===
const $ = id => document.getElementById(id);
const loginScreen = $('loginScreen');
const app = $('app');
const btnLogin = $('googleLoginBtn');
const loginStatus = $('loginStatus');

// === LOGIN ===
btnLogin.onclick = () => {
  btnLogin.disabled = true;
  loginStatus.style.display = 'block';
  loginStatus.textContent = 'Redirecionando...';
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithRedirect(provider);
};

auth.getRedirectResult().catch(() => {});

auth.onAuthStateChanged(u => {
  if (u) {
    user = u;
    loginScreen.style.display = 'none';
    app.style.display = 'block';
    ref = db.ref('users/' + user.uid + '/historico');
    carregar();
  } else {
    loginScreen.style.display = 'block';
    app.style.display = 'none';
    btnLogin.disabled = false;
    loginStatus.style.display = 'none';
  }
});

function logout() { auth.signOut(); }

// === SYNC ===
function carregar() {
  ref.on('value', snap => {
    const data = snap.val();
    historico = data ? Object.values(data) : [];
    salvarLocal();
    atualizar();
    status('Sincronizado');
  }, () => {
    historico = JSON.parse(localStorage.getItem('bb-v17') || '[]');
    atualizar();
    status('Offline');
  });
}

function salvar() {
  if (!ref) return;
  const obj = {};
  historico.forEach((h, i) => obj[i] = h);
  ref.set(obj).catch(() => status('Erro'));
  salvarLocal();
}

function salvarLocal() { localStorage.setItem('bb-v17', JSON.stringify(historico)); }

function status(txt) {
  const el = $('syncStatus');
  el.textContent = `${user.displayName.split(' ')[0]} | ${txt}`;
  el.style.color = txt.includes('Erro') ? 'red' : txt.includes('Offline') ? 'orange' : 'green';
}

// === RESTANTE DAS FUNÇÕES (igual antes) ===
function atualizar() { atualizarTabela(); atualizarEstatisticas(); renderizarMaterias(); }
// ... [TODAS AS FUNÇÕES: ciclo, notas, etc.]
// (Copie do código anterior)

document.addEventListener('DOMContentLoaded', () => {
  $('btnCiclo').onclick = gerarCiclo;
  $('btnReset').onclick = resetarProgresso;
  $('btnPDF').onclick = exportarPDF;
  $('btnSair').onclick = logout;
  $('btnPausar').onclick = pausarCiclo;
  $('btnProximo').onclick = proximoTopico;
  $('btnParar').onclick = pararCiclo;
  $('btnCancelarNota').onclick = fecharModal;
  $('btnSalvarNota').onclick = salvarNota;
});