import { api, state, shell, bindShell, API_URL, SYSTEM_EMAIL, SYSTEM_URL } from '../main.js';
import '../systems.css';
import '../integration-key-preview.css';
import { bindDocumentValidation } from '../document-validation.js';

const esc = value => {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
};

export async function systemsScreen(app) {
  if (state.session.system.id !== 'SIS_0000' || state.session.user.perfil !== 'admin') return;
  app.innerHTML = shell(`<div class="panel">
    <div class="notice"><strong>Escopo do cadastro</strong><p>Cada registro representa uma organização contratante e seu site. Somente administradores da organização recebem acesso ao painel GateGuard. Compradores e usuários finais não recebem login.</p></div>
    <form id="site-registration" class="system-form">
      <fieldset id="site-fields" disabled>
        <h2 class="form-section-title">Organização e site</h2>
        <section class="form-section">
          <input name="systemEmail" type="hidden" value="${esc(SYSTEM_EMAIL)}"><input name="portalUrl" type="hidden" value="${esc(SYSTEM_URL)}">
          <div class="system-fields"><label>ID da organização<input name="system" readonly></label><label>Nome da organização*<input name="name" required maxlength="120"></label></div>
          <label>URL pública do site*<input name="siteUrl" type="url" required placeholder="https://www.exemplo.com.br"></label>
          <label>Modelo de integração*<select name="integrationMode" required><option value="OWN_BACKEND">A organização já possui backend</option><option value="GATEGUARD_HOSTED">Backend excepcional fornecido pelo GateGuard</option></select></label>
          <p id="integration-mode-help" class="notice"></p>
          <div class="phone-field"><label>Telefone*<input name="phone" required inputmode="numeric" maxlength="14" placeholder="(00)00000-0000"></label><label class="inline-check"><input type="checkbox" name="whatsapp"> WhatsApp</label></div>
          <div class="document-group"><div class="document-type-field"><span>Documento*</span><div class="document-type-selector" role="radiogroup"><label><input type="radio" name="documentType" value="CPF" required><span>CPF</span></label><label><input type="radio" name="documentType" value="CNPJ" required checked><span>CNPJ</span></label></div></div><label><span id="system-document-label">CNPJ*</span><input name="cpfCnpj" required inputmode="numeric"></label><label id="corporate-name-field">Razão social*<input name="corporateName" maxlength="160" required></label></div>
        </section>
        <h2 class="form-section-title">Administrador da organização</h2>
        <section class="form-section">
          <p>Este usuário acessará exclusivamente o painel financeiro GateGuard. Ele não será usado para autenticar compradores no site.</p>
          <label>Nome do administrador*<input name="administratorName" required maxlength="120"></label><label>CPF*<input name="administratorCpf" required inputmode="numeric" maxlength="14"></label><label>Cargo*<input name="administratorRole" required maxlength="100"></label><label>E-mail administrativo*<input name="adminEmail" type="email" required></label><label>E-mail financeiro<input name="financialEmail" type="email"></label><label>E-mail de comunicados<input name="communicationsEmail" type="email"></label>
          <div class="credential-fields"><label>Usuário do painel<input value="gestor" readonly></label><label>Senha temporária*<span class="registration-password-control"><input name="temporaryPassword" type="password" required minlength="8" maxlength="64"><button type="button" id="toggle-password">Exibir</button><button type="button" id="generate-password">Gerar</button></span></label></div>
          <div class="registration-actions"><button type="submit" id="register-site">Cadastrar organização</button></div>
        </section>
      </fieldset><p id="registration-feedback" class="error"></p>
    </form>

    <section id="payment-api" class="api-integration">
      <div class="integration-heading"><div><span>INTEGRAÇÃO FINANCEIRA</span><h2>API de Pagamentos GateGuard</h2></div><span id="integration-badge" class="badge">Selecione uma organização</span></div>
      <p>A credencial autoriza somente operações de pagamento da organização. Ela não autentica compradores, usuários finais ou funcionários do site.</p>
      <label>Organização<select id="integration-site"><option value="">Carregando...</option></select></label>
      <div id="integration-details" hidden>
        <div class="integration-endpoint"><small>Criar cobrança</small><code>POST ${esc(API_URL)}/api/payment-api/charges</code></div>
        <div class="integration-endpoint"><small>Consultar checkout</small><code>GET ${esc(API_URL)}/api/payment-api/charges/:id/checkout</code></div>
        <div id="integration-key-preview" class="integration-key-preview" hidden><small>Credencial ativa, final</small><code><span>gg_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</span><strong></strong></code></div>
        <div class="integration-actions"><button type="button" id="generate-key">Gerar credencial</button><button type="button" id="revoke-key" class="danger-button" hidden>Revogar credencial</button></div>
        <div id="integration-secret" hidden><strong>Copie agora. A chave completa será exibida somente uma vez.</strong><div><code id="generated-key"></code><button type="button" id="copy-key">Copiar</button></div><p id="secret-guidance"></p><pre id="integration-example"></pre></div>
        <p id="integration-feedback"></p>
      </div>
    </section>

    <section id="site-danger" class="system-danger">
      <h2>Excluir organização</h2><p>A exclusão remove o cadastro central e revoga o acesso ao painel e à API. Dados financeiros já registrados devem ser preservados conforme as obrigações legais e de auditoria.</p>
      <label>Senha administrativa*<input id="delete-password" type="password"></label><button type="button" id="authorize-deletion" class="danger-button">Validar senha</button>
      <label>Organização<select id="delete-site" disabled><option value="">Selecione</option></select></label>
      <div id="deletion-confirmations" hidden><label class="inline-check"><input id="confirm-irreversible" type="checkbox"> Confirmo a exclusão definitiva do cadastro e das credenciais.</label><label class="inline-check"><input id="confirm-backend" type="checkbox"> Confirmo a desativação dos dados do backend excepcional, quando aplicável.</label></div>
      <button type="button" id="delete-site-button" class="danger-button" disabled>Excluir organização</button><p id="deletion-feedback" class="error"></p>
    </section>
  </div>`, 'Organizações e Integrações');
  bindShell();

  const form = app.querySelector('#site-registration');
  const feedback = app.querySelector('#registration-feedback');
  bindDocumentValidation(form.cpfCnpj, { typeInputs: form.querySelectorAll('[name="documentType"]'), label: app.querySelector('#system-document-label'), corporateField: app.querySelector('#corporate-name-field') });
  bindDocumentValidation(form.administratorCpf);
  const modeHelp = () => {
    app.querySelector('#integration-mode-help').textContent = form.integrationMode.value === 'GATEGUARD_HOSTED'
      ? 'Uso excepcional: o GateGuard hospeda a camada que guarda a credencial e chama a API. O escopo continua limitado a pagamentos.'
      : 'A credencial GateGuard ficará somente nas variáveis de ambiente do backend da organização.';
  };
  form.integrationMode.onchange = modeHelp;
  modeHelp();
  app.querySelector('#toggle-password').onclick = () => { form.temporaryPassword.type = form.temporaryPassword.type === 'password' ? 'text' : 'password'; };

  let sites = [];
  try {
    const [readiness, listed] = await Promise.all([api('/api/system-registration/readiness'), api('/api/sites')]);
    form.system.value = readiness.id;
    app.querySelector('#site-fields').disabled = false;
    sites = listed.sites.filter(site => site.id !== 'SIS_0000');
    const options = '<option value="">Selecione uma organização</option>' + sites.map(site => `<option value="${esc(site.id)}">${esc(site.id)} — ${esc(site.name)} — ${site.hostedBackend ? 'backend GateGuard' : 'backend próprio'}</option>`).join('');
    app.querySelector('#integration-site').innerHTML = options;
    app.querySelector('#delete-site').innerHTML = options;
  } catch (error) { feedback.textContent = error.message; }

  app.querySelector('#generate-password').onclick = async () => {
    try { form.temporaryPassword.value = (await api('/api/system-registration/password')).password; } catch (error) { feedback.textContent = error.message; }
  };
  form.onsubmit = async event => {
    event.preventDefault();
    feedback.textContent = 'Cadastrando organização e acesso administrativo...';
    const button = app.querySelector('#register-site');
    button.disabled = true;
    const body = Object.fromEntries(new FormData(form));
    body.whatsapp = form.whatsapp.checked;
    try {
      const result = await api('/api/system-registration', { method: 'POST', body: JSON.stringify(body) });
      feedback.className = 'notice';
      feedback.innerHTML = `<strong>Organização ${esc(result.system)} cadastrada.</strong><p>Modelo: ${result.hostedBackend ? 'backend excepcional GateGuard' : 'backend próprio'}.</p><p>Usuário do painel: <code>gestor</code>. ${result.emailSent ? 'Credenciais enviadas por e-mail.' : 'Entregue a senha temporária por canal seguro.'}</p>`;
    } catch (error) { feedback.className = 'error'; feedback.textContent = error.message; }
    finally { button.disabled = false; }
  };

  const siteSelect = app.querySelector('#integration-site');
  const details = app.querySelector('#integration-details');
  const badge = app.querySelector('#integration-badge');
  const integrationFeedback = app.querySelector('#integration-feedback');
  const preview = app.querySelector('#integration-key-preview');
  const secret = app.querySelector('#integration-secret');
  const generate = app.querySelector('#generate-key');
  const revoke = app.querySelector('#revoke-key');
  const selectedSite = () => sites.find(site => site.id === siteSelect.value);
  const loadIntegration = async () => {
    details.hidden = !siteSelect.value; secret.hidden = true; integrationFeedback.textContent = '';
    if (!siteSelect.value) { badge.textContent = 'Selecione uma organização'; return; }
    try {
      const data = await api(`/api/systems/${encodeURIComponent(siteSelect.value)}/integration`);
      badge.textContent = data.enabled ? 'API ativa' : 'API inativa';
      generate.textContent = data.enabled ? 'Rotacionar credencial' : 'Gerar credencial';
      revoke.hidden = !data.enabled;
      preview.hidden = !(data.enabled && data.keySuffix);
      preview.querySelector('strong').textContent = data.keySuffix || '';
    } catch (error) { badge.textContent = 'Falha na consulta'; integrationFeedback.textContent = error.message; }
  };
  siteSelect.onchange = loadIntegration;
  generate.onclick = async () => {
    generate.disabled = true;
    try {
      const data = await api(`/api/systems/${encodeURIComponent(siteSelect.value)}/integration/key`, { method: 'POST' });
      const hosted = selectedSite()?.hostedBackend;
      app.querySelector('#generated-key').textContent = data.apiKey;
      app.querySelector('#secret-guidance').textContent = hosted ? 'Backend excepcional: a equipe GateGuard deve guardar esta chave no ambiente hospedado. Nunca a entregue ao frontend da organização.' : 'Backend próprio: a organização deve guardar esta chave exclusivamente como segredo no servidor.';
      app.querySelector('#integration-example').textContent = `GATEGUARD_SYSTEM_ID=${data.system}\nGATEGUARD_API_KEY=${data.apiKey}\nGATEGUARD_API_URL=${API_URL}`;
      secret.hidden = false;
      await loadIntegration(); secret.hidden = false;
    } catch (error) { integrationFeedback.textContent = error.message; }
    finally { generate.disabled = false; }
  };
  app.querySelector('#copy-key').onclick = async () => { await navigator.clipboard.writeText(app.querySelector('#generated-key').textContent); app.querySelector('#copy-key').textContent = 'Copiada'; };
  revoke.onclick = async () => {
    if (!confirm('Revogar imediatamente a credencial da API de pagamentos?')) return;
    try { await api(`/api/systems/${encodeURIComponent(siteSelect.value)}/integration/key`, { method: 'DELETE' }); await loadIntegration(); }
    catch (error) { integrationFeedback.textContent = error.message; }
  };

  const deletePassword = app.querySelector('#delete-password');
  const deleteSelect = app.querySelector('#delete-site');
  const deleteButton = app.querySelector('#delete-site-button');
  const confirmations = app.querySelector('#deletion-confirmations');
  const updateDelete = () => { deleteButton.disabled = !deleteSelect.value || !app.querySelector('#confirm-irreversible').checked || !app.querySelector('#confirm-backend').checked; };
  app.querySelector('#authorize-deletion').onclick = async () => {
    try { await api('/api/system-deletion/verify', { method: 'POST', body: JSON.stringify({ password: deletePassword.value }) }); deleteSelect.disabled = false; confirmations.hidden = false; }
    catch (error) { app.querySelector('#deletion-feedback').textContent = error.message; }
  };
  deleteSelect.onchange = updateDelete;
  app.querySelector('#confirm-irreversible').onchange = updateDelete;
  app.querySelector('#confirm-backend').onchange = updateDelete;
  deleteButton.onclick = async () => {
    const system = deleteSelect.value;
    if (!confirm(`Excluir definitivamente ${system}?`)) return;
    try {
      await api(`/api/systems/${encodeURIComponent(system)}`, { method: 'DELETE', body: JSON.stringify({ password: deletePassword.value, confirmSystem: system, confirmIrreversible: true, confirmBackendData: true }) });
      app.querySelector('#deletion-feedback').textContent = `${system} removida.`;
      deleteSelect.querySelector(`option[value="${system}"]`)?.remove();
      siteSelect.querySelector(`option[value="${system}"]`)?.remove();
    } catch (error) { app.querySelector('#deletion-feedback').textContent = error.message; }
  };
}
