# D53 — Fluxo de interface integrado com API Django real

## Âmbito

Foi adicionada a rota [#/real](#/real) (HashRouter), que utiliza JWT real e endpoints Django para contas, perfis, oportunidades, propostas, contratação e aceitação/versionamento de acordos. A implementação encontra-se isolada das páginas antigas do ServiPlus, que continuam baseadas em dados locais simulados. **A abertura da rota não transforma os módulos antigos em funcionalidades reais.**

Frontend: branch `feat/d53-real-django-flow`.  
Backend exigido: branch `feat/d53-ui-api-read-models`, PR #6 do repositório `enoqueJonas/freelance-backend` (dependente dos PR #5 → #4 → #3).

## Execução local (dois terminais)

**Django:**

```bash
git checkout feat/d53-ui-api-read-models
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

**React:**

```bash
git checkout feat/d53-real-django-flow
npm ci
npm run dev
```

Abrir `http://localhost:3000/#/real`. O Vite encaminha os pedidos `/api` do browser para `http://127.0.0.1:8000`. **Não são necessárias permissões CORS genéricas** para este percurso de desenvolvimento. No deploy, configurar um proxy reverso same-origin para `/api`, HTTPS, segredo de servidor e controlos de segurança; o Django actual não está pronto para produção.

## Percurso de teste manual (duas identidades reais, sem dados inventados)

1. Na página `#/real`, registar e autenticar o empregador com username/password e telefone moçambicano válido, criar perfil Employer, criar oportunidade e publicar.
2. Sair, autenticar um trabalhador distinto, criar perfil Worker e submeter proposta para a oportunidade.
3. Sair, entrar como empregador e aceitar a proposta recebida. Confirma-se no backend a criação de `Engagement PENDING_AGREEMENT`.
4. Propor `AgreementVersion v1` com preço positivo ou preço após diagnóstico, consultar o conteúdo e aceitar expressamente.
5. Sair, autenticar o trabalhador e aceitar a **mesma versão**; verificar `Engagement ACTIVE`.
6. Uma parte propõe `v2`. Confirmar que a versão `v1` permanece vigente até a contraparte também aceitar; depois, `v1 SUPERSEDED`, `v2 ACCEPTED`.
7. Propor outra alteração e rejeitar com motivo; verificar que a versão anterior permanece vigente, com histórico de rejeição.

O frontend recebe os IDs das listagens reais, sem valores codificados. Os dados e estados são recuperados do backend a cada operação.

## Segurança e limites

- A página usa `realApi.ts`, **sem importar mockApi** e sem simular respostas quando a API falha.
- Utiliza JWT access token apenas em estado React **na memória**. A sessão é perdida ao recarregar a página; o token de refresh não é armazenado nem utilizado. Isto reduz persistência no browser, mas **não** constitui solução de gestão de sessões pronta para produção.
- A antiga interface mock continua acessível e identificada como demonstração. Os dados simulados das páginas `/dashboard`, `/offers`, `/profile` etc. **não** são resultados de API real.
- A API de D53 tem endpoints GET de listagem de propostas restritos ao empregador titular e de listagem de contratações restritos às respectivas partes.
- A capacidade de pagamento, entrega, reputação e tratamento completo de conflito **não está implementada**. Uma fingerprint SHA-256 não substitui assinatura jurídica nem verificação de identidade robusta.
- O sistema não suporta execução em produção tal como está (configuração Django de desenvolvimento, SQLite, `DEBUG=True`, chave estática e necessidade de configurar HTTPS, hosts e segurança).
- O frontend ainda precisa de testes E2E num browser real, com API e base de dados disponíveis; testes de cliente, compilação e build **não equivalem** a V02/V03/V04 completos nem a validação por participantes da investigação.

## Verificação

```bash
npm ci
npx tsx --test tests/real-api-client.test.ts
npm run lint
npm run build
```

O workflow GitHub Actions `.github/workflows/d53-real-api.yml` executa estes passos no PR. Os testes do cliente usam `fetch` de teste para observar contratos de rede; o backend é verificado separadamente no PR #6 com testes Django reais.

**Manter a D44 académica canónica e os comentários do supervisor inalterados.**
