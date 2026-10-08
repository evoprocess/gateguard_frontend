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

function paymentRow(payment, showSite = false) {
  return `<div class="user"><strong>${esc(payment.description || payment.chargeReference || payment.id)}</strong>${showSite ? `<span>${esc(payment.system)}</span>` : ''}<span>Ref.: ${esc(payment.chargeReference || payment.id || '—')}</span><span>Vencimento: ${esc(payment.dueDate || '—')}</span><span>R$ ${money(payment.value)}</span><span class="badge">${esc(payment.status)}</span></div>`;
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
    <p id="pay-error" class="error"></p>
    <section class="sis"><div class="sis-head"><div><h2>Operações dos compradores do site</h2><p>Visão detalhada para suporte, conciliação, análise de estornos e acompanhamento de eventos processados pela API.</p></div></div><div id="site-payment-history">Carregando...</div></section>
    <section class="sis"><div class="sis-head"><div><h2>Cobranças do GateGuard à organização</h2><p>Mensalidade da plataforma e serviços adicionais contratados pela organização.</p></div></div><div id="gateguard-billing">Carregando...</div></section>
    <div id="payment-checkout" class="payment-checkout" hidden></div>
  </div>`, 'Central Financeira');
  bindShell();

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
