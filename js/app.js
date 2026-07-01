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
    current = i;
    steps.forEach((s, k) => s.classList.toggle('active', k === i));
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

  /* ---------- Mostrador de latão (SVG) ---------- */
  const GAUGE = {
    cx: 200, cy: 210, r: 158,
    start: -200, end: 20, // graus (0° = eixo x positivo)
  };

  function polar(angDeg, r) {
    const a = angDeg * Math.PI / 180;
    return [GAUGE.cx + r * Math.cos(a), GAUGE.cy + r * Math.sin(a)];
  }

  function arcPath(a0, a1, r) {
    const [x0, y0] = polar(a0, r);
    const [x1, y1] = polar(a1, r);
    const large = (a1 - a0) > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  }

  function construirGauge(minV, maxV) {
    const svg = $('#bio-gauge');
    const span = GAUGE.end - GAUGE.start;
    const zonas = [
      { f0: 0.0, f1: 0.45, cor: '#3f8f5f' },
      { f0: 0.45, f1: 0.7, cor: '#c9932e' },
      { f0: 0.7, f1: 1.0, cor: '#b6473a' },
    ];
    let html = `
      <defs>
        <radialGradient id="g-face" cx="50%" cy="38%" r="75%">
          <stop offset="0%" stop-color="#fffdf4"/>
          <stop offset="70%" stop-color="#efe4c9"/>
          <stop offset="100%" stop-color="#d9c9a4"/>
        </radialGradient>
        <linearGradient id="g-bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#f3d98a"/>
          <stop offset="55%" stop-color="#c9a34a"/>
          <stop offset="100%" stop-color="#7a5c1e"/>
        </linearGradient>
      </defs>
      <circle cx="${GAUGE.cx}" cy="${GAUGE.cy}" r="${GAUGE.r + 26}" fill="url(#g-bezel)" stroke="#5c4413" stroke-width="2"/>
      <circle cx="${GAUGE.cx}" cy="${GAUGE.cy}" r="${GAUGE.r + 12}" fill="url(#g-face)" stroke="#a08c5e" stroke-width="1.5"/>
    `;
    // zonas coloridas
    for (const z of zonas) {
      html += `<path d="${arcPath(GAUGE.start + span * z.f0, GAUGE.start + span * z.f1, GAUGE.r - 8)}"
        fill="none" stroke="${z.cor}" stroke-width="12" stroke-linecap="butt" opacity=".85"/>`;
    }
    // marcações e números
    const nTicks = 10;
    for (let i = 0; i <= nTicks; i++) {
      const f = i / nTicks;
      const ang = GAUGE.start + span * f;
      const [x0, y0] = polar(ang, GAUGE.r - 20);
      const [x1, y1] = polar(ang, GAUGE.r - 34);
      html += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#57452a" stroke-width="2.4"/>`;
      const val = Math.round(minV + (maxV - minV) * f);
      const [tx, ty] = polar(ang, GAUGE.r - 50);
      html += `<text x="${tx}" y="${ty}" text-anchor="middle" dominant-baseline="middle"
        font-family="Oswald, sans-serif" font-size="15" fill="#57452a">${val}</text>`;
      // sub-marcações
      if (i < nTicks) {
        for (let s = 1; s < 5; s++) {
          const fa = GAUGE.start + span * (f + s / (5 * nTicks));
          const [sx0, sy0] = polar(fa, GAUGE.r - 20);
          const [sx1, sy1] = polar(fa, GAUGE.r - 27);
          html += `<line x1="${sx0}" y1="${sy0}" x2="${sx1}" y2="${sy1}" stroke="#7a6845" stroke-width="1.2"/>`;
        }
      }
    }
    html += `
      <g id="gauge-needle" style="transform-origin:${GAUGE.cx}px ${GAUGE.cy}px; transform: rotate(${GAUGE.start}deg); transition: transform 1.8s cubic-bezier(.3,1.4,.4,1);">
        <polygon points="${GAUGE.cx - 6},${GAUGE.cy} ${GAUGE.cx + 6},${GAUGE.cy} ${GAUGE.cx + GAUGE.r - 26},${GAUGE.cy - 1.5} ${GAUGE.cx + GAUGE.r - 26},${GAUGE.cy + 1.5}"
          fill="#8c2f22" stroke="#5c1d14" stroke-width="1"/>
      </g>
      <circle cx="${GAUGE.cx}" cy="${GAUGE.cy}" r="15" fill="url(#g-bezel)" stroke="#5c4413" stroke-width="1.5"/>
      <circle cx="${GAUGE.cx - 4}" cy="${GAUGE.cy - 5}" r="4" fill="rgba(255,255,255,.55)"/>
    `;
    svg.innerHTML = html;
    return { minV, maxV };
  }

  function apontarGauge(escala, valor) {
    const span = GAUGE.end - GAUGE.start;
    const f = Math.min(1, Math.max(0, (valor - escala.minV) / (escala.maxV - escala.minV)));
    const ang = GAUGE.start + span * f;
    const needle = $('#gauge-needle');
    // pequeno atraso para a transição disparar depois de renderizar
    requestAnimationFrame(() => requestAnimationFrame(() => {
      needle.style.transform = `rotate(${ang - GAUGE.start + GAUGE.start}deg)`;
      needle.style.transform = `rotate(${ang}deg)`;
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

    itens.forEach((item, i) => {
      const el = document.createElement('article');
      el.className = 'rx-item';
      el.style.animationDelay = `${0.15 + i * 0.13}s`;
      el.innerHTML = `
        <div class="rx-stamp" aria-hidden="true">${item.icone}</div>
        <div>
          <h4>${item.titulo} <span class="rx-priority ${item.prioridade.classe}">${item.prioridade.rotulo}</span></h4>
          <p>${item.texto}</p>
          <span class="rx-goal">${item.meta}</span>
        </div>
      `;
      body.appendChild(el);
    });
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

    // mostrar secções
    $('#resultados').classList.remove('hidden');
    $('#plano').classList.remove('hidden');
    $('#nav-resultados').classList.remove('nav-disabled');
    $('#nav-plano').classList.remove('nav-disabled');
    $$('#resultados .reveal, #plano .reveal').forEach(el => revealObserver.observe(el));

    // mostrador: escala centrada na idade cronológica
    const minV = Math.max(18, Math.floor((resultado.idadeCronologica - 15) / 5) * 5);
    const maxV = Math.ceil((resultado.idadeCronologica + 20) / 5) * 5;
    const escala = construirGauge(minV, maxV);

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

    // navegar e animar
    document.getElementById('resultados').scrollIntoView({ behavior: 'smooth' });
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
