# ConecTA — RN13/RN14/RN16, RF24–RF25, V07

Fonte normativa da implementação: `Monografia_Chirley_112026(1).docx`, regras RN13–RN14/RN16, requisitos RF24–RF25 e cenário V07.

## Comportamento especificado

- **RN13:** conflitos são reportados, documentados e acompanhados, sem autoridade arbitral da plataforma.
- **RN14:** registos relevantes permanecem associados à contratação (Engagement).
- **RN16:** acções administrativas de moderação devem registar motivo e estado.
- **RF24:** reportar conflito associado a uma contratação.
- **RF25:** consultar e acompanhar o estado de um conflito reportado.
- **V07:** reportar com categoria e evidência; abrir análise; pedir informação; acrescentar evidência; registar resultado e encerrar, sem presumir arbitragem.

### Modelo implementado no frontend

| Transição | Autor autorizado | Condição |
|---|---|---|
| Novo → OPEN | Trabalhador ou empregador da contratação | Categoria + descrição + evidência descritiva |
| OPEN → UNDER_REVIEW | Administrador | Motivo da análise |
| UNDER_REVIEW → WAITING_INFORMATION | Administrador | Pedido documentado e destinatário definido |
| WAITING_INFORMATION → UNDER_REVIEW | Parte destinatária | Adiciona evidência descritiva |
| UNDER_REVIEW → RESOLVED | Administrador | Regista resultado **administrativo não vinculativo** |
| RESOLVED → CLOSED | Administrador | Justifica encerramento do acompanhamento |

Uma das partes pode acrescentar informação em OPEN/UNDER_REVIEW/WAITING_INFORMATION. Só a resposta da parte solicitada altera WAITING_INFORMATION para UNDER_REVIEW. Não há mutação automática do status de Contract, julgamento de mérito, condenação, pagamento ou transferência financeira.

O histórico guarda actor, data, acção, estado e nota. Evidências são descrições com URL opcional HTTP(S); não há upload de ficheiros, validação pericial ou garantia de autenticidade. Não utilizar dados sensíveis reais.

### Superfícies alteradas

- `src/services/disputes.ts`: serviço com transições e guardas simuladas.
- `src/types.ts`: entidades `Dispute`, `DisputeEvidence` e `DisputeEvent`.
- `src/components/DisputeTrackingPanel.tsx`: reporte e acompanhamento das partes.
- `src/components/AdminDisputesPanel.tsx`: análise e documentação administrativa.
- `src/pages/Dashboard.tsx`: acesso aos novos componentes, sem botões de arbitragem.
- `src/services/mockApi.ts`: removidos `contracts.dispute` e `admin.resolveDispute` que alteravam unilateralmente contratos.
- Cópia pública limitada que alegava arbitragem actualizada.

### Critérios dos testes

| Cenário | Resultado esperado |
|---|---|
| V07-A — Reporte por trabalhador/empregador | Categoria, evidência e estado OPEN; sem modificar Contract |
| V07-B — Abertura de análise | Apenas administrador; motivo persistido |
| V07-C — Pedido de informação | Participante explicitamente escolhido; WAITING_INFORMATION |
| V07-D — Resposta com evidência | Só resposta da parte solicitada retoma UNDER_REVIEW |
| V07-E — Resultado e encerramento | RESOLVED e CLOSED com histórico; Contract inalterado |
| V07-F — Transição inválida | Rejeitada sem perda de dados |
| RN14 — Isolamento por participação | Terceiros não acedem a registos |
| RN16 — Rastreabilidade | Eventos contêm autor, data, motivo, estado |
| Segurança de URL | Rejeição de esquemas javascript: |
| Dados antigos | Contract legado com status disputed não é automaticamente considerado caso formal |

### Verificação técnica

```bash
npm ci
npm run lint
npm run build
npm test
```

Os 12 testes unitários encontram-se em `src/services/disputes.test.ts`.

## Limitações e trabalho pendente

1. Autorização e histórico são simulados em `localStorage`: qualquer utilizador com acesso ao navegador pode modificar os dados. A implementação em backend deve impor autenticação, permissões e armazenamento persistente antes de usar dados reais.
2. Evidências de V07 são descritivas e URLs; falta um sistema de anexos seguros e preservação de ficheiros.
3. RESOLVED significa apenas **resultado de acompanhamento administrativo registado**, não decisão arbitral.
4. Os contratos marcados `disputed` pela implementação antiga mantêm-se legados; a migração exige análise explícita, sem inventar motivos ou evidências.
5. PR #8 e PR #9 são branches independentes. Após merge/rebase, é obrigatório executar testes de integração combinados e reconciliar possíveis alterações simultâneas em `Dashboard.tsx`, `mockApi.ts` e `LandingPage.tsx`.

**Condição de aceitação académica:** para afirmar que V07 passou, executar os fluxos com contas sintéticas, capturar resultados e conservar evidências da execução. Passagem de CI não substitui testes manuais nem validação com utilizadores.
