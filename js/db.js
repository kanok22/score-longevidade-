/* ============================================================
   VITALIS — Camada de dados (contas, resultados, compras)

   Dois modos, com a mesma API:
   - Supabase (recomendado): autenticação real + Postgres com
     Row Level Security. Ativa-se preenchendo js/config.js.
   - Demonstração: tudo no localStorage deste navegador, com
     password guardada como hash SHA-256 com salt (nunca em
     texto simples). Serve para experimentar sem servidor.
   ============================================================ */

const VitalisDB = (() => {
  const cfg = window.VITALIS_CONFIG || {};
  const usaSupabase = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  let sb = null;

  /* ---------------- utilitários (modo demo) ---------------- */
  const lsGet = (k, fallback) => {
    try { return JSON.parse(localStorage.getItem(k)) ?? fallback; }
    catch { return fallback; }
  };
  const lsSet = (k, v) => localStorage.setItem(k, JSON.stringify(v));

  async function sha256(texto) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  const novoSalt = () =>
    [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');

  const chaveDados = email => `vitalis_dados_${email}`;
  const dadosDe = email => lsGet(chaveDados(email), { resultados: [], compras: [] });
  const gravaDados = (email, dados) => lsSet(chaveDados(email), dados);

  /* ---------------- API: modo demonstração ---------------- */
  const demo = {
    modo: 'demo',

    async init() {},

    async registar({ nome, email, pass }) {
      email = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email inválido.');
      if (pass.length < 8) throw new Error('A palavra-passe deve ter pelo menos 8 caracteres.');
      const users = lsGet('vitalis_users', {});
      if (users[email]) throw new Error('Já existe uma conta com este email. Entre em vez de se registar.');
      const salt = novoSalt();
      users[email] = { nome: nome.trim(), salt, hash: await sha256(salt + pass) };
      lsSet('vitalis_users', users);
      lsSet('vitalis_sessao', email);
      return { email, nome: users[email].nome };
    },

    async entrar(email, pass) {
      email = email.trim().toLowerCase();
      const u = lsGet('vitalis_users', {})[email];
      if (!u || u.hash !== await sha256(u.salt + pass)) {
        throw new Error('Email ou palavra-passe incorretos.');
      }
      lsSet('vitalis_sessao', email);
      return { email, nome: u.nome };
    },

    async sair() { localStorage.removeItem('vitalis_sessao'); },

    async utilizador() {
      const email = lsGet('vitalis_sessao', null);
      if (!email) return null;
      const u = lsGet('vitalis_users', {})[email];
      return u ? { email, nome: u.nome } : null;
    },

    async guardarResultado(res) {
      const u = await this.utilizador();
      if (!u) throw new Error('Sessão expirada.');
      const d = dadosDe(u.email);
      d.resultados.unshift({ criado_em: new Date().toISOString(), dados: res });
      d.resultados = d.resultados.slice(0, 20);
      gravaDados(u.email, d);
    },

    async resultados() {
      const u = await this.utilizador();
      return u ? dadosDe(u.email).resultados : [];
    },

    async comprar(compra) {
      const u = await this.utilizador();
      if (!u) throw new Error('Sessão expirada.');
      const d = dadosDe(u.email);
      if (compra.plano_id && d.compras.some(c => c.plano_id === compra.plano_id)) {
        throw new Error('Já tem este plano na sua conta.');
      }
      d.compras.unshift({ criado_em: new Date().toISOString(), ...compra });
      gravaDados(u.email, d);
    },

    async compras() {
      const u = await this.utilizador();
      return u ? dadosDe(u.email).compras : [];
    },
  };

  /* ---------------- API: modo Supabase ---------------- */
  const supa = {
    modo: 'supabase',

    async init() {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
        s.onload = res;
        s.onerror = () => rej(new Error('Não foi possível carregar o Supabase.'));
        document.head.appendChild(s);
      });
      sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    },

    async registar({ nome, email, pass }) {
      const { data, error } = await sb.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pass,
        options: { data: { nome: nome.trim() } },
      });
      if (error) throw new Error(error.message);
      if (!data.session) {
        throw new Error('Conta criada! Confirme o email que lhe enviámos e depois entre.');
      }
      return { email: data.user.email, nome: nome.trim() };
    },

    async entrar(email, pass) {
      const { data, error } = await sb.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password: pass,
      });
      if (error) throw new Error('Email ou palavra-passe incorretos.');
      return { email: data.user.email, nome: data.user.user_metadata?.nome || '' };
    },

    async sair() { await sb.auth.signOut(); },

    async utilizador() {
      const { data } = await sb.auth.getUser();
      if (!data?.user) return null;
      return { email: data.user.email, nome: data.user.user_metadata?.nome || '' };
    },

    async guardarResultado(res) {
      const { error } = await sb.from('resultados').insert({ dados: res });
      if (error) throw new Error(error.message);
    },

    async resultados() {
      const { data, error } = await sb.from('resultados')
        .select('criado_em, dados').order('criado_em', { ascending: false }).limit(20);
      if (error) throw new Error(error.message);
      return data || [];
    },

    async comprar(compra) {
      const { error } = await sb.from('compras').insert(compra);
      if (error) {
        if (error.code === '23505') throw new Error('Já tem este plano na sua conta.');
        throw new Error(error.message);
      }
    },

    async compras() {
      const { data, error } = await sb.from('compras')
        .select('criado_em, plano_id, titulo, categoria, preco, cupao')
        .order('criado_em', { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    },
  };

  return usaSupabase ? supa : demo;
})();
