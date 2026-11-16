# GateGuard — Frontend

Interface pública e painel financeiro para administradores das organizações parceiras.

## Quem acessa

- equipe interna GateGuard;
- administradores autorizados das organizações.

Compradores e usuários finais não acessam o GateGuard. Eles consultam o pagamento no próprio site da organização.

## Áreas do painel

- **Central Financeira:** operações dos compradores e cobranças do GateGuard à organização.
- **Organizações e Integrações:** área interna GateGuard para cadastro e credenciais da API de pagamentos.
- **Manuais:** documentação operacional interna.

## Homologação do EVOTV

Somente a administração `SIS_0000` vê o console em **Operações Financeiras**. Para validar o fluxo do comprador, gere uma cobrança Pix dentro do programa de PC ou do aplicativo Android com uma conta EVOTV descartável. O console lista a cobrança e permite simular o recebimento somente quando o backend GateGuard está conectado ao Sandbox do Asaas; a confirmação não movimenta dinheiro real e permite verificar o webhook no histórico do GateGuard.

A liberação ou o bloqueio do login acontece no backend EVOTV. A manutenção diária permanece às 01:00 (horário de Brasília). Para homologação, o console usa uma rota separada que opera somente sobre o login configurado e marcado como conta descartável; apenas a sessão `SIS_0000/admin` pode acioná-la. O teste não executa a rotina global, não percorre outros usuários e registra as ações na auditoria do EVOTV.

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

O build para GitHub Pages usa a base `/gateguard_frontend/`.
