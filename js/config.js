/* ============================================================
   VITALIS — Configuração da base de dados
   ------------------------------------------------------------
   Por omissão o site corre em MODO DEMONSTRAÇÃO: as contas e
   compras ficam guardadas apenas no navegador (localStorage).

   Para contas reais, gratuitas e seguras, use o Supabase:
   1. Crie um projeto em https://supabase.com (plano Free)
   2. Corra o SQL que está no README.md (tabelas + segurança RLS)
   3. Cole abaixo o Project URL e a chave "anon public"
      (Settings → API). A chave anon é pública por desenho;
      a segurança é garantida pelas políticas RLS no servidor.
   ============================================================ */

window.VITALIS_CONFIG = {
  supabaseUrl: '',      // ex.: 'https://xxxx.supabase.co'
  supabaseAnonKey: '',  // ex.: 'eyJhbGciOi...'
};
