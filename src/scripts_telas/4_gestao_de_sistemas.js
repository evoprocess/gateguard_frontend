import { api, state, shell, bindShell, API_URL, SYSTEM_EMAIL, SYSTEM_URL } from '../main.js';
import '../systems.css';
import '../integration-key-preview.css';
import { bindDocumentValidation } from '../document-validation.js';
import publicDirectory from '../sistemas_publicos.json';

const publicSystemNames = new Map(
  publicDirectory.floors.flatMap(floor => floor.systems.map(system => [system.id, system.name]))
);

const esc = value => {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
};

export async function systemsScreen(app) {
  if (state.session.system.id !== 'SIS_0000' || state.session.user.perfil !== 'admin') return;
  app.innerHTML = shell(`<div class="panel"><div id="registration-status">Verificando configuração...</div><form id="system-registration" class="system-form" hidden>
    <fieldset id="system-fields" disabled>
      <h2 class="form-section-title">Dados do sistema</h2><section class="form-section">
      <div class="system-left-column"><div class="system-fields"><input name="systemEmail" type="hidden" value="${esc(SYSTEM_EMAIL)}"><input name="systemUrl" type="hidden" value="${esc(SYSTEM_URL)}"><label>ID do Sistema<input name="system" readonly></label></div>
      <div class="system-main-fields"><label>Nome do Sistema*<input name="name" required maxlength="120" autocapitalize="characters"></label>
        <div class="phone-field"><label>Telefone*<input name="phone" required inputmode="numeric" maxlength="14" placeholder="(00)00000-0000" title="Informe DDD e telefone com 8 ou 9 dígitos"></label><label class="inline-check"><input type="checkbox" name="whatsapp"> Whatsapp</label></div>
      </div></div><div class="document-group">
        <div class="document-type-field"><span>Tipo de documento*</span><div class="document-type-selector" role="radiogroup" aria-label="Tipo de documento"><label><input type="radio" name="documentType" value="CPF" required><span>CPF</span></label><label><input type="radio" name="documentType" value="CNPJ" required checked><span>CNPJ</span></label></div></div>
        <label><span id="system-document-label">CNPJ*</span><input name="cpfCnpj" required inputmode="numeric"></label>
        <label id="corporate-name-field">Razão social*<input name="corporateName" maxlength="160" required></label>
      </div></section>
      <h2 class="form-section-title">Dados do administrador</h2><section class="form-section">
      <label>Nome do Administrador*<input name="administratorName" required maxlength="120" autocapitalize="characters"></label><label>CPF*<input name="administratorCpf" required inputmode="numeric" maxlength="14" placeholder="000.000.000-00"></label>
      <label>Cargo*<input name="administratorRole" required maxlength="100" autocapitalize="characters"></label><label>E-mail administrativo*<input name="adminEmail" type="email" required></label>
      <details><summary>Outros destinatários de e-mail (opcional)</summary>
        <label>E-mail de acessos (opcional)<input name="accessEmail" type="email"></label><label>E-mail financeiro (opcional)<input name="financialEmail" type="email"></label><label>E-mail de comunicados (opcional)<input name="communicationsEmail" type="email"></label>
      </details>
      <div class="credential-fields"><label>Login<input value="gestor" readonly></label><label>Senha*<span class="registration-password-control"><input name="temporaryPassword" type="password" required minlength="8" maxlength="64" pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,64}" autocomplete="new-password" title="Use de 8 a 64 caracteres, com pelo menos uma letra e um número"><button type="button" id="toggle-registration-password" aria-label="Exibir senha" title="Exibir senha" aria-pressed="false"><span aria-hidden="true">&#128065;</span></button><button type="button" id="generate-password" aria-label="Gerar nova senha" title="Gerar nova senha"><span aria-hidden="true">&#8635;</span></button></span></label></div>
      <div class="registration-actions"><button type="submit" id="register-system-button" disabled title="Preencha corretamente todos os campos obrigatórios">Cadastrar Sistema</button></div></section>
    </fieldset><p id="registration-feedback" class="error"></p>
  </form>
  <section class="form-section developer-internal-manual">
    <details>
      <summary><strong>Orientações rápidas do cadastro de sistemas · SIS_0000</strong></summary>
      <p>Este resumo operacional é exclusivo da <code>SIS_0000</code>. Os documentos normativos, versões e registros de mudanças ficam no menu <strong>Manuais do Sistema</strong>.</p>
      <ol>
        <li>O sistema calcula o próximo identificador no formato <code>SIS_XXXX</code>, preservando uma numeração exclusiva de quatro algarismos.</li>
        <li>O Firebase do sistema deve estar configurado no Render do backend Gate Guard, serviço <code>Logins_Back</code>, pela variável <code>DADOS_FIREBASE_SIS_XXXX</code>.</li>
        <li>Depois do redeploy, volte a esta tela, preencha o formulário e clique em <strong>Cadastrar Sistema</strong>. A criação ainda não está concluída apenas com a configuração do projeto Firebase.</li>
        <li>O mesmo usuário <code>sis_XXXX-gestor@gateguard.com.br</code> e a mesma senha do login geral devem existir no Firebase Authentication central e no Firebase Authentication do sistema.</li>
        <li>No Firestore do sistema, crie a coleção <code>logins</code> e o documento <code>gestor</code>, contendo obrigatoriamente os campos string <code>cargo</code> e <code>nome</code>. Exemplo: <code>cargo: "Gerente Operacional"</code> e <code>nome: "Caique Jorge Neymário"</code>.</li>
        <li>O backend cria esses acessos durante o cadastro, grava o administrador no Firestore do sistema e cria obrigatoriamente o documento <code>logins_geral/SIS_XXXX</code> no Firestore central. Se a configuração for feita manualmente, mantenha exatamente a mesma estrutura. Esse documento libera login, pagamentos, acessos e integrações do sistema.</li>
        <li>Em seguida, o backend atualiza automaticamente <code>src/sistemas_publicos.json</code> no repositório <code>evoprocess/gateguard_frontend</code>, preenchendo ID, nome, status ativo, sala e URL pública. O commit inicia a publicação normal do frontend.</li>
        <li>Para essa automação, <code>Logins_Back</code> precisa da variável secreta <code>GITHUB_FRONTEND_TOKEN</code>, com permissão de escrita apenas no repositório do frontend. Repositório, branch e caminho ficam nas variáveis <code>GITHUB_FRONTEND_REPOSITORY</code>, <code>GITHUB_FRONTEND_BRANCH</code> e <code>GITHUB_PUBLIC_SYSTEMS_PATH</code>.</li>
        <li>Por fim, o sistema envia o convite de acesso. O cadastro somente é apresentado como concluído depois que todas essas etapas terminam.</li>
      </ol>
      <p><strong>Diagnóstico:</strong> se o fluxo parar em “Publicando o sistema no JSON público”, verifique o token do GitHub, a permissão de escrita, a branch configurada e se o workflow de publicação do frontend foi executado.</p>
    </details>
  </section>
  <section id="api-integration" class="api-integration" hidden>
    <div class="integration-heading"><div><span>INTEGRAÇÃO EXTERNA</span><h2>API GateGuard</h2></div><span id="integration-badge" class="badge">Selecione um sistema</span></div>
    <p>Conecte sistemas externos ao controle terceirizado de login, pagamentos e bloqueios do GateGuard.</p>
    <label>Sistema<select id="integration-system"><option value="">Carregando sistemas...</option></select></label>
    <div id="integration-details" hidden>
      <div class="integration-endpoint"><small>Endpoint de autenticação</small><code>POST ${esc(API_URL)}/api/integrations/authenticate</code></div>
      <div id="integration-key-preview" class="integration-key-preview" hidden><small>Chave cadastrada</small><code><span>gg_live_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX</span><strong></strong></code><small>Compare os quatro últimos caracteres com a credencial configurada no backend do lojista.</small></div>
      <div class="integration-actions"><button type="button" id="generate-integration-key">Gerar chave</button><button type="button" id="revoke-integration-key" class="danger-button" hidden>Revogar integração</button></div>
      <div id="integration-secret" hidden>
        <strong>Copie a chave agora. Ela será exibida somente uma vez.</strong>
        <div><code id="integration-generated-key"></code><button type="button" id="copy-integration-key">Copiar chave</button></div>
        <p><strong>Configuração no sistema novo:</strong> no Render, abra o serviço de <strong>backend do projeto integrado</strong>, acesse <strong>Environment</strong> e adicione obrigatoriamente as duas variáveis abaixo. Não inclua <code>API_GATEGUARD=</code> no valor e não coloque esse segredo no frontend nem no backend do GateGuard.</p>
        <div><code>Key: API_GATEGUARD</code><button type="button" id="copy-integration-variable-name">Copiar nome</button></div>
        <div><code id="integration-render-variable-value"></code><button type="button" id="copy-integration-variable-value">Copiar valor</button></div>
        <div><code>Key: GATEGUARD_API_URL</code></div>
        <div><code>Value: https://logins-back.onrender.com</code></div>
        <p><strong>Sessão:</strong> consulte <code>SESSION_SECRET</code> no Render do backend GateGuard <code>Logins_Back</code>. Se ela ainda não existir, crie-a somente uma vez no <code>Logins_Back</code> com uma chave aleatória de pelo menos 32 caracteres. Configure também <code>SESSION_SECRET</code> no Render do backend do sistema usando esse valor existente.</p>
        <div><code>Key: SESSION_SECRET</code></div>
        <div><code>PowerShell: $secretRng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider; $secretBytes = New-Object byte[] 32; $secretRng.GetBytes($secretBytes); ($secretBytes | ForEach-Object { $_.ToString("x2") }) -join ""; $secretRng.Dispose()</code></div>
      </div>
      <p id="integration-feedback"></p>
    </div>
  </section>
  <section id="system-danger" class="system-danger" hidden>
    <h2>Excluir sistema</h2>
    <p><strong>Atenção:</strong> esta ação é irreversível. O cadastro, os acessos e o projeto Firebase do sistema serão removidos.</p>
    <div class="deletion-password-row">
      <label>Senha administrativa de exclusão*<input id="delete-password" type="password" autocomplete="current-password" required><span class="show-password"><input id="show-delete-password" type="checkbox"> Exibir senha</span></label>
      <button type="button" id="authorize-deletion" class="danger-button" disabled>Validar senha</button>
    </div>
    <label>Sistema a excluir*<select id="delete-system" required disabled><option value="">Carregando sistemas...</option></select></label>
    <div id="deletion-confirmations" hidden>
      <p class="error"><strong>Confirmação necessária:</strong> não será possível desfazer esta operação.</p>
      <label class="inline-check"><input id="confirm-irreversible" type="checkbox"> Confirmo a exclusão definitiva de todos os dados e acessos desta sistema.</label>
      <label class="inline-check"><input id="confirm-firebase" type="checkbox"> Confirmo que o projeto Firebase desta sistema também será excluído.</label>
    </div>
    <button type="button" id="delete-system-button" class="danger-button" disabled>Excluir Sistema Selecionada</button>
    <p id="deletion-feedback" class="error"></p>
  </section></div>`, 'Gestão de Sistemas');
  bindShell();

  try {
    const [readiness, systemData] = await Promise.all([api('/api/system-registration/readiness'), api('/api/access/systems')]);
    const form = app.querySelector('#system-registration');
    form.hidden = false; form.system.value = readiness.id;
    app.querySelector('#registration-status').innerHTML = readiness.configured
      ? `<div class="notice"><strong>Firebase manual da ${esc(readiness.id)} detectado (${esc(readiness.firebase?.projectId || '')}).</strong><p>Finalize o formulário abaixo. Ao clicar em <strong>Cadastrar Sistema</strong>, o sistema criará obrigatoriamente <code>${esc(readiness.centralDocumentPath || `logins_geral/${readiness.id}`)}</code> no Firebase central. Sem esse documento, login e integrações retornarão “Sistema não encontrada”.</p></div>`
      : `<div class="notice"><strong>Configuração manual necessária para ${esc(readiness.id)}</strong>
          <ol><li>Crie o projeto no Firebase e um aplicativo Web.</li><li>Ative Authentication por e-mail/senha e crie o Firestore.</li><li>Publique as regras abaixo no Firestore.</li><li>Adicione no Render a variável <code>${esc(readiness.envName)}</code> com o JSON do Firebase e faça o redeploy.</li><li>Volte a esta tela e conclua o formulário. Somente essa etapa cria <code>${esc(readiness.centralDocumentPath || `logins_geral/${readiness.id}`)}</code> no Firebase central; não considere o sistema criada antes da mensagem final de sucesso.</li></ol>
          <details><summary>Exibir regras do Firestore</summary><pre id="manual-firestore-rules">${esc(readiness.firestoreRules || '')}</pre><button type="button" id="copy-firestore-rules">Copiar regras</button></details>
        </div>`;
    const copyRules = app.querySelector('#copy-firestore-rules');
    if (copyRules) copyRules.onclick = async () => {
      await navigator.clipboard.writeText(readiness.firestoreRules || '');
      copyRules.textContent = 'Regras copiadas';
    };
    const ready = readiness.configured;
    app.querySelector('#system-fields').disabled = !ready;
    const passwordInput = form.temporaryPassword;
    const passwordToggle = app.querySelector('#toggle-registration-password');
    passwordToggle.onclick = () => {
      const showing = passwordInput.type === 'text';
      passwordInput.type = showing ? 'password' : 'text';
      passwordToggle.setAttribute('aria-pressed', String(!showing));
      passwordToggle.setAttribute('aria-label', showing ? 'Exibir senha' : 'Ocultar senha');
      passwordToggle.title = showing ? 'Exibir senha' : 'Ocultar senha';
      passwordInput.focus();
    };
    app.querySelector('#generate-password').onclick = async () => { passwordInput.value = (await api('/api/system-registration/password')).password; passwordInput.dispatchEvent(new Event('input', { bubbles: true })); passwordInput.focus(); };
    const deleteSelect = app.querySelector('#delete-system');
    const removable = systemData.systems.filter(item => item.id !== 'SIS_0000');
    const integratedSystems = removable.filter(item => item.sistema_implantado === true);
    const integrationSection = app.querySelector('#api-integration');
    const integrationSelect = app.querySelector('#integration-system');
    const integrationDetails = app.querySelector('#integration-details');
    const integrationBadge = app.querySelector('#integration-badge');
    const integrationFeedback = app.querySelector('#integration-feedback');
    const integrationSecret = app.querySelector('#integration-secret');
    const integrationKeyPreview = app.querySelector('#integration-key-preview');
    const generateKey = app.querySelector('#generate-integration-key');
    const revokeKey = app.querySelector('#revoke-integration-key');
    integrationSelect.innerHTML = '<option value="">Selecione um sistema</option>' + integratedSystems.map(item => `<option value="${esc(item.id)}">${esc(item.id)} — ${esc(publicSystemNames.get(item.id) || item.name || item.id)}</option>`).join('');
    integrationSection.hidden = false;
    const loadIntegration = async () => {
      const system = integrationSelect.value;
      integrationDetails.hidden = !system;
      integrationSecret.hidden = true;
      integrationFeedback.textContent = '';
      if (!system) { integrationBadge.textContent = 'Selecione um sistema'; return; }
      integrationBadge.textContent = 'Consultando...';
      try {
        const data = await api(`/api/systems/${encodeURIComponent(system)}/integration`);
        integrationBadge.textContent = data.enabled ? 'Integração ativa' : 'Integração inativa';
        integrationBadge.classList.toggle('is-inactive', !data.enabled);
        generateKey.textContent = data.enabled ? 'Rotacionar chave' : 'Gerar chave';
        revokeKey.hidden = !data.enabled;
        integrationKeyPreview.hidden = !(data.enabled && data.keySuffix);
        integrationKeyPreview.querySelector('strong').textContent = data.keySuffix || '';
      } catch (error) {
        integrationKeyPreview.hidden = true;
        integrationBadge.textContent = 'Falha na consulta';
        integrationFeedback.textContent = error.message;
        integrationFeedback.className = 'error';
      }
    };
    integrationSelect.onchange = loadIntegration;
    generateKey.onclick = async () => {
      generateKey.disabled = true;
      integrationFeedback.textContent = 'Gerando credencial segura...';
      try {
        const data = await api(`/api/systems/${encodeURIComponent(integrationSelect.value)}/integration/key`, { method: 'POST' });
        const renderVariableValue = JSON.stringify({ id_sis: data.system, KEYGG: data.apiKey });
        app.querySelector('#integration-generated-key').textContent = data.apiKey;
        app.querySelector('#integration-render-variable-value').textContent = `Value: ${renderVariableValue}`;
        app.querySelector('#integration-render-variable-value').dataset.copyValue = renderVariableValue;
        integrationFeedback.textContent = 'Chave criada. Adicione API_GATEGUARD e GATEGUARD_API_URL nas variáveis de ambiente do backend do novo sistema no Render.';
        integrationFeedback.className = 'notice';
        await loadIntegration();
        integrationSecret.hidden = false;
      } catch (error) {
        integrationFeedback.textContent = error.message;
        integrationFeedback.className = 'error';
      } finally { generateKey.disabled = false; }
    };
    app.querySelector('#copy-integration-key').onclick = async () => {
      await navigator.clipboard.writeText(app.querySelector('#integration-generated-key').textContent);
      app.querySelector('#copy-integration-key').textContent = 'Chave copiada';
    };
    app.querySelector('#copy-integration-variable-name').onclick = async () => {
      await navigator.clipboard.writeText('API_GATEGUARD');
      app.querySelector('#copy-integration-variable-name').textContent = 'Nome copiado';
    };
    app.querySelector('#copy-integration-variable-value').onclick = async () => {
      const value = app.querySelector('#integration-render-variable-value').dataset.copyValue || '';
      await navigator.clipboard.writeText(value);
      app.querySelector('#copy-integration-variable-value').textContent = 'Valor copiado';
    };
    revokeKey.onclick = async () => {
      if (!confirm('Revogar a integração desta sistema? O sistema externo perderá o acesso imediatamente.')) return;
      try {
        await api(`/api/systems/${encodeURIComponent(integrationSelect.value)}/integration/key`, { method: 'DELETE' });
        integrationFeedback.textContent = 'Integração revogada.';
        integrationFeedback.className = 'notice';
        await loadIntegration();
      } catch (error) {
        integrationFeedback.textContent = error.message;
        integrationFeedback.className = 'error';
      }
    };
    deleteSelect.innerHTML = '<option value="">Selecione um sistema</option>' + removable.map(item => `<option value="${esc(item.id)}">${esc(item.id)} — ${esc(item.name)}</option>`).join('');
    app.querySelector('#system-danger').hidden = false;
    const deletePassword = app.querySelector('#delete-password');
    app.querySelector('#show-delete-password').onchange = event => { deletePassword.type = event.target.checked ? 'text' : 'password'; };
    const authorizeDeletion = app.querySelector('#authorize-deletion');
    const confirmations = app.querySelector('#deletion-confirmations');
    const irreversible = app.querySelector('#confirm-irreversible');
    const firebase = app.querySelector('#confirm-firebase');
    const deleteButton = app.querySelector('#delete-system-button');
    const deletionFeedback = app.querySelector('#deletion-feedback');
    const lockDeletion = () => { confirmations.hidden = true; irreversible.checked = false; firebase.checked = false; deleteButton.disabled = true; };
    deleteSelect.onchange = () => {
      lockDeletion();
      confirmations.hidden = !deleteSelect.value;
      deletionFeedback.textContent = deleteSelect.value ? 'Leia e marque as duas confirmações para liberar a exclusão.' : '';
      deletionFeedback.className = '';
    };
    deletePassword.oninput = () => {
      lockDeletion();
      deleteSelect.value = '';
      deleteSelect.disabled = true;
      authorizeDeletion.disabled = !deletePassword.value;
    };
    authorizeDeletion.onclick = async () => {
      if (!deletePassword.value) { deletionFeedback.textContent = 'Informe a senha administrativa.'; deletionFeedback.className = 'error'; return; }
      deletionFeedback.textContent = 'Validando senha...';
      try {
        await api('/api/system-deletion/verify', { method: 'POST', body: JSON.stringify({ password: deletePassword.value }) });
        deletePassword.disabled = true;
        authorizeDeletion.disabled = true;
        deleteSelect.disabled = false;
        deletionFeedback.textContent = 'Senha validada. Agora selecione o sistema que deseja excluir.';
        deletionFeedback.className = 'notice';
      } catch (error) { lockDeletion(); deleteSelect.disabled = true; deletePassword.disabled = false; authorizeDeletion.disabled = !deletePassword.value; deletionFeedback.textContent = /senha.*incorreta/i.test(error.message) ? 'Senha incorreta.' : error.message; deletionFeedback.className = 'error'; }
    };
    const synchronizeDeletion = () => { deleteButton.disabled = !(irreversible.checked && firebase.checked); };
    irreversible.onchange = synchronizeDeletion;
    firebase.onchange = synchronizeDeletion;
    deleteButton.onclick = async () => {
      const system = deleteSelect.value;
      deleteButton.disabled = true;
      deletionFeedback.textContent = `Excluindo ${system} e seu projeto Firebase. Não feche esta página...`; deletionFeedback.className = '';
      try {
        const result = await api(`/api/systems/${encodeURIComponent(system)}`, { method: 'DELETE', body: JSON.stringify({ password: deletePassword.value, confirmSystem: system, confirmIrreversible: irreversible.checked, confirmFirebase: firebase.checked }) });
        deletionFeedback.textContent = `${result.system} e o projeto Firebase ${result.projectId} foram excluídos.`; deletionFeedback.className = 'notice';
        deleteSelect.querySelector(`option[value="${CSS.escape(system)}"]`)?.remove();
        deleteSelect.value = ''; deleteSelect.disabled = true; deletePassword.value = ''; deletePassword.disabled = false; authorizeDeletion.disabled = true; lockDeletion();
      } catch (error) { deletionFeedback.textContent = error.message; deletionFeedback.className = 'error'; synchronizeDeletion(); }
    };
    const synchronizeDocumentType = () => {
      const isCnpj = form.documentType.value === 'CNPJ';
      app.querySelector('#system-document-label').textContent = `${isCnpj ? 'CNPJ' : 'CPF'}*`;
      form.cpfCnpj.placeholder = isCnpj ? '00.000.000/0000-00' : '000.000.000-00';
      form.cpfCnpj.maxLength = isCnpj ? 18 : 14;
      form.cpfCnpj.value = formatDocument(form.cpfCnpj.value, isCnpj ? 'CNPJ' : 'CPF');
      form.corporateName.required = isCnpj;
      form.corporateName.disabled = !isCnpj;
      app.querySelector('#corporate-name-field').classList.toggle('is-invisible', !isCnpj);
      if (!isCnpj) form.corporateName.value = '';
      validateSystemDocument();
    };
    const uppercaseFields = [form.name, form.administratorName, form.administratorRole];
    uppercaseFields.forEach(input => { input.oninput = () => { input.value = input.value.toLocaleUpperCase('pt-BR'); }; });
    const formatCpf = value => {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
      return digits
        .replace(/^(\d{3})(\d)/, '$1.$2')
        .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4');
    };
    const formatCnpj = value => {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 14);
      return digits
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4')
        .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
    };
    const formatPhone = value => {
      const digits = String(value || '').replace(/\D/g, '').slice(0, 11);
      if (!digits) return '';
      if (digits.length <= 2) return `(${digits}`;
      const ddd = digits.slice(0, 2);
      const number = digits.slice(2);
      if (number.length <= 4) return `(${ddd})${number}`;
      const split = number.length <= 8 ? 4 : 5;
      return `(${ddd})${number.slice(0, split)}-${number.slice(split)}`;
    };
    function formatDocument(value, type) { return type === 'CNPJ' ? formatCnpj(value) : formatCpf(value); }
    const validatePhone = () => {
      const valid = /^\d{10,11}$/.test(form.phone.value.replace(/\D/g, ''));
      form.phone.setCustomValidity(valid ? '' : 'Telefone inválido. Informe DDD e telefone com 8 ou 9 dígitos.');
      return valid;
    };
    form.phone.addEventListener('input', () => {
      form.phone.value = formatPhone(form.phone.value);
      validatePhone();
    });
    form.cpfCnpj.addEventListener('input', () => {
      form.cpfCnpj.value = formatDocument(form.cpfCnpj.value, form.documentType.value);
    });
    form.administratorCpf.addEventListener('input', () => {
      form.administratorCpf.value = formatCpf(form.administratorCpf.value);
    });
    const validateSystemDocument = bindDocumentValidation(form.cpfCnpj, () => form.documentType.value);
    const validateAdministratorCpf = bindDocumentValidation(form.administratorCpf, () => 'CPF');
    const registrationSubmit = app.querySelector('#register-system-button');
    const synchronizeRegistration = () => {
      validateSystemDocument();
      validateAdministratorCpf();
      validatePhone();
      registrationSubmit.disabled = !form.checkValidity();
      registrationSubmit.title = registrationSubmit.disabled
        ? 'Preencha corretamente todos os campos obrigatórios'
        : 'Cadastrar sistema e enviar os dados de acesso';
    };
    form.addEventListener('input', synchronizeRegistration);
    form.addEventListener('change', synchronizeRegistration);
    form.addEventListener('focusout', synchronizeRegistration);
    form.querySelectorAll('input[name="documentType"]').forEach(input => { input.onchange = synchronizeDocumentType; });
    synchronizeDocumentType();
    synchronizeRegistration();
    form.onsubmit = async event => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      values.whatsapp = form.whatsapp.checked;
      const feedback = app.querySelector('#registration-feedback');
      const submit = registrationSubmit;
      submit.disabled = true;
      feedback.textContent = 'Iniciando o cadastro...'; feedback.className = 'registration-progress';
      const renderProgress = status => {
        const stages = (status.history || []).filter(item => item.id);
        const icon = value => value === 'completed' ? '&#10003;' : value === 'processing' ? '&#8635;' : '&#8226;';
        feedback.innerHTML = `<strong>Implantação do sistema</strong><ol class="registration-timeline">${stages.map(item => `<li class="is-${esc(item.status || 'info')}"><span>${icon(item.status)}</span><span>${esc(item.message)}</span></li>`).join('')}</ol>${status.state === 'failed' ? `<p class="error">${esc(status.error || 'Não foi possível concluir o cadastro.')}</p><button type="button" id="resume-registration">Continuar da etapa pendente</button>` : '<small>As etapas concluídas são preservadas. Não feche esta página enquanto o processo estiver em andamento.</small>'}`;
      };
      const monitorJob = async jobId => {
        let status;
        do {
          await new Promise(resolve => setTimeout(resolve, 1200));
          status = await api(`/api/system-registration/jobs/${encodeURIComponent(jobId)}`);
          renderProgress(status);
        } while (status.state === 'processing');
        return status;
      };
      try {
        const { jobId } = await api('/api/system-registration/jobs', { method: 'POST', body: JSON.stringify(values) });
        let status = await monitorJob(jobId);
        while (status.state === 'failed') {
          const resume = feedback.querySelector('#resume-registration');
          if (!resume) break;
          await new Promise(resolve => { resume.onclick = resolve; });
          resume.disabled = true;
          await api(`/api/system-registration/jobs/${encodeURIComponent(jobId)}/resume`, { method: 'POST' });
          status = await monitorJob(jobId);
        }
        if (status.state === 'failed') throw new Error(status.error || 'Não foi possível concluir o cadastro.');
        const result = status.result;
        const credentials = result.credentials || { system: result.system, login: result.login, password: values.temporaryPassword, url: values.systemUrl };
        renderProgress(status);
        feedback.insertAdjacentHTML('beforeend', `<section class="registration-result"><h3>Cadastro criado com sucesso</h3>${result.emailSent ? `<p class="notice">Os dados de acesso foram enviados para ${esc(result.recipients.join(', '))}.</p>` : `<p class="registration-email-warning"><strong>O e-mail não foi enviado.</strong> Informe os dados abaixo manualmente ao gestor do novo sistema.</p>`}<dl><div><dt>Sistema</dt><dd><code>${esc(credentials.system)}</code></dd></div><div><dt>Login</dt><dd><code>${esc(credentials.login)}</code></dd></div><div><dt>Senha</dt><dd><code>${esc(credentials.password)}</code></dd></div><div><dt>Link</dt><dd><code>${esc(credentials.url)}</code></dd></div></dl><button type="button" id="copy-registration-access">Copiar dados de acesso</button></section>`);
        feedback.querySelector('#copy-registration-access').onclick = async event => {
          const button = event.currentTarget;
          await navigator.clipboard.writeText(`Sistema: ${credentials.system}\nLogin: ${credentials.login}\nSenha: ${credentials.password}\nLink: ${credentials.url}`);
          button.textContent = 'Dados copiados';
        };
        if (!integrationSelect.querySelector(`option[value="${CSS.escape(result.system)}"]`)) {
          integrationSelect.insertAdjacentHTML('beforeend', `<option value="${esc(result.system)}">${esc(result.system)} — ${esc(values.name || result.system)}</option>`);
        }
        integrationSection.hidden = false;
        form.querySelector('fieldset').disabled = true;
      } catch (error) { feedback.textContent = error.message; feedback.className = 'error'; synchronizeRegistration(); }
    };
  } catch (error) { app.querySelector('#registration-status').innerHTML = `<p class="error">${esc(error.message)}</p>`; }
}
