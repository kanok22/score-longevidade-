/* ============================================================
   VITALIS — Interface
   Formulário multi-etapas, mostrador de latão (SVG), vu-meters,
   receituário e animações de entrada.
   ============================================================ */

(() => {
  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObserver.unobserve(e.target);
      }
    }
  }, { threshold: 0.12 });
  $$('.reveal').forEach(el => revealObserver.observe(el));

  /* ---------- Sliders com output ao vivo ---------- */
  const bindSlider = (inputId, outputId, fmt = v => v) => {
    const input = $(inputId), out = $(outputId);
    const update = () => { out.textContent = fmt(input.value); };
    input.addEventListener('input', update);
    update();
  };
  bindSlider('#f-fc', '#out-fc');
  bindSlider('#f-cardio', '#out-cardio');
  bindSlider('#f-forca', '#out-forca');
  bindSlider('#f-sono', '#out-sono', v => String(v).replace('.', ','));
  bindSlider('#f-veg', '#out-veg');

  /* ---------- Controlos segmentados / dial-select ---------- */
  const escolhas = {}; // valores dos controlos custom
  $$('.seg-control, .dial-select').forEach(group => {
    const name = group.dataset.name;
    $$('button', group).forEach(btn => {
      btn.addEventListener('click', () => {
        $$('button', group).forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        escolhas[name] = btn.dataset.value;
        group.closest('.field')?.classList.remove('invalid');
      });
    });
  });

  /* ---------- Interruptores ---------- */
  $$('.toggle').forEach(t => {
    escolhas[t.dataset.name] = false;
    t.closest('.toggle-row').addEventListener('click', ev => {
      ev.preventDefault();
      t.classList.toggle('on');
      escolhas[t.dataset.name] = t.classList.contains('on');
    });
  });

  /* ---------- Navegação do formulário ---------- */
  const steps      = $$('.form-step');
  const stepLabels = $$('#progress-steps li');
  const fill       = $('#progress-fill');
  const btnPrev    = $('#btn-prev');
  const btnNext    = $('#btn-next');
  const btnCalc    = $('#btn-calc');
  const formError  = $('#form-error');
  let current = 0;

  function showStep(i) {
    const dir = i >= current ? 'from-right' : 'from-left';
    current = i;
    steps.forEach((s, k) => {
      const ativo = k === i;
      s.classList.toggle('active', ativo);
      s.classList.remove('from-right', 'from-left');
      if (ativo) {
        void s.offsetWidth; // reinicia a animação
        s.classList.add(dir);
      }
    });
    stepLabels.forEach((l, k) => {
      l.classList.toggle('active', k === i);
      l.classList.toggle('done', k < i);
    });
    fill.style.width = `${((i + 1) / steps.length) * 100}%`;
    btnPrev.disabled = i === 0;
    const last = i === steps.length - 1;
    btnNext.classList.toggle('hidden', last);
    btnCalc.classList.toggle('hidden', !last);
    formError.classList.add('hidden');
  }

  /* Validação por passo (só campos obrigatórios) */
  function validaPasso(i) {
    let ok = true;
    const marca = (el, cond) => {
      el.closest('.field')?.classList.toggle('invalid', !cond);
      if (!cond) ok = false;
    };
    if (i === 0) {
      const idade = $('#f-idade');
      marca(idade, idade.value >= 18 && idade.value <= 100);
      const sexoOk = !!escolhas.sexo;
      $('[data-name="sexo"]').closest('.field').classList.toggle('invalid', !sexoOk);
      if (!sexoOk) ok = false;
    }
    if (i === 1) {
      const alt = $('#f-altura'), peso = $('#f-peso');
      marca(alt, alt.value >= 120 && alt.value <= 230);
      marca(peso, peso.value >= 35 && peso.value <= 250);
    }
    return ok;
  }

  btnNext.addEventListener('click', () => {
    if (!validaPasso(current)) {
      formError.classList.remove('hidden');
      formError.classList.remove('shake'); // reinicia animação
      void formError.offsetWidth;
      return;
    }
    showStep(Math.min(current + 1, steps.length - 1));
  });
  btnPrev.addEventListener('click', () => showStep(Math.max(current - 1, 0)));

  /* ---------- Mostrador: anel de progresso (SVG) ---------- */
  const GAUGE = { cx: 200, cy: 200, r: 158, w: 18 };

  function construirGauge(minV, maxV, cronologica, biologica) {
    const svg = $('#bio-gauge');
    const C = 2 * Math.PI * GAUGE.r;
    const frac = v => Math.min(1, Math.max(0, (v - minV) / (maxV - minV)));

    const jovem = biologica <= cronologica;
    const corA = jovem ? '#7ce8d8' : '#fdba74';
    const corB = jovem ? '#2dd4bf' : '#f97316';
    const glow = jovem ? 'rgba(45,212,191,.45)' : 'rgba(249,115,22,.45)';

    // posição do marcador da idade cronológica (anel começa no topo, sentido horário)
    const angC = (-90 + frac(cronologica) * 360) * Math.PI / 180;
    const mx = GAUGE.cx + GAUGE.r * Math.cos(angC);
    const my = GAUGE.cy + GAUGE.r * Math.sin(angC);

    svg.innerHTML = `
      <defs>
        <linearGradient id="g-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${corA}"/>
          <stop offset="100%" stop-color="${corB}"/>
        </linearGradient>
      </defs>
      <circle cx="${GAUGE.cx}" cy="${GAUGE.cy}" r="${GAUGE.r}" fill="none"
        stroke="rgba(255,255,255,.07)" stroke-width="${GAUGE.w}"/>
      <circle id="gauge-progress" cx="${GAUGE.cx}" cy="${GAUGE.cy}" r="${GAUGE.r}" fill="none"
        stroke="url(#g-ring)" stroke-width="${GAUGE.w}" stroke-linecap="round"
        transform="rotate(-90 ${GAUGE.cx} ${GAUGE.cy})"
        stroke-dasharray="${C}" stroke-dashoffset="${C}"
        style="transition: stroke-dashoffset 1.8s cubic-bezier(.3,1,.4,1); filter: drop-shadow(0 0 12px ${glow});"/>
      <circle cx="${mx}" cy="${my}" r="7" fill="#fff" opacity=".95"/>
      <circle cx="${mx}" cy="${my}" r="12" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>
    `;
    return { minV, maxV, frac, C };
  }

  function apontarGauge(escala, valor) {
    const prog = $('#gauge-progress');
    const alvo = escala.C * (1 - escala.frac(valor));
    // pequeno atraso para a transição disparar depois de renderizar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      prog.style.strokeDashoffset = String(alvo);
    }));
  }

  /* ---------- Contador animado ---------- */
  function animaNumero(el, alvo, duracao = 1600, decimais = 0) {
    const t0 = performance.now();
    const tick = now => {
      const p = Math.min(1, (now - t0) / duracao);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (alvo * eased).toFixed(decimais).replace('.', ',');
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Vu-meters ---------- */
  function renderMeters(dominios) {
    const wrap = $('#meters');
    wrap.innerHTML = '';
    for (const key of Object.keys(dominios)) {
      const d = dominios[key];
      if (d.score == null) continue;
      const cls = d.score >= 75 ? 'f-good' : d.score >= 50 ? 'f-mid' : 'f-bad';
      const row = document.createElement('div');
      row.className = 'meter';
      row.innerHTML = `
        <span class="meter-name"><span aria-hidden="true">${d.icone}</span>${d.nome}</span>
        <div class="meter-track"><div class="meter-fill ${cls}" style="width:0%"></div></div>
        <span class="meter-value">0</span>
      `;
      wrap.appendChild(row);
      // animar após inserir
      requestAnimationFrame(() => requestAnimationFrame(() => {
        $('.meter-fill', row).style.width = `${d.score}%`;
      }));
      animaNumero($('.meter-value', row), d.score, 1400);
    }
  }

  /* ---------- Separadores do painel de resultados ---------- */
  function mostrarPainel(id) {
    $$('.panel-tab').forEach(t => t.classList.toggle('active', t.dataset.panel === id));
    $$('.panel').forEach(p => {
      const ativo = p.id === id;
      if (ativo) {
        p.classList.remove('active');
        void p.offsetWidth; // reinicia a animação de entrada
      }
      p.classList.toggle('active', ativo);
    });
  }
  $$('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => mostrarPainel(tab.dataset.panel));
  });
  $$('.topnav a[data-panel]').forEach(a => {
    a.addEventListener('click', () => mostrarPainel(a.dataset.panel));
  });

  /* ---------- Funil: sessão + catálogo resumido ---------- */
  const temConta = () => {
    try {
      return !!localStorage.getItem('vitalis_sessao') ||
        Object.keys(localStorage).some(k => k.startsWith('sb-'));
    } catch { return false; }
  };

  const CATALOGO = {
    'dieta-mediterranica':    { nome: 'Dieta Mediterrânica · 12 sem.',  icone: '🫒', preco: 29, precoAntigo: 49 },
    'dieta-antiinflamatoria': { nome: 'Dieta Anti-inflamatória · 8 sem.', icone: '🥗', preco: 24, precoAntigo: 39 },
    'protocolo-sono':         { nome: 'Protocolo de Sono Profundo · 6 sem.', icone: '☾', preco: 19, precoAntigo: 34 },
    'forca-longevidade':      { nome: 'Programa de Força · 10 sem.',    icone: '🏋', preco: 24, precoAntigo: 39 },
  };
  const DOMINIO_PLANO = {
    coracao: 'dieta-mediterranica',
    metabolismo: 'dieta-antiinflamatoria',
    nutricao: 'dieta-mediterranica',
    movimento: 'forca-longevidade',
    sono: 'protocolo-sono',
    mente: 'protocolo-sono',
  };

  function renderOferta(resultado) {
    // domínios mais fracos primeiro → programas recomendados (máx. 2 distintos)
    const fracos = Object.entries(resultado.dominios)
      .filter(([, d]) => d.score != null)
      .sort((a, b) => a[1].score - b[1].score);
    const recomendados = [];
    for (const [key] of fracos) {
      const id = DOMINIO_PLANO[key];
      if (id && !recomendados.includes(id)) recomendados.push(id);
      if (recomendados.length === 2) break;
    }
    try { localStorage.setItem('vitalis_recomendados', JSON.stringify(recomendados)); } catch {}

    if (resultado.recuperavel >= 1) {
      $('#oferta-titulo').textContent =
        `Recupere até ${String(resultado.recuperavel).replace('.', ',')} anos de idade biológica`;
    }
    $('#oferta-planos').innerHTML = recomendados.map((id, i) => {
      const p = CATALOGO[id];
      const [key] = fracos[i] || [];
      const motivo = key && resultado.dominios[key]
        ? `${resultado.dominios[key].nome} em ${resultado.dominios[key].score}/100`
        : 'perfil geral';
      return `
        <div class="offer-plan">
          <span class="op-icon">${p.icone}</span>
          <div class="op-info">
            <strong>${p.nome}</strong>
            <small>recomendado porque: ${motivo}</small>
          </div>
          <span class="op-price"><s>${p.precoAntigo} €</s><b>${p.preco} €</b></span>
        </div>`;
    }).join('');
  }

  /* ---------- Receituário ---------- */
  function renderPlano(resultado) {
    const itens = VitalisPlan.gerar(resultado);
    const body = $('#rx-body');
    body.innerHTML = '';

    const nome = resultado.dados.nome?.trim();
    $('#rx-for').textContent = `Plano para: ${nome || 'si'}`;
    $('#rx-date').textContent = new Date().toLocaleDateString('pt-PT', {
      day: 'numeric', month: 'long', year: 'numeric'
    });

    const lede = $('#plano-lede');
    if (resultado.delta > 0) {
      lede.textContent = `Boas notícias: cada intervenção abaixo foi escolhida porque pode devolver-lhe parte dos ${String(resultado.delta).replace('.', ',')} anos de diferença. Comece pelas de prioridade máxima.`;
    } else if (resultado.delta < 0) {
      lede.textContent = `Está a envelhecer mais devagar do que o calendário. Este plano serve para proteger essa vantagem — e alargá-la.`;
    } else {
      lede.textContent = `A sua idade biológica acompanha a cronológica. Com as intervenções certas, pode colocá-la abaixo.`;
    }

    if (!itens.length) {
      body.innerHTML = `<p class="rx-empty">🏅 Perfil exemplar em todos os domínios. Mantenha os hábitos e reavalie a cada 6 meses.</p>`;
      return;
    }

    // Funil: sem conta, só as 3 primeiras intervenções ficam abertas
    const LIMITE_GRATIS = 3;
    const bloquear = !temConta() && itens.length > LIMITE_GRATIS;
    const visiveis = bloquear ? itens.slice(0, LIMITE_GRATIS) : itens;
    const trancados = bloquear ? itens.slice(LIMITE_GRATIS) : [];

    visiveis.forEach((item, i) => {
      const el = document.createElement('article');
      el.className = 'rx-item';
      el.style.animationDelay = `${0.15 + i * 0.13}s`;
      const tut = item.tutorial ? `
        <button type="button" class="rx-tut-toggle">📘 Como fazer — tutorial passo-a-passo <span class="chev">▾</span></button>
        <ol class="rx-tut">${item.tutorial.map(p => `<li>${p}</li>`).join('')}</ol>` : '';
      el.innerHTML = `
        <div class="rx-stamp" aria-hidden="true">${item.icone}</div>
        <div>
          <h4>${item.titulo} <span class="rx-priority ${item.prioridade.classe}">${item.prioridade.rotulo}</span></h4>
          <p>${item.texto}</p>
          <span class="rx-goal">${item.meta}</span>
          ${tut}
        </div>
      `;
      const toggle = el.querySelector('.rx-tut-toggle');
      if (toggle) {
        toggle.addEventListener('click', () => {
          el.querySelector('.rx-tut').classList.toggle('open');
          toggle.classList.toggle('open');
        });
      }
      body.appendChild(el);
    });

    if (trancados.length) {
      const lock = document.createElement('div');
      lock.className = 'rx-locked';
      lock.innerHTML = `
        <div class="rx-locked-list">
          ${trancados.map(t => `
            <div class="rx-item locked" style="animation-delay:.2s">
              <div class="rx-stamp" aria-hidden="true">${t.icone}</div>
              <div>
                <h4>${t.titulo} <span class="rx-priority ${t.prioridade.classe}">${t.prioridade.rotulo}</span></h4>
                <p class="blurred">${t.texto}</p>
                <span class="rx-goal blurred">${t.meta}</span>
              </div>
            </div>`).join('')}
        </div>
        <div class="rx-locked-cta">
          <span class="lock-icon">🔒</span>
          <strong>+${trancados.length} intervenções personalizadas bloqueadas</strong>
          <p>Crie uma conta gratuita para desbloquear o plano completo e guardar a sua evolução.</p>
          <a href="conta.html" class="btn btn-brass"><span class="btn-face">Desbloquear grátis →</span></a>
        </div>
      `;
      body.appendChild(lock);
    }
  }

  /* ---------- Recolha de dados e cálculo ---------- */
  function recolherDados() {
    return {
      idade: Number($('#f-idade').value),
      sexo: escolhas.sexo,
      nome: $('#f-nome').value,
      altura: Number($('#f-altura').value),
      peso: Number($('#f-peso').value),
      cintura: Number($('#f-cintura').value) || null,
      pa: escolhas.pa || 'ns',
      fc: Number($('#f-fc').value),
      cardio: Number($('#f-cardio').value),
      forca: Number($('#f-forca').value),
      tabaco: escolhas.tabaco || 'nunca',
      alcool: escolhas.alcool || 'leve',
      sedentario: !!escolhas.sedentario,
      sono: Number($('#f-sono').value),
      qsono: escolhas.qsono || 'media',
      stress: escolhas.stress || 'medio',
      social: escolhas.social || 'medias',
      proposito: !!escolhas.proposito,
      veg: Number($('#f-veg').value),
      upf: escolhas.upf || 'semanal',
      padrao: escolhas.padrao || 'misto',
      agua: !!escolhas.agua,
      glicemia: Number($('#f-glicemia').value) || null,
      hdl: Number($('#f-hdl').value) || null,
      ldl: Number($('#f-ldl').value) || null,
      trig: Number($('#f-trig').value) || null,
    };
  }

  btnCalc.addEventListener('click', () => {
    // valida os passos obrigatórios
    for (const i of [0, 1]) {
      if (!validaPasso(i)) {
        showStep(i);
        formError.classList.remove('hidden');
        return;
      }
    }

    const dados = recolherDados();
    const resultado = VitalisScore.calcular(dados);

    // mostrar painel de resultados no separador Score
    $('#painel').classList.remove('hidden');
    $('#nav-resultados').classList.remove('nav-disabled');
    $('#nav-plano').classList.remove('nav-disabled');
    mostrarPainel('p-resultados');
    $$('#painel .reveal').forEach(el => revealObserver.observe(el));

    // mostrador: escala centrada na idade cronológica
    const minV = Math.max(18, Math.floor((resultado.idadeCronologica - 15) / 5) * 5);
    const maxV = Math.ceil((resultado.idadeCronologica + 20) / 5) * 5;
    const escala = construirGauge(minV, maxV, resultado.idadeCronologica, resultado.idadeBiologica);

    $('#chrono-value').textContent = resultado.idadeCronologica;
    const deltaBox = $('#delta-box');
    const deltaVal = $('#delta-value');
    const d = resultado.delta;
    deltaVal.textContent = `${d > 0 ? '+' : ''}${String(d).replace('.', ',')} anos`;
    deltaBox.classList.toggle('delta-good', d < 0);
    deltaBox.classList.toggle('delta-bad', d > 0);

    const verdict = $('#gauge-verdict');
    if (d <= -3)      verdict.textContent = '“O seu corpo está claramente mais jovem do que o calendário. Trabalho notável.”';
    else if (d < 0)   verdict.textContent = '“Ligeiramente mais jovem do que a idade cronológica — está no bom caminho.”';
    else if (d === 0) verdict.textContent = '“Em linha com o calendário. Há margem para ganhar anos de vitalidade.”';
    else if (d <= 3)  verdict.textContent = '“Ligeiramente acima da idade cronológica — pequenas mudanças terão grande efeito.”';
    else              verdict.textContent = '“O corpo está a envelhecer mais depressa do que devia. O plano abaixo é o seu mapa de regresso.”';

    renderMeters(resultado.dominios);
    renderPlano(resultado);
    renderOferta(resultado);

    // métricas de projeção
    animaNumero($('#stat-global'), resultado.scoreGlobal, 1400);
    $('#stat-ritmo').textContent = `${String(resultado.ritmo).replace('.', ',')}×`;
    $('#stat-recuperavel').textContent = String(resultado.recuperavel).replace('.', ',');
    const projTile = $('#stat-proj-tile');
    if (resultado.recuperavel >= 1) {
      $('#stat-proj').innerHTML =
        `${String(resultado.projSem).replace('.', ',')} <small>→</small> ${String(resultado.projCom).replace('.', ',')}`;
      $('#stat-proj-label').textContent =
        `idade biológica daqui a 10 anos: manter hábitos vs. seguir o plano`;
      projTile.classList.add('teal');
    } else {
      $('#stat-proj').textContent = String(resultado.projCom).replace('.', ',');
      $('#stat-proj-label').textContent = 'projeção da idade biológica daqui a 10 anos mantendo os bons hábitos';
      projTile.classList.add('teal');
    }

    // deixa o resultado pronto a ser guardado na conta (conta.html)
    try {
      localStorage.setItem('vitalis_ultimo_resultado', JSON.stringify({
        idadeCronologica: resultado.idadeCronologica,
        idadeBiologica: resultado.idadeBiologica,
        delta: resultado.delta,
        imc: resultado.imc,
        scoreGlobal: resultado.scoreGlobal,
        recuperavel: resultado.recuperavel,
        dominios: Object.fromEntries(
          Object.entries(resultado.dominios).map(([k, v]) => [k, v.score])
        ),
      }));
    } catch { /* armazenamento indisponível — segue sem guardar */ }

    // navegar e animar
    document.getElementById('painel').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => {
      apontarGauge(escala, resultado.idadeBiologica);
      animaNumero($('#bio-number'), resultado.idadeBiologica, 1800, 1);
    }, 450);
  });

  /* ---------- Imprimir / recomeçar ---------- */
  $('#btn-print').addEventListener('click', () => window.print());
  $('#btn-restart').addEventListener('click', () => {
    document.getElementById('avaliacao').scrollIntoView({ behavior: 'smooth' });
    showStep(0);
  });

  showStep(0);
})();
