import { api, state, shell, bindShell } from '../main.js';
import '../payments.css';
import { bindDocumentValidation } from '../document-validation.js';

const esc = value => {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
};
const money = value => Number(value || 0).toFixed(2).replace('.', ',');
const payable = new Set(['PENDING', 'OVERDUE', 'DUNNING_REQUESTED', 'AWAITING_RISK_ANALYSIS']);
const requestedSandboxConfirmations = new Set();

function paymentRow(payment, showSite = false) {
  return `<div class="user"><strong>${esc(payment.description || payment.chargeReference || payment.id)}</strong>${showSite ? `<span>${esc(payment.system)}</span>` : ''}<span>Ref.: ${esc(payment.chargeReference || payment.id || '—')}</span><span>Vencimento: ${esc(payment.dueDate || '—')}</span><span>R$ ${money(payment.value)}</span><span class="badge">${esc(payment.status)}</span></div>`;
}

function testPaymentRow(payment, canSimulate) {
  const awaitingWebhook = requestedSandboxConfirmations.has(payment.id) && ['PENDING', 'OVERDUE'].includes(payment.status);
  const canConfirm = canSimulate && !awaitingWebhook && payment.billingType === 'PIX' && ['PENDING', 'OVERDUE'].includes(payment.status);
  return `<article class="payment-test-row"><div><strong>${esc(payment.description || payment.chargeReference || payment.id)}</strong><p>Ref.: ${esc(payment.chargeReference || payment.id)} · R$ ${money(payment.value)} · ${esc(payment.dueDate || 'Sem vencimento')}</p>${awaitingWebhook ? '<small>Simulação enviada; aguardando o webhook.</small>' : ''}</div><span class="badge">${esc(payment.status)}</span>${canConfirm ? `<button type="button" data-confirm-sandbox="${esc(payment.id)}">Simular recebimento no Sandbox</button>` : ''}</article>`;
}

function renderSubscriptionTestAccount(container, account) {
  const stateLabel = account.active ? 'LIBERADA' : 'BLOQUEADA';
  container.innerHTML = `<div class="subscription-test-account"><div><small>CONTA DESCARTÁVEL CONFIGURADA</small><strong>${esc(account.login)}</strong><span>Estado atual: <b>${stateLabel}</b>${account.validUntil ? ` · validade ${esc(new Date(account.validUntil).toLocaleString('pt-BR'))}` : ''}</span></div><div class="subscription-test-actions"><button type="button" data-subscription-test="block" ${account.canBlock ? '' : 'disabled'}>Bloquear conta de teste</button><button type="button" data-subscription-test="release" ${account.canRelease ? '' : 'disabled'}>Liberar conta de teste</button></div></div>`;
}

async function loadEvotvSubscriptionTest(app) {
  const container = app.querySelector('#evotv-subscription-test');
  const feedback = app.querySelector('#evotv-subscription-feedback');
  if (!container || !feedback) return;
  container.innerHTML = '<p>Consultando a conta descartável configurada no EVOTV...</p>';
  feedback.textContent = '';
  try {
    const result = await api('/api/payment-tests/evotv/subscription');
    renderSubscriptionTestAccount(container, result.account);
    container.querySelectorAll('[data-subscription-test]').forEach(button => {
      button.onclick = async () => {
        const action = button.dataset.subscriptionTest;
        const verb = action === 'block' ? 'bloquear' : 'liberar';
        if (!window.confirm(`Deseja ${verb} somente a conta descartável ${result.account.login}? A rotina global não será executada.`)) return;
        container.querySelectorAll('button').forEach(item => { item.disabled = true; });
        feedback.className = 'payment-test-feedback';
        feedback.textContent = `${action === 'block' ? 'Bloqueando' : 'Liberando'} a conta descartável...`;
        try {
          const updated = await api(`/api/payment-tests/evotv/subscription/${action}`, { method: 'POST', body: '{}' });
          await loadEvotvSubscriptionTest(app);
          feedback.textContent = `Conta ${updated.account.login} ${updated.account.active ? 'liberada' : 'bloqueada'}; operação registrada na auditoria do EVOTV.`;
        } catch (error) {
          await loadEvotvSubscriptionTest(app);
          feedback.className = 'payment-test-feedback error';
          feedback.textContent = error.message;
        }
      };
    });
  } catch (error) {
    container.innerHTML = `<p class="error">${esc(error.message)}</p>`;
  }
}

async function loadEvotvTestConsole(app) {
  const status = app.querySelector('#evotv-test-status');
  const list = app.querySelector('#evotv-test-payments');
  const feedback = app.querySelector('#evotv-test-feedback');
  const refresh = app.querySelector('#evotv-test-refresh');
  if (!status || !list || !refresh) return;
  refresh.disabled = true;
  loadEvotvSubscriptionTest(app);
  status.textContent = 'Verificando Asaas e integração EVOTV...';
  feedback.textContent = '';
  try {
    const [health, historyData] = await Promise.all([
      api('/api/payment-tests/evotv'),
      api('/api/payments/history?system=SIS_0002')
    ]);
    const sandboxReady = health.environment === 'sandbox' && health.asaasConnected && health.integrationEnabled;
    const labels = [
      `Asaas: ${health.environment === 'sandbox' ? 'Sandbox' : 'Produção'}`,
      `Conexão: ${health.asaasConnected ? 'ativa' : 'indisponível'}`,
      `API EVOTV: ${health.integrationEnabled ? 'ativa' : 'desativada'}`
    ];
    status.className = `payment-test-status ${sandboxReady ? 'is-ready' : 'is-warning'}`;
    status.textContent = labels.join(' · ');
    const payments = (historyData.payments || []).filter(payment =>
      payment.system === 'SIS_0002'
      && (payment.category === 'SITE_BUYER_PAYMENT' || String(payment.event || '').startsWith('SITE_PAYMENT'))
    ).slice(0, 30);
    list.innerHTML = payments.map(payment => testPaymentRow(payment, sandboxReady)).join('')
      || '<p>Nenhum pagamento de comprador do EVOTV aparece no histórico. Gere uma cobrança Pix pelo programa ou aplicativo e atualize esta lista.</p>';
    app.querySelectorAll('[data-confirm-sandbox]').forEach(button => {
      button.onclick = async () => {
        if (!window.confirm('Confirmar esta cobrança no Sandbox do Asaas? Nenhum valor real será movimentado.')) return;
        button.disabled = true;
        feedback.className = 'payment-test-feedback';
        feedback.textContent = 'Enviando a simulação ao Asaas...';
        try {
          const result = await api(`/api/payment-tests/evotv/payments/${encodeURIComponent(button.dataset.confirmSandbox)}/confirm`, { method: 'POST', body: '{}' });
          requestedSandboxConfirmations.add(button.dataset.confirmSandbox);
          feedback.textContent = `O Asaas Sandbox respondeu ${result.status || 'sem status'}. Aguarde o webhook e atualize a lista para conferir se o GateGuard registrou o recebimento.`;
          window.setTimeout(() => loadEvotvTestConsole(app), 1500);
        } catch (error) {
          feedback.className = 'payment-test-feedback error';
          feedback.textContent = error.message;
          button.disabled = false;
        }
      };
    });
  } catch (error) {
    status.className = 'payment-test-status is-warning';
    status.textContent = error.message;
    list.innerHTML = '<p>Não foi possível carregar os pagamentos de teste.</p>';
  } finally {
    refresh.disabled = false;
  }
}

function bindCheckout(app) {
  app.querySelectorAll('[data-checkout]').forEach(button => {
    button.onclick = async () => {
      const box = app.querySelector('#payment-checkout');
      button.disabled = true;
      box.hidden = false;
      box.innerHTML = '<p>Gerando dados para pagamento...</p>';
      try {
        const checkout = await api(`/api/payments/${encodeURIComponent(button.dataset.checkout)}/checkout`);
        const pix = checkout.pix;
        box.innerHTML = `<button type="button" class="checkout-close" aria-label="Fechar">×</button><h2>Pagar cobrança do GateGuard</h2><p><strong>${esc(checkout.system)}</strong> — R$ ${money(checkout.value)}</p>${pix?.encodedImage ? `<img class="pix-qr" src="data:image/png;base64,${esc(pix.encodedImage)}" alt="QR Code Pix">` : ''}${pix?.payload ? `<label>Pix Copia e Cola</label><textarea readonly>${esc(pix.payload)}</textarea><button type="button" data-copy-pix>Copiar código Pix</button>` : ''}${checkout.invoiceUrl ? `<a class="payment-link" href="${esc(checkout.invoiceUrl)}" target="_blank" rel="noopener noreferrer">Outros métodos de pagamento</a>` : ''}`;
        box.querySelector('.checkout-close').onclick = () => { box.hidden = true; };
        const copy = box.querySelector('[data-copy-pix]');
        if (copy) copy.onclick = async () => { await navigator.clipboard.writeText(pix.payload); copy.textContent = 'Código copiado'; };
      } catch (error) {
        box.innerHTML = `<button type="button" class="checkout-close" aria-label="Fechar">×</button><p class="error">${esc(error.message)}</p>`;
        box.querySelector('.checkout-close').onclick = () => { box.hidden = true; };
      } finally { button.disabled = false; }
    };
  });
}

export async function paymentsScreen(app) {
  const platformAdmin = state.session.user.perfil === 'admin' && state.session.system.id === 'SIS_0000';
  app.innerHTML = shell(`<div class="panel">
    <div class="notice"><strong>Dois contextos financeiros separados.</strong><p><b>Operações dos compradores</b> são pagamentos processados para o site da organização. <b>Cobranças GateGuard</b> são mensalidades e serviços cobrados pelo GateGuard à organização. Compradores do site não acessam este painel.</p></div>
    ${platformAdmin ? `<form id="plan-form" class="add-form"><h2 id="plan-form-title">Cobrar mensalidade GateGuard</h2><select name="system" required><option value="">Carregando organizações...</option></select><input name="name" placeholder="Organização" required><input name="cpfCnpj" placeholder="CPF/CNPJ" required><input name="email" type="email" placeholder="E-mail financeiro"><input name="value" type="number" min="5" step=".01" placeholder="Mensalidade" required><input name="nextDueDate" type="date" required><button>Salvar mensalidade</button><button type="button" id="cancel-edit" hidden>Cancelar edição</button></form>
      <form id="extra-form" class="add-form"><h2>Cobrar serviço adicional GateGuard</h2><select name="system" required><option value="">Carregando organizações...</option></select><input name="name" placeholder="Organização" required><input name="cpfCnpj" placeholder="CPF/CNPJ" required><input name="email" type="email" placeholder="E-mail financeiro"><input name="serviceDescription" placeholder="Descrição do serviço" required><input name="value" type="number" min="5" step=".01" placeholder="Valor" required><input name="dueDate" type="date" required><button>Gerar cobrança</button></form>` : ''}
    ${platformAdmin ? `<section class="payment-test-console"><div class="sis-head"><div><span class="payment-test-kicker">ACESSO EXCLUSIVO · SIS_0000</span><h2>Homologação de pagamento EVOTV</h2><p>Use um login descartável no programa de PC ou no app Android. Os dois usam o mesmo backend e geram a cobrança vinculada à conta de teste.</p></div><button type="button" id="evotv-test-refresh">Atualizar teste</button></div><div id="evotv-test-status" class="payment-test-status" aria-live="polite">Verificando...</div><ol class="payment-test-steps"><li>Gere uma cobrança Pix dentro do EVOTV com a conta descartável.</li><li>Quando ela aparecer abaixo como pendente, use a simulação Sandbox para testar o Asaas e o webhook do GateGuard.</li><li>Confira aqui se o pagamento foi registrado como recebido. A reconciliação automática continua diariamente às 01:00.</li></ol><p id="evotv-test-feedback" class="payment-test-feedback" aria-live="polite"></p><div id="evotv-test-payments">Carregando pagamentos...</div><div class="payment-test-blocking"><h3>Teste direcionado de bloqueio e liberação</h3><p>As ações abaixo operam somente sobre a conta configurada e marcada como descartável no backend EVOTV. Elas não executam a rotina global, não percorrem outros logins e não alteram a validade.</p><p id="evotv-subscription-feedback" class="payment-test-feedback" aria-live="polite"></p><div id="evotv-subscription-test">Carregando conta descartável...</div></div></section>` : ''}
    <p id="pay-error" class="error"></p>
    <section class="sis"><div class="sis-head"><div><h2>Operações dos compradores do site</h2><p>Visão detalhada para suporte, conciliação, análise de estornos e acompanhamento de eventos processados pela API.</p></div></div><div id="site-payment-history">Carregando...</div></section>
    <section class="sis"><div class="sis-head"><div><h2>Cobranças do GateGuard à organização</h2><p>Mensalidade da plataforma e serviços adicionais contratados pela organização.</p></div></div><div id="gateguard-billing">Carregando...</div></section>
    <div id="payment-checkout" class="payment-checkout" hidden></div>
  </div>`, 'Central Financeira');
  bindShell();
  if (platformAdmin) {
    app.querySelector('#evotv-test-refresh').onclick = () => loadEvotvTestConsole(app);
    loadEvotvTestConsole(app);
  }

  const form = app.querySelector('#plan-form');
  if (form) {
    const extraForm = app.querySelector('#extra-form');
    bindDocumentValidation(form.cpfCnpj);
    bindDocumentValidation(extraForm.cpfCnpj);
    form.nextDueDate.value = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    extraForm.dueDate.value = form.nextDueDate.value;
    try {
      const data = await api('/api/sites');
      const options = '<option value="">Selecione uma organização</option>' + data.sites.filter(site => site.id !== 'SIS_0000').map(site => `<option value="${esc(site.id)}">${esc(site.id)} — ${esc(site.name)}</option>`).join('');
      form.system.innerHTML = options;
      extraForm.system.innerHTML = options;
    } catch (error) { app.querySelector('#pay-error').textContent = error.message; }
    form.onsubmit = async event => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(form));
      body.value = Number(body.value);
      const id = form.dataset.planId;
      try { await api(id ? `/api/payments/plans/${encodeURIComponent(id)}` : '/api/payments', { method: id ? 'PUT' : 'POST', body: JSON.stringify(body) }); await paymentsScreen(app); }
      catch (error) { app.querySelector('#pay-error').textContent = error.message; }
    };
    extraForm.onsubmit = async event => {
      event.preventDefault();
      const body = Object.fromEntries(new FormData(extraForm));
      body.value = Number(body.value); body.billingType = 'UNDEFINED'; body.expiresAt = `${body.dueDate}T23:59:59.000Z`;
      try { await api('/api/payments/extras', { method: 'POST', body: JSON.stringify(body) }); await paymentsScreen(app); }
      catch (error) { app.querySelector('#pay-error').textContent = error.message; }
    };
    app.querySelector('#cancel-edit').onclick = () => paymentsScreen(app);
  }

  try {
    const data = await api('/api/payments');
    const history = data.history || [];
    const sitePayments = history.filter(payment => payment.category === 'SITE_BUYER_PAYMENT' || String(payment.event || '').startsWith('SITE_PAYMENT'));
    const gateGuardHistory = history.filter(payment => !sitePayments.includes(payment));
    app.querySelector('#site-payment-history').innerHTML = sitePayments.map(payment => paymentRow(payment, platformAdmin)).join('') || '<p>Nenhuma operação de comprador registrada.</p>';

    const plans = data.plans || [];
    const extras = data.extras || [];
    app.querySelector('#gateguard-billing').innerHTML = `${plans.map(plan => `<article class="table"><div class="sis-head"><div><h3>${esc(plan.externalReference)}</h3><p>Mensalidade — R$ ${money(plan.value)} | Próximo vencimento: ${esc(plan.nextDueDate || '—')} | ${esc(plan.status)}</p></div>${platformAdmin ? `<button type="button" data-edit-plan="${esc(plan.id)}" data-value="${esc(plan.value)}" data-due="${esc(plan.nextDueDate)}">Editar</button>` : ''}</div>${(plan.payments?.data || []).map(payment => `<div class="user"><strong>${esc(payment.dueDate)}</strong><span>R$ ${money(payment.value)}</span><span class="badge">${esc(payment.status)}</span>${payable.has(payment.status) ? `<button type="button" data-checkout="${esc(payment.id)}">Pagar agora</button>` : ''}</div>`).join('') || '<p>Nenhuma fatura.</p>'}</article>`).join('')}${extras.map(payment => `<div class="user"><strong>${esc(String(payment.description || '').replace('SERVIÇO EXTRA — ', ''))}</strong><span>${esc(payment.externalReference)}</span><span>R$ ${money(payment.value)}</span><span class="badge">${esc(payment.status)}</span>${payable.has(payment.status) ? `<button type="button" data-checkout="${esc(payment.id)}">Pagar agora</button>` : ''}</div>`).join('')}${!plans.length && !extras.length ? gateGuardHistory.map(payment => paymentRow(payment, platformAdmin)).join('') || '<p>Nenhuma cobrança GateGuard registrada.</p>' : ''}`;
    bindCheckout(app);
    if (form) app.querySelectorAll('[data-edit-plan]').forEach(button => {
      button.onclick = () => {
        form.dataset.planId = button.dataset.editPlan;
        form.system.value = button.closest('.table').querySelector('h3').textContent;
        form.system.disabled = true;
        form.name.required = false; form.cpfCnpj.required = false;
        form.value.value = button.dataset.value; form.nextDueDate.value = button.dataset.due;
        app.querySelector('#plan-form-title').textContent = 'Editar mensalidade GateGuard';
        app.querySelector('#cancel-edit').hidden = false;
        form.scrollIntoView({ behavior: 'smooth' });
      };
    });
  } catch (error) {
    app.querySelector('#site-payment-history').innerHTML = `<p class="error">${esc(error.message)}</p>`;
    app.querySelector('#gateguard-billing').innerHTML = '';
  }
}
