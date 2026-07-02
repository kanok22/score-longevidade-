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

  /* Tutoriais passo-a-passo, por título da intervenção */
  const TUTORIAIS = {
    'Cessação tabágica': [
      'Marque uma data concreta para deixar de fumar (máx. 30 dias) e escreva-a onde a vê todos os dias.',
      'Fale com o médico ou farmacêutico sobre substitutos de nicotina (pastilhas, adesivos) — duplicam a taxa de sucesso.',
      'Identifique os 3 momentos em que mais fuma e prepare um substituto para cada (pastilha, água, 10 flexões, chamada a um amigo).',
      'Remova isqueiros, cinzeiros e tabaco de casa e do carro na véspera da data.',
      'Se recair, não desista: a maioria das pessoas precisa de várias tentativas. Recomece no dia seguinte.',
    ],
    'Controlar a pressão arterial': [
      'Compre ou peça emprestado um medidor de braço validado (evite os de pulso).',
      'Meça 2× de manhã e 2× à noite, sentado, 5 min em repouso, durante 7 dias. Anote tudo.',
      'Leve os registos a uma consulta — o diagnóstico nunca se faz com uma medição única.',
      'Entretanto: reduza o sal (cozinhe com especiarias), caminhe 30 min/dia e evite bebidas energéticas.',
    ],
    'Conhecer a sua pressão arterial': [
      'Passe numa farmácia e peça uma medição — é gratuito ou custa cêntimos.',
      'Vá descansado: sente-se 5 minutos antes, sem café nem tabaco na hora anterior.',
      'Anote os dois números (ex.: 128/82) e a hora do dia.',
      'Repita noutro dia a horas diferentes para confirmar.',
    ],
    'Chegar aos 150 minutos de exercício': [
      'Escolha uma atividade que tolere bem: caminhada rápida, bicicleta, natação ou dança.',
      'Comece com 3 blocos de 20 minutos por semana, em dias alternados.',
      'Adicione 5–10 minutos por semana a cada bloco até chegar aos 150 min/semana.',
      'Regra da intensidade certa: consegue falar, mas não consegue cantar.',
      'Marque os treinos no calendário como compromissos — a hora certa é a que cumpre.',
    ],
    'Treino de força 2× por semana': [
      'Sem equipamento: agachamentos, flexões (contra a parede se preciso), lunges e prancha.',
      'Estrutura simples: 3 séries de 8–12 repetições por exercício, 2 dias por semana não seguidos.',
      'Quando conseguir 12 repetições fáceis, aumente a dificuldade (mais carga, mais lento, mais amplitude).',
      'Vídeo-aulas de técnica: pesquise "exercício + técnica correta" e valide a postura ao espelho.',
      'Dores musculares ligeiras 24–48h depois são normais; dor articular aguda não é — pare e ajuste.',
    ],
    'Reduzir peso de forma sustentada': [
      'Defina o alvo realista: 0,5 kg por semana (défice de ~500 kcal/dia).',
      'Comece pelo mais fácil: elimine bebidas açucaradas e álcool durante a semana.',
      'Encha metade do prato com vegetais, um quarto com proteína, um quarto com hidratos integrais.',
      'Pese-se 1× por semana, sempre no mesmo dia e hora, e registe.',
      'Combine com treino de força para perder gordura sem perder músculo.',
    ],
    'Vigiar a composição corporal': [
      'Meça o perímetro abdominal 1× por mês, ao nível do umbigo, sem prender a respiração.',
      'Troque snacks processados por fruta + frutos secos.',
      'Adicione proteína ao pequeno-almoço (ovos, iogurte grego, queijo fresco) — reduz a fome do dia.',
      'Reavalie o score em 8 semanas para ver a tendência.',
    ],
    'Recuperar as horas de sono': [
      'Fixe primeiro a hora de acordar — todos os dias à mesma hora, fins de semana incluídos.',
      'Antecipe a hora de deitar 20 minutos por semana até chegar às 7–8h de sono.',
      'Sem ecrãs 60 min antes de deitar; luz fraca e quente na última hora.',
      'Cafeína só até às 14h; álcool à noite fragmenta o sono profundo.',
      'Se não adormecer em 20 min, levante-se, leia com luz fraca e volte quando tiver sono.',
    ],
    'Melhorar a qualidade do sono': [
      'Quarto: fresco (17–19 °C), escuro total (blackout ou máscara) e silencioso (tampões se preciso).',
      'Crie uma rotina de descompressão de 30 min: duche morno → alongamentos leves → leitura.',
      'Ressona ou acorda com dores de cabeça? Fale com o médico sobre apneia do sono.',
      'Reserve a cama para dormir — trabalhar ou ver vídeos na cama treina o cérebro para ficar alerta.',
    ],
    'Programa anti-stress diário': [
      'Escolha uma técnica e domine-a: respiração 4-7-8 (inspire 4s, sustenha 7s, expire 8s).',
      'Pratique 10 minutos por dia à mesma hora — associe a um hábito existente (depois do café da manhã).',
      'Caminhadas na natureza 2× por semana contam — e amplificam o efeito.',
      'À noite, escreva 3 coisas boas do dia; treina o cérebro para o positivo.',
      'Apps gratuitas de meditação guiada ajudam nas primeiras semanas.',
    ],
    'Reconstruir laços sociais': [
      'Comece pequeno: uma mensagem ou chamada por dia a alguém de quem gosta.',
      'Agende uma refeição partilhada por semana — repetição cria hábito.',
      'Junte-se a um grupo com horário fixo (clube de caminhada, voluntariado, aulas) — a regularidade faz o trabalho por si.',
      'Diga sim a convites por defeito durante 1 mês, mesmo sem vontade inicial.',
    ],
    'Cultivar propósito': [
      'Responda por escrito: "O que faria com prazer mesmo sem ser pago?" e "Que problema gostava de ajudar a resolver?"',
      'Escolha UMA atividade que cruze as duas respostas e reserve-lhe 2h por semana.',
      'Diga a alguém o que vai fazer — compromisso público duplica a adesão.',
      'Ao fim de 30 dias, avalie: energia ao fazer? Vontade de repetir? Se não, troque de atividade sem culpa.',
    ],
    'Cinco porções de vegetais e fruta': [
      'Uma porção = 1 peça de fruta ou 1 chávena de vegetais crus ou ½ chávena cozinhados.',
      'Truque do pequeno-almoço: junte fruta ao iogurte ou aveia — 1 porção garantida antes de sair de casa.',
      'Ao almoço e jantar: metade do prato com vegetais, sempre.',
      'Congelados contam e não perdem valor nutricional — tenha sempre um saco no congelador.',
      'Adicione 1 porção nova por semana até chegar às 5/dia.',
    ],
    'Cortar nos ultraprocessados': [
      'Regra dos 5 ingredientes: se o rótulo tem mais de 5 ingredientes impronunciáveis, fica na prateleira.',
      'Trocas diretas: refrigerante → água com gás e limão; batatas fritas → frutos secos; bolachas → fruta + queijo.',
      'Não compre para casa o que não quer comer — a força de vontade decide-se no supermercado.',
      'Prepare 2–3 refeições simples de 15 min para os dias de cansaço (ovos mexidos + salada, atum + leguminosas).',
    ],
    'Transição para padrão mediterrânico': [
      'Troque a gordura principal por azeite virgem extra (cozinhar e temperar).',
      'Peixe 2–3× por semana, sendo 1× peixe gordo (sardinha, cavala, salmão).',
      'Leguminosas 3× por semana: comece por adicionar grão ou feijão a sopas e saladas.',
      'Punhado de frutos secos ao lanche, todos os dias.',
      'Carne vermelha no máximo 1× por semana; processada só em ocasiões.',
    ],
    'Reduzir o álcool': [
      'Conte as bebidas reais de uma semana normal — sem contar, não há mudança.',
      'Defina 4 dias fixos sem álcool por semana e proteja-os.',
      'Em casa, não tenha stock: compre à unidade quando decidir beber.',
      'Em eventos sociais, alterne cada bebida alcoólica com um copo de água.',
      'Se reduzir custar mais do que esperava, fale com o seu médico — há apoio eficaz e discreto.',
    ],
    'Quebrar o tempo sentado': [
      'Alarme de 45 em 45 minutos: levante-se, 2 minutos de pé ou a andar.',
      'Chamadas telefónicas sempre em pé ou a caminhar.',
      'Beba água ao longo do dia — obriga a pausas naturais.',
      'Escadas em vez de elevador sempre que forem ≤ 3 pisos.',
    ],
    'Hidratação de base': [
      'Copo de água ao acordar, antes de qualquer café.',
      'Garrafa de 1L visível na secretária: encha 2× ao dia.',
      'Um copo antes de cada refeição — ajuda também na saciedade.',
    ],
    'Corrigir a glicemia': [
      'Caminhe 10–15 minutos depois de cada refeição principal — baixa diretamente o pico de glicose.',
      'Ordem no prato: vegetais primeiro, proteína depois, hidratos no fim.',
      'Troque hidratos refinados por integrais e elimine açúcar líquido.',
      'Durma 7–8h: uma noite má sobe a glicemia do dia seguinte.',
      'Repita a análise em 3 meses e leve os resultados ao médico.',
    ],
    'Baixar o colesterol LDL': [
      'Aveia ao pequeno-almoço (fibra solúvel) todos os dias.',
      'Punhado de nozes ou amêndoas diário.',
      'Troque manteiga por azeite; corte fritos e produtos de pastelaria industrial.',
      'Leguminosas 3× por semana.',
      'Marque consulta para avaliar o risco cardiovascular global — pode precisar de mais do que dieta.',
    ],
    'Manter-se sem fumar': [
      'Identifique as situações de risco (stress, álcool, certas companhias) e tenha um plano para cada.',
      'Celebre os marcos: 1 mês, 6 meses, 1 ano sem fumar.',
      'Se vier uma vontade forte: 5 minutos de espera + água + respiração lenta — a onda passa.',
    ],
  };

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
        tutorial: TUTORIAIS[rg.titulo] || null,
      });
    }

    return itens;
  }

  return { gerar };
})();
