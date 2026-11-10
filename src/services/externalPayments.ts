import {
  Contract, Notification, Payment, PaymentMethod, PaymentStage, PaymentStatus, User
} from '../types';
import { agreements } from './agreements';

/**
 * Protótipo local RN09/RN10/RF19. Apenas regista declarações dos participantes.
 * Não comunica com bancos, não executa transacções, não custodia fundos e
 * NÃO constitui implementação de autenticação/autorização segura no servidor.
 */
const STORAGE_KEY = 'serviplus_payments';
const CONTRACTS_KEY = 'serviplus_contracts';
const USERS_KEY = 'serviplus_users';
const NOTIFICATIONS_KEY = 'serviplus_notifications';
const VALID_STATUSES: PaymentStatus[] = ['REPORTED_PAID', 'CONFIRMED', 'CONTESTED'];
const VALID_METHODS: PaymentMethod[] = ['M-Pesa', 'e-Mola', 'Transferência Bancária', 'Outro'];
const VALID_STAGES: PaymentStage[] = ['ADVANCE', 'MILESTONE', 'FINAL'];

const readList = <T,>(key: string): T[] => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T[] : [];
  } catch {
    return [];
  }
};
const writeList = <T,>(key: string, value: T[]) => localStorage.setItem(key, JSON.stringify(value));
const records = (): Payment[] => readList<Payment>(STORAGE_KEY);
const contracts = (): Contract[] => readList<Contract>(CONTRACTS_KEY);
const users = (): User[] => readList<User>(USERS_KEY);

const notify = (userId: number, text: string) => {
  const list = readList<Notification>(NOTIFICATIONS_KEY);
  list.unshift({
    id: Math.max(0, ...list.map(n => n.id)) + 1,
    userId, text, type: 'payment', isRead: false, createdAt: new Date().toISOString()
  });
  writeList(NOTIFICATIONS_KEY, list);
};

export interface ExternalPaymentReport {
  amount: number;
  method: PaymentMethod;
  stage: PaymentStage;
  moment: string;
  paidOn: string;
  externalReference?: string;
  notes?: string;
  agreementConditionId?: string;
}

export const externalPayments = {
  async listForContract(contractId: number, requesterId: number): Promise<{
    items: Payment[];
    legacyUnverifiedCount: number;
  }> {
    const contract = contracts().find(c => c.id === contractId);
    const requester = users().find(u => u.id === requesterId);
    if (!contract || !requester ||
      (requester.role !== 'admin' && requesterId !== contract.employerId &&
        requesterId !== contract.workerProfile.userId)) {
      throw new Error('Não tem permissão para consultar este contrato.');
    }
    const all = records().filter(p => p.contractId === contractId);
    const items = all.filter(p => VALID_STATUSES.includes(p.status));
    return {
      items: items.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      legacyUnverifiedCount: all.length - items.length
    };
  },

  async report(contractId: number, employerId: number, input: ExternalPaymentReport): Promise<Payment> {
    const contract = contracts().find(c => c.id === contractId);
    if (!contract || contract.employerId !== employerId) {
      throw new Error('Apenas o empregador desta contratação pode declarar pagamentos externos.');
    }
    if (contract.status !== 'active' && contract.status !== 'completed') {
      throw new Error('O contrato deve estar activo ou concluído.');
    }
    const cents = Math.round(input.amount * 100);
    if (!Number.isFinite(input.amount) || !Number.isSafeInteger(cents) || cents <= 0 ||
      Math.abs(input.amount * 100 - cents) > 0.00001 ||
      !VALID_METHODS.includes(input.method) || !VALID_STAGES.includes(input.stage) ||
      !input.moment.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(input.paidOn) ||
      !Number.isFinite(Date.parse(input.paidOn)) ||
      new Date(input.paidOn).toISOString().slice(0, 10) !== input.paidOn ||
      input.paidOn > new Date().toISOString().slice(0, 10)) {
      throw new Error('Indique valor positivo, método, etapa, momento e uma data válida.');
    }
    const activeAgreement = await agreements.activeForContract(contractId, employerId);
    const condition = activeAgreement?.terms.paymentConditions.find(
      c => c.id === input.agreementConditionId
    );
    if (activeAgreement && (!condition || condition.method !== input.method ||
        condition.stage !== input.stage || condition.moment !== input.moment)) {
      throw new Error('O pagamento deve corresponder a uma condição da versão aceite do acordo.');
    }
    const existing = records();
    if (condition && activeAgreement) {
      const usedCents = existing.filter(p => p.contractId === contractId &&
        p.agreementVersionId === activeAgreement.id &&
        p.agreementConditionId === condition.id &&
        (p.status === 'REPORTED_PAID' || p.status === 'CONFIRMED'))
        .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
      if (usedCents + cents > Math.round(condition.amount * 100)) {
        throw new Error('O valor declarado excede a etapa aceite do acordo.');
      }
    }
    const outstandingCents = existing
      .filter(p => p.contractId === contractId &&
        (p.status === 'REPORTED_PAID' || p.status === 'CONFIRMED'))
      .reduce((sum, p) => sum + Math.round(p.amount * 100), 0);
    if (outstandingCents + cents > Math.round(contract.budget * 100)) {
      throw new Error('A soma dos pagamentos declarados excede o valor do contrato.');
    }
    const now = new Date().toISOString();
    const entry: Payment = {
      id: Math.max(0, ...existing.map(p => p.id)) + 1,
      contractId,
      agreementVersionId: activeAgreement?.id,
      agreementConditionId: condition?.id,
      amount: cents / 100, method: input.method, stage: input.stage,
      moment: input.moment.trim(), paidOn: input.paidOn,
      externalReference: input.externalReference?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      status: 'REPORTED_PAID', reportedByUserId: employerId,
      createdAt: now, updatedAt: now,
      history: [{
        status: 'REPORTED_PAID', actorUserId: employerId, recordedAt: now,
        note: 'Declaração do empregador. A plataforma não verificou nenhuma transferência.'
      }]
    };
    writeList(STORAGE_KEY, [entry, ...existing]);
    notify(contract.workerProfile.userId,
      'O empregador declarou um pagamento externo de ' +
      entry.amount.toLocaleString('pt-MZ') + ' MT para "' + contract.title +
      '". Confirme a recepção ou conteste. A plataforma não verifica a transacção.');
    return entry;
  },

  async respond(paymentId: number, workerId: number, action: 'CONFIRMED' | 'CONTESTED',
    reason = ''): Promise<Payment> {
    const all = records();
    const index = all.findIndex(p => p.id === paymentId);
    if (index < 0 || all[index].status !== 'REPORTED_PAID') {
      throw new Error('O pagamento já foi respondido ou não existe.');
    }
    const payment = all[index];
    const contract = contracts().find(c => c.id === payment.contractId);
    if (!contract || contract.workerProfile.userId !== workerId || contract.employerId === workerId) {
      throw new Error('Só o trabalhador da contratação pode confirmar ou contestar.');
    }
    if (action === 'CONTESTED' && reason.trim().length < 8) {
      throw new Error('A contestação deve conter um motivo com pelo menos 8 caracteres.');
    }
    const now = new Date().toISOString();
    payment.status = action;
    payment.respondedByUserId = workerId;
    payment.responseNote = action === 'CONTESTED'
      ? reason.trim()
      : 'O trabalhador declarou ter recebido o valor; sem verificação externa.';
    payment.updatedAt = now;
    payment.history.push({
      status: action, actorUserId: workerId, recordedAt: now,
      note: payment.responseNote
    });
    writeList(STORAGE_KEY, all);
    notify(contract.employerId,
      'O trabalhador ' + (action === 'CONFIRMED' ? 'confirmou a recepção declarada' :
        'contestou o registo') + ' de ' + payment.amount.toLocaleString('pt-MZ') +
      ' MT no contrato "' + contract.title + '".');
    return payment;
  }
};
