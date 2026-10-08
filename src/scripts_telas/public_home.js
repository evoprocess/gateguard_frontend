import { loginScreen } from './0_login.js';
import { PUBLIC_IMAGES_URL, SYSTEM_EMAIL } from '../main.js';
import '../developer-guide.css';
import '../responsibilities.css';
import '../solution-public.css';

const developerGuideUrl = `${import.meta.env.BASE_URL}docs/Manual_Implantacao_API_GateGuard.pdf`;

export function publicHomeScreen(app, openLogin = false) {
  const contactLink = SYSTEM_EMAIL ? `mailto:${encodeURIComponent(SYSTEM_EMAIL)}?subject=Integração de pagamentos GateGuard` : '#';
  app.innerHTML = `
    <div class="public-page">
      <header class="public-header">
        <button class="public-brand" data-scroll="inicio" aria-label="GateGuard - início"><img src="${PUBLIC_IMAGES_URL}/gateguard_logo.png" alt="GateGuard"></button>
        <nav aria-label="Navegação principal"><button class="nav-tab is-active" data-scroll="inicio">Início</button><button class="nav-tab" data-scroll="solucao">Solução</button><button class="nav-tab" data-scroll="integracao">Integração</button><button class="nav-tab" data-scroll="desenvolvedores">Desenvolvedores</button><button class="button button-secondary" data-login>Entrar</button></nav>
      </header>
      <main>
        <section id="inicio" class="public-hero public-screen" data-public-screen>
          <div class="hero-copy"><span class="public-eyebrow">PAGAMENTOS PARA SITES</span><h1>Seu site vende.<br><em>O GateGuard processa.</em></h1><p>Uma plataforma dedicada ao gerenciamento de pagamentos via API, com cobranças, checkout, webhooks, conciliação e integração segura com o Asaas.</p>
            <div class="hero-actions"><a class="button button-primary" href="${contactLink}">Integrar meu site</a><button class="text-link" data-scroll="integracao">Entender a integração <span>↓</span></button></div>
            <div class="trust-row"><span>✓ API segura</span><span>✓ Asaas isolado</span><span>✓ Credenciais fora do navegador</span></div>
          </div>
          <div class="hero-visual" aria-label="Fluxo financeiro GateGuard"><div class="dashboard-preview client-preview"><div class="preview-top"><span>Pagamento</span><b class="active-pill">Confirmado</b></div><small>Processamento seguro</small><strong class="preview-value">API GateGuard</strong><div class="client-system"><span>G</span><div><small>Integração</small><b>Site → GateGuard → Asaas</b></div></div><div class="preview-stats"><span><b>Webhooks</b> monitorados</span><span><b>100%</b> servidor</span></div></div><div class="floating-card payment-card"><span>✓</span><div><b>Cobrança criada</b><small>Credenciais protegidas</small></div></div></div>
        </section>

        <section id="solucao" class="solution-section public-screen" data-public-screen>
          <div class="solution-heading"><span class="public-eyebrow">SOLUÇÃO GATEGUARD</span><h2>Pagamentos para sites</h2><p>Uma única solução para criar cobranças, disponibilizar checkout e acompanhar todo o ciclo financeiro do site da organização.</p></div>
          <article class="solution-card">
            <div><h3>API de Pagamentos GateGuard</h3><p>A organização integra seu site ao GateGuard e acompanha cobranças, confirmações, falhas, estornos e conciliação em um painel administrativo próprio.</p><a href="${contactLink}" class="solution-contact">Integrar pagamentos</a></div>
            <ul><li>Pix, boleto e cartão conforme configuração</li><li>Checkout e QR Code Pix</li><li>Webhooks e conciliação financeira</li><li>Histórico detalhado para suporte</li><li>Isolamento entre organizações parceiras</li><li>Auditoria das operações financeiras</li></ul>
          </article>
          <p class="implementation-note"><strong>Observação de implantação:</strong> quando uma organização não possui estrutura de servidor, o GateGuard pode avaliar uma camada técnica limitada à execução segura da API de pagamentos.</p>
        </section>

        <section id="integracao" class="responsibilities-section public-screen" data-public-screen>
          <div class="responsibilities-heading"><span class="public-eyebrow">FLUXO DE PAGAMENTO</span><h2>Da cobrança à conciliação</h2><p>O GateGuard centraliza a operação financeira e devolve ao site as informações necessárias para que a organização acompanhe cada pagamento.</p></div>
          <div class="how-steps"><article><span>1</span><h3>Cobrança</h3><p>O site envia os dados da operação financeira para a API GateGuard.</p></article><article><span>2</span><h3>Processamento</h3><p>O GateGuard cria a cobrança no Asaas e disponibiliza checkout ou Pix.</p></article><article><span>3</span><h3>Acompanhamento</h3><p>Webhooks, eventos, estornos e conciliação ficam disponíveis para a organização.</p></article></div>
          <p class="responsibilities-limit">Compradores consultam e pagam no site da organização. O painel GateGuard é reservado aos administradores autorizados das organizações parceiras.</p>
        </section>

        <section id="desenvolvedores" class="developer-section public-screen" data-public-screen>
          <div class="developer-copy"><span class="public-eyebrow">ÁREA PARA DESENVOLVEDORES</span><h2>API financeira para o seu site</h2><p>O ambiente autorizado da organização informa o identificador do site e envia a cobrança. O GateGuard valida a credencial, processa a operação financeira e devolve apenas os dados necessários.</p><ul><li><code>POST /api/payment-api/charges</code></li><li><code>GET /api/payment-api/charges/:id/checkout</code></li><li>Cabeçalhos <code>X-GateGuard-System</code> e <code>X-GateGuard-Key</code></li><li>Nenhuma senha de usuário final é recebida</li></ul><a class="developer-guide-cta" href="${developerGuideUrl}" target="_blank" rel="noopener">Abrir guia da API de pagamentos</a></div>
          <div class="developer-preview"><span>FLUXO SEGURO</span><strong>Site → GateGuard → Asaas</strong><code>requisição → validação → cobrança → webhook → conciliação</code><p>As credenciais financeiras permanecem protegidas durante todo o processamento.</p></div>
        </section>

        <section id="cadastre-se" class="signup-section public-screen" data-public-screen>
          <div><span class="public-eyebrow">PAGAMENTOS SEGUROS PARA SITES</span><h2>Integre seu site ao GateGuard</h2><p>Centralize cobranças, checkout, eventos e suporte financeiro em uma única solução.</p></div>
          <div class="signup-benefits"><span>API de pagamentos</span><span>Integração com Asaas</span><span>Painel financeiro para organizações</span><a class="button button-light" href="${contactLink}">Falar sobre meu site</a></div>
          <footer><div class="footer-product"><img src="${PUBLIC_IMAGES_URL}/gateguard_logo.png" alt="GateGuard"><span>© ${new Date().getFullYear()} GateGuard<br><small>Gestão de Pagamentos para Sites</small></span></div><div class="footer-developer"><span>Desenvolvido por</span><img src="${PUBLIC_IMAGES_URL}/logo_dev.png" alt="Logo do desenvolvedor"></div></footer>
        </section>
      </main>
    </div>`;

  const open = () => { if (!app.querySelector('.login-modal')) loginScreen(app); };
  app.querySelectorAll('[data-login]').forEach(button => { button.onclick = open; });
  const page = app.querySelector('.public-page');
  const tabs = [...app.querySelectorAll('.nav-tab')];
  app.querySelectorAll('[data-scroll]').forEach(control => { control.onclick = () => app.querySelector(`#${control.dataset.scroll}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.scroll === visible.target.id));
  }, { root: page, threshold: [.5, .7] });
  app.querySelectorAll('[data-public-screen]').forEach(section => observer.observe(section));
  if (openLogin) open();
}
