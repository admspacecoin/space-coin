/* jshint esversion: 11 */
const { createClient } = supabase;
const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Redireciona se já estiver logado
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) window.location.href = 'app.html';
})();

// ── TABS ──────────────────────────────────────────────────────────
function showTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display = isLogin ? 'flex' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('tab-login').className = 'type-btn' + (isLogin ? ' on' : '');
  document.getElementById('tab-register').className = 'type-btn' + (isLogin ? '' : ' on');
  clearError();
}

// ── LOGIN ─────────────────────────────────────────────────────────
async function login(e) {
  e.preventDefault();
  const email    = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  if (!email || !password) return showError('Preencha e-mail e senha.');

  setBtnLoading('btn-login', true);
  const { error } = await sb.auth.signInWithPassword({ email, password });
  setBtnLoading('btn-login', false);

  if (error) return showError(traduzirErro(error.message));
  window.location.href = 'app.html';
}

// ── CADASTRO ──────────────────────────────────────────────────────
async function register(e) {
  e.preventDefault();
  const name     = document.getElementById('reg-name').value.trim();
  const email    = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value;

  if (!name || !email || !password) return showError('Preencha todos os campos.');
  if (password.length < 6) return showError('Senha deve ter pelo menos 6 caracteres.');

  setBtnLoading('btn-register', true);
  const { error } = await sb.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  setBtnLoading('btn-register', false);

  if (error) return showError(traduzirErro(error.message));
  showSuccess('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
}

// ── HELPERS ───────────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById('auth-msg');
  el.textContent = msg;
  el.className = 'auth-msg error';
}

function showSuccess(msg) {
  const el = document.getElementById('auth-msg');
  el.textContent = msg;
  el.className = 'auth-msg success';
}

function clearError() {
  const el = document.getElementById('auth-msg');
  el.textContent = '';
  el.className = 'auth-msg';
}

function setBtnLoading(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;
  btn.disabled = loading;
  btn.textContent = loading ? 'Aguarde...' : btn.dataset.label;
}

function traduzirErro(msg) {
  if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (msg.includes('Email not confirmed'))       return 'Confirme seu e-mail antes de entrar.';
  if (msg.includes('already registered'))        return 'Este e-mail já está cadastrado.';
  if (msg.includes('Password should be'))        return 'Senha deve ter pelo menos 6 caracteres.';
  return msg;
}
