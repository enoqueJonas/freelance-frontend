import {
  Contract, Dispute, DisputeAction, DisputeCategory, DisputeEvidence,
  DisputeEvent, DisputeStatus, Notification, User
} from '../types';

/**
 * Fluxo administrativo de conflitos RN13–RN14, RN16, RF24–RF25, V07.
 * Armazenamento/autorizações apenas simulados em localStorage.
 * Nunca decide direitos, transfere dinheiro ou altera o estado do contrato.
 */
const DISPUTES_KEY = 'conecta_disputes_v1';
const CONTRACTS_KEY = 'serviplus_contracts';
const USERS_KEY = 'serviplus_users';
const NOTIFICATIONS_KEY = 'serviplus_notifications';
const CATEGORIES: DisputeCategory[] =
  ['SCOPE', 'DEADLINE', 'DELIVERABLE', 'PAYMENT', 'COMMUNICATION', 'OTHER'];

const read = <T,>(key: string): T[] => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error('Registos locais inválidos; não serão substituídos.');
  return parsed as T[];
};
const save = <T,>(key: string, data: T[]) => localStorage.setItem(key, JSON.stringify(data));
const allCases = () => read<Dispute>(DISPUTES_KEY);
const allUsers = () => read<User>(USERS_KEY);
const allContracts = () => read<Contract>(CONTRACTS_KEY);
const nextId = (items: { id: number }[]) => Math.max(0, ...items.map(i => i.id)) + 1;
const timestamp = () => new Date().toISOString();

const getUser = (id: number) => {
  const user = allUsers().find(u => u.id === id);
  if (!user) throw new Error('Utilizador não encontrado.');
  return user;
};
const requireAdmin = (id: number) => {
  const user = getUser(id);
  if (user.role !== 'admin') throw new Error('Apenas administradores podem actualizar a análise.');
};
const getCase = (caseId: number) => {
  const dispute = allCases().find(d => d.id === caseId);
  if (!dispute) throw new Error('Conflito não encontrado.');
  return dispute;
};
const participant = (d: Dispute, id: number) =>
  d.employerUserId === id || d.workerUserId === id;
const ensureParticipant = (d: Dispute, id: number) => {
  getUser(id);
  if (!participant(d, id)) throw new Error('Apenas as partes deste contrato podem fornecer evidências.');
};

const notify = (recipientIds: number[], message: string) => {
  const current = read<Notification>(NOTIFICATIONS_KEY);
  const now = timestamp();
  let id = nextId(current);
  const knownIds = new Set(allUsers().map(u => u.id));
  const destinations = [...new Set(recipientIds)].filter(x => knownIds.has(x));
  for (const userId of destinations) {
    current.unshift({
      id: id++, userId, text: message, isRead: false,
      createdAt: now, type: 'system'
    });
  }
  save(NOTIFICATIONS_KEY, current);
};
const admins = () => allUsers().filter(u => u.role === 'admin').map(u => u.id);
const appendEvent = (
  d: Dispute, action: DisputeAction, actorUserId: number, note: string,
  nextStatus: DisputeStatus = d.status
) => {
  const now = timestamp();
  d.status = nextStatus;
  d.updatedAt = now;
  const entry: DisputeEvent = {
    id: nextId(d.events), action, actorUserId, recordedAt: now,
    note, statusAfter: nextStatus
  };
  d.events.push(entry);
  return entry;
};
const update = (d: Dispute) => {
  const list = allCases();
  const index = list.findIndex(item => item.id === d.id);
  if (index < 0) throw new Error('Conflito não encontrado para actualização.');
  list[index] = d;
  save(DISPUTES_KEY, list);
  return d;
};
const validUrl = (url: string) => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('invalid');
    return parsed.href;
  } catch {
    throw new Error('A referência da evidência deve ser um URL HTTP(S) válido.');
  }
};
const evidenceInput = (description: string, url?: string) => {
  const detail = description.trim();
  if (detail.length < 8 || detail.length > 2000) {
    throw new Error('Descreva a evidência (8 a 2000 caracteres).');
  }
  return { description: detail, url: validUrl((url || '').trim()) };
};
const notes = (value: string, label: string, min = 8) => {
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > 4000) {
    throw new Error(label + ' deve conter entre ' + min + ' e 4000 caracteres.');
  }
  return trimmed;
};

export const disputeService = {
  async listForUser(userId: number): Promise<Dispute[]> {
    const user = getUser(userId);
    return allCases()
      .filter(d => user.role === 'admin' || participant(d, userId))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async report(
    contractId: number, userId: number,
    payload: { category: DisputeCategory; description: string; evidenceDescription: string; evidenceUrl?: string }
  ): Promise<Dispute> {
    const contract = allContracts().find(c => c.id === contractId);
    getUser(userId);
    if (!contract || (userId !== contract.employerId &&
        userId !== contract.workerProfile.userId)) {
      throw new Error('Apenas uma parte da contratação pode reportar conflitos.');
    }
    if (contract.employerId === contract.workerProfile.userId) {
      throw new Error('Contrato inválido: as partes devem ser distintas.');
    }
    if (!CATEGORIES.includes(payload.category)) throw new Error('Categoria inválida.');
    const description = notes(payload.description, 'Descrição do conflito', 20);
    const evidence = evidenceInput(payload.evidenceDescription, payload.evidenceUrl);
    const now = timestamp();
    const list = allCases();
    const d: Dispute = {
      id: nextId(list), contractId,
      employerUserId: contract.employerId,
      workerUserId: contract.workerProfile.userId,
      reportedByUserId: userId, category: payload.category,
      description, status: 'OPEN',
      evidence: [{ id: 1, authorUserId: userId, ...evidence, createdAt: now }],
      events: [{
        id: 1, action: 'REPORTED', actorUserId: userId, recordedAt: now,
        note: 'Conflito reportado com categoria e evidência descritiva.',
        statusAfter: 'OPEN'
      }],
      createdAt: now, updatedAt: now
    };
    save(DISPUTES_KEY, [d, ...list]);
    notify([contract.employerId, contract.workerProfile.userId, ...admins()],
      'Foi registado um conflito administrativo #' + d.id +
      ' associado ao contrato #' + contract.id + '. Nenhuma decisão arbitral foi tomada.');
    return d;
  },

  async addEvidence(
    caseId: number, userId: number, description: string, url?: string
  ): Promise<Dispute> {
    const d = getCase(caseId);
    ensureParticipant(d, userId);
    if (d.status === 'CLOSED' || d.status === 'RESOLVED') {
      throw new Error('Este acompanhamento já foi encerrado; não recebe novas evidências.');
    }
    const info = evidenceInput(description, url);
    const next: DisputeEvidence = {
      id: nextId(d.evidence), authorUserId: userId,
      ...info, createdAt: timestamp()
    };
    d.evidence.push(next);
    const solicited = d.status === 'WAITING_INFORMATION' && d.requestedFromUserId === userId;
    if (solicited) d.requestedFromUserId = undefined;
    appendEvent(d, solicited ? 'INFORMATION_SUPPLIED' : 'EVIDENCE_ADDED', userId,
      'Nova evidência descritiva registada pela parte.',
      solicited ? 'UNDER_REVIEW' : d.status);
    update(d);
    notify([...admins(), d.employerUserId, d.workerUserId].filter(i => i !== userId),
      'Foi adicionada informação ao conflito administrativo #' + d.id + '.');
    return d;
  },

  async beginReview(caseId: number, adminId: number, reason: string): Promise<Dispute> {
    requireAdmin(adminId);
    const d = getCase(caseId);
    if (d.status !== 'OPEN') throw new Error('A análise só pode iniciar num conflito OPEN.');
    appendEvent(d, 'REVIEW_STARTED', adminId, notes(reason, 'Motivo da análise'), 'UNDER_REVIEW');
    update(d);
    notify([d.workerUserId, d.employerUserId],
      'O conflito administrativo #' + d.id + ' entrou em análise documental.');
    return d;
  },

  async requestInformation(
    caseId: number, adminId: number, requestedFromUserId: number, question: string
  ): Promise<Dispute> {
    requireAdmin(adminId);
    const d = getCase(caseId);
    if (d.status !== 'UNDER_REVIEW') throw new Error('O pedido exige análise em curso.');
    if (!participant(d, requestedFromUserId)) throw new Error('A informação deve ser solicitada a uma parte do contrato.');
    d.requestedFromUserId = requestedFromUserId;
    appendEvent(d, 'INFORMATION_REQUESTED', adminId,
      'Pedido à parte #' + requestedFromUserId + ': ' + notes(question, 'Pedido de informação', 12),
      'WAITING_INFORMATION');
    update(d);
    notify([requestedFromUserId], 'Informação adicional solicitada no conflito administrativo #' + d.id + '.');
    return d;
  },

  async registerAdministrativeResult(caseId: number, adminId: number, result: string): Promise<Dispute> {
    requireAdmin(adminId);
    const d = getCase(caseId);
    if (d.status !== 'UNDER_REVIEW') throw new Error('Só uma análise em curso pode receber resultado administrativo.');
    const note = notes(result, 'Resultado documental', 20);
    d.administrativeResult = note;
    d.requestedFromUserId = undefined;
    appendEvent(d, 'ADMINISTRATIVE_RESULT', adminId, note, 'RESOLVED');
    update(d);
    notify([d.workerUserId, d.employerUserId],
      'Resultado de acompanhamento registado no conflito #' + d.id +
      '. Não altera os direitos, pagamentos ou estado contratual.');
    return d;
  },

  async closeCase(caseId: number, adminId: number, reason: string): Promise<Dispute> {
    requireAdmin(adminId);
    const d = getCase(caseId);
    if (d.status !== 'RESOLVED') throw new Error('É necessário registar o resultado administrativo antes de encerrar.');
    appendEvent(d, 'ADMINISTRATIVELY_CLOSED', adminId,
      notes(reason, 'Motivo do encerramento'), 'CLOSED');
    update(d);
    notify([d.workerUserId, d.employerUserId],
      'O acompanhamento administrativo do conflito #' + d.id + ' foi encerrado.');
    return d;
  }
};
