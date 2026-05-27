// Diagnostic questions, rendering, calculation and radar chart
const categories = [
  {
    id: 'lideranca',
    title: 'Liderança Estratégica',
    questions: [
      'Define e comunica claramente a visão institucional?',
      'Alinha decisões com objetivos estratégicos?',
      'Demonstra exemplo em comportamento e ética?'
    ]
  },
  {
    id: 'comunicacao',
    title: 'Comunicação',
    questions: [
      'Promove comunicação transparente com a equipe?',
      'Garante retorno e escuta ativa às demandas?',
      'Utiliza canais adequados para informação crítica?'
    ]
  },
  {
    id: 'seguranca',
    title: 'Segurança e Conformidade',
    questions: [
      'Define normas claras de segurança institucional?',
      'Monitora e ajusta práticas para conformidade?',
      'Encoraja reporte de riscos sem retaliação?'
    ]
  },
  {
    id: 'cultura',
    title: 'Cultura e Engajamento',
    questions: [
      'Fomenta ambiente de confiança e inclusão?',
      'Reconhece e desenvolve talentos internos?',
      'Incentiva colaboração entre áreas?'
    ]
  },
  {
    id: 'desenvolvimento',
    title: 'Desenvolvimento e Capacitação',
    questions: [
      'Investe em capacitação contínua da equipe?',
      'Avalia impacto do treinamento em resultados?',
      'Promove planos de desenvolvimento individuais?'
    ]
  }
];

const form = document.getElementById('diagnosticForm');
const calculateBtn = document.getElementById('calculate');
const resetBtn = document.getElementById('reset');
const summary = document.getElementById('summary');
let radarChart = null;

function renderForm() {
  form.innerHTML = '';
  categories.forEach((cat, ci) => {
    const catEl = document.createElement('div');
    catEl.className = 'category';
    const h = document.createElement('h3');
    h.textContent = cat.title;
    catEl.appendChild(h);

    cat.questions.forEach((q, qi) => {
      const qEl = document.createElement('div');
      qEl.className = 'q';
      qEl.dataset.cat = ci;
      qEl.dataset.q = qi;

      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = q;

      const controls = document.createElement('div');
      controls.className = 'controls';

      const range = document.createElement('input');
      range.type = 'range';
      range.min = '0';
      range.max = '5';
      range.step = '1';
      range.value = '0';
      range.className = 'score';

      const val = document.createElement('div');
      val.className = 'val';
      val.textContent = '0';

      range.addEventListener('input', () => {
        val.textContent = range.value;
      });

      controls.appendChild(range);
      controls.appendChild(val);

      qEl.appendChild(label);
      qEl.appendChild(controls);
      catEl.appendChild(qEl);
    });

    form.appendChild(catEl);
  });
}

function computeResults() {
  const catAverages = [];
  const catDetails = [];

  categories.forEach((cat, ci) => {
    const qEls = Array.from(form.querySelectorAll(`.q[data-cat="${ci}"]`));
    const scores = qEls.map(el => Number(el.querySelector('input.score').value));
    const sum = scores.reduce((s, n) => s + n, 0);
    const avg = scores.length ? sum / scores.length : 0;
    catAverages.push(Number(avg.toFixed(2)));
    catDetails.push({title: cat.title, avg, scores});
  });

  const overall = catAverages.reduce((s, n) => s + n, 0) / catAverages.length;
  return {catAverages, catDetails, overall};
}

let phrasesDB = [];

function loadPhrases() {
  fetch('frases.json')
    .then(r => r.json())
    .then(data => { phrasesDB = data; })
    .catch(err => { console.warn('Could not load frases.json:', err); phrasesDB = []; });
}

function pickPhrase(tipo, notaLabel) {
  if (!phrasesDB || !phrasesDB.length) return null;
  const candidates = phrasesDB.filter(p => p.tipo === tipo && p.nota === notaLabel);
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)].mensagem;
}

function calculate() {
  const {catAverages, catDetails, overall} = computeResults();
  renderSummary(catDetails, overall);
  renderChart(catAverages);
}

function summarize() {
  const {catAverages, catDetails, overall} = computeResults();
  const textEl = document.getElementById('textSummary');
  const strengths = catDetails.filter(d => d.avg >= 4);
  const weaknesses = catDetails.filter(d => d.avg <= 2);
  const middles = catDetails.filter(d => d.avg > 2 && d.avg < 4);

  function suggestFor(title) {
    const key = title.toLowerCase();
    const base = (s)=> `Sugestão prática: ${s}`;
    if (key.includes('liderança')) return base('reunir a liderança para alinhar prioridades e comunicar metas claras com exemplos práticos.');
    if (key.includes('comunicação')) return base('implementar ciclos de feedback regulares e um canal único para informações críticas.');
    if (key.includes('segurança')) return base('promover treinamentos práticos e facilitar o reporte de riscos sem penalizações.');
    if (key.includes('cultura')) return base('desenvolver iniciativas de reconhecimento e momentos de integração entre equipes.');
    if (key.includes('desenvolvimento')) return base('estruturar planos de desenvolvimento e monitorar impacto dos treinamentos.');
    return base('avaliar práticas internas e documentar um pequeno plano de ação com responsáveis.');
  }

  let html = `<h4>Gother.IA</h4>`;
  html += `<p><strong>Média geral:</strong> ${overall.toFixed(2)} — <em>${classify(overall)}</em></p>`;

  if (strengths.length) {
    html += `<p><strong>Onde está acertando:</strong></p><ul>` + strengths.map(d => {
      const phrase = pickPhrase('strength', 'high') || `Há sinais de coerência e propósito — continue a cultivar essas práticas com constância.`;
      return `<li><strong>${d.title}:</strong> ${phrase}</li>`;
    }).join('') + `</ul>`;
  }

  if (middles.length) {
    html += `<p><strong>Áreas que merecem atenção:</strong></p><ul>` + middles.map(d => {
      const phrase = pickPhrase('attention', 'mid') || `Existe potencial, porém requer pequenas reflexões e ajustes práticos.`;
      return `<li><strong>${d.title}:</strong> ${phrase}</li>`;
    }).join('') + `</ul>`;
  }

  if (weaknesses.length) {
    html += `<p><strong>Onde precisa melhorar / Atenção:</strong></p><ul>` + weaknesses.map(d => {
      const phrase = pickPhrase('improve', 'low') || `Sugestão prática: iniciar ações corretivas e mensurar avanços.`;
      return `<li><strong>${d.title}:</strong> ${phrase}</li>`;
    }).join('') + `</ul>`;
  }

  if (!strengths.length && !weaknesses.length && !middles.length) {
    html += `<p class="muted">Nenhuma resposta registrada. Use "Calcular Resultado" antes.</p>`;
  }

  textEl.innerHTML = html;
}

function renderSummary(details, overall) {
  summary.innerHTML = '';
  const list = document.createElement('div');
  list.className = 'list';
  details.forEach(d => {
    const p = document.createElement('p');
    p.innerHTML = `<strong>${d.title}:</strong> ${d.avg.toFixed(2)}`;
    list.appendChild(p);
  });

  const ov = document.createElement('p');
  ov.innerHTML = `<strong>Média geral:</strong> ${overall.toFixed(2)}`;

  const classification = document.createElement('div');
  classification.className = 'classification';
  classification.textContent = `Classificação: ${classify(overall)}`;

  summary.appendChild(list);
  summary.appendChild(ov);
  summary.appendChild(classification);
}

function classify(score) {
  if (score < 1) return 'Muito Baixo';
  if (score < 2) return 'Baixo';
  if (score < 3) return 'Médio';
  if (score < 4) return 'Bom';
  return 'Excelente';
}

function renderChart(values) {
  const canvasEl = document.getElementById('radarChart');
  const ctx = canvasEl.getContext('2d');
  const labels = categories.map(c => c.title);

  // Responsive sizing for mobile/desktop
  const isMobile = window.innerWidth < 768;
  const maxSize = isMobile ? 280 : 380;
  canvasEl.width = maxSize;
  canvasEl.height = maxSize;

  if (radarChart) {
    radarChart.data.datasets[0].data = values;
    radarChart.resize();
    radarChart.update();
    return;
  }

  radarChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels,
      datasets: [{
        label: 'Média por categoria',
        data: values,
        backgroundColor: 'rgba(11,132,255,0.15)',
        borderColor: 'rgba(11,132,255,0.9)',
        pointBackgroundColor: 'rgba(11,132,255,0.9)',
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          suggestedMin: 0,
          suggestedMax: 5,
          ticks: {stepSize: 1, font: {size: isMobile ? 10 : 12}},
          grid: {drawBorder: true},
          angleLines: {display: true}
        }
      },
      plugins: {
        legend: {display: false},
        tooltip: {
          backgroundColor: 'rgba(11,18,33,0.8)',
          padding: 12,
          titleFont: {size: 12},
          bodyFont: {size: 11},
          borderColor: 'rgba(11,132,255,0.5)',
          borderWidth: 1
        }
      }
    }
  });
}

function resetForm() {
  form.querySelectorAll('input.score').forEach(i => {
    i.value = 0;
    i.dispatchEvent(new Event('input'));
  });
  summary.innerHTML = `<p class="muted">As médias por categoria e a classificação aparecem aqui após o cálculo.</p>`;
  if (radarChart) {
    radarChart.data.datasets[0].data = categories.map(()=>0);
    radarChart.update();
  }
}

calculateBtn.addEventListener('click', calculate);
resetBtn.addEventListener('click', resetForm);

renderForm();
loadPhrases();

// Handle window resize for responsive chart
window.addEventListener('resize', () => {
  if (radarChart) {
    const isMobile = window.innerWidth < 768;
    const maxSize = isMobile ? 280 : 380;
    const canvas = document.getElementById('radarChart');
    canvas.width = maxSize;
    canvas.height = maxSize;
    radarChart.resize();
  }
});

let loadingTimer = null;
let serverlessUrl = ''; // set this to your serverless endpoint URL if available

// Call serverless function to generate summary via LLM
async function callServerlessSummary(payload) {
  if (!serverlessUrl) return null; // no URL configured
  try {
    const resp = await fetch(serverlessUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.result || null;
  } catch (err) {
    console.warn('Serverless call failed; falling back to local phrases:', err);
    return null;
  }
}

// Try serverless first, fall back to local frases.json
async function summarizeWithServerless() {
  const {catAverages, catDetails, overall} = computeResults();
  const textEl = document.getElementById('textSummary');

  try {
    const payload = {catAverages, catDetails, overall};
    const serverlessText = await callServerlessSummary(payload);
    if (serverlessText) {
      textEl.innerHTML = `<h4>Gother.IA</h4><p><strong>Média geral:</strong> ${overall.toFixed(2)} — <em>${classify(overall)}</em></p><div>${serverlessText}</div>`;
      return;
    }
  } catch (err) {
    console.warn('Serverless summary error; using local fallback', err);
  }

  // Fallback to local frases.json
  summarize();
}

function showLoadingThenSummarize(duration = 3000) {
  const textEl = document.getElementById('textSummary');
  textEl.innerHTML = `<div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0">
      <div class="progress-bar"></div>
    </div>
    <p class="muted">Gother.IA está analisando os resultados...</p>`;

  const bar = textEl.querySelector('.progress-bar');
  // reset
  bar.style.transition = 'none';
  bar.style.width = '0%';
  bar.getBoundingClientRect();
  // animate
  bar.style.transition = `width ${duration}ms linear`;
  setTimeout(() => bar.style.width = '100%', 50);

  if (loadingTimer) clearTimeout(loadingTimer);
  loadingTimer = setTimeout(async () => {
    await summarizeWithServerless();
    loadingTimer = null;
  }, duration + 60);
}

// When clicking calculate, also show the loading summary (3s) then present the summary
calculateBtn.removeEventListener && calculateBtn.removeEventListener('click', calculate);
calculateBtn.addEventListener('click', () => {
  calculate();
  // show numeric result + chart first, then run Gother.IA with loading (try serverless, fallback to local)
  showLoadingThenSummarize(3000);
});

// ========== CONFIGURATION ==========
// To enable serverless ChatGPT integration, uncomment and set your endpoint URL:
// serverlessUrl = 'https://seu-vercel.vercel.app/api/generate';
// or for Netlify:
// serverlessUrl = 'https://seu-site.netlify.app/.netlify/functions/generate';
// Otherwise, Gother.IA will use local frases.json automatically.

