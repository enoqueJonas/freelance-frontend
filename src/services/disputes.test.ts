import { beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { disputeService } from './disputes';
import { Contract, EmployerProfile, WorkerProfile, User } from '../types';

const store = new Map<string, string>();
const storage: Storage = {
  get length() { return store.size; },
  clear: () => store.clear(),
  getItem: key => store.get(key) ?? null,
  key: index => [...store.keys()][index] ?? null,
  removeItem: key => { store.delete(key); },
  setItem: (key, value) => { store.set(key, String(value)); }
};
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage });

const worker: User = {
  id: 1, username: 'worker', email: 'worker@example.test',
  first_name: 'Ana', last_name: 'Teste', role: 'worker',
  is_verified: true, date_joined: '2026-01-01'
};
const employer: User = {
  id: 2, username: 'employer', email: 'employer@example.test',
  first_name: 'Beto', last_name: 'Teste', role: 'employer',
  is_verified: true, date_joined: '2026-01-01'
};
const admin: User = {
  id: 12, username: 'admin', email: 'admin@example.test',
  first_name: 'Admin', last_name: 'Teste', role: 'admin',
  is_verified: true, date_joined: '2026-01-01'
};
const outsider: User = {
  id: 44, username: 'outsider', email: 'outsider@example.test',
  first_name: 'Rui', last_name: 'Teste', role: 'worker',
  is_verified: true, date_joined: '2026-01-01'
};
const ep: EmployerProfile = {
  id: 20, userId: employer.id, companyName: 'Empresa Teste',
  contactName: 'Beto Teste', email: employer.email,
  description: '', location: 'Maputo', industry: 'IT', documentStatus: 'approved'
};
const wp: WorkerProfile = {
  id: 10, userId: worker.id, firstName: 'Ana', lastName: 'Teste',
  email: worker.email, title: 'Programadora', bio: '', skills: ['React'],
  experienceYears: 2, completedJobs: 0, averageRating: 0,
  documentStatus: 'approved', location: 'Maputo'
};
const contract: Contract = {
  id: 9, proposalId: 99, offerId: 10, employerId: employer.id, workerId: wp.id,
  employerProfile: ep, workerProfile: wp, title: 'Website de teste',
  description: 'Desenvolvimento', budget: 25000,
  startDate: '2026-01-01', endDate: '2026-12-31',
  status: 'active', createdAt: '2026-01-01T10:00:00Z',
  signedByWorker: true, signedByEmployer: true
};
const complaint = () => ({
  category: 'DELIVERABLE' as const,
  description: 'A entrega recebida não corresponde ao que está descrito no acordo.',
  evidenceDescription: 'Captura de ecrã sintética do requisito do serviço.',
  evidenceUrl: 'https://example.test/evidence/1'
});
const seed = (k: string, v: unknown) => localStorage.setItem(k, JSON.stringify(v));
const read = <T,>(k: string): T[] => JSON.parse(localStorage.getItem(k) || '[]') as T[];

beforeEach(() => {
  store.clear();
  seed('serviplus_users', [worker, employer, admin, outsider]);
  seed('serviplus_contracts', [contract]);
  seed('serviplus_notifications', []);
});

test('V07-A: parte reporta categoria e evidência e o conflito inicia OPEN', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  assert.equal(d.status, 'OPEN');
  assert.equal(d.category, 'DELIVERABLE');
  assert.equal(d.evidence.length, 1);
  assert.equal(d.events[0].action, 'REPORTED');
  assert.equal(d.contractId, contract.id);
  assert.equal(read<Contract>('serviplus_contracts')[0].status, 'active');
});

test('V07-A: as duas partes podem reportar; não participantes são bloqueados', async () => {
  const d = await disputeService.report(contract.id, employer.id, complaint());
  assert.equal(d.reportedByUserId, employer.id);
  await assert.rejects(disputeService.report(contract.id, outsider.id, complaint()), /Apenas uma parte/);
  await assert.rejects(disputeService.report(contract.id, admin.id, complaint()), /Apenas uma parte/);
});

test('V07-B: abertura de análise exige administrador e motivo', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await assert.rejects(disputeService.beginReview(d.id, worker.id, 'Verificar documentação'), /Apenas administradores/);
  await assert.rejects(disputeService.beginReview(d.id, admin.id, ''), /Motivo da análise/);
  const reviewed = await disputeService.beginReview(d.id, admin.id, 'Conferência administrativa dos documentos apresentados');
  assert.equal(reviewed.status, 'UNDER_REVIEW');
  assert.equal(reviewed.events[1].action, 'REVIEW_STARTED');
  assert.equal(reviewed.events[1].actorUserId, admin.id);
});

test('V07-C: pedido de informação identifica destinatário, motivo e WAITING_INFORMATION', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await disputeService.beginReview(d.id, admin.id, 'Analisar o relato inicial');
  await assert.rejects(disputeService.requestInformation(d.id, admin.id, outsider.id, 'Envie detalhes do contrato'), /parte do contrato/);
  const waiting = await disputeService.requestInformation(
    d.id, admin.id, employer.id, 'Indique a data da aprovação do escopo.'
  );
  assert.equal(waiting.status, 'WAITING_INFORMATION');
  assert.equal(waiting.requestedFromUserId, employer.id);
  assert.equal(waiting.events.at(-1)?.action, 'INFORMATION_REQUESTED');
});

test('V07-D: evidência não solicitada não elimina o pedido dirigido à contraparte', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await disputeService.beginReview(d.id, admin.id, 'Recepção e triagem do reporte');
  await disputeService.requestInformation(d.id, admin.id, employer.id, 'Solicite-se o resumo de alterações acordadas.');
  const otherEvidence = await disputeService.addEvidence(d.id, worker.id, 'Email descritivo guardado em dados de teste.');
  assert.equal(otherEvidence.status, 'WAITING_INFORMATION');
  assert.equal(otherEvidence.requestedFromUserId, employer.id);
  assert.equal(otherEvidence.events.at(-1)?.action, 'EVIDENCE_ADDED');
});

test('V07-D: resposta da parte solicitada retoma UNDER_REVIEW com evidência e autoria', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await disputeService.beginReview(d.id, admin.id, 'Analisar evidências sintéticas');
  await disputeService.requestInformation(d.id, admin.id, employer.id, 'Qual a data de aceitação dos requisitos?');
  const updated = await disputeService.addEvidence(
    d.id, employer.id, 'Mensagem de aceitação enviada em 2 de novembro.',
    'https://example.test/accepted-scope'
  );
  assert.equal(updated.status, 'UNDER_REVIEW');
  assert.equal(updated.requestedFromUserId, undefined);
  assert.equal(updated.evidence.length, 2);
  assert.equal(updated.evidence[1].authorUserId, employer.id);
  assert.equal(updated.events.at(-1)?.action, 'INFORMATION_SUPPLIED');
});

test('V07-E: resultado e encerramento apenas administrativos, preservando contrato', async () => {
  const d = await disputeService.report(contract.id, employer.id, complaint());
  await disputeService.beginReview(d.id, admin.id, 'Abrir análise documental');
  const resolved = await disputeService.registerAdministrativeResult(
    d.id, admin.id, 'As partes foram informadas dos registos apresentados. Não houve arbitragem.'
  );
  assert.equal(resolved.status, 'RESOLVED');
  assert.equal(resolved.events.at(-1)?.action, 'ADMINISTRATIVE_RESULT');
  const closed = await disputeService.closeCase(
    d.id, admin.id, 'O acompanhamento administrativo foi concluído.'
  );
  assert.equal(closed.status, 'CLOSED');
  assert.equal(closed.events.at(-1)?.action, 'ADMINISTRATIVELY_CLOSED');
  assert.equal(closed.events.length, 4);
  assert.equal(read<Contract>('serviplus_contracts')[0].status, 'active');
  await assert.rejects(disputeService.addEvidence(d.id, worker.id, 'Nova evidência sintética'), /encerrado/);
});

test('V07: transições inválidas não alteram o estado nem o histórico', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await assert.rejects(disputeService.closeCase(d.id, admin.id, 'Fecho sem análise'), /resultado administrativo/);
  await assert.rejects(disputeService.registerAdministrativeResult(
    d.id, admin.id, 'Resultado sem revisão documental suficiente'
  ), /análise em curso/);
  await assert.rejects(disputeService.requestInformation(
    d.id, admin.id, worker.id, 'Por favor, envie uma evidência adicional.'
  ), /análise em curso/);
  assert.equal((await disputeService.listForUser(worker.id))[0].status, 'OPEN');
  assert.equal((await disputeService.listForUser(worker.id))[0].events.length, 1);
});

test('RN14: partes consultam ocorrências do próprio contrato; não há exposição a terceiros', async () => {
  await disputeService.report(contract.id, worker.id, complaint());
  assert.equal((await disputeService.listForUser(worker.id)).length, 1);
  assert.equal((await disputeService.listForUser(employer.id)).length, 1);
  assert.equal((await disputeService.listForUser(admin.id)).length, 1);
  assert.equal((await disputeService.listForUser(outsider.id)).length, 0);
  await assert.rejects(disputeService.addEvidence(1, outsider.id, 'Prova de uma parte estranha ao acordo'), /Apenas as partes/);
});

test('RN14: URL inseguro não entra no registo', async () => {
  await assert.rejects(disputeService.report(contract.id, worker.id, {
    ...complaint(), evidenceUrl: 'javascript:alert(1)'
  }), /HTTP\(S\)/);
  assert.equal((await disputeService.listForUser(worker.id)).length, 0);
});

test('RN16: actos de análise administrativa preservam autor, data, nota e estado', async () => {
  const d = await disputeService.report(contract.id, worker.id, complaint());
  await disputeService.beginReview(d.id, admin.id, 'Iniciar revisão humana dos factos reportados');
  const updated = (await disputeService.listForUser(admin.id))[0];
  for (const e of updated.events) {
    assert.ok(Number.isFinite(Date.parse(e.recordedAt)));
    assert.ok(e.note.length > 0);
    assert.ok(e.actorUserId > 0);
    assert.ok(e.statusAfter);
  }
  const notifications = read<{userId:number; text:string}>('serviplus_notifications');
  assert.ok(notifications.some(n => n.userId === admin.id));
});

test('Legado: contrato marcado disputed pelo mock anterior não cria arbitragem automática', async () => {
  seed('serviplus_contracts', [{ ...contract, status: 'disputed' }]);
  assert.equal((await disputeService.listForUser(worker.id)).length, 0);
  const created = await disputeService.report(contract.id, worker.id, complaint());
  assert.equal(created.status, 'OPEN');
  assert.equal(read<Contract>('serviplus_contracts')[0].status, 'disputed');
});
