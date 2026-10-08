import { API_URL, PUBLIC_IMAGES_URL, state, navigate } from '../main.js';

export function loginScreen(app, options = {}) {
  const modal = document.createElement('div');
  modal.className = 'login-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'login-title');
  modal.innerHTML = `
    <div class="login-backdrop" data-close-login></div>
    <section class="login-card">
      <button class="login-close" type="button" data-close-login aria-label="Fechar">&times;</button>
      <div class="brand"><img src="${PUBLIC_IMAGES_URL}/gateguard_logo.png" alt="GateGuard"></div>
      <div class="login-heading"><span>PAINEL FINANCEIRO GATEGUARD</span><h2 id="login-title">Acesso administrativo</h2><p>Este acesso serve somente para administrar a integração e os pagamentos do site. O GateGuard não autentica usuários finais do seu site.</p></div>
      <form id="login-form">
        <label>ID DO SITE<input name="system" placeholder="SIS_XXXX" required></label>
        <label>USUÁRIO DO PAINEL<input name="login" placeholder="Digite seu usuário" required></label>
        <div class="password-field">
          <label for="password">SENHA</label>
          <div class="password-row"><input id="password" name="password" type="password" placeholder="Digite sua senha" minlength="6" required><label class="check" for="show"><input id="show" type="checkbox"> Exibir senha</label></div>
        </div>
        <p id="error" class="error" role="alert"></p><p id="login-status" class="login-status" aria-live="polite"></p>
        <button type="submit"><span class="button-text">ENTRAR NO PAINEL</span><span class="login-spinner" aria-hidden="true"></span></button>
      </form>
    </section>`;
  app.appendChild(modal);

  const form = modal.querySelector('#login-form');
  const close = reason => {
    document.removeEventListener('keydown', onKeydown);
    modal.remove();
    options.onClose?.({ reason });
  };
  const onKeydown = event => { if (event.key === 'Escape') close('escape'); };
  modal.querySelectorAll('[data-close-login]').forEach(element => { element.onclick = () => close('close'); });
  document.addEventListener('keydown', onKeydown);

  let remembered = {};
  try { remembered = JSON.parse(localStorage.getItem('remembered_login') || '{}'); } catch { localStorage.removeItem('remembered_login'); }
  form.system.value = String(options.system || remembered.system || '').toUpperCase();
  form.login.value = String(remembered.login || '');
  if (options.system && options.lockSystem !== false) form.system.readOnly = true;
  form.system.oninput = event => { event.target.value = event.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, ''); };
  modal.querySelector('#show').onchange = event => { form.password.type = event.target.checked ? 'text' : 'password'; };
  form.onsubmit = async event => {
    event.preventDefault();
    const button = form.querySelector('button[type="submit"]');
    const buttonText = button.querySelector('.button-text');
    const status = modal.querySelector('#login-status');
    modal.querySelector('#error').textContent = '';
    button.disabled = true;
    button.classList.add('is-loading');
    buttonText.textContent = 'VALIDANDO';
    status.textContent = 'Validando acesso ao painel...';
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Falha ao entrar.');
      localStorage.setItem('remembered_login', JSON.stringify({ system: form.system.value, login: form.login.value }));
      state.token = data.token;
      state.session = data;
      sessionStorage.setItem('login_session', data.token);
      sessionStorage.setItem('login_data', JSON.stringify(data));
      document.removeEventListener('keydown', onKeydown);
      navigate('home');
    } catch (error) {
      modal.querySelector('#error').textContent = error.message;
    } finally {
      button.disabled = false;
      button.classList.remove('is-loading');
      buttonText.textContent = 'ENTRAR NO PAINEL';
      status.textContent = '';
    }
  };
  setTimeout(() => (form.system.value ? form.login : form.system).focus(), 0);
}
