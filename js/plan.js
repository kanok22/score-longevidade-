/* ============================================================
   VITALIS — Gerador do plano terapêutico
   A partir do resultado do score, produz uma lista priorizada
   de intervenções de estilo de vida com metas concretas.
   Prioridade 1 = maior impacto estimado no score.
   ============================================================ */

const VitalisPlan = (() => {

  /* Cada regra: condição sobre os dados/resultado → prescrição.
     impacto (1–10) ordena o plano; prioridade visual deriva dele. */
  const REGRAS = [
    {
      cond: r => r.dados.tabaco === 'atual',
      impacto: 10,
      icone: '🚭',
      titulo: 'Cessação tabágica',
      texto: 'É a intervenção isolada com maior impacto na sua idade biológica. Fale com o seu médico sobre apoio farmacológico e consultas de cessação tabágica — a combinação duplica a taxa de sucesso.',
      meta: 'Meta: definir uma data para deixar de fumar nos próximos 30 dias.'
    },
    {
      cond: r => r.dados.pa === 'alta',
      impacto: 9,
      icone: '🩺',
      titulo: 'Controlar a pressão arterial',
      texto: 'Uma pressão arterial ≥140/90 acelera o envelhecimento vascular. Meça em casa durante 7 dias e leve os registos a uma consulta. Reduza o sal, priorize alimentos frescos e mantenha atividade física regular.',
      meta: 'Meta: consulta médica + registo de 7 dias de medições.'
    },
    {
      cond: r => r.dados.pa === 'ns',
      impacto: 5,
      icone: '🩺',
      titulo: 'Conhecer a sua pressão arterial',
      texto: 'Não sabe a sua pressão arterial — e é um dos marcadores mais importantes do envelhecimento vascular. Meça numa farmácia ou centro de saúde.',
      meta: 'Meta: obter uma medição fiável esta semana.'
    },
    {
      cond: r => r.dados.cardio < 150,
      impacto: 8,
      icone: '🏃',
      titulo: 'Chegar aos 150 minutos de exercício',
      texto: r => `Regista ${r.dados.cardio} min/semana de exercício aeróbico. O patamar com maior retorno é 150–300 min/semana de intensidade moderada (caminhada rápida, bicicleta, natação). Comece por blocos de 20–30 minutos.`,
      meta: 'Meta: +30 min/semana até atingir 150 min/semana.'
    },
    {
      cond: r => r.dados.forca < 2,
      impacto: 7,
      icone: '🏋',
      titulo: 'Treino de força 2× por semana',
      texto: 'A massa muscular é um dos melhores preditores de longevidade funcional. Duas sessões semanais de força (pesos, elásticos ou peso corporal) preservam músculo e osso, e melhoram a sensibilidade à insulina.',
      meta: 'Meta: 2 sessões/semana de 30–40 min, grandes grupos musculares.'
    },
    {
      cond: r => r.imc >= 30,
      impacto: 8,
      icone: '⚖',
      titulo: 'Reduzir peso de forma sustentada',
      texto: r => `O seu IMC estimado é ${r.imc}. Uma perda de 5–10% do peso corporal melhora pressão arterial, glicemia e inflamação. Combine défice calórico moderado com proteína adequada e treino de força para preservar músculo.`,
      meta: 'Meta: perder 0,5 kg/semana durante 12 semanas, com acompanhamento.'
    },
    {
      cond: r => r.imc >= 25 && r.imc < 30,
      impacto: 5,
      icone: '⚖',
      titulo: 'Vigiar a composição corporal',
      texto: r => `O seu IMC estimado é ${r.imc}. Pequenos ajustes — mais proteína e vegetais, menos açúcar líquido — evitam a progressão e melhoram o perfil metabólico.`,
      meta: 'Meta: estabilizar o peso e reduzir o perímetro abdominal 2–3 cm.'
    },
    {
      cond: r => r.dados.sono < 7,
      impacto: 7,
      icone: '☾',
      titulo: 'Recuperar as horas de sono',
      texto: r => `Dorme cerca de ${r.dados.sono}h por noite. O sono curto crónico eleva cortisol, glicemia e pressão arterial. Antecipe a hora de deitar em 20 minutos por semana até chegar às 7–8h.`,
      meta: 'Meta: 7–8h por noite, com horário regular (±30 min).'
    },
    {
      cond: r => r.dados.sono >= 7 && r.dados.qsono === 'ma',
      impacto: 6,
      icone: '☾',
      titulo: 'Melhorar a qualidade do sono',
      texto: 'Dorme horas suficientes mas acorda cansado(a). Higiene do sono: quarto fresco e escuro, sem ecrãs 60 min antes de deitar, cafeína só até ao início da tarde. Se ressona ou tem pausas respiratórias, fale com o médico sobre apneia do sono.',
      meta: 'Meta: rotina de descompressão de 30 min todas as noites.'
    },
    {
      cond: r => r.dados.stress === 'alto',
      impacto: 6,
      icone: '🧘',
      titulo: 'Programa anti-stress diário',
      texto: 'O stress crónico acelera o encurtamento dos telómeros e a inflamação. Reserve 10–15 minutos diários para uma prática comprovada: respiração lenta (4-7-8), meditação guiada, caminhada na natureza ou diário de gratidão.',
      meta: 'Meta: 10 min/dia de prática de relaxamento, 5 dias/semana.'
    },
    {
      cond: r => r.dados.social === 'fracas',
      impacto: 6,
      icone: '🤝',
      titulo: 'Reconstruir laços sociais',
      texto: 'O isolamento social tem impacto na mortalidade comparável ao tabagismo ligeiro. Agende encontros regulares: um telefonema por dia, uma refeição partilhada por semana, um grupo ou clube por mês.',
      meta: 'Meta: 2 interações sociais significativas por semana.'
    },
    {
      cond: r => !r.dados.proposito,
      impacto: 4,
      icone: '🧭',
      titulo: 'Cultivar propósito',
      texto: 'Ter objetivos que dão sentido aos dias (ikigai) associa-se a menor mortalidade. Identifique uma atividade — voluntariado, projeto criativo, mentoria — que combine o que gosta com o que é útil aos outros.',
      meta: 'Meta: iniciar uma atividade com significado este mês.'
    },
    {
      cond: r => r.dados.veg < 5,
      impacto: 6,
      icone: '🥗',
      titulo: 'Cinco porções de vegetais e fruta',
      texto: r => `Consome ${r.dados.veg} porções/dia. O alvo com melhor evidência é ≥5 porções de vegetais e fruta variados (metade do prato ao almoço e jantar + 1–2 peças de fruta).`,
      meta: 'Meta: +1 porção por semana até chegar às 5/dia.'
    },
    {
      cond: r => r.dados.upf === 'diario',
      impacto: 7,
      icone: '🚫',
      titulo: 'Cortar nos ultraprocessados',
      texto: 'O consumo diário de ultraprocessados associa-se a maior mortalidade por todas as causas. Troque: refrigerante → água com gás e limão; snacks → fruta e frutos secos; fast-food → refeições simples preparadas em 15 min.',
      meta: 'Meta: ultraprocessados no máximo 2× por semana.'
    },
    {
      cond: r => r.dados.padrao === 'ocidental',
      impacto: 6,
      icone: '🫒',
      titulo: 'Transição para padrão mediterrânico',
      texto: 'O padrão mediterrânico é o mais consistentemente associado à longevidade: azeite como gordura principal, peixe 2–3×/semana, leguminosas 3×/semana, frutos secos diários, carne vermelha ocasional.',
      meta: 'Meta: substituir 3 jantares/semana por refeições mediterrânicas.'
    },
    {
      cond: r => r.dados.alcool === 'alto',
      impacto: 7,
      icone: '🍷',
      titulo: 'Reduzir o álcool',
      texto: 'Mais de 10 bebidas por semana aumenta risco cardiovascular, hepático e oncológico. Estabeleça dias sem álcool e reduza gradualmente. Se sentir dificuldade em reduzir, procure apoio médico.',
      meta: 'Meta: ≤ 3 bebidas/semana, com ≥ 4 dias sem álcool.'
    },
    {
      cond: r => r.dados.sedentario,
      impacto: 5,
      icone: '⏰',
      titulo: 'Quebrar o tempo sentado',
      texto: 'Longos períodos sentado anulam parte do benefício do exercício. Levante-se 2–3 minutos a cada 45 minutos; faça chamadas em pé; use escadas sempre que possível.',
      meta: 'Meta: pausa ativa a cada 45–60 min do dia de trabalho.'
    },
    {
      cond: r => !r.dados.agua,
      impacto: 3,
      icone: '💧',
      titulo: 'Hidratação de base',
      texto: 'Mantenha uma garrafa de água visível na secretária e beba um copo ao acordar e antes de cada refeição.',
      meta: 'Meta: 1,5–2 L de água por dia.'
    },
    {
      cond: r => r.dados.glicemia && r.dados.glicemia >= 100,
      impacto: 8,
      icone: '🩸',
      titulo: 'Corrigir a glicemia',
      texto: r => `Glicemia em jejum de ${r.dados.glicemia} mg/dL sugere ${r.dados.glicemia >= 126 ? 'valores em faixa diabética — confirme com o seu médico com urgência' : 'pré-diabetes'}. Caminhada de 10–15 min após as refeições, menos açúcares rápidos e mais fibra têm efeito direto.`,
      meta: 'Meta: repetir análise em 3 meses após mudanças; alvo < 100 mg/dL.'
    },
    {
      cond: r => r.dados.ldl && r.dados.ldl >= 160,
      impacto: 7,
      icone: '🧪',
      titulo: 'Baixar o colesterol LDL',
      texto: r => `LDL de ${r.dados.ldl} mg/dL merece avaliação médica. Entretanto: mais fibra solúvel (aveia, leguminosas), frutos secos, azeite; menos gordura saturada e trans.`,
      meta: 'Meta: consulta para avaliar risco cardiovascular global.'
    },
    {
      cond: r => r.dados.tabaco === 'ex',
      impacto: 2,
      icone: '🌱',
      titulo: 'Manter-se sem fumar',
      texto: 'Excelente decisão — o risco cardiovascular continua a cair durante anos após parar. Mantenha as estratégias que o afastam do tabaco, sobretudo em períodos de stress.',
      meta: 'Meta: continuar 100% sem tabaco.'
    },
  ];

  /* Reforços positivos quando está (quase) tudo bem */
  const ELOGIOS = [
    {
      cond: r => r.delta <= -3,
      icone: '🏆',
      titulo: 'Continue exatamente assim',
      texto: r => `O seu perfil coloca a sua idade biológica ${Math.abs(r.delta)} anos abaixo da cronológica. Os seus hábitos estão a trabalhar a seu favor — o plano abaixo serve para consolidar e proteger esse capital de saúde.`,
      meta: 'Meta: reavaliar o score a cada 6 meses.'
    },
  ];

  function prioridade(impacto) {
    if (impacto >= 8) return { classe: 'p1', rotulo: 'Prioridade máxima' };
    if (impacto >= 5) return { classe: 'p2', rotulo: 'Importante' };
    return { classe: 'p3', rotulo: 'Consolidar' };
  }

  function gerar(resultado) {
    const itens = [];

    for (const e of ELOGIOS) {
      if (e.cond(resultado)) {
        itens.push({
          icone: e.icone,
          titulo: e.titulo,
          texto: typeof e.texto === 'function' ? e.texto(resultado) : e.texto,
          meta: e.meta,
          prioridade: { classe: 'p3', rotulo: 'Manutenção' },
          impacto: 0,
        });
      }
    }

    const ativas = REGRAS
      .filter(rg => rg.cond(resultado))
      .sort((a, b) => b.impacto - a.impacto)
      .slice(0, 7); // plano focado: no máximo 7 intervenções

    for (const rg of ativas) {
      itens.push({
        icone: rg.icone,
        titulo: rg.titulo,
        texto: typeof rg.texto === 'function' ? rg.texto(resultado) : rg.texto,
        meta: rg.meta,
        prioridade: prioridade(rg.impacto),
        impacto: rg.impacto,
      });
    }

    return itens;
  }

  return { gerar };
})();
