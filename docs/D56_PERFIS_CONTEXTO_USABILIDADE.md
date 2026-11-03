# D56 — Activação contextual de perfis, sem distrair da contratação

**Objectivo:** resolver o problema UX-02 identificado depois dos ensaios D54/D55: os formulários de criação do perfil secundário ocupavam demasiado espaço e competiam com oportunidades, propostas e acordos.

## Alterações

- A área «Perfis da conta» apresenta os estados **Trabalhador** e **Empregador**, sem abrir formulários automaticamente.
- Quem ainda não criou qualquer perfil escolhe uma das duas opções. A outra permanece disponível na **mesma conta** (RN01).
- Quem já tem um perfil vê o segundo como **opcional**; a área de oportunidades e contratações permanece acessível.
- Os formulários aparecem **um de cada vez**, por acção explícita. Os botões usam `aria-expanded` e `aria-controls`; os formulários têm nome acessível e labels legíveis.
- Após a criação e confirmação pelo Django, o formulário fecha e o estado passa a `Activo`. Erros de API não marcam um perfil como criado.
- A troca de conta continua a limpar o estado e os campos transitórios; esta implementação não utiliza `mockApi`.
- Perfis acumuláveis **não** autorizam autocontratação: a regra de identidade distinta continua no backend, previamente testada.

## Evidência e testes

O Playwright mantém o cenário integrado D54/D55 (oportunidade, proposta, v1/v2, rejeição) e acrescenta verificações:

1. Formulários de ambos os perfis inicialmente fechados;
2. Abrir apenas o perfil de empregador, criar e confirmar encerramento automático;
3. Abrir apenas o perfil de trabalhador e confirmar que o outro formulário permanece fechado;
4. A opção de segundo perfil permanece acessível sem interferir na proposta;
5. A troca de conta não repõe os valores anteriores;
6. Depois da contratação e rejeição de v3, adicionar perfil secundário à conta Worker **sem perder o histórico de propostas nem contratos**;
7. Novo ensaio a 390 × 844 px: abrir formulário de trabalhador com teclado (Enter), alternar para empregador, fechar e confirmar ausência de formulário aberto.

O workflow `.github/workflows/d54-browser-e2e.yml` arranca **React, Django e SQLite de ensaio** e utiliza o backend fixado no commit D55 `3752c14e3cfef7bfd20a4de7a70f762fcf51ea08`. Além das seis imagens de contratação, solicita três capturas reais adicionais do onboarding contextual (perfil inicialmente fechado, perfil de empregador activo e viewport móvel).

**Não declarar testes aprovados antes de examinar os logs** da revisão exacta deste PR.

## Escopo científico

Esta intervenção demonstra uma decisão de design de interface e, se o CI passar, compatibilidade técnica com o fluxo real de contratação. **Não** constitui teste de usabilidade com utilizadores representativos nem evidência de adequação de perfis no mercado de Maputo. Qualquer frase académica nesse sentido requer observação empírica, não apenas Playwright.

A monografia canónica `Monografia_D44_Metodologia_Proveniencia_Verificada.docx` e os comentários do supervisor permanecem inalterados. Os screenshots resultantes são dados sintéticos; não devem ser confundidos com entrevistas, avaliações reais ou validação de hipótese.
