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

## Desenvolvimento

```bash
npm install
npm run dev
npm run build
```

O build para GitHub Pages usa a base `/gateguard_frontend/`.
