import { loginScreen } from './0_login.js';
import { PUBLIC_IMAGES_URL, SYSTEM_EMAIL } from '../main.js';
import directory from '../sistemas_publicos.json';
import '../developer-guide.css';
import '../responsibilities.css';
import '../solution-public.css';
import '../hero-checkout.css';

const developerGuideUrl = `${import.meta.env.BASE_URL}docs/Manual_Implantacao_API_GateGuard.pdf`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

export function publicHomeScreen(app, openLogin = false) {
  const contactLink = SYSTEM_EMAIL ? `mailto:${encodeURIComponent(SYSTEM_EMAIL)}?subject=Integração de pagamentos GateGuard` : '#';
  app.innerHTML = `
    <div class="public-page">
      <header class="public-header">
        <button class="public-brand" data-scroll="inicio" aria-label="GateGuard - início"><img src="${PUBLIC_IMAGES_URL}/gateguard_logo.png" alt="GateGuard"></button>
        <nav aria-label="Navegação principal"><button class="nav-tab is-active" data-scroll="inicio">Início</button><button class="nav-tab" data-scroll="localizar-organizacao">Localizar organização</button><button class="nav-tab" data-scroll="solucao">Solução</button><button class="nav-tab" data-scroll="integracao">Integração</button><button class="button button-secondary" data-scroll="localizar-organizacao">Entrar</button></nav>
      </header>
      <main>
        <section id="inicio" class="public-hero public-screen" data-public-screen>
          <div class="hero-copy"><span class="public-eyebrow">PAGAMENTOS PARA SITES</span><h1>Aceite pagamentos<br><em>no seu site</em></h1><p>Receba por vendas e mensalidades diretamente no seu site. O GateGuard valida a confirmação do pagamento para que o site libere a assinatura ou conclua a venda com segurança.</p>
            <div class="hero-actions"><a class="button button-primary" href="${contactLink}">Adicionar pagamentos</a><button class="text-link" data-scroll="integracao">Entender a integração <span>↓</span></button></div>
            <div class="trust-row"><span>✓ API segura</span><span>✓ Asaas isolado</span><span>✓ Credenciais fora do navegador</span></div>
          </div>
          <div class="hero-visual" aria-label="Exemplo de um site aceitando pagamento com GateGuard">
            <div class="store-preview">
              <div class="store-browser"><i></i><i></i><i></i><span>minhaloja.com.br</span></div>
              <div class="store-nav"><strong>NOVA</strong><span>Produtos&nbsp;&nbsp; Assinaturas&nbsp;&nbsp; Suporte</span><b>◌</b></div>
              <div class="store-product"><div class="product-art"><i></i><span>N</span></div><div class="product-copy"><small>ASSINATURA DIGITAL</small><h3>Plano Profissional</h3><p>Recursos completos para sua equipe.</p><strong>R$ 49,90 <small>/ mês</small></strong><button type="button">Assinar agora</button></div></div>
              <div class="store-shade"></div>
              <div class="checkout-modal">
                <div class="checkout-brand"><img src="${PUBLIC_IMAGES_URL}/gateguard_logo.png" alt="GateGuard"><div><small>PAGAMENTO SEGURO</small><strong>GateGuard</strong></div><span>🔒</span></div>
                <div class="checkout-order"><div><small>Plano Profissional</small><span>Assinatura mensal</span></div><strong>R$ 49,90</strong></div>
                <div class="checkout-methods"><button type="button" class="is-selected">Pix</button><button type="button">Cartão</button></div>
                <div class="checkout-field"><span>CPF/CNPJ</span><b>•••.•••.•••-••</b></div>
                <button type="button" class="checkout-pay">Pagar R$ 49,90</button>
                <p>Pagamento validado para liberar sua assinatura.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="localizar-organizacao" class="flow-section locator-section public-screen" data-public-screen>
          <div class="locator-heading"><div><span class="public-eyebrow">DIRETÓRIO DE PARCEIROS</span><h2>Localize sua organização</h2><p>Explore o ambiente 3D, encontre a sala da organização parceira e abra o acesso administrativo ao GateGuard.</p></div><div class="locator-tools"><div class="floor-indicator"><small>PISO ATUAL</small><strong id="current-floor-label">Piso 1</strong><span>Use a escada para trocar</span></div><button type="button" id="movement-legend-button" class="movement-legend-button"><small>AJUDA</small><strong>Controles do ambiente</strong><span>Consultar movimentos</span></button></div></div>
          <form id="store-search-form" class="store-search" autocomplete="off"><label for="store-search">Pesquisar organização parceira</label><div><div class="store-combobox"><input id="store-search" role="combobox" aria-autocomplete="both" aria-expanded="false" aria-controls="store-options" placeholder="Digite o nome da organização"><button type="button" id="toggle-store-options" aria-label="Exibir organizações">⌄</button><div id="store-options" class="store-options" role="listbox" hidden>${directory.floors.flatMap(floor => floor.systems).filter(system => system.status === 'active').map(system => `<button type="button" role="option" data-store-option="${esc(system.name)}">${esc(system.name)}</button>`).join('')}</div></div><button type="submit">Localizar no 3D</button></div><span id="store-search-feedback" class="sr-only" aria-live="polite"></span></form>
          <div class="locator-game" tabindex="0" aria-label="Ambiente 3D para localizar uma organização parceira e abrir seu login."></div>
          <div id="movement-legend-popup" class="movement-legend-popup" hidden><div><button type="button" id="close-movement-legend" aria-label="Fechar legenda">&times;</button><span>CONTROLES DO AMBIENTE</span><h3>Como se movimentar</h3><ul><li><kbd>W A S D</kbd><span>Caminhar pelo ambiente</span></li><li><kbd>↑ ↓ ← →</kbd><span>Movimentação alternativa</span></li><li><kbd>Mouse</kbd><span>Controlar a câmera</span></li><li><kbd>Espaço / Enter</kbd><span>Entrar na organização</span></li><li><kbd>Esc</kbd><span>Liberar o cursor</span></li></ul></div></div>
        </section>

        <section id="solucao" class="solution-section public-screen" data-public-screen>
          <div class="solution-heading"><span class="public-eyebrow">SOLUÇÃO GATEGUARD</span><h2>Pagamentos para sites</h2><p>Uma única solução para criar cobranças, disponibilizar checkout e acompanhar todo o ciclo financeiro do site da organização.</p></div>
          <article class="solution-card">
            <div><h3>API de Pagamentos GateGuard</h3><p>A organização integra seu site ao GateGuard e acompanha cobranças, confirmações, falhas, estornos e conciliação em um painel administrativo próprio.</p><a href="${contactLink}" class="solution-contact">Integrar pagamentos</a></div>
            <ul><li>Pix, boleto e cartão conforme configuração</li><li>Checkout e QR Code Pix</li><li>Confirmação segura para liberar vendas e assinaturas</li><li>Webhooks e conciliação financeira</li><li>Histórico detalhado para suporte</li><li>Auditoria das operações financeiras</li></ul>
          </article>
          <p class="implementation-note"><strong>Observação de implantação:</strong> quando uma organização não possui estrutura de servidor, o GateGuard pode avaliar uma camada técnica limitada à execução segura da API de pagamentos.</p>
        </section>

        <section id="integracao" class="responsibilities-section public-screen" data-public-screen>
          <div class="responsibilities-heading"><span class="public-eyebrow">FLUXO DE PAGAMENTO</span><h2>Da cobrança à conciliação</h2><p>O GateGuard centraliza a operação financeira e devolve ao site as informações necessárias para que a organização acompanhe cada pagamento.</p></div>
          <div class="how-steps"><article><span>1</span><h3>Cobrança</h3><p>O site envia a venda ou mensalidade para processamento financeiro.</p></article><article><span>2</span><h3>Validação</h3><p>O GateGuard valida a confirmação do pagamento com segurança.</p></article><article><span>3</span><h3>Liberação</h3><p>O site recebe a confirmação e libera a assinatura ou conclui a venda.</p></article></div>
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

  const open = (system, systemName, systemUrl, onClose) => {
    if (!app.querySelector('.login-modal')) loginScreen(app, typeof system === 'string' ? { system, systemName, systemUrl, lockSystem: true, onClose } : {});
  };
  app.querySelectorAll('[data-login]').forEach(button => { button.onclick = () => open(); });
  const page = app.querySelector('.public-page');
  const tabs = [...app.querySelectorAll('.nav-tab')];
  app.querySelectorAll('[data-scroll]').forEach(control => { control.onclick = () => app.querySelector(`#${control.dataset.scroll}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
    if (!visible) return;
    tabs.forEach(tab => tab.classList.toggle('is-active', tab.dataset.scroll === visible.target.id));
  }, { root: page, threshold: [.5, .7] });
  app.querySelectorAll('[data-public-screen]').forEach(section => observer.observe(section));
  const legendPopup = app.querySelector('#movement-legend-popup');
  app.querySelector('#movement-legend-button').onclick = () => { legendPopup.hidden = false; };
  app.querySelector('#close-movement-legend').onclick = () => { legendPopup.hidden = true; };
  legendPopup.onclick = event => { if (event.target === legendPopup) legendPopup.hidden = true; };
  const searchInput = app.querySelector('#store-search');
  const storeOptions = app.querySelector('#store-options');
  const optionButtons = [...storeOptions.querySelectorAll('[data-store-option]')];
  const showOptions = (showAll = false) => {
    const query = showAll ? '' : searchInput.value.trim().toLocaleLowerCase('pt-BR');
    optionButtons.forEach(option => { option.hidden = Boolean(query) && !option.dataset.storeOption.toLocaleLowerCase('pt-BR').includes(query); });
    storeOptions.hidden = false;
    searchInput.setAttribute('aria-expanded', 'true');
  };
  const hideOptions = () => { storeOptions.hidden = true; searchInput.setAttribute('aria-expanded', 'false'); };
  searchInput.oninput = event => {
    const typed = searchInput.value;
    if (event.inputType?.startsWith('insert') && typed) {
      const match = optionButtons.map(option => option.dataset.storeOption).find(name => name.toLocaleLowerCase('pt-BR').startsWith(typed.toLocaleLowerCase('pt-BR')));
      if (match && match.length > typed.length) {
        searchInput.value = match;
        searchInput.setSelectionRange(typed.length, match.length);
      }
    }
    if (!storeOptions.hidden) showOptions(false);
  };
  app.querySelector('#toggle-store-options').onclick = () => storeOptions.hidden ? showOptions(true) : hideOptions();
  optionButtons.forEach(option => { option.onclick = () => { searchInput.value = option.dataset.storeOption; hideOptions(); searchInput.focus(); }; });
  page.addEventListener('click', event => { if (!event.target.closest('.store-combobox')) hideOptions(); });
  import('../system-world.js').then(({ bindFirstPersonDirectory }) => {
    if (app.querySelector('.locator-game')) bindFirstPersonDirectory(app, open, directory);
  }).catch(() => {
    const game = app.querySelector('.locator-game');
    if (game) game.innerHTML = '<p class="game-prompt">O ambiente 3D não pôde ser iniciado neste dispositivo.</p>';
  });
  if (openLogin) open();
}
