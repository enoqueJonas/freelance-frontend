import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { externalPayments } from './externalPayments';
import { Contract, EmployerProfile, WorkerProfile, User } from '../types';

const values = new Map<string, string>();
const memoryStorage: Storage = {
  get length() { return values.size; },
  clear: () => values.clear(),
  getItem: key => values.get(key) ?? null,
  key: index => [...values.keys()][index] ?? null,
  removeItem: key => { values.delete(key); },
  setItem: (key, value) => { values.set(key, String(value)); }
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: memoryStorage });

const employer: User = {
  id: 1, username: 'payer', email: 'payer@example.test', first_name: 'Payer',
  last_name: 'Demo', role: 'employer', is_verified: true, date_joined: '2026-01-01'
};
const worker: User = {
  id: 2, username: 'worker', email: 'worker@example.test', first_name: 'Worker',
  last_name: 'Demo', role: 'worker', is_verified: true, date_joined: '2026-01-01'
};
const outsider: User = {
  id: 3, username: 'other', email: 'other@example.test', first_name: 'Other',
  last_name: 'Demo', role: 'employer', is_verified: true, date_joined: '2026-01-01'
};
const employerProfile: EmployerProfile = {
  id: 12, userId: 1, companyName: 'Empresa Demo', contactName: 'Payer Demo',
  email: employer.email, description: '', location: 'Maputo', industry: 'IT',
  documentStatus: 'approved'
};
const workerProfile: WorkerProfile = {
  id: 21, userId: 2, firstName: 'Worker', lastName: 'Demo', email: worker.email,
  title: 'Dev', bio: '', skills: [], experienceYears: 1, completedJobs: 0,
  averageRating: 0, documentStatus: 'approved', location: 'Maputo'
};
const contract: Contract = {
  id: 71, proposalId: 70, offerId: 60, employerId: 1, workerId: 21,
  employerProfile, workerProfile, title: 'Trabalho Demo', description: 'Teste',
  budget: 1000, startDate: '2026-01-01', endDate: '2026-12-31',
  status: 'active', createdAt: '2026-01-01T00:00:00Z',
  signedByWorker: true, signedByEmployer: true
};
const today = () => new Date().toISOString().slice(0, 10);
const payment = (amount = 400) => ({
  amount, method: 'M-Pesa' as const, stage: 'ADVANCE' as const,
  moment: 'Após aceitação do contrato', paidOn: today(), externalReference: 'EXT-001'
});
const seed = (key: string, payload: unknown) => localStorage.setItem(key, JSON.stringify(payload));

beforeEach(() => {
  memoryStorage.clear();
  seed('serviplus_users', [employer, worker, outsider]);
  seed('serviplus_contracts', [contract]);
  seed('serviplus_payments', []);
  seed('serviplus_notifications', []);
});

test('V05: reportar pagamento externo não confirma o recebimento', async () => {
  const item = await externalPayments.report(contract.id, employer.id, payment());
  assert.equal(item.status, 'REPORTED_PAID');
  assert.equal(item.reportedByUserId, employer.id);
  assert.equal(item.amount, 400);
  assert.equal(item.history.length, 1);
  assert.equal((await externalPayments.listForContract(contract.id, worker.id)).items[0].status, 'REPORTED_PAID');
});

test('V05: trabalhador confirma a recepção; histórico mantém ambas as declarações', async () => {
  const item = await externalPayments.report(contract.id, employer.id, payment());
  const confirmed = await externalPayments.respond(item.id, worker.id, 'CONFIRMED');
  assert.equal(confirmed.status, 'CONFIRMED');
  assert.equal(confirmed.respondedByUserId, worker.id);
  assert.equal(confirmed.history.length, 2);
  await assert.rejects(externalPayments.respond(item.id, worker.id, 'CONFIRMED'), /já foi respondido/);
});

test('V05: trabalhador contesta declaração com motivo, sem arbitragem automática', async () => {
  const item = await externalPayments.report(contract.id, employer.id, payment());
  await assert.rejects(externalPayments.respond(item.id, worker.id, 'CONTESTED', 'não'), /pelo menos 8/);
  const contested = await externalPayments.respond(item.id, worker.id, 'CONTESTED', 'O valor não foi recebido');
  assert.equal(contested.status, 'CONTESTED');
  assert.equal(contested.history.length, 2);
  assert.match(contested.responseNote || '', /não foi recebido/);
});

test('RN10: uma parte não pode confirmar o seu próprio pagamento', async () => {
  const item = await externalPayments.report(contract.id, employer.id, payment());
  await assert.rejects(externalPayments.respond(item.id, employer.id, 'CONFIRMED'), /Só o trabalhador/);
  assert.equal((await externalPayments.listForContract(contract.id, worker.id)).items[0].status, 'REPORTED_PAID');
});

test('RN09: requer valores válidos, etapa, momento e data', async () => {
  await assert.rejects(externalPayments.report(contract.id, employer.id, payment(0)), /valor positivo/);
  await assert.rejects(externalPayments.report(contract.id, employer.id, payment(13.333)), /valor positivo/);
  await assert.rejects(externalPayments.report(contract.id, employer.id, {
    ...payment(), paidOn: '2026-02-31'
  }), /data válida/);
  await assert.rejects(externalPayments.report(contract.id, employer.id, {
    ...payment(), moment: ''
  }), /momento/);
});

test('RN09: pagamentos por etapas não podem exceder o orçamento declarado', async () => {
  await externalPayments.report(contract.id, employer.id, payment(600));
  await externalPayments.report(contract.id, employer.id, payment(400));
  await assert.rejects(externalPayments.report(contract.id, employer.id, payment(1)), /excede/);
});

test('RF19: declaração contestada pode ser substituída sem contá-la como recebida', async () => {
  const item = await externalPayments.report(contract.id, employer.id, payment(1000));
  await externalPayments.respond(item.id, worker.id, 'CONTESTED', 'Não recebi o valor');
  const corrected = await externalPayments.report(contract.id, employer.id, payment(1000));
  assert.equal(corrected.status, 'REPORTED_PAID');
  assert.equal((await externalPayments.listForContract(contract.id, worker.id)).items.length, 2);
});

test('autorização simulada: somente partes do contrato consultam ou alteram dados', async () => {
  await assert.rejects(externalPayments.report(contract.id, outsider.id, payment()), /Apenas o empregador/);
  await assert.rejects(externalPayments.listForContract(contract.id, outsider.id), /permissão/);
  const item = await externalPayments.report(contract.id, employer.id, payment());
  await assert.rejects(externalPayments.respond(item.id, outsider.id, 'CONFIRMED'), /Só o trabalhador/);
});

test('legado: pagamentos com completed da simulação antiga NÃO são confirmados', async () => {
  seed('serviplus_payments', [{
    id: 9, contractId: contract.id, amount: 1000, status: 'completed',
    payoutMethod: 'M-Pesa', refCode: 'MP-FAKE', createdAt: '2026-01-01T00:00:00Z'
  }]);
  const list = await externalPayments.listForContract(contract.id, worker.id);
  assert.equal(list.legacyUnverifiedCount, 1);
  assert.equal(list.items.length, 0);
  const newRecord = await externalPayments.report(contract.id, employer.id, payment(1000));
  assert.equal(newRecord.status, 'REPORTED_PAID');
});
