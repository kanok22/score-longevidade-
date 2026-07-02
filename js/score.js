/* ============================================================
   VITALIS — Motor de cálculo
   Estima a idade biológica somando deltas (em anos) à idade
   cronológica, e calcula 6 sub-scores (0–100) por domínio.

   Os pesos são heurísticos, inspirados em fatores de risco
   descritos na literatura (atividade física, tabaco, sono,
   pressão arterial, IMC, dieta mediterrânica, stress, laços
   sociais). Ferramenta educativa — não é diagnóstico médico.
   ============================================================ */

const VitalisScore = (() => {

  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* Cada regra devolve { delta, pontos } onde:
     - delta: anos somados/subtraídos à idade biológica
     - pontos: contributo 0–100 para o sub-score do domínio */

  function avaliaIMC(d) {
    const h = d.altura / 100;
    const imc = d.peso / (h * h);
    let delta, pts;
    if (imc < 18.5)      { delta = +1.5; pts = 55; }
    else if (imc < 25)   { delta = -0.5; pts = 100; }
    else if (imc < 30)   { delta = +1.0; pts = 65; }
    else if (imc < 35)   { delta = +2.5; pts = 40; }
    else                 { delta = +4.0; pts = 20; }
    return { delta, pts, imc };
  }

  function avaliaCintura(d) {
    if (!d.cintura) return null;
    const limite = d.sexo === 'f' ? 88 : 102;
    const alerta = d.sexo === 'f' ? 80 : 94;
    if (d.cintura < alerta)  return { delta: -0.5, pts: 100 };
    if (d.cintura < limite)  return { delta: +0.5, pts: 65 };
    return { delta: +1.5, pts: 35 };
  }

  function avaliaPA(d) {
    switch (d.pa) {
      case 'otima':   return { delta: -1.0, pts: 100 };
      case 'normal':  return { delta:  0.0, pts: 85 };
      case 'elevada': return { delta: +1.0, pts: 55 };
      case 'alta':    return { delta: +3.0, pts: 25 };
      default:        return { delta: +0.5, pts: 60 }; // "não sei" — leve penalização
    }
  }

  function avaliaFC(d) {
    const fc = d.fc;
    if (fc < 60)  return { delta: -1.0, pts: 100 };
    if (fc <= 70) return { delta:  0.0, pts: 85 };
    if (fc <= 80) return { delta: +1.0, pts: 60 };
    return { delta: +2.0, pts: 35 };
  }

  function avaliaCardio(d) {
    const m = d.cardio;
    if (m >= 300) return { delta: -2.5, pts: 100 };
    if (m >= 150) return { delta: -1.5, pts: 85 };
    if (m >= 75)  return { delta: -0.5, pts: 60 };
    if (m > 0)    return { delta: +1.0, pts: 40 };
    return { delta: +2.0, pts: 15 };
  }

  function avaliaForca(d) {
    if (d.forca >= 2) return { delta: -1.0, pts: 100 };
    if (d.forca === 1) return { delta: -0.3, pts: 65 };
    return { delta: +0.7, pts: 30 };
  }

  function avaliaSedentarismo(d) {
    return d.sedentario
      ? { delta: +1.0, pts: 40 }
      : { delta:  0.0, pts: 90 };
  }

  function avaliaTabaco(d) {
    switch (d.tabaco) {
      case 'atual': return { delta: +5.0, pts: 5 };
      case 'ex':    return { delta: +1.5, pts: 65 };
      default:      return { delta: -0.5, pts: 100 };
    }
  }

  function avaliaAlcool(d) {
    switch (d.alcool) {
      case 'zero':     return { delta: -0.3, pts: 100 };
      case 'leve':     return { delta:  0.0, pts: 90 };
      case 'moderado': return { delta: +1.0, pts: 55 };
      case 'alto':     return { delta: +3.0, pts: 20 };
      default:         return { delta: 0, pts: 70 };
    }
  }

  function avaliaSono(d) {
    const h = d.sono;
    let delta, pts;
    if (h >= 7 && h <= 8)       { delta = -1.0; pts = 100; }
    else if (h >= 6 && h < 7)   { delta = +0.5; pts = 65; }
    else if (h > 8 && h <= 9)   { delta = +0.5; pts = 70; }
    else if (h < 6)             { delta = +2.0; pts = 30; }
    else                        { delta = +1.5; pts = 45; } // > 9h
    return { delta, pts };
  }

  function avaliaQualidadeSono(d) {
    switch (d.qsono) {
      case 'boa':   return { delta: -0.5, pts: 100 };
      case 'media': return { delta: +0.3, pts: 60 };
      case 'ma':    return { delta: +1.5, pts: 25 };
      default:      return { delta: 0, pts: 60 };
    }
  }

  function avaliaStress(d) {
    switch (d.stress) {
      case 'baixo': return { delta: -0.5, pts: 100 };
      case 'medio': return { delta: +0.5, pts: 60 };
      case 'alto':  return { delta: +2.0, pts: 25 };
      default:      return { delta: 0, pts: 60 };
    }
  }

  function avaliaSocial(d) {
    switch (d.social) {
      case 'fortes': return { delta: -1.5, pts: 100 };
      case 'medias': return { delta:  0.0, pts: 65 };
      case 'fracas': return { delta: +1.5, pts: 25 };
      default:       return { delta: 0, pts: 65 };
    }
  }

  function avaliaProposito(d) {
    return d.proposito
      ? { delta: -0.7, pts: 100 }
      : { delta: +0.5, pts: 45 };
  }

  function avaliaVegetais(d) {
    const p = d.veg;
    if (p >= 5) return { delta: -1.5, pts: 100 };
    if (p >= 3) return { delta: -0.5, pts: 75 };
    if (p >= 1) return { delta: +0.5, pts: 45 };
    return { delta: +1.5, pts: 15 };
  }

  function avaliaUPF(d) {
    switch (d.upf) {
      case 'raro':    return { delta: -0.5, pts: 100 };
      case 'semanal': return { delta: +0.5, pts: 60 };
      case 'diario':  return { delta: +2.0, pts: 20 };
      default:        return { delta: 0, pts: 60 };
    }
  }

  function avaliaPadrao(d) {
    switch (d.padrao) {
      case 'mediterranico': return { delta: -1.5, pts: 100 };
      case 'misto':         return { delta:  0.0, pts: 65 };
      case 'ocidental':     return { delta: +1.5, pts: 30 };
      default:              return { delta: 0, pts: 65 };
    }
  }

  function avaliaAgua(d) {
    return d.agua
      ? { delta: -0.2, pts: 95 }
      : { delta: +0.3, pts: 55 };
  }

  function avaliaGlicemia(d) {
    if (!d.glicemia) return null;
    const g = d.glicemia;
    if (g < 100) return { delta: -0.5, pts: 100 };
    if (g < 126) return { delta: +1.5, pts: 50 };
    return { delta: +3.0, pts: 20 };
  }

  function avaliaHDL(d) {
    if (!d.hdl) return null;
    const alvo = d.sexo === 'f' ? 50 : 40;
    if (d.hdl >= alvo + 10) return { delta: -0.5, pts: 100 };
    if (d.hdl >= alvo)      return { delta:  0.0, pts: 75 };
    return { delta: +1.0, pts: 40 };
  }

  function avaliaLDL(d) {
    if (!d.ldl) return null;
    if (d.ldl < 100) return { delta: -0.5, pts: 100 };
    if (d.ldl < 130) return { delta:  0.0, pts: 75 };
    if (d.ldl < 160) return { delta: +1.0, pts: 50 };
    return { delta: +2.0, pts: 25 };
  }

  function avaliaTrig(d) {
    if (!d.trig) return null;
    if (d.trig < 150) return { delta: -0.3, pts: 100 };
    if (d.trig < 200) return { delta: +0.5, pts: 60 };
    return { delta: +1.5, pts: 30 };
  }

  /* ---------- Agregação por domínio ---------- */

  function media(items) {
    const validos = items.filter(Boolean);
    if (!validos.length) return null;
    return Math.round(validos.reduce((s, r) => s + r.pts, 0) / validos.length);
  }

  function calcular(d) {
    const imc     = avaliaIMC(d);
    const cintura = avaliaCintura(d);
    const pa      = avaliaPA(d);
    const fc      = avaliaFC(d);
    const cardio  = avaliaCardio(d);
    const forca   = avaliaForca(d);
    const sedent  = avaliaSedentarismo(d);
    const tabaco  = avaliaTabaco(d);
    const alcool  = avaliaAlcool(d);
    const sono    = avaliaSono(d);
    const qsono   = avaliaQualidadeSono(d);
    const stress  = avaliaStress(d);
    const social  = avaliaSocial(d);
    const prop    = avaliaProposito(d);
    const veg     = avaliaVegetais(d);
    const upf     = avaliaUPF(d);
    const padrao  = avaliaPadrao(d);
    const agua    = avaliaAgua(d);
    const glic    = avaliaGlicemia(d);
    const hdl     = avaliaHDL(d);
    const ldl     = avaliaLDL(d);
    const trig    = avaliaTrig(d);

    const regras = [
      imc, cintura, pa, fc, cardio, forca, sedent, tabaco, alcool,
      sono, qsono, stress, social, prop, veg, upf, padrao, agua,
      glic, hdl, ldl, trig
    ].filter(Boolean);

    const deltaTotal = regras.reduce((s, r) => s + r.delta, 0);

    // Idade biológica: cronológica + deltas, com limites de plausibilidade
    const idadeBio = clamp(
      Math.round((d.idade + deltaTotal) * 10) / 10,
      Math.max(18, d.idade - 15),
      d.idade + 25
    );

    const dominios = {
      coracao:    { nome: 'Coração',    icone: '♥', score: media([pa, fc, tabaco]) },
      metabolismo:{ nome: 'Metabolismo',icone: '⚗', score: media([imc, cintura, glic, hdl, ldl, trig]) },
      movimento:  { nome: 'Movimento',  icone: '🏃', score: media([cardio, forca, sedent]) },
      sono:       { nome: 'Sono',       icone: '☾', score: media([sono, qsono]) },
      nutricao:   { nome: 'Nutrição',   icone: '🥗', score: media([veg, upf, padrao, agua, alcool]) },
      mente:      { nome: 'Mente',      icone: '☯', score: media([stress, social, prop]) },
    };

    // ---- métricas de funil / projeção ----
    // anos "recuperáveis": soma dos deltas positivos endereçáveis por estilo de vida
    const recuperavel = Math.round(
      regras.filter(r => r.delta > 0).reduce((s, r) => s + r.delta, 0) * 0.8 * 10
    ) / 10;
    // score global 0–100 (média dos domínios disponíveis)
    const scores = Object.values(dominios).map(x => x.score).filter(s => s != null);
    const scoreGlobal = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
    // ritmo de envelhecimento (1.00 = em linha com o calendário)
    const ritmo = Math.round((idadeBio / d.idade) * 100) / 100;
    // projeção a 10 anos: manter hábitos vs. seguir o plano
    const projSem = Math.round((idadeBio + 10 * Math.max(1, ritmo)) * 10) / 10;
    const projCom = Math.round((idadeBio + 10 - Math.min(recuperavel, 8)) * 10) / 10;

    return {
      idadeCronologica: d.idade,
      idadeBiologica: idadeBio,
      delta: Math.round((idadeBio - d.idade) * 10) / 10,
      imc: Math.round(imc.imc * 10) / 10,
      dominios,
      scoreGlobal,
      ritmo,
      recuperavel,
      projSem,
      projCom,
      dados: d,
    };
  }

  return { calcular };
})();
