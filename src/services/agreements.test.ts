import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { agreements } from './agreements';
import { externalPayments } from './externalPayments';
import type {
  AgreementTerms, Contract, EmployerProfile, WorkerProfile, User
} from '../types';

const values = new Map<string, string>();
const storage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: key => values.get(key) ?? null,
  key: i => [...values.keys()][i] ?? null,
  removeItem: k => { values.delete(k); },
  setItem: (k, v) => { values.set(k, String(v)); }
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

const employer: User = {
  id: 1, email: 'employer@example.test', username: 'employer',
  first_name: 'Beto', last_name: 'Teste', role: 'employer',
  is_verified: true, date_joined: '2026-01-01'
};
const worker: User = {
  id: 2, email: 'worker@example.test', username: 'worker',
  first_name: 'Ana', last_name: 'Teste', role: 'worker',
  is_verified: true, date_joined: '2026-01-01'
};
const admin: User = {
  id: 3, email: 'admin@example.test', username: 'admin',
  first_name: 'Admin', last_name: 'Teste', role: 'admin',
  is_verified: true, date_joined: '2026-01-01'
};
const ep: EmployerProfile = {
  id: 10, userId: 1, companyName: 'Empresa Teste', contactName: 'Beto Teste',
  email: employer.email, description: '', location: 'Maputo', industry: 'TI',
  documentStatus: 'approved'
};
const wp: WorkerProfile = {
  id: 11, userId: 2, firstName: 'Ana', lastName: 'Teste',
  email: worker.email, title: 'Programadora', bio: '', skills: ['React'],
  location: 'Maputo', documentStatus: 'approved',
  experienceYears: 2, completedJobs: 0, averageRating: 0
};
const contract: Contract = {
  id: 7, proposalId: 5, offerId: 4,
  employerId: 1, workerId: wp.id, employerProfile: ep, workerProfile: wp,
  title: 'Desenvolvimento de portal', description: 'Criar portal para a empresa com autenticação e relatórios.',
  budget: 20000, startDate: '2026-11-11', endDate: '2026-12-15',
  status: 'pending', signedByWorker: false, signedByEmployer: false,
  createdAt: '2026-11-10T00:00:00Z'
};
const terms = (price = 20000): AgreementTerms => ({
  title: 'Desenvolvimento de portal',
  scope: 'Implementar um portal para consulta de serviços com controlo de acesso.',
  deliverables: 'Código-fonte, documentação técnica e demonstração funcional.',
  acceptanceCriteria: 'Validação de login, consulta e relatório segundo os casos de teste.',
  budget: price, startDate: '2026-11-11', endDate: '2026-12-15',
  paymentConditions: [
    {
      id: 'advance', stage: 'ADVANCE', method: 'M-Pesa',
      amount: price / 4, moment: 'Após assinatura do acordo por ambas as partes'
    },
    {
      id: 'final', stage: 'FINAL', method: 'Transferência Bancária',
      amount: price * 3 / 4, moment: 'Depois da entrega aceite formalmente'
    }
  ]
});
const write = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const read = <T,>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]') as T[];
const contractNow = () => read<Contract>('serviplus_contracts')[0];

beforeEach(() => {
  values.clear();
  write('serviplus_users', [employer, worker, admin]);
  write('serviplus_contracts', [contract]);
  write('serviplus_payments', []);
  write('serviplus_notifications', []);
  write('conecta_agreement_versions_v1', []);
});
const publishInitial = async () => {
  const draft = await agreements.initializeDraft(contract.id, employer.id);
  await agreements.saveDraft(draft.id, employer.id, terms());
  await agreements.submitDraft(draft.id, employer.id);
  return draft.id;
};
const activateInitial = async () => {
  const id = await publishInitial();
  await agreements.approve(id, employer.id);
  await agreements.approve(id, worker.id);
  return (await agreements.activeForContract(contract.id, employer.id))!;
};

test('RF13: contrato gera rascunho sem qualquer assinatura presumida', async () => {
  const initial = await agreements.initializeDraft(contract.id, employer.id);
  assert.equal(initial.number, 1);
  assert.equal(initial.status, 'DRAFT');
  assert.equal(initial.approvals.length, 0);
  assert.equal(contractNow().signedByEmployer, false);
  assert.equal(contractNow().signedByWorker, false);
  assert.equal(contractNow().status, 'pending');
});

test('RF13: publicação incompleta é recusada; não altera contrato', async () => {
  const draft = await agreements.initializeDraft(contract.id, employer.id);
  await assert.rejects(agreements.submitDraft(draft.id, employer.id), /entregáveis e critérios/);
  assert.equal((await agreements.listForContract(contract.id, employer.id))[0].status, 'DRAFT');
  assert.equal(contractNow().status, 'pending');
});

test('RF13: publicação valida valor, prazos e soma das etapas', async () => {
  const draft = await agreements.initializeDraft(contract.id, employer.id);
  const incorrect = terms();
  incorrect.paymentConditions[0].amount = 8000;
  await agreements.saveDraft(draft.id, employer.id, incorrect);
  await assert.rejects(agreements.submitDraft(draft.id, employer.id), /soma dos pagamentos/);
  const badDate = terms();
  badDate.endDate = '2026-02-31';
  await agreements.saveDraft(draft.id, employer.id, badDate);
  await assert.rejects(agreements.submitDraft(draft.id, employer.id), /datas/);
  await agreements.saveDraft(draft.id, employer.id, terms());
  assert.equal((await agreements.submitDraft(draft.id, employer.id)).status, 'PENDING_APPROVAL');
});

test('RF13: apenas aprovação bilateral da mesma versão activa o contrato', async () => {
  const id = await publishInitial();
  const first = await agreements.approve(id, employer.id);
  assert.equal(first.status, 'PENDING_APPROVAL');
  assert.equal(first.approvals.length, 1);
  assert.equal(contractNow().status, 'pending');
  assert.equal(contractNow().signedByEmployer, false); // sem falso estado de assinatura
  await assert.rejects(agreements.approve(id, employer.id), /duas vezes/);
  const active = await agreements.approve(id, worker.id);
  assert.equal(active.status, 'ACTIVE');
  assert.equal(active.approvals.length, 2);
  assert.deepEqual(active.approvals.map(a => a.userId).sort(), [1, 2]);
  assert.equal(contractNow().status, 'active');
  assert.equal(contractNow().signedByEmployer, true);
  assert.equal(contractNow().signedByWorker, true);
});

test('RF13: terceiros e administradores não aprovam em nome das partes', async () => {
  const id = await publishInitial();
  await assert.rejects(agreements.approve(id, admin.id), /Só as partes/);
  await assert.rejects(agreements.saveDraft(id, worker.id, terms()), /Só o autor/);
  const list = await agreements.listForContract(contract.id, admin.id);
  assert.equal(list[0].approvals.length, 0);
});

test('RF14: versão publicada é imutável através da interface do serviço', async () => {
  const id = await publishInitial();
  await assert.rejects(agreements.saveDraft(id, employer.id, terms(10000)), /Só o autor/);
  const copy = await agreements.listForContract(contract.id, employer.id);
  copy[0].terms.scope = 'texto adulterado';
  const saved = await agreements.listForContract(contract.id, worker.id);
  assert.ok(!saved[0].terms.scope.includes('adulterado'));
});

test('RF14: nova versão não modifica as condições existentes enquanto pendente', async () => {
  const original = await activateInitial();
  const second = await agreements.openAmendment(contract.id, worker.id,
    'Alteração de entregáveis e do orçamento acordado');
  const updated = terms(24000);
  updated.deliverables = 'Código-fonte, testes automatizados, documentação e painel de administração.';
  await agreements.saveDraft(second.id, worker.id, updated);
  await agreements.submitDraft(second.id, worker.id);
  await agreements.approve(second.id, worker.id);
  assert.equal(contractNow().budget, 20000);
  assert.equal(contractNow().status, 'active');
  assert.equal((await agreements.activeForContract(contract.id, employer.id))!.id, original.id);
  assert.equal((await agreements.listForContract(contract.id, employer.id))[0].status, 'PENDING_APPROVAL');
});

test('RF14: segunda aprovação activa v2 e preserva snapshot histórico de v1', async () => {
  const original = await activateInitial();
  const next = await agreements.openAmendment(contract.id, worker.id,
    'Adicionar fase de validação com testes de regressão');
  const revised = terms(24000);
  revised.scope = 'Implementar portal de serviços, painel de gestão e automação de regressão.';
  await agreements.saveDraft(next.id, worker.id, revised);
  await agreements.submitDraft(next.id, worker.id);
  await agreements.approve(next.id, employer.id);
  await agreements.approve(next.id, worker.id);
  const list = await agreements.listForContract(contract.id, employer.id);
  assert.equal(list.length, 2);
  assert.equal(list[0].number, 2);
  assert.equal(list[0].status, 'ACTIVE');
  assert.equal(list[1].status, 'SUPERSEDED');
  assert.equal(list[1].id, original.id);
  assert.equal(list[1].terms.budget, 20000);
  assert.equal(list[0].terms.budget, 24000);
  assert.equal(contractNow().budget, 24000);
  assert.equal(contractNow().description, revised.scope);
  assert.ok(list[1].events.some(e => e.action === 'SUPERSEDED'));
});

test('RF14: rejeição de alteração não altera o acordo anteriormente aceite', async () => {
  const original = await activateInitial();
  const proposed = await agreements.openAmendment(contract.id, employer.id,
    'Rever o prazo de entrega inicialmente estabelecido');
  const updated = terms();
  updated.endDate = '2027-01-15';
  await agreements.saveDraft(proposed.id, employer.id, updated);
  await agreements.submitDraft(proposed.id, employer.id);
  await agreements.approve(proposed.id, employer.id);
  const rejected = await agreements.reject(proposed.id, worker.id,
    'O prazo proposto não respeita a disponibilidade acordada.');
  assert.equal(rejected.status, 'REJECTED');
  assert.equal(contractNow().endDate, original.terms.endDate);
  assert.equal((await agreements.activeForContract(contract.id, worker.id))!.id, original.id);
  const third = await agreements.openAmendment(contract.id, worker.id,
    'Proposta alternativa após a recusa da segunda versão');
  assert.equal(third.number, 3);
});

test('RF13: proposta inicial recusada pode ser renegociada sem apagar o histórico', async () => {
  const first = await publishInitial();
  await agreements.reject(first, worker.id, 'Entregáveis insuficientemente detalhados.');
  assert.equal(contractNow().status, 'pending');
  const revised = await agreements.redraftInitial(contract.id, employer.id,
    'Clarificar entregáveis e critérios após rejeição');
  assert.equal(revised.number, 2);
  assert.equal(revised.status, 'DRAFT');
  assert.equal((await agreements.listForContract(contract.id, worker.id))[1].status, 'REJECTED');
});

test('RF14: não se inventam versões aceites para contratos legados', async () => {
  write('serviplus_contracts', [{ ...contract, status: 'active', signedByEmployer: true, signedByWorker: true }]);
  assert.equal((await agreements.listForContract(contract.id, worker.id)).length, 0);
  await assert.rejects(agreements.openAmendment(contract.id, employer.id,
    'Pretendo alterar este contrato legado'), /legado/);
});

test('RF18/RN09: pagamento declarado referencia a versão e etapa aceites', async () => {
  const active = await activateInitial();
  const report = await externalPayments.report(contract.id, employer.id, {
    amount: 2000, method: 'M-Pesa', stage: 'ADVANCE',
    moment: active.terms.paymentConditions[0].moment,
    agreementConditionId: 'advance', paidOn: new Date().toISOString().slice(0, 10)
  });
  assert.equal(report.agreementVersionId, active.id);
  assert.equal(report.agreementConditionId, 'advance');
  assert.equal(report.status, 'REPORTED_PAID');
  await assert.rejects(externalPayments.report(contract.id, employer.id, {
    amount: 1000, method: 'e-Mola', stage: 'ADVANCE',
    moment: active.terms.paymentConditions[0].moment, agreementConditionId: 'advance',
    paidOn: new Date().toISOString().slice(0, 10)
  }), /condição da versão aceite/);
});

test('RF18: um registo não pode exceder o valor da etapa aprovada', async () => {
  const active = await activateInitial();
  const input = {
    amount: 3000, method: 'M-Pesa' as const, stage: 'ADVANCE' as const,
    moment: active.terms.paymentConditions[0].moment,
    agreementConditionId: 'advance', paidOn: new Date().toISOString().slice(0, 10)
  };
  await externalPayments.report(contract.id, employer.id, input);
  await assert.rejects(externalPayments.report(contract.id, employer.id,
    { ...input, amount: 2500 }), /excede a etapa/);
});

test('RF18: orçamento renegociado não pode ficar abaixo dos valores declarados', async () => {
  const active = await activateInitial();
  await externalPayments.report(contract.id, employer.id, {
    amount: 4000, method: 'M-Pesa', stage: 'ADVANCE',
    moment: active.terms.paymentConditions[0].moment,
    agreementConditionId: 'advance', paidOn: new Date().toISOString().slice(0, 10)
  });
  const draft = await agreements.openAmendment(contract.id, employer.id,
    'Proposta de redução do âmbito e preço do trabalho');
  const lower = terms(2000);
  await agreements.saveDraft(draft.id, employer.id, lower);
  await agreements.submitDraft(draft.id, employer.id);
  await agreements.approve(draft.id, employer.id);
  await assert.rejects(agreements.approve(draft.id, worker.id), /pagamentos já declarados/);
  assert.equal(contractNow().budget, 20000);
  assert.equal((await agreements.activeForContract(contract.id, employer.id))!.id, active.id);
});
