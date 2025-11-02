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
  { nome: 'LÍNGUA INGLESA', peso: 1, topicos: ['1 - Conhecimento de um vocabulário fundamental e dos aspectos gramaticais básicos para a compreensão de textos']},
  {nome: 'LÍNGUA PORTUGUESA', peso: 2, topicos : [ '1 - Compreensão de textos.', '2 - Ortografia oficial.', '3 - Classe e emprego de palavras.', '4 - Emprego do acento indicativo de crase.', '5 - Sintaxe da oração e do período.', '6 - Emprego dos sinais de pontuação.', '7 - Concordância verbal e nominal.', '8 - Regência verbal e nominal.', '9 - Colocação dos pronomes oblíquos átonos (próclise, mesóclise e ênclise).' ]},
  { nome: 'MATEMÁTICA', peso: 2, topicos: [ '1 - Números inteiros, racionais e reais; problemas de contagem.', '2 - Sistema legal de medidas.', '3 - Razões e proporções; divisão proporcional; regras de três simples e compostas; porcentagens.', '4 - Lógica proposicional.', '5 - Noções de conjuntos.', '6 - Relações e funções; funções polinomiais; funções exponenciais e logarítmicas.', '7 - Matrizes.', '8 - Determinantes.', '9 - Sistemas lineares.', '10 - Sequências.', '11 - Progressões aritméticas e progressões geométricas.' ]},
  {nome:'MATEMÁTICA FINANCEIRA', peso:2, topicos : [ '1 - Conceitos gerais: O conceito do valor do dinheiro no tempo; Capital, juros, taxas de juros; Capitalização, regimes de capitalização; Fluxos de caixa e diagramas de fluxo de caixa; Equivalência financeira.', '2 - Juros simples: Cálculo do montante, dos juros, da taxa de juros, do principal e do prazo da operação financeira.', '3 - Juros compostos: Cálculo do montante, dos juros, da taxa de juros, do principal e do prazo da operação financeira.', '4 - Sistemas de amortização: Sistema Price; Sistema SAC.' ]},
  { nome: 'ATUALIDADES DO MERCADO FINANCEIRO', peso: 1, topicos: [ '1 - Os bancos na Era Digital: Atualidade, tendências e desafios.', '2 - Internet banking.', '3 - Mobile banking.', '4 - Open banking.', '5 - Novos modelos de negócios.', '6 - Fintechs, startups e big techs.', '7 - Sistema de bancos sombra (Shadow banking).', '8 - Funções da moeda.', '9 - O dinheiro na era digital: blockchain, bitcoin e demais criptomoedas.', '10 - Marketplace.', '11 - Correspondentes bancários.', '12 - Arranjos de pagamentos.', '13 - Sistema de pagamentos instantâneos (PIX).', '14 - Segmentação e interações digitais.', '15 - Transformação digital no Sistema Financeiro.' ]},
  { nome: 'PROBABILIDADE E ESTATÍSTICA', peso: 1, topicos: [ '1 - Representação tabular e gráfica.', '2 - Medidas de tendência central: média, mediana, moda, medidas de posição, mínimo e máximo; e medidas de dispersão: amplitude, amplitude interquartil, variância, desvio padrão e coeficiente de variação.', '3 - Variáveis aleatórias e distribuição de probabilidade.', '4 - Teorema de Bayes.', '5 - Probabilidade condicional.', '6 - População e amostra.', '7 - Variância e covariância.', '8 - Correlação linear simples.', '9 - Distribuição binomial e distribuição normal.', '10 - Noções de amostragem e inferência estatística.' ]},
  { nome: 'CONHECIMENTOS BANCÁRIOS', peso: 2, topicos: [ '1 - Sistema Financeiro Nacional: Estrutura do Sistema Financeiro Nacional; Órgãos normativos e instituições supervisoras, executoras e operadoras.', '2 - Mercado financeiro e seus desdobramentos (mercados monetário, de crédito, de capitais e cambial).', '3 - Moeda e política monetária: Políticas monetárias convencionais e não-convencionais (Quantitative Easing); Taxa SELIC e operações compromissadas; O debate sobre os depósitos remunerados dos bancos comerciais no Banco Central do Brasil.', '4 - Orçamento público, títulos do Tesouro Nacional e dívida pública.', '5 - Produtos Bancários: Noções de cartões de crédito e débito, crédito direto ao consumidor, crédito rural, poupança, capitalização, previdência, consórcio, investimentos e seguros.', '6 - Noções de Mercado de capitais.', '7 - Noções de Mercado de Câmbio: Instituições autorizadas a operar e operações básicas.', '8 - Regimes de taxas de câmbio fixas, flutuantes e regimes intermediários.', '9 - Taxas de câmbio nominais e reais.', '10 - Impactos das taxas de câmbio sobre as exportações e importações.', '11 - Diferencial de juros interno e externo, prêmios de risco, fluxo de capitais e seus impactos sobre as taxas de câmbio.', '12 - Dinâmica do Mercado: Operações no mercado interbancário.', '13 - Mercado bancário: Operações de tesouraria, varejo bancário e recuperação de crédito.', '14 - Taxas de juros de curto prazo e a curva de juros; taxas de juros nominais e reais.', '15 - Garantias do Sistema Financeiro Nacional: aval; fiança; penhor mercantil; alienação fiduciária; hipoteca; fianças bancárias.', '16 - Crime de lavagem de dinheiro: conceito e etapas; Prevenção e combate ao crime de lavagem de dinheiro: Lei nº 9.613/98 e suas alterações; Circular nº 3.978, de 23 de janeiro de 2020 e Carta Circular nº 4.001, de 29 de janeiro de 2020 e suas alterações.', '17 - Autorregulação bancária e Normativos SARB.', '18 - Sigilo Bancário: Lei Complementar nº 105/2001 e suas alterações.', '19 - Lei Geral de Proteção de Dados (LGPD): Lei nº 13.709, de 14 de agosto de 2018 e suas alterações.', '20 - Legislação anticorrupção: Lei nº 12.846/2013 e Decreto nº 11.129 de 11/07/2022.', '21 - Segurança cibernética: Resolução CMN nº 4.893, de 26/02/2021.', '22 - Ética aplicada: ética, moral, valores e virtudes; noções de ética empresarial e profissional; gestão da ética nas empresas públicas e privadas; Código de Ética do Banco do Brasil (disponível no sítio do BB na internet).', '23 - Política de Responsabilidade Socioambiental do Banco do Brasil (disponível no sítio do BB na internet).', '24 - ASG (Ambiental, Social e Governança): Economia Sustentável; Financiamentos; Mercado PJ.' ]},
  { nome: 'TECNOLOGIA DA INFORMAÇÃO', peso: 3, topicos: [ '1 - Aprendizagem de máquina: Fundamentos básicos; Noções de algoritmos de aprendizado supervisionados e não supervisionados; Noções de processamento de linguagem natural.', '2 - Banco de Dados: Banco de dados NoSQL (conceitos básicos, bancos orientados a grafos, colunas, chave/valor e documentos); MongoDB; linguagem SQL2008; Conceitos de banco de dados e sistemas gerenciadores de bancos de dados (SGBD); Data Warehouse (modelagem conceitual para data warehouses, dados multidimensionais); Modelagem conceitual de dados (a abordagem entidade-relacionamento); Modelo relacional de dados (conceitos básicos, normalização); PostgreSQL.', '3 - Big Data: Fundamentos; Técnicas de preparação e apresentação de dados.', '4 - Desenvolvimento Mobile: linguagens/frameworks: Java/Kotlin e Swift; React Native 0.59; Sistemas Android API 30 e iOS Xcode 10.', '5 - Estrutura de dados e algoritmos: busca sequencial e busca binária sobre arrays; ordenação (métodos da bolha, por seleção, por inserção); lista encadeada, pilha, fila e noções sobre árvore binária.', '6 - Ferramentas e linguagens de programação para manipulação de dados: Ansible; Java (SE 11 e EE 8); TypeScript 4.0; Python 3.9.X aplicada para IA/ML e Analytics (bibliotecas Pandas, NumPy, SciPy, Matplotlib e Scikit-learn).' ] },
  { nome: 'CONHECIMENTO DE INFORMATICA', peso: 1, topicos : [ '1 - Noções de sistemas operacionais: Windows 10 (32-64 bits) e ambiente Linux (SUSE SLES 15 SP2).', '2 - Edição de textos, planilhas e apresentações: ambientes Microsoft Office (Word, Excel e PowerPoint - versão O365).', '3 - Segurança da informação: fundamentos, conceitos e mecanismos de segurança.', '4 - Proteção de estações de trabalho: controle de dispositivos USB, hardening, antimalware e firewall pessoal.', '5 - Conceitos de organização e de gerenciamento de informações, arquivos, pastas e programas.', '6 - Redes de computadores: conceitos básicos, ferramentas, aplicativos e procedimentos de Internet e intranet.', '7 - Navegador Web: Microsoft Edge (versão 91) e Mozilla Firefox (versão 78 ESR); busca e pesquisa na Web.', '8 - Correio eletrônico, grupos de discussão, fóruns e wikis.', '9 - Redes sociais: Twitter, Facebook, LinkedIn, WhatsApp, YouTube, Instagram e Telegram.', '10 - Visão geral sobre sistemas de suporte à decisão e inteligência de negócio.', '11 - Fundamentos sobre análise de dados.', '12 - Conceitos de educação a distância.', '13 - Conceitos de tecnologias e ferramentas multimídia, de reprodução de áudio e vídeo.', '14 - Ferramentas de produtividade e trabalho a distância: Microsoft Teams, Cisco Webex, Google Hangout, Google Drive e Skype.' ]},
  {nome: 'VENDAS E NEGOCIAÇÃO', peso: 2, topicos : [ '1 - Noções de estratégia empresarial: análise de mercado, forças competitivas, imagem institucional, identidade e posicionamento.', '2 - Segmentação de mercado.', '3 - Ações para aumentar o valor percebido pelo cliente.', '4 - Gestão da experiência do cliente.', '5 - Aprendizagem e sustentabilidade organizacional.', '6 - Características dos serviços: intangibilidade, inseparabilidade, variabilidade e perecibilidade.', '7 - Gestão da qualidade em serviços.', '8 - Técnicas de vendas: da pré-abordagem ao pós-vendas.', '9 - Noções de marketing digital: geração de leads; técnica de copywriting; gatilhos mentais; Inbound marketing.', '10 - Ética e conduta profissional em vendas.', '11 - Padrões de qualidade no atendimento aos clientes.', '12 - Utilização de canais remotos para vendas.', '13 - Comportamento do consumidor e sua relação com vendas e negociação.', '14 - Política de Relacionamento com o Cliente: Resolução nº 4.949, de 30 de setembro de 2021.', '15 - Resolução CMN nº 4.860, de 23 de outubro de 2020 que dispõe sobre a constituição e o funcionamento de componente organizacional de ouvidoria pelas instituições financeiras e demais instituições autorizadas a funcionar pelo Banco Central do Brasil.', '16 - Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência): Lei nº 13.146, de 06 de julho de 2015.', '17 - Código de Proteção e Defesa do Consumidor: Lei nº 8.078/1990 (versão atualizada).' ] }
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
