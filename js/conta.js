/* ============================================================
   VITALIS — Área de conta: autenticação, loja de planos,
   cupões, compras e histórico de resultados.
   ============================================================ */

(() => {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);

  /* ---------------- Catálogo de planos ---------------- */
  const PLANOS = [
    {
      id: 'dieta-mediterranica', categoria: 'Dietas', icone: '🫒', preco: 29,
      titulo: 'Dieta Mediterrânica — 12 semanas',
      desc: 'Plano alimentar completo com menus semanais, lista de compras e receitas rápidas. O padrão com mais evidência em longevidade.',
      conteudo: [
        'Semanas 1–2 · Fundações: azeite como gordura principal, 5 porções de vegetais/fruta por dia, água como bebida base.',
        'Semanas 3–4 · Proteína inteligente: peixe 3× por semana (2× gordo), leguminosas 3× por semana.',
        'Semanas 5–6 · Trocas: pão branco → integral; snacks → 30 g de frutos secos; carne processada → ovos ou peixe.',
        'Semanas 7–8 · Ritmo: janela de jantar 3h antes de deitar; fruta como sobremesa.',
        'Semanas 9–10 · Consolidação: 2 receitas novas por semana do caderno incluído.',
        'Semanas 11–12 · Autonomia: montar o seu prato-modelo e plano de manutenção.',
      ],
    },
    {
      id: 'dieta-antiinflamatoria', categoria: 'Dietas', icone: '🥗', preco: 24,
      titulo: 'Dieta Anti-inflamatória — 8 semanas',
      desc: 'Protocolo para baixar a inflamação de base: especiarias, ómega-3, fibra fermentável e corte de ultraprocessados.',
      conteudo: [
        'Semanas 1–2 · Eliminar: açúcar líquido, fritos e carnes processadas; introduzir cúrcuma e gengibre.',
        'Semanas 3–4 · Ómega-3: sardinha, cavala ou salmão 3× por semana; nozes diárias.',
        'Semanas 5–6 · Intestino: iogurte natural ou kefir diário + 30 plantas diferentes por semana.',
        'Semanas 7–8 · Manutenção: plano de pratos anti-inflamatórios para o dia-a-dia.',
      ],
    },
    {
      id: 'protocolo-sono', categoria: 'Sono', icone: '☾', preco: 19,
      titulo: 'Protocolo de Sono Profundo — 6 semanas',
      desc: 'Rotina noturna, gestão de luz e cafeína, e técnica de descompressão para dormir 7–8h de qualidade.',
      conteudo: [
        'Semana 1 · Diagnóstico: diário de sono e horário-âncora de acordar.',
        'Semana 2 · Luz: 10 min de luz solar ao acordar; ecrãs fora do quarto.',
        'Semanas 3–4 · Descompressão: rotina de 30 min (duche morno, leitura, respiração 4-7-8).',
        'Semanas 5–6 · Consolidação: ajuste fino da janela de sono e plano para recaídas.',
      ],
    },
    {
      id: 'forca-longevidade', categoria: 'Movimento', icone: '🏋', preco: 24,
      titulo: 'Programa de Força Longevidade — 10 semanas',
      desc: 'Treino de força progressivo, 2–3 sessões semanais, pensado para preservar músculo e osso depois dos 40.',
      conteudo: [
        'Semanas 1–2 · Padrões base: agachamento, empurrar, puxar e dobradiça de anca com peso corporal.',
        'Semanas 3–5 · Carga: introdução de halteres/elásticos, 2 sessões de 35 min.',
        'Semanas 6–8 · Progressão: 3 sessões, sobrecarga gradual e equilíbrio unipodal.',
        'Semanas 9–10 · Teste e plano de manutenção: força de preensão e levantar da cadeira.',
      ],
    },
  ];

  const CUPOES = {
    'VITALIS100': { desconto: 100, nota: 'Oferta de lançamento — 100% de desconto' },
  };

  const ACOMPANHAMENTO = { preco: 49, unidade: '€/mês' };

  let cupaoAtivo = null;

  /* ---------------- UI utilitários ---------------- */
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.add('hidden'), 3800);
  }

  function abrirModal(html) {
    $('#modal-body').innerHTML = html;
    $('#modal').classList.remove('hidden');
  }
  function fecharModal() { $('#modal').classList.add('hidden'); }
  $('#modal-close').addEventListener('click', fecharModal);
  $('#modal').addEventListener('click', e => { if (e.target === $('#modal')) fecharModal(); });

  const eur = v => v === 0 ? 'Grátis' : `${v} €`;
  const dataPt = iso => new Date(iso).toLocaleDateString('pt-PT', { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------------- Autenticação ---------------- */
  const authBlock = $('#auth-block');
  const areaPrivada = $('#area-privada');
  const authError = $('#auth-error');

  function mostraErro(msg) {
    authError.textContent = msg;
    authError.classList.remove('hidden');
  }

  $('#tab-entrar').addEventListener('click', () => {
    $('#tab-entrar').classList.add('selected');
    $('#tab-registar').classList.remove('selected');
    $('#form-entrar').classList.remove('hidden');
    $('#form-registar').classList.add('hidden');
    authError.classList.add('hidden');
  });
  $('#tab-registar').addEventListener('click', () => {
    $('#tab-registar').classList.add('selected');
    $('#tab-entrar').classList.remove('selected');
    $('#form-registar').classList.remove('hidden');
    $('#form-entrar').classList.add('hidden');
    authError.classList.add('hidden');
  });

  $('#form-entrar').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const user = await VitalisDB.entrar($('#login-email').value, $('#login-pass').value);
      await entrou(user);
    } catch (err) { mostraErro(err.message); }
  });

  $('#form-registar').addEventListener('submit', async e => {
    e.preventDefault();
    try {
      const user = await VitalisDB.registar({
        nome: $('#reg-nome').value,
        email: $('#reg-email').value,
        pass: $('#reg-pass').value,
      });
      toast('Conta criada com sucesso. Bem-vindo à Vitalis!');
      await entrou(user);
    } catch (err) { mostraErro(err.message); }
  });

  $('#btn-sair').addEventListener('click', async () => {
    await VitalisDB.sair();
    areaPrivada.classList.add('hidden');
    authBlock.classList.remove('hidden');
    $('#tab-entrar').click(); // volta ao separador de login
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  async function entrou(user) {
    authBlock.classList.add('hidden');
    areaPrivada.classList.remove('hidden');
    $('#saudacao').textContent = user.nome ? `Olá, ${user.nome.split(' ')[0]}` : 'Bem-vindo';
    await guardarResultadoPendente();
    await Promise.all([renderResultados(), renderCompras()]);
    renderLoja();
  }

  /* Resultado vindo da página de avaliação */
  async function guardarResultadoPendente() {
    try {
      const bruto = localStorage.getItem('vitalis_ultimo_resultado');
      if (!bruto) return;
      await VitalisDB.guardarResultado(JSON.parse(bruto));
      localStorage.removeItem('vitalis_ultimo_resultado');
      toast('💾 O resultado da sua avaliação foi guardado na conta.');
    } catch { /* resultado pendente inválido — ignora */ }
  }

  /* ---------------- Resultados / histórico ---------------- */
  async function renderResultados() {
    const lista = await VitalisDB.resultados();
    const alvo = $('#ultimo-resultado');
    const hist = $('#historico');

    if (!lista.length) {
      alvo.innerHTML = `<p class="empty-note">Ainda não guardou nenhum resultado. <a href="index.html#avaliacao">Faça a avaliação →</a></p>`;
      hist.innerHTML = `<li class="empty-note">Sem avaliações guardadas.</li>`;
      return;
    }

    const ult = lista[0].dados;
    const boa = ult.delta <= 0;
    alvo.innerHTML = `
      <div class="last-numbers">
        <div class="cmp-box"><span class="cmp-label">Idade biológica</span>
          <span class="cmp-value">${String(ult.idadeBiologica).replace('.', ',')}</span></div>
        <div class="cmp-box"><span class="cmp-label">Cronológica</span>
          <span class="cmp-value">${ult.idadeCronologica}</span></div>
        <div class="cmp-box ${boa ? 'delta-good' : 'delta-bad'}" id="delta-box"><span class="cmp-label">Diferença</span>
          <span class="cmp-value">${ult.delta > 0 ? '+' : ''}${String(ult.delta).replace('.', ',')}</span></div>
      </div>
      <p class="gauge-verdict">Avaliação de ${dataPt(lista[0].criado_em)} · ${boa
        ? 'mais jovem do que o calendário — proteja essa vantagem.'
        : 'há anos a recuperar — os planos abaixo foram feitos para isso.'}</p>
    `;

    hist.innerHTML = lista.map(r => `
      <li class="history-item">
        <span class="h-date">${dataPt(r.criado_em)}</span>
        <span class="h-bio">${String(r.dados.idadeBiologica).replace('.', ',')} anos</span>
        <span class="h-delta ${r.dados.delta <= 0 ? 'good' : 'bad'}">${r.dados.delta > 0 ? '+' : ''}${String(r.dados.delta).replace('.', ',')}</span>
      </li>
    `).join('');
  }

  /* ---------------- Loja ---------------- */
  function precoFinal(plano) {
    if (!cupaoAtivo) return plano.preco;
    return Math.max(0, Math.round(plano.preco * (1 - cupaoAtivo.desconto / 100)));
  }

  let comprados = new Set();

  function renderLoja() {
    const loja = $('#loja');
    loja.innerHTML = PLANOS.map(p => {
      const final = precoFinal(p);
      const tem = comprados.has(p.id);
      return `
      <article class="shop-card ${tem ? 'owned' : ''}">
        <div class="shop-stamp">${p.icone}</div>
        <span class="shop-cat">${p.categoria}</span>
        <h4>${p.titulo}</h4>
        <p>${p.desc}</p>
        <div class="shop-buy">
          <span class="price-tag ${final === 0 ? 'free' : ''}">
            ${final < p.preco ? `<s>${p.preco} €</s> ` : ''}${eur(final)}
          </span>
          ${tem
            ? `<span class="owned-badge">✔ Na sua conta</span>`
            : `<button type="button" class="btn btn-emerald btn-sm" data-comprar="${p.id}">
                 <span class="btn-face">${final === 0 ? '🎁 Obter grátis' : '🛒 Comprar'}</span>
               </button>`}
        </div>
      </article>`;
    }).join('');

    loja.querySelectorAll('[data-comprar]').forEach(btn => {
      btn.addEventListener('click', () => comprar(btn.dataset.comprar));
    });
  }

  async function comprar(id) {
    const p = PLANOS.find(x => x.id === id);
    const final = precoFinal(p);

    if (final > 0) {
      abrirModal(`
        <h3 class="modal-title">💳 Pagamento</h3>
        <p>O pagamento online por cartão ainda não está ativo nesta versão do site.</p>
        <p>Se tiver um <strong>cupão</strong>, aplique-o na loja — com o cupão <code>VITALIS100</code> este plano fica <strong>gratuito</strong>.</p>
      `);
      return;
    }

    try {
      await VitalisDB.comprar({
        plano_id: p.id, titulo: p.titulo, categoria: p.categoria,
        preco: final, cupao: cupaoAtivo ? cupaoAtivo.codigo : null,
      });
      toast(`🎉 "${p.titulo}" foi adicionado aos seus planos.`);
      await renderCompras();
      renderLoja();
    } catch (err) { toast(err.message); }
  }

  /* Cupão */
  $('#btn-cupao').addEventListener('click', () => {
    const cod = $('#cupao-input').value.trim().toUpperCase();
    const estado = $('#cupao-estado');
    const c = CUPOES[cod];
    if (!c) {
      cupaoAtivo = null;
      estado.textContent = cod ? '✖ Cupão inválido ou expirado.' : '';
      estado.className = 'coupon-state bad';
    } else {
      cupaoAtivo = { codigo: cod, ...c };
      estado.textContent = `✔ ${c.nota} (−${c.desconto}%)`;
      estado.className = 'coupon-state good';
      toast(`Cupão ${cod} aplicado: ${c.desconto}% de desconto em todos os planos.`);
    }
    renderLoja();
  });

  /* ---------------- Os meus planos ---------------- */
  async function renderCompras() {
    const compras = await VitalisDB.compras();
    comprados = new Set(compras.map(c => c.plano_id));
    const alvo = $('#minhas-compras');

    const planosComprados = compras.filter(c => c.categoria !== 'Acompanhamento');
    const acomp = compras.filter(c => c.categoria === 'Acompanhamento');

    if (!planosComprados.length) {
      alvo.innerHTML = `<p class="empty-note">Ainda não tem planos. Escolha um acima — com o cupão certo pode ser gratuito.</p>`;
      return;
    }

    // agrupar por categoria (ex.: "Dietas")
    const grupos = {};
    for (const c of planosComprados) (grupos[c.categoria] ??= []).push(c);

    alvo.innerHTML = Object.entries(grupos).map(([cat, itens]) => `
      <div class="owned-group">
        <h4 class="owned-cat">📁 ${cat}</h4>
        ${itens.map(c => {
          const pedida = acomp.some(a => a.plano_id === `acomp-${c.plano_id}`);
          return `
          <div class="owned-item">
            <div class="owned-info">
              <strong>${c.titulo}</strong>
              <small>Adquirido a ${dataPt(c.criado_em)} · ${eur(c.preco)}${c.cupao ? ` · cupão ${c.cupao}` : ''}</small>
            </div>
            <div class="owned-actions">
              <button type="button" class="btn btn-ivory btn-sm" data-ver="${c.plano_id}"><span class="btn-face">📖 Ver plano</span></button>
              ${pedida
                ? `<span class="owned-badge">✔ Acompanhamento pedido</span>`
                : `<button type="button" class="btn btn-brass btn-sm" data-acomp="${c.plano_id}">
                     <span class="btn-face">👩‍⚕️ Acompanhamento · ${ACOMPANHAMENTO.preco}${ACOMPANHAMENTO.unidade}</span>
                   </button>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    `).join('');

    alvo.querySelectorAll('[data-ver]').forEach(b =>
      b.addEventListener('click', () => verPlano(b.dataset.ver)));
    alvo.querySelectorAll('[data-acomp]').forEach(b =>
      b.addEventListener('click', () => pedirAcompanhamento(b.dataset.acomp)));
  }

  function verPlano(id) {
    const p = PLANOS.find(x => x.id === id);
    if (!p) return;
    abrirModal(`
      <h3 class="modal-title">${p.icone} ${p.titulo}</h3>
      <ol class="plan-steps">
        ${p.conteudo.map(l => `<li>${l}</li>`).join('')}
      </ol>
      <p class="modal-note">Guarde este plano: está sempre disponível em "Os meus planos". Para o adaptar a si, considere o acompanhamento profissional.</p>
    `);
  }

  function pedirAcompanhamento(planoId) {
    const p = PLANOS.find(x => x.id === planoId);
    abrirModal(`
      <h3 class="modal-title">👩‍⚕️ Acompanhamento profissional</h3>
      <p>Sessões mensais com um dos nossos <strong>nutricionistas ou fisiologistas do exercício</strong>, que adaptam o plano <em>${p.titulo}</em> a si e acompanham a sua evolução.</p>
      <p class="modal-price">Serviço pago à parte: <strong>${ACOMPANHAMENTO.preco} ${ACOMPANHAMENTO.unidade}</strong></p>
      <p>Ao enviar o pedido, a nossa equipa entra em contacto por email para agendar a primeira sessão. <u>Nenhum pagamento é cobrado antes dessa confirmação.</u></p>
      <button type="button" class="btn btn-emerald" id="btn-confirmar-acomp"><span class="btn-face">📨 Enviar pedido</span></button>
    `);
    $('#btn-confirmar-acomp').addEventListener('click', async () => {
      try {
        await VitalisDB.comprar({
          plano_id: `acomp-${planoId}`, titulo: `Acompanhamento — ${p.titulo}`,
          categoria: 'Acompanhamento', preco: ACOMPANHAMENTO.preco, cupao: null,
        });
        fecharModal();
        toast('📨 Pedido enviado. A nossa equipa vai contactá-lo por email.');
        await renderCompras();
      } catch (err) { toast(err.message); }
    });
  }

  /* ---------------- Arranque ---------------- */
  (async () => {
    try {
      await VitalisDB.init();
    } catch (err) {
      mostraErro(err.message);
    }
    $('#auth-mode-note').textContent = VitalisDB.modo === 'demo'
      ? 'Modo demonstração: a conta fica guardada apenas neste navegador. Para contas reais e sincronizadas, o administrador deve configurar o Supabase (instruções no README).'
      : 'Ligação segura via Supabase — os seus dados são privados e protegidos por Row Level Security.';

    const user = await VitalisDB.utilizador();
    if (user) await entrou(user);
  })();
})();
