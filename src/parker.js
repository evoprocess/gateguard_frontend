import './parker.css';

const topics = {
  acquisition: {
    title: 'Aquisição GateGuard',
    message: 'Para integrar pagamentos ao seu site, fale com nosso contato comercial:',
    subject: 'Quero adquirir o GateGuard'
  },
  support: {
    title: 'Suporte GateGuard',
    message: 'Para suporte técnico ou financeiro, entre em contato pelo e-mail:',
    subject: 'Preciso de suporte no GateGuard'
  }
};

export function mountParker({ email, shieldUrl, avatarBodyUrl, avatarArmUrl }) {
  if (document.querySelector('[data-parker]')) return;

  const assistant = document.createElement('aside');
  assistant.className = 'parker-assistant';
  assistant.dataset.parker = '';
  assistant.innerHTML = `
    <section class="parker-panel" id="parker-panel" role="dialog" aria-label="Atendimento do Parker" hidden>
      <header class="parker-panel-header">
        <div class="parker-identity"><img src="${shieldUrl}" alt=""><span><b>Parker</b><small><i></i> Guardião GateGuard</small></span></div>
        <button type="button" class="parker-close" aria-label="Fechar atendimento">&times;</button>
      </header>
      <div class="parker-character" role="img" aria-label="Parker, mascote guardião animado do GateGuard">
        <div class="parker-avatar" aria-hidden="true">
          <img class="parker-avatar-body" src="${avatarBodyUrl}" alt="">
          <img class="parker-avatar-arm" src="${avatarArmUrl}" alt="">
          <i class="parker-eye parker-eye-left"></i>
          <i class="parker-eye parker-eye-right"></i>
        </div>
        <span class="parker-status">PARKER ONLINE</span>
      </div>
      <div class="parker-panel-body" aria-live="polite">
        <div data-parker-intro>
          <p class="parker-message">Olá! Eu sou o Parker. Posso direcionar você para o contato certo.</p>
          <div class="parker-topics">
            <button type="button" data-parker-topic="acquisition"><span>✦</span><b>Quero adquirir</b><small>Conhecer e integrar o GateGuard</small></button>
            <button type="button" data-parker-topic="support"><span>?</span><b>Preciso de suporte</b><small>Ajuda técnica ou financeira</small></button>
          </div>
        </div>
        <div class="parker-response" data-parker-response hidden>
          <span class="parker-response-icon">✓</span>
          <h2 data-parker-title></h2>
          <p data-parker-message></p>
          <strong data-parker-email></strong>
          <a class="parker-contact" data-parker-contact>Abrir e-mail</a>
          <button type="button" class="parker-back">Escolher outra opção</button>
        </div>
      </div>
      <footer>Atendimento direcionado com segurança pelo GateGuard.</footer>
    </section>
    <button type="button" class="parker-launcher" aria-label="Conversar com Parker" aria-controls="parker-panel" aria-expanded="false">
      <img src="${shieldUrl}" alt="Escudo GateGuard">
    </button>`;

  document.body.append(assistant);
  const panel = assistant.querySelector('.parker-panel');
  const launcher = assistant.querySelector('.parker-launcher');
  const closeButton = assistant.querySelector('.parker-close');
  const intro = assistant.querySelector('[data-parker-intro]');
  const response = assistant.querySelector('[data-parker-response]');
  const contact = assistant.querySelector('[data-parker-contact]');
  const setOpen = open => {
    panel.hidden = !open;
    launcher.setAttribute('aria-expanded', String(open));
    assistant.classList.toggle('is-open', open);
    if (open) closeButton.focus();
  };

  launcher.addEventListener('click', () => setOpen(panel.hidden));
  closeButton.addEventListener('click', () => { setOpen(false); launcher.focus(); });
  assistant.querySelector('.parker-back').addEventListener('click', () => {
    response.hidden = true;
    intro.hidden = false;
    assistant.querySelector('[data-parker-topic]').focus();
  });
  assistant.querySelectorAll('[data-parker-topic]').forEach(button => {
    button.addEventListener('click', () => {
      const topic = topics[button.dataset.parkerTopic];
      intro.hidden = true;
      response.hidden = false;
      assistant.querySelector('[data-parker-title]').textContent = topic.title;
      assistant.querySelector('[data-parker-message]').textContent = topic.message;
      assistant.querySelector('[data-parker-email]').textContent = email || 'Contato ainda não configurado';
      contact.hidden = !email;
      if (email) contact.href = `mailto:${email}?subject=${encodeURIComponent(topic.subject)}`;
      contact.focus();
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) { setOpen(false); launcher.focus(); }
  });
}
