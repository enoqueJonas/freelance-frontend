# D54 — Evidência de integração real em Chromium

**Estado:** cenário de browser executado com sucesso em **3 de Novembro de 2026**. Fonte: [GitHub Actions D54 #41600019575](https://github.com/enoqueJonas/freelance-frontend/actions/runs/41600019575).

Este teste não utiliza `mockApi`, não intercepta pedidos HTTP para fabricar respostas e **não valida as páginas legadas de demonstração**. Arranca o servidor Django real, aplica migrações a uma base SQLite de teste e utiliza o browser Chromium com React/Vite para executar o fluxo do `/#/real`.

## Resultado verificado

- **1 teste completo de browser executado; 1 aprovado** no Chromium.
- Verificação TypeScript e build React concluídos.
- Backend fixado no commit `ced54117d2db0db9e049086fcc975dd4f36807e0` (branch técnica D53).
- Duas identidades sintéticas: empregador e trabalhador. Palavra-passe de teste gerada pelo workflow, nunca guardada no Git.
- O cenário inclui: publicar oportunidade → submeter e seleccionar proposta → contratação pendente → duas aceitações da v1 → ACTIVE → propor/aceitar v2 → v1 SUPERSEDED e v2 ACCEPTED → propor/rejeitar v3 mantendo v2 vigente.
- **Seis capturas de ecrã efectivamente geradas e arquivadas:** [d54-real-browser-screenshots](https://github.com/enoqueJonas/freelance-frontend/actions/runs/41600019575/artifacts/13213853540), disponíveis até **3 de Dezembro de 2026**. Estas capturas são da interface em ambiente de teste com dados fictícios, não evidência de utilizadores reais.

Os nomes das imagens são:

1. `01-oportunidade-publicada.png`
2. `02-proposta-submetida.png`
3. `03-contratacao-pendente.png`
4. `04-acordo-v1-activo.png`
5. `05-versao-v2-vigente.png`
6. `06-versao-v3-rejeitada.png`

**Os screenshots precisam de revisão visual de legibilidade e correspondência com as figuras do documento académico antes de serem integrados.**

## Código de teste

- [`tests/d54-real-browser.spec.ts`](../tests/d54-real-browser.spec.ts)
- [`playwright.d54.config.ts`](../playwright.d54.config.ts)
- [`.github/workflows/d54-browser-e2e.yml`](../.github/workflows/d54-browser-e2e.yml)

### Executar localmente

Configurar Python 3.13, Node.js 22, Django e o frontend. A revisão de backend deve corresponder ao SHA D53 indicado.

```bash
# Repositório backend (terminal 1)
git checkout ced54117d2db0db9e049086fcc975dd4f36807e0
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

```bash
# Repositório frontend (terminal 2)
git checkout test/d54-real-browser-e2e
npm ci
npm install --no-save --ignore-scripts @playwright/test@1.56.1
npx playwright install chromium
npm run dev -- --host 127.0.0.1
```

```bash
# Executar apenas contra uma BD dedicada de teste (terminal 3)
export E2E_PASSWORD="$(openssl rand -hex 24)"
npx playwright test -c playwright.d54.config.ts
```

**Atenção:** o teste cria dados e assume usernames de teste definidos. Utilizar base de dados descartável ou limpa; não apontar para produção nem ambiente partilhado. O backend está configurado para desenvolvimento e **não deve ser exposto publicamente**.

## Limites científicos e técnicos

- O ensaio confirma uma trajectória E2E no Chromium, com dados sintéticos, não uma matriz completa de todos os cenários V01–V08 nem RNF01–RNF07.
- Não demonstra comportamento sob concorrência PostgreSQL, carga, vários browsers, dispositivos móveis, recuperação de sessão ou falhas de rede.
- Não há módulos reais de pagamentos, entrega, arbitragem ou reputação neste percurso.
- A impressão digital SHA-256 do acordo não é assinatura electrónica qualificada.
- Não demonstra adequação ao contexto de Maputo nem eficácia na redução de fraudes ou conflitos; isso requer estudo empírico.
- A monografia D44 original e os comentários do supervisor não foram modificados. Figuras no documento devem ser identificadas como **protótipo testado com dados sintéticos**, sem afirmar entrevistas ou utilizadores reais.

## Nota de infra-estrutura

A primeira execução foi bloqueada pelo runner `ubuntu-26.04`, não suportado por Playwright 1.56.1. O workflow foi corrigido para `ubuntu-24.04`, e o ensaio posterior passou. Registos de falhas são preservados no histórico de Actions, não omitidos da auditoria.
