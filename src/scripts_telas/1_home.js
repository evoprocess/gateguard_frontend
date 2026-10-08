import { api, state, shell, bindShell, navigate } from '../main.js';

const esc = value => {
  const element = document.createElement('span');
  element.textContent = String(value ?? '');
  return element.innerHTML;
};

export async function homeScreen(app) {
  const owner = state.session.user.perfil === 'admin' && state.session.system.id === 'SIS_0000';
  if (!owner) {
    app.innerHTML = shell(`<section class="admin-welcome"><div><span>ADMINISTRAÇÃO DA ORGANIZAÇÃO</span><h2>${esc(state.session.system.name)}</h2><p>Olá, <strong>${esc(state.session.user.name)}</strong>. Este painel é exclusivo dos administradores da organização para acompanhar operações financeiras processadas pela API e as cobranças do próprio GateGuard.</p></div><div class="admin-identity"><small>Solução contratada</small><strong>Pagamentos GateGuard</strong><span>${esc(state.session.system.id)}</span></div></section><section class="admin-actions"><button data-admin-page="payments"><span>01</span><div><strong>Central Financeira</strong><small>Operações dos compradores, conciliação, estornos e cobranças do GateGuard.</small></div><b>→</b></button></section><div class="notice"><strong>Quem não acessa o GateGuard?</strong><p>Compradores e usuários finais do seu site consultam pagamentos no próprio site da organização. O login GateGuard é reservado aos administradores autorizados da organização.</p></div>`, 'Visão Geral');
    bindShell();
    app.querySelector('[data-admin-page="payments"]').onclick = () => navigate('payments');
    return;
  }

  app.innerHTML = shell(`
    <section class="admin-welcome"><div><span>ADMINISTRAÇÃO CENTRAL</span><h2>Painel GateGuard</h2><p>Gerencie organizações, integrações de pagamento, operações financeiras e cobranças da plataforma.</p></div><div class="admin-identity"><small>Sessão administrativa</small><strong>${esc(state.session.user.name)}</strong><span>SIS_0000 · admin</span></div></section>
    <section class="admin-metrics" aria-label="Resumo administrativo"><article><span>Organizações</span><strong id="admin-sis-count">—</strong><small>sites integrados</small></article><article><span>Solução</span><strong>Pagamentos</strong><small>API e suporte financeiro</small></article><article><span>Operação</span><strong>Asaas</strong><small>cobranças e conciliação</small></article></section>
    <section class="admin-actions"><button data-admin-page="systems"><span>01</span><div><strong>Organizações e Integrações</strong><small>Cadastrar sites e gerenciar credenciais da API de pagamentos.</small></div><b>→</b></button><button data-admin-page="payments"><span>02</span><div><strong>Central Financeira</strong><small>Acompanhar operações dos sites e cobranças do GateGuard às organizações.</small></div><b>→</b></button></section>`, 'Administração');
  bindShell();
  app.querySelectorAll('[data-admin-page]').forEach(button => { button.onclick = () => navigate(button.dataset.adminPage); });
  try {
    const data = await api('/api/sites');
    const counter = app.querySelector('#admin-sis-count');
    if (counter) counter.textContent = data.sites.filter(site => site.id !== 'SIS_0000' && site.sistema_implantado === true).length;
  } catch {
    const counter = app.querySelector('#admin-sis-count');
    if (counter) counter.textContent = '!';
  }
}
