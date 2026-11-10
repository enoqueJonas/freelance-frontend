import type {
  AgreementEvent, AgreementParty, AgreementTerms, AgreementVersion, Contract,
  Notification, User
} from '../types';

/**
 * RF13 / RF14 — acordo demonstrativo com aceitação bilateral e versões.
 * Não oferece assinatura digital certificada, autenticação segura nem histórico inviolável.
 */
const KEY = 'conecta_agreement_versions_v1';
const CONTRACTS = 'serviplus_contracts';
const USERS = 'serviplus_users';
const NOTIFICATIONS = 'serviplus_notifications';
const PAYMENTS = 'serviplus_payments';
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const read = <T,>(key: string): T[] => {
  const value = localStorage.getItem(key);
  if (!value) return [];
  const parsed: unknown = JSON.parse(value);
  if (!Array.isArray(parsed)) throw new Error('Armazenamento local inválido.');
  return parsed as T[];
};
const write = <T,>(key: string, values: T[]) =>
  localStorage.setItem(key, JSON.stringify(values));
const versions = () => read<AgreementVersion>(KEY);
const contracts = () => read<Contract>(CONTRACTS);
const users = () => read<User>(USERS);
const now = () => new Date().toISOString();
const cents = (amount: number) => Math.round(amount * 100);
const validMoney = (value: number) =>
  Number.isFinite(value) && Number.isSafeInteger(cents(value)) &&
  cents(value) > 0 && Math.abs(value * 100 - cents(value)) < 0.00001;
const validDate = (date: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(date) &&
  Number.isFinite(Date.parse(date)) &&
  new Date(date).toISOString().slice(0, 10) === date;
const idFor = <T extends { id: number }>(items: T[]) =>
  Math.max(0, ...items.map(item => item.id)) + 1;
const contractFor = (id: number) => {
  const contract = contracts().find(item => item.id === id);
  if (!contract) throw new Error('Contrato não encontrado.');
  return contract;
};
const partyFor = (contract: Contract, userId: number): AgreementParty => {
  if (!users().some(user => user.id === userId))
    throw new Error('Utilizador não encontrado.');
  if (contract.employerId === contract.workerProfile.userId)
    throw new Error('O trabalhador e o empregador não podem ser a mesma conta.');
  if (contract.employerId === userId) return 'employer';
  if (contract.workerProfile.userId === userId) return 'worker';
  throw new Error('Só as partes desta contratação podem aceitar ou alterar o acordo.');
};
const canView = (contract: Contract, userId: number) => {
  const user = users().find(item => item.id === userId);
  if (!user || (user.role !== 'admin' &&
    userId !== contract.employerId && userId !== contract.workerProfile.userId))
    throw new Error('Sem permissão para consultar o acordo.');
};
const event = (
  action: AgreementEvent['action'], actorUserId: number, note: string
): AgreementEvent => ({ action, actorUserId, at: now(), note });
const notify = (contract: Contract, message: string) => {
  const list = read<Notification>(NOTIFICATIONS);
  let id = idFor(list);
  for (const userId of new Set([contract.employerId, contract.workerProfile.userId])) {
    list.unshift({
      id: id++, userId, text: message, type: 'contract',
      isRead: false, createdAt: now()
    });
  }
  write(NOTIFICATIONS, list);
};
const assertTerms = (terms: AgreementTerms): AgreementTerms => {
  if (!terms || typeof terms.title !== 'string' || terms.title.trim().length < 5 ||
    typeof terms.scope !== 'string' || terms.scope.trim().length < 20 ||
    typeof terms.deliverables !== 'string' || terms.deliverables.trim().length < 12 ||
    typeof terms.acceptanceCriteria !== 'string' || terms.acceptanceCriteria.trim().length < 15) {
    throw new Error('Indique título, âmbito, entregáveis e critérios de aceitação concretos.');
  }
  if (!validMoney(terms.budget)) throw new Error('O valor acordado deve ser positivo e ter até duas casas decimais.');
  if (!validDate(terms.startDate) || !validDate(terms.endDate) ||
    terms.endDate < terms.startDate) throw new Error('As datas de início e fim são inválidas.');
  if (!Array.isArray(terms.paymentConditions) ||
    terms.paymentConditions.length < 1 || terms.paymentConditions.length > 12) {
    throw new Error('Defina entre uma e doze condições de pagamento.');
  }
  const seen = new Set<string>();
  let sum = 0;
  for (const condition of terms.paymentConditions) {
    if (typeof condition.id !== 'string' || condition.id.length > 64 ||
      !condition.id || seen.has(condition.id) ||
      !['ADVANCE', 'MILESTONE', 'FINAL'].includes(condition.stage) ||
      !['M-Pesa', 'e-Mola', 'Transferência Bancária', 'Outro'].includes(condition.method) ||
      !validMoney(condition.amount) ||
      !condition.moment?.trim() || condition.moment.trim().length < 8 ||
      condition.moment.trim().length > 300) {
      throw new Error('Cada etapa exige identificação distinta, valor, método e momento válidos.');
    }
    seen.add(condition.id);
    sum += cents(condition.amount);
  }
  if (sum !== cents(terms.budget)) {
    throw new Error('A soma dos pagamentos previstos deve corresponder ao valor acordado.');
  }
  return clone({
    title: terms.title.trim(),
    scope: terms.scope.trim(),
    deliverables: terms.deliverables.trim(),
    acceptanceCriteria: terms.acceptanceCriteria.trim(),
    budget: cents(terms.budget) / 100,
    startDate: terms.startDate, endDate: terms.endDate,
    paymentConditions: terms.paymentConditions.map(c => ({
      id: c.id, stage: c.stage, amount: cents(c.amount) / 100,
      method: c.method, moment: c.moment.trim()
    }))
  });
};
const getVersion = (id: number): AgreementVersion => {
  const record = versions().find(item => item.id === id);
  if (!record) throw new Error('Versão do acordo não encontrada.');
  return record;
};
const saveVersion = (record: AgreementVersion) => {
  const list = versions();
  const idx = list.findIndex(item => item.id === record.id);
  if (idx === -1) throw new Error('Versão não encontrada para atualização.');
  list[idx] = record;
  write(KEY, list);
};
const existingOpen = (contractId: number) =>
  versions().some(v => v.contractId === contractId &&
    ['DRAFT', 'PENDING_APPROVAL'].includes(v.status));
const activeVersion = (contractId: number) =>
  versions().find(v => v.contractId === contractId && v.status === 'ACTIVE');
const reasonText = (value: string, min = 8): string => {
  const reason = value.trim();
  if (reason.length < min || reason.length > 1000) {
    throw new Error('Indique um motivo com entre ' + min + ' e 1000 caracteres.');
  }
  return reason;
};

export const agreements = {
  /** Chamado após a criação de uma contratação a partir de proposta. Sem aceitação implícita. */
  async initializeDraft(contractId: number, employerUserId: number): Promise<AgreementVersion> {
    const contract = contractFor(contractId);
    if (partyFor(contract, employerUserId) !== 'employer' ||
      contract.status !== 'pending' || versions().some(v => v.contractId === contractId)) {
      throw new Error('Não é possível iniciar a primeira versão deste acordo.');
    }
    const nowAt = now();
    const list = versions();
    const initial: AgreementVersion = {
      id: idFor(list), contractId, number: 1, status: 'DRAFT',
      createdByUserId: employerUserId, createdAt: nowAt,
      reason: 'Primeira formalização das condições a partir da proposta aceite.',
      terms: {
        title: contract.title, scope: contract.description,
        deliverables: '', acceptanceCriteria: '',
        budget: contract.budget,
        startDate: contract.startDate, endDate: contract.endDate,
        paymentConditions: []
      },
      approvals: [],
      events: [event('CREATED', employerUserId,
        'Rascunho inicial gerado a partir da proposta. Ainda não existem aprovações.')]
    };
    write(KEY, [...list, initial]);
    return clone(initial);
  },

  async listForContract(contractId: number, viewerUserId: number): Promise<AgreementVersion[]> {
    canView(contractFor(contractId), viewerUserId);
    return clone(versions().filter(v => v.contractId === contractId)
      .sort((a, b) => b.number - a.number));
  },

  async activeForContract(contractId: number, viewerUserId: number): Promise<AgreementVersion | null> {
    canView(contractFor(contractId), viewerUserId);
    return clone(activeVersion(contractId) || null);
  },

  /** Só o autor pode editar um rascunho. Publicado = termos imutáveis. */
  async saveDraft(versionId: number, actorUserId: number, terms: AgreementTerms): Promise<AgreementVersion> {
    const v = getVersion(versionId);
    const contract = contractFor(v.contractId);
    partyFor(contract, actorUserId);
    if (v.status !== 'DRAFT' || v.createdByUserId !== actorUserId) {
      throw new Error('Só o autor pode editar um rascunho ainda não publicado.');
    }
    // Um rascunho pode ser incompleto, mas não pode alterar o valor/número sem controlo.
    v.terms = clone(terms);
    v.events.push(event('DRAFT_UPDATED', actorUserId, 'Rascunho alterado; ainda sem efeito contratual.'));
    saveVersion(v);
    return clone(v);
  },

  async submitDraft(versionId: number, actorUserId: number): Promise<AgreementVersion> {
    const v = getVersion(versionId);
    const contract = contractFor(v.contractId);
    partyFor(contract, actorUserId);
    if (v.status !== 'DRAFT' || v.createdByUserId !== actorUserId ||
      contract.status === 'completed') {
      throw new Error('Apenas o autor pode submeter o rascunho de uma contratação não concluída.');
    }
    v.terms = assertTerms(v.terms);
    v.status = 'PENDING_APPROVAL';
    v.submittedAt = now();
    v.events.push(event('SUBMITTED', actorUserId, 'Versão submetida para aprovação bilateral.'));
    saveVersion(v);
    notify(contract, 'A versão ' + v.number + ' do acordo aguarda aceitação das duas partes.');
    return clone(v);
  },

  /** Abre nova versão apenas a partir de uma versão aceite; o texto anterior permanece intacto. */
  async openAmendment(contractId: number, actorUserId: number, reason: string): Promise<AgreementVersion> {
    const contract = contractFor(contractId);
    partyFor(contract, actorUserId);
    if (contract.status !== 'active') throw new Error('Só contratos activos podem receber alterações.');
    const accepted = activeVersion(contractId);
    if (!accepted) throw new Error('Contrato legado sem acordo versionado aceite; exige revisão antes de alterar.');
    if (existingOpen(contractId)) throw new Error('Já existe uma versão por concluir.');
    const list = versions();
    const number = Math.max(0, ...list.filter(v => v.contractId === contractId).map(v => v.number)) + 1;
    const draft: AgreementVersion = {
      id: idFor(list), contractId, number,
      status: 'DRAFT', createdByUserId: actorUserId,
      createdAt: now(), reason: reasonText(reason),
      terms: clone(accepted.terms), approvals: [],
      events: [event('CREATED', actorUserId, 'Proposta de alteração: ' + reason.trim())]
    };
    write(KEY, [...list, draft]);
    return clone(draft);
  },

  async approve(versionId: number, actorUserId: number): Promise<AgreementVersion> {
    const v = getVersion(versionId);
    const contract = contractFor(v.contractId);
    const party = partyFor(contract, actorUserId);
    if (v.status !== 'PENDING_APPROVAL' || contract.status === 'completed') {
      throw new Error('Esta versão não está disponível para aprovação.');
    }
    if (v.approvals.some(a => a.party === party)) {
      throw new Error('A mesma parte não pode aprovar duas vezes.');
    }
    v.approvals.push({ party, userId: actorUserId, approvedAt: now() });
    v.events.push(event('APPROVED', actorUserId, 'Aceitação expressa da versão ' + v.number + ' como ' + party + '.'));
    const both = v.approvals.some(a => a.party === 'employer') &&
      v.approvals.some(a => a.party === 'worker');
    if (both) {
      const recorded = read<{ contractId: number; amount: number; status: string }>(PAYMENTS)
        .filter(p => p.contractId === contract.id &&
          (p.status === 'REPORTED_PAID' || p.status === 'CONFIRMED'));
      const reportedTotal = recorded.reduce((sum, p) => sum + cents(p.amount), 0);
      if (reportedTotal > cents(v.terms.budget)) {
        throw new Error('A nova versão não pode reduzir o valor abaixo dos pagamentos já declarados.');
      }
      // Apenas neste ponto as novas condições podem produzir efeitos no protótipo.
      const list = versions();
      for (const old of list) {
        if (old.contractId === v.contractId && old.id !== v.id && old.status === 'ACTIVE') {
          old.status = 'SUPERSEDED';
          old.events.push(event('SUPERSEDED', actorUserId, 'Substituída pela versão ' + v.number + '.'));
        }
      }
      v.status = 'ACTIVE';
      v.events.push(event('ACTIVATED', actorUserId, 'Ambas as partes aprovaram exatamente esta versão.'));
      const contractsList = contracts();
      const ci = contractsList.findIndex(c => c.id === v.contractId);
      if (ci < 0) throw new Error('Contrato desapareceu durante a aprovação.');
      const current = contractsList[ci];
      Object.assign(current, {
        title: v.terms.title, description: v.terms.scope,
        budget: v.terms.budget, startDate: v.terms.startDate,
        endDate: v.terms.endDate, signedByEmployer: true, signedByWorker: true,
        status: 'active'
      });
      list[list.findIndex(item => item.id === v.id)] = v;
      // Protótipo local: sem transação atómica entre chaves.
      write(CONTRACTS, contractsList);
      write(KEY, list);
      notify(contract, 'A versão ' + v.number + ' foi aceite por ambas as partes e está activa.');
      return clone(v);
    }
    saveVersion(v);
    return clone(v);
  },

  async reject(versionId: number, actorUserId: number, reason: string): Promise<AgreementVersion> {
    const v = getVersion(versionId);
    const contract = contractFor(v.contractId);
    partyFor(contract, actorUserId);
    if (v.status !== 'PENDING_APPROVAL') throw new Error('Só uma versão submetida pode ser recusada.');
    v.status = 'REJECTED';
    v.rejectedByUserId = actorUserId;
    v.rejectionReason = reasonText(reason);
    v.events.push(event('REJECTED', actorUserId, v.rejectionReason));
    saveVersion(v);
    // O contrato anterior mantém-se, inclusive as suas aprovações.
    notify(contract, 'A versão ' + v.number + ' foi recusada. O acordo anterior mantém-se.');
    return clone(v);
  },

  /** Reabre a negociação inicial após recusa, sem apagar o histórico. */
  async redraftInitial(contractId: number, actorUserId: number, reason: string): Promise<AgreementVersion> {
    const contract = contractFor(contractId);
    partyFor(contract, actorUserId);
    const all = versions().filter(v => v.contractId === contractId);
    const newest = all.reduce<AgreementVersion | null>(
      (latest, item) => !latest || item.number > latest.number ? item : latest, null
    );
    if (contract.status !== 'pending' || activeVersion(contractId) || existingOpen(contractId) ||
      !newest || newest.status !== 'REJECTED') {
      throw new Error('Só acordos iniciais recusados podem ser renegociados nesta etapa.');
    }
    const last = all.reduce((a, b) => a.number > b.number ? a : b);
    const v: AgreementVersion = {
      id: idFor(versions()), contractId, number: last.number + 1,
      status: 'DRAFT', createdByUserId: actorUserId,
      createdAt: now(), reason: reasonText(reason),
      terms: clone(last.terms), approvals: [],
      events: [event('CREATED', actorUserId, 'Renegociação da primeira versão: ' + reason.trim())]
    };
    write(KEY, [...versions(), v]);
    return clone(v);
  }
};
