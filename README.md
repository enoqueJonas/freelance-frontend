# ConecTA / ServiPlus — Frontend React

Protótipo de ligação entre prestadores de serviços de Tecnologias de Informação e empregadores, desenvolvido com React, TypeScript e Vite.

## Dois percursos distintos

- **Fluxo Django real:** [`/#/real`](http://localhost:3000/#/real) — registo, login JWT, perfis, oportunidades, propostas e acordos versionados através da API Django. Requer o backend da branch [D53](https://github.com/enoqueJonas/freelance-backend/pull/6).
- **Demonstração antiga:** restantes páginas (`/login`, `/dashboard`, `/offers`, etc.) continuam com `mockApi` e dados locais fictícios. **Não** comprovam autenticação, pagamentos, avaliações ou contratações reais.

## Preparação do backend

No repositório [freelance-backend](https://github.com/enoqueJonas/freelance-backend):

```bash
git checkout feat/d53-ui-api-read-models
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

O código do backend D53 depende das alterações dos PRs #3–#5 e encontra-se numa branch de desenvolvimento. **Não o utilizar em produção sem configuração segura de segredos, DEBUG, hosts, HTTPS e base de dados.**

## Preparação do frontend

```bash
git checkout feat/d53-real-django-flow
npm ci
npm run dev
```

Abrir **http://localhost:3000/#/real**.

O Vite encaminha `/api` para `http://127.0.0.1:8000` durante o desenvolvimento. Não é necessário activar CORS permissivo para esta configuração. Um deployment separado precisará de reverse proxy seguro e configuração de origem apropriada.

## Verificação

```bash
npx tsx --test tests/real-api-client.test.ts
npm run lint
npm run build
```

Os testes do cliente usam um `fetch` simulado para verificar o contrato HTTP e a gestão dos erros. A API Django tem uma suite própria, incluindo testes de autorização e persistência. **O funcionamento integral no browser com dois utilizadores reais continua a exigir execução e evidências próprias**: estes comandos não substituem E2E ou UAT.

Para o roteiro de ponta a ponta, consultar [`docs/D53_INTEGRACAO_REACT_DJANGO.md`](docs/D53_INTEGRACAO_REACT_DJANGO.md).

## Segurança e limites

- A rota real não utiliza o `AuthContext` fictício da demonstração antiga.
- O token de acesso JWT é mantido apenas em memória; o refresh da página termina a sessão. Não se armazenam palavras-passe.
- Os formulários de aceitação/rejeição usam a impressão digital do acordo devolvida pelo backend, **sem equivalência com assinatura electrónica qualificada**.
- A implementação actual **não** executa pagamentos, escrow, entrega de serviços, arbitragem nem validação de reputação.
- O projecto faz parte de uma avaliação académica de protótipo, não de um serviço financeiro ou plataforma pronta para exploração comercial.

## Projecto e proveniência

Código frontend: [enoqueJonas/freelance-frontend](https://github.com/enoqueJonas/freelance-frontend). Backend: [enoqueJonas/freelance-backend](https://github.com/enoqueJonas/freelance-backend). As alterações D53 encontram-se em PRs de desenvolvimento, não integradas automaticamente nas branches principais.
