import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import type { User, WorkerProfile, EmployerProfile, Contract } from '../types';

// mockApi seeds localStorage during module import, so install storage first.
const map = new Map<string, string>();
const storage: Storage = {
  get length() { return map.size; },
  clear: () => map.clear(),
  getItem: key => map.get(key) ?? null,
  key: index => [...map.keys()][index] ?? null,
  removeItem: key => { map.delete(key); },
  setItem: (key, value) => { map.set(key, String(value)); }
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });
const { mockApi } = await import('./mockApi');
const { externalPayments } = await import('./externalPayments');
const { disputeService } = await import('./disputes');

const admin: User = {
  id: 1, username: 'admin', email: 'admin@example.test',
  first_name: 'Admin', last_name: 'Teste', role: 'admin',
  is_verified: true, date_joined: '2026-01-01'
};
const seed = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
const read = <T,>(key: string): T[] => JSON.parse(localStorage.getItem(key) || '[]') as T[];

beforeEach(() => {
  map.clear();
  seed('serviplus_users', [admin]);
  seed('serviplus_workers', []);
  seed('serviplus_employers', []);
  seed('serviplus_offers', []);
  seed('serviplus_proposals', []);
  seed('serviplus_contracts', []);
  seed('serviplus_payments', []);
  seed('serviplus_notifications', []);
  seed('serviplus_reviews', []);
  seed('conecta_disputes_v1', []);
});

const registerWorker = async (suffix = 'a') =>
  mockApi.auth.register({
    username: 'worker_' + suffix, email: suffix + '@example.test',
    firstName: 'Ana', lastName: suffix, role: 'worker',
    location: 'Maputo', title: 'Programadora', bio: 'Desenvolvimento de TI',
    skills: ['React']
  });
const registerEmployer = async (suffix = 'b') =>
  mockApi.auth.register({
    username: 'employer_' + suffix, email: suffix + '@example.test',
    firstName: 'Beto', lastName: suffix, role: 'employer',
    location: 'Maputo', companyName: 'Empresa Teste', industry: 'Tecnologia'
  });
const verify = async (userId: number, role: 'worker' | 'employer') => {
  assert.equal(await mockApi.auth.uploadVerificationDocument(
    userId, role, 'https://example.test/synthetic-document'
  ), true);
  assert.equal(await mockApi.admin.approveDocument(userId, role, true), true);
};
const post = async (id: number) => mockApi.offers.create(id, {
  title: 'Website de demonstração', description: 'Desenvolvimento de um portal',
  category: 'Desenvolvimento Web', requiredSkills: ['React'],
  salaryBudget: 20000, location: 'Maputo'
});

test('V01: uma conta com perfil trabalhador cria empregador sem duplicar User', async () => {
  const first = await registerWorker();
  const id = first.user.id;
  const second = await mockApi.auth.createAdditionalProfile(id, 'employer', {
    companyName: 'Empresa de Teste', industry: 'TI', location: 'Maputo'
  });
  assert.equal(second.userId, id);
  assert.equal(read<User>('serviplus_users').length, 2); // admin + trabalhador
  assert.equal(read<WorkerProfile>('serviplus_workers').filter(p => p.userId === id).length, 1);
  assert.equal(read<EmployerProfile>('serviplus_employers').filter(p => p.userId === id).length, 1);
  const worker = await mockApi.auth.login(first.user.email, 'worker');
  const employer = await mockApi.auth.login(first.user.email, 'employer');
  assert.deepEqual(worker?.user.roles, ['worker', 'employer']);
  assert.equal(worker?.user.role, 'worker');
  assert.equal(employer?.user.role, 'employer');
  assert.equal(employer?.profile?.userId, id);
});

test('V01: empregador também pode criar perfil trabalhador na mesma conta', async () => {
  const first = await registerEmployer();
  await mockApi.auth.createAdditionalProfile(first.user.id, 'worker', {
    title: 'Especialista de redes', skills: ['Linux', 'Redes']
  });
  const asWorker = await mockApi.auth.login(first.user.email, 'worker');
  const asEmployer = await mockApi.auth.login(first.user.email, 'employer');
  assert.deepEqual(asWorker?.user.roles, ['worker', 'employer']);
  assert.equal(asWorker?.user.role, 'worker');
  assert.equal(asEmployer?.user.role, 'employer');
});

test('V01: os perfis não desaparecem depois de novo login e não podem ser duplicados', async () => {
  const first = await registerWorker();
  await mockApi.auth.createAdditionalProfile(first.user.id, 'employer', {
    companyName: 'Consultoria Local'
  });
  await assert.rejects(
    mockApi.auth.createAdditionalProfile(first.user.id, 'employer', { companyName: 'Duplicado' }),
    /já existe/
  );
  const reloaded = await mockApi.auth.login(first.user.email, 'employer');
  assert.equal(reloaded?.user.role, 'employer');
  assert.equal(reloaded?.user.roles?.length, 2);
});

test('RN01: verificação de um perfil não verifica automaticamente o outro', async () => {
  const first = await registerWorker();
  await mockApi.auth.createAdditionalProfile(first.user.id, 'employer', { companyName: 'Outra entidade' });
  await verify(first.user.id, 'employer');
  const asEmployer = await mockApi.auth.login(first.user.email, 'employer');
  const asWorker = await mockApi.auth.login(first.user.email, 'worker');
  assert.equal(asEmployer?.user.is_verified, true);
  assert.equal(asWorker?.user.is_verified, false);
  assert.equal(asWorker?.profile?.documentStatus, 'unsubmitted');
});

test('RN01: email ou username duplicados são rejeitados', async () => {
  await registerWorker('abc');
  await assert.rejects(mockApi.auth.register({
    username: 'novo_nome', email: 'ABC@example.test', firstName: 'Outra',
    lastName: 'Pessoa', role: 'worker', title: 'Dev', location: 'Maputo'
  }), /já registado/);
  await assert.rejects(mockApi.auth.register({
    username: 'WORKER_ABC', email: 'outro@example.test', firstName: 'Outra',
    lastName: 'Pessoa', role: 'worker', title: 'Dev', location: 'Maputo'
  }), /já registado/);
});

test('RN02: utilizador com dois perfis não pode propor à própria oportunidade', async () => {
  const account = await registerWorker();
  await mockApi.auth.createAdditionalProfile(account.user.id, 'employer', { companyName: 'Empresa Própria' });
  await verify(account.user.id, 'worker');
  await verify(account.user.id, 'employer');
  const offer = await post(account.user.id);
  await assert.rejects(mockApi.proposals.create(account.user.id, offer.id, {
    description: 'Proposta indevida', priceProposal: 18000, timelineDays: 7
  }), /RN02/);
  assert.equal(read('serviplus_proposals').length, 0);
});

test('RN02: terceiros não aceitam propostas nem assinam contrato alheio', async () => {
  const owner = await registerEmployer();
  const applicant = await registerWorker();
  await verify(owner.user.id, 'employer');
  await verify(applicant.user.id, 'worker');
  const offer = await post(owner.user.id);
  const proposal = await mockApi.proposals.create(applicant.user.id, offer.id, {
    description: 'Execução em React', priceProposal: 18000, timelineDays: 15
  });
  assert.equal(proposal.status, 'pending');
  await assert.rejects(mockApi.contracts.createFromProposal(applicant.user.id, proposal.id), /Apenas o empregador/);
  const contract = await mockApi.contracts.createFromProposal(owner.user.id, proposal.id);
  assert.equal(contract.status, 'pending');
  assert.equal(await mockApi.contracts.sign(contract.id, owner.user.id), false);
  assert.equal(await mockApi.contracts.sign(contract.id, applicant.user.id), true);
  assert.equal((await mockApi.contracts.getForUser(applicant.user.id, 'worker'))[0].status, 'active');
});

test('Integração: contrato válido suporta pagamentos externos e reporte não arbitral', async () => {
  const owner = await registerEmployer();
  const applicant = await registerWorker();
  await verify(owner.user.id, 'employer');
  await verify(applicant.user.id, 'worker');
  const offer = await post(owner.user.id);
  const proposal = await mockApi.proposals.create(applicant.user.id, offer.id, {
    description: 'Implementação de portal', priceProposal: 18000, timelineDays: 15
  });
  const contract = await mockApi.contracts.createFromProposal(owner.user.id, proposal.id);
  assert.equal(await mockApi.contracts.sign(contract.id, applicant.user.id), true);
  const p = await externalPayments.report(contract.id, owner.user.id, {
    amount: 3000, method: 'M-Pesa', stage: 'ADVANCE',
    moment: 'Após contrato', paidOn: new Date().toISOString().slice(0, 10)
  });
  assert.equal(p.status, 'REPORTED_PAID');
  assert.equal((await externalPayments.respond(p.id, applicant.user.id, 'CONFIRMED')).status, 'CONFIRMED');
  const d = await disputeService.report(contract.id, applicant.user.id, {
    category: 'DEADLINE',
    description: 'O prazo combinado não foi observado no plano de entrega.',
    evidenceDescription: 'Histórico de mensagens sintético para teste.'
  });
  assert.equal(d.status, 'OPEN');
  assert.equal(read<Contract>('serviplus_contracts')[0].status, 'active');
  assert.equal((await externalPayments.listForContract(contract.id, applicant.user.id)).items.length, 1);
});
