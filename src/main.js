import { homeScreen } from './scripts_telas/1_home.js';
import { paymentsScreen } from './scripts_telas/2_sistema_de_pagamentos.js';
import { systemsScreen } from './scripts_telas/4_gestao_de_sistemas.js';
import { manualsScreen } from './scripts_telas/5_manuais_internos.js';
import { publicHomeScreen } from './scripts_telas/public_home.js';
import frontendConfig from './configuracao.json';
import publicDirectory from './sistemas_publicos.json';
export const SYSTEM_NAME = String(frontendConfig.nome_sistema || 'Sistema').trim();
export const SYSTEM_EMAIL = String(frontendConfig.email_contato || '').trim().toLowerCase();
export const SYSTEM_URL = String(frontendConfig.link_sistema || '').trim();
export const PUBLIC_IMAGES_URL = `${import.meta.env.BASE_URL}imagens_pub`;
document.title = SYSTEM_NAME;
export const API_URL = (import.meta.env?.VITE_API_URL || 'https://gateguard-backend.onrender.com').replace(/\/$/, '');
export const state = { token: sessionStorage.getItem('login_session') || '', session: JSON.parse(sessionStorage.getItem('login_data') || 'null') };
if (state.session?.user) {
  state.session.user.perfil ??= state.session.user.role;
  state.session.user.tipo ??= state.session.user.roleLevel ?? 1;
  state.session.user.nivel ??= state.session.user.accessRank ?? null;
}
function escapeHtml(value) { const element = document.createElement('span'); element.textContent = String(value ?? ''); return element.innerHTML; }
export async function api(path, options = {}) { const response = await fetch(`${API_URL}${path}`, { ...options, headers: { authorization: `Bearer ${state.token}`, ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers } }); const data = await response.json().catch(() => ({})); if (!response.ok) throw new Error(data.error || 'Nao foi possivel concluir.'); return data; }
export function logout() { sessionStorage.removeItem('login_session'); sessionStorage.removeItem('login_data'); state.token = ''; state.session = null; navigate('public'); }
export function shell(content, title) { const user = state.session.user; const perfil = user.perfil; const system = state.session.system; const privileged = ['admin', 'gerente'].includes(perfil); const internalOrg = system.id === 'SIS_0000'; const owner = perfil === 'admin' && internalOrg; const manualsLink = '<button data-page="manuals">Manuais do Sistema</button>'; const navigation = owner ? `<button data-page="home">Administração</button><button data-page="systems">Sites e Integrações</button><button data-page="payments">Operações Financeiras</button>${manualsLink}` : `<button data-page="home">Home</button>${privileged ? '<button data-page="payments">Pagamentos</button>' : ''}${internalOrg ? manualsLink : ''}`; const publicSystem = publicDirectory.floors.flatMap(floor => floor.systems).find(item => item.id === system.id); const logoPath = internalOrg ? 'imagens_pub/gateguard_logo.png' : publicSystem?.logo; const logo = logoPath ? `<img data-system-logo src="${import.meta.env.BASE_URL}${escapeHtml(logoPath)}" alt="${escapeHtml(system.name)}">` : ''; return `<div class="app-shell"><header><div class="header-brand">${logo}<div><strong>${escapeHtml(SYSTEM_NAME)}</strong><small>${escapeHtml(system.id)}</small></div></div><button id="menu-button" class="menu-button" aria-label="Abrir menu">☰</button><nav id="menu" hidden><div class="menu-user"><strong>${escapeHtml(user.name)}</strong><span><b>Perfil interno:</b> ${escapeHtml(perfil)}</span><span><b>Cargo:</b> ${escapeHtml(user.cargo || 'Não informado')}</span></div><div class="menu-links">${navigation}<button id="logout">Sair</button></div></nav></header><section class="content"><div class="title"><p>${internalOrg ? 'GATEGUARD · ADMINISTRAÇÃO' : 'PAINEL FINANCEIRO'}</p><h1>${title}</h1></div>${content}</section></div>`; }
export function bindShell() { const menu = document.querySelector('#menu'); const logo = document.querySelector('[data-system-logo]'); if (logo) logo.onerror = () => { logo.onerror = null; logo.src = logo.dataset.fallback; }; document.querySelector('#menu-button').onclick = () => { menu.hidden = !menu.hidden; }; menu.querySelectorAll('[data-page]').forEach(x => x.onclick = () => navigate(x.dataset.page)); document.querySelector('#logout').onclick = logout; }
export async function navigate(page) { const app = document.querySelector('#app'); if (!state.token || !state.session) { publicHomeScreen(app, page === 'login'); return; } if (page === 'login' || page === 'public') page = 'home'; if (page === 'payments' && !['admin', 'gerente'].includes(state.session.user.perfil)) page = 'home'; const internalOrg = state.session.system.id === 'SIS_0000'; const owner = state.session.user.perfil === 'admin' && internalOrg; if (page === 'systems' && !owner) page = 'home'; if (page === 'manuals' && !internalOrg) page = 'home'; if (page === 'payments') return paymentsScreen(app); if (page === 'systems') return systemsScreen(app); if (page === 'manuals') return manualsScreen(app); return homeScreen(app); }
navigate(state.token ? 'home' : 'public');
