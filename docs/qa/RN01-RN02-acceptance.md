# ConecTA — RN01 / RN02 / V01 / V02: protocolo de aceitação

**Origem:** `Monografia_Chirley_112026(1).docx`, regras RN01–RN02 e cenários V01–V02.
**Estado:** Implementação inicial no frontend simulado. **Não executado / não validado por testes**.
**Ambiente:** Vite + React, `mockApi.ts` / `localStorage`. Dados usados apenas para testes sintéticos.

## Requisitos e limites

- **RN01:** o mesmo utilizador pode ter perfis de trabalhador e empregador; o papel é contextual.
- **RN02:** o utilizador não pode representar os dois lados da mesma oportunidade ou contratação.
- **V01:** conta sintética com ambos os perfis e evidências profissionais; conservar dados após nova sessão.
- **V02:** a proposta à própria oportunidade deve ser recusada.

Este incremento cobre **criação do segundo perfil, alternância contextual, persistência local e guarda de autocontratação**.
Não comprova ainda a gestão completa de evidências, autenticação real, autorização no servidor nem a formalização integral do acordo V02.

## Casos a executar

| Caso | Procedimento | Resultado esperado | Estado |
|---|---|---|---|
| V01-A | Registar trabalhador e criar perfil adicional de empregador no painel | Um `User.id`, dois perfis distintos, papel activo empregador | Não executado |
| V01-B | Registar empregador e criar perfil adicional de trabalhador | Mesmo `User.id`; ambos disponíveis | Não executado |
| V01-C | Alternar trabalhador → empregador → trabalhador | Navegação e dados específicos do papel; sem perder perfis | Não executado |
| V01-D | Recarregar a página; terminar sessão e voltar a entrar | Ambos os perfis permanecem; a sessão restaurada mantém o papel escolhido quando aplicável | Não executado |
| V01-E | Submeter documento no papel secundário; aprovar no painel administrador | Estado do perfil secundário muda; o primário permanece independente | Não executado |
| V01-F | Tentar criar um segundo perfil do mesmo tipo | Operação rejeitada sem duplicação | Não executado |
| V01-G | Acrescentar portfólio, certificação e outras evidências ao perfil profissional | Evidências persistem e podem ser consultadas | **Fora deste incremento** |
| V02-A | Uma conta com dois perfis publica uma oportunidade e tenta candidatar-se a ela no papel trabalhador | Mensagem de bloqueio RN02; nenhuma proposta criada | Não executado |
| V02-B | Outra conta verificada apresenta uma proposta à oportunidade | Proposta criada para o trabalhador distinto | Não executado |
| V02-C | Utilizador não proprietário tenta aceitar uma proposta | Aceitação rejeitada pelo serviço simulado | Não executado |
| V02-D | Utilizador não pertencente ao contrato tenta assiná-lo | Assinatura recusada pelo serviço simulado | Não executado |
| V02-E | Empregador aceita proposta válida | Contrato fica `pending`, sem activar até assinatura pelo trabalhador | Não executado |

## Verificações técnicas obrigatórias

```bash
npm ci
npm run lint
npm run build
```

Executar depois os cenários com dados sintéticos em ambiente limpo. O protótipo usa `localStorage`; não usar dados pessoais nem documentos de identificação reais.

## Critério de conclusão

**RN01 / RN02 não devem ser classificados como validados** até:
1. A build e a verificação TypeScript passarem.
2. Os cenários positivos e negativos acima serem executados e documentados.
3. A integração real com o backend repetir a validação de autorização por proprietário e por papel.
4. O registo de evidências de V01 ser implementado e verificado.

A matriz da monografia deve distinguir *implementação simulada* de *validação experimental*.
