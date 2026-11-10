import React, { useEffect, useState } from 'react';
import type {
  AgreementPaymentCondition, AgreementTerms, AgreementVersion, Contract,
  PaymentMethod, PaymentStage, UserRole
} from '../types';
import { agreements } from '../services/agreements';

interface Props {
  contract: Contract;
  userId: number;
  role: UserRole;
  onUpdated: () => void | Promise<void>;
}
const statusNames = {
  DRAFT: 'Rascunho (não aprovado)',
  PENDING_APPROVAL: 'Aguarda aprovação das duas partes',
  ACTIVE: 'Versão aceite',
  SUPERSEDED: 'Versão substituída',
  REJECTED: 'Versão recusada'
};
const stageNames: Record<PaymentStage, string> = {
  ADVANCE: 'Adiantamento', MILESTONE: 'Pagamento por etapa', FINAL: 'Pagamento final'
};
const methods: PaymentMethod[] = ['M-Pesa', 'e-Mola', 'Transferência Bancária', 'Outro'];
const copy = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const newCondition = (): AgreementPaymentCondition => ({
  id: 'stage_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
  stage: 'FINAL', method: 'M-Pesa', amount: 0, moment: ''
});
export const AgreementPanel: React.FC<Props> = ({ contract, userId, role, onUpdated }) => {
  const [items, setItems] = useState<AgreementVersion[]>([]);
  const [editing, setEditing] = useState<AgreementTerms | null>(null);
  const [reason, setReason] = useState('');
  const [rejection, setRejection] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    const versions = await agreements.listForContract(contract.id, userId);
    setItems(versions);
    const draft = versions.find(v => v.status === 'DRAFT' && v.createdByUserId === userId);
    setEditing(draft ? copy(draft.terms) : null);
  };
  useEffect(() => {
    setError(''); setMessage('');
    void load().catch(e => setError(e.message || 'Não foi possível consultar as versões.'));
  }, [contract.id, userId]);
  const draft = items.find(v => v.status === 'DRAFT');
  const pending = items.find(v => v.status === 'PENDING_APPROVAL');
  const active = items.find(v => v.status === 'ACTIVE');
  const participant = role !== 'admin' &&
    (userId === contract.employerId || userId === contract.workerProfile.userId);

  const execute = async (action: () => Promise<unknown>, success: string) => {
    if (busy) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await action();
      await load();
      await onUpdated();
      setMessage(success);
    } catch (err: any) {
      setError(err.message || 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  };
  const saveAndSubmit = () => execute(async () => {
    if (!draft || !editing) throw new Error('Rascunho não encontrado.');
    await agreements.saveDraft(draft.id, userId, editing);
    await agreements.submitDraft(draft.id, userId);
  }, 'Versão publicada. Aguarda aceitação expressa das duas partes.');

  const modifyTerm = <K extends keyof AgreementTerms>(key: K, value: AgreementTerms[K]) =>
    setEditing(prev => prev ? { ...prev, [key]: value } : prev);
  const modifyPayment = (id: string, update: Partial<AgreementPaymentCondition>) =>
    setEditing(prev => prev ? ({
      ...prev,
      paymentConditions: prev.paymentConditions.map(c => c.id === id ? { ...c, ...update } : c)
    }) : prev);

  if (!participant) return null;
  return (
    <section aria-label="Acordos e versões" className="mt-5 pt-5 border-t border-gray-100 space-y-4">
      <div>
        <h5 className="text-sm font-bold text-gray-900">Acordo e versões das condições</h5>
        <p className="text-xs text-gray-500 mt-1">
          Acordos electrónicos demonstrativos: cada versão só é activada quando ambas as partes
          aprovam exactamente as mesmas condições. Não é assinatura digital certificada.
        </p>
      </div>
      {error && <p role="alert" className="text-xs bg-red-50 text-red-700 p-3 rounded-lg">{error}</p>}
      {message && <p role="status" className="text-xs bg-emerald-50 text-emerald-800 p-3 rounded-lg">{message}</p>}
      {items.length === 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg">
          Contrato legado sem versões verificáveis. Não foi criada nenhuma aprovação retroactiva.
          A migração exige revisão das condições originais pelas partes.
        </p>
      )}

      {active && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3 space-y-2 text-xs">
          <p className="font-bold text-emerald-800">Versão {active.number} aceite por ambas as partes</p>
          <p className="text-gray-800">
            <strong>{active.terms.title}</strong> · {active.terms.budget.toLocaleString('pt-MZ')} MT
          </p>
          <p className="text-gray-700 whitespace-pre-wrap">Âmbito: {active.terms.scope}</p>
          <p className="text-gray-700 whitespace-pre-wrap">Entregáveis: {active.terms.deliverables}</p>
          <p className="text-gray-700 whitespace-pre-wrap">
            Critérios de aceitação: {active.terms.acceptanceCriteria}
          </p>
          <p className="text-gray-600">
            Prazo: {active.terms.startDate} a {active.terms.endDate} ·
            {active.terms.paymentConditions.length} condição(ões) de pagamento
          </p>
        </div>
      )}
      {!draft && !pending && active && contract.status === 'active' && (
        <div className="space-y-2 text-xs">
          <label className="block text-gray-700 font-semibold">
            Motivo da alteração proposta
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              rows={2} maxLength={1000}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg"
              placeholder="Descreva a alteração pretendida e por que é necessária." />
          </label>
          <button type="button" disabled={busy || reason.trim().length < 8}
            onClick={() => void execute(
              () => agreements.openAmendment(contract.id, userId, reason),
              'Nova versão em rascunho. O acordo aceite continua em vigor.'
            )}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-200 disabled:opacity-60">
            Propor nova versão
          </button>
        </div>
      )}
      {!draft && !pending && !active && items.some(v => v.status === 'REJECTED') &&
        contract.status === 'pending' && (
        <div className="space-y-2 text-xs">
          <label className="block text-gray-700 font-semibold">
            Justificação para nova proposta inicial
            <textarea value={reason} onChange={e => setReason(e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
          </label>
          <button type="button" disabled={busy || reason.trim().length < 8}
            onClick={() => void execute(
              () => agreements.redraftInitial(contract.id, userId, reason),
              'Novo rascunho criado sem apagar as versões recusadas.'
            )}
            className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg font-semibold border border-blue-200 disabled:opacity-60">
            Renegociar proposta inicial
          </button>
        </div>
      )}

      {draft && draft.createdByUserId !== userId && (
        <p className="text-xs bg-amber-50 text-amber-900 rounded-lg p-3">
          A versão {draft.number} ainda está a ser preparada pela outra parte. Não existe texto publicado para aprovação.
        </p>
      )}
      {draft && draft.createdByUserId === userId && editing && (
        <form onSubmit={event => { event.preventDefault(); void saveAndSubmit(); }}
          className="border border-blue-100 rounded-xl p-4 space-y-3 text-xs">
          <h6 className="font-bold text-gray-800">Editar rascunho da versão {draft.number}</h6>
          <p className="text-gray-600">
            Confirme os detalhes antes de publicar. Após a publicação os termos ficam congelados;
            para os modificar é necessário gerar uma nova versão.
          </p>
          <label className="block text-gray-700 font-semibold">Designação
            <input required minLength={5} value={editing.title}
              onChange={e => modifyTerm('title', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
          </label>
          <label className="block text-gray-700 font-semibold">Âmbito acordado
            <textarea required minLength={20} rows={3} value={editing.scope}
              onChange={e => modifyTerm('scope', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
          </label>
          <label className="block text-gray-700 font-semibold">Entregáveis concretos
            <textarea required minLength={12} rows={2} value={editing.deliverables}
              onChange={e => modifyTerm('deliverables', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
          </label>
          <label className="block text-gray-700 font-semibold">Critérios de aceitação
            <textarea required minLength={15} rows={2} value={editing.acceptanceCriteria}
              onChange={e => modifyTerm('acceptanceCriteria', e.target.value)}
              className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block text-gray-700 font-semibold">Valor (MT)
              <input type="number" min="0.01" step="0.01" required value={editing.budget}
                onChange={e => modifyTerm('budget', Number(e.target.value))}
                className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
            </label>
            <label className="block text-gray-700 font-semibold">Início
              <input type="date" required value={editing.startDate}
                onChange={e => modifyTerm('startDate', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
            </label>
            <label className="block text-gray-700 font-semibold">Fim
              <input type="date" required value={editing.endDate}
                onChange={e => modifyTerm('endDate', e.target.value)}
                className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
            </label>
          </div>
          <div className="space-y-3 border-t border-gray-100 pt-3">
            <p className="font-bold text-gray-800">Condições de pagamento externo</p>
            <p className="text-gray-500">
              Defina valor, método, etapa e momento. A soma deve ser igual ao valor acordado.
              Não há custódia nem execução financeira.
            </p>
            {editing.paymentConditions.map((condition, idx) => (
              <div key={condition.id} className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-2">
                <div className="flex justify-between gap-2">
                  <strong>Etapa {idx + 1}</strong>
                  <button type="button" className="text-rose-700 font-semibold"
                    onClick={() => modifyTerm('paymentConditions',
                      editing.paymentConditions.filter(item => item.id !== condition.id))}>
                    Remover
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="block">Etapa
                    <select value={condition.stage}
                      onChange={e => modifyPayment(condition.id, { stage: e.target.value as PaymentStage })}
                      className="mt-1 block w-full p-2 border border-gray-200 rounded-lg">
                      {(Object.keys(stageNames) as PaymentStage[]).map(key => (
                        <option key={key} value={key}>{stageNames[key]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">Método
                    <select value={condition.method}
                      onChange={e => modifyPayment(condition.id, { method: e.target.value as PaymentMethod })}
                      className="mt-1 block w-full p-2 border border-gray-200 rounded-lg">
                      {methods.map(key => <option key={key} value={key}>{key}</option>)}
                    </select>
                  </label>
                  <label className="block">Valor (MT)
                    <input type="number" required min="0.01" step="0.01"
                      value={condition.amount}
                      onChange={e => modifyPayment(condition.id, { amount: Number(e.target.value) })}
                      className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
                  </label>
                </div>
                <label className="block">Momento/condição
                  <input required minLength={8} value={condition.moment}
                    onChange={e => modifyPayment(condition.id, { moment: e.target.value })}
                    className="mt-1 block w-full p-2 border border-gray-200 rounded-lg"
                    placeholder="Ex.: após validação da entrega da fase 1" />
                </label>
              </div>
            ))}
            <button type="button" disabled={editing.paymentConditions.length >= 12}
              onClick={() => modifyTerm('paymentConditions', [
                ...editing.paymentConditions, newCondition()
              ])}
              className="px-3 py-2 border border-gray-200 rounded-lg text-blue-700 font-semibold disabled:opacity-50">
              Adicionar etapa
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy}
              onClick={() => void execute(
                () => agreements.saveDraft(draft.id, userId, editing),
                'Rascunho guardado; nenhuma aprovação registada.'
              )}
              className="px-3 py-2 border border-blue-300 rounded-lg text-blue-700 font-semibold">
              Guardar rascunho
            </button>
            <button type="submit" disabled={busy}
              className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg disabled:opacity-60">
              Publicar para aprovação bilateral
            </button>
          </div>
        </form>
      )}
      {pending && (
        <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 space-y-3 text-xs">
          <strong className="text-amber-900">Versão {pending.number}: por aprovar</strong>
          <p className="text-gray-700 whitespace-pre-wrap">{pending.terms.scope}</p>
          <p className="text-gray-700 whitespace-pre-wrap">Entregáveis: {pending.terms.deliverables}</p>
          <p className="text-gray-700 whitespace-pre-wrap">
            Critérios de aceitação: {pending.terms.acceptanceCriteria}
          </p>
          <p className="text-gray-700">
            {pending.terms.budget.toLocaleString('pt-MZ')} MT ·
            {pending.terms.startDate} a {pending.terms.endDate}
          </p>
          <div className="space-y-1">
            <strong>Plano de pagamentos externo:</strong>
            {pending.terms.paymentConditions.map(c => (
              <p key={c.id} className="text-gray-700">
                {stageNames[c.stage]} — {c.amount.toLocaleString('pt-MZ')} MT,
                {' '}{c.method}, {c.moment}
              </p>
            ))}
          </div>
          <p className="text-gray-600">
            Aprovado por: {pending.approvals.length === 0 ? 'nenhuma parte' :
              pending.approvals.map(a => a.party === 'worker' ? 'trabalhador' : 'empregador').join(', ')}.
          </p>
          {active && <p className="text-amber-900 font-semibold">
            A versão anterior continua activa até à aprovação bilateral da alteração.
          </p>}
          {!pending.approvals.some(a => a.userId === userId) && (
            <div className="space-y-2">
              <button type="button" disabled={busy}
                onClick={() => void execute(
                  () => agreements.approve(pending.id, userId),
                  'Aceitação registada na versão ' + pending.number + '.'
                )}
                className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60">
                Aceitar expressamente esta versão
              </button>
              <label className="block text-gray-700 font-semibold">
                Motivo de rejeição
                <textarea rows={2} value={rejection} onChange={e => setRejection(e.target.value)}
                  className="mt-1 block w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <button type="button" disabled={busy || rejection.trim().length < 8}
                onClick={() => void execute(
                  () => agreements.reject(pending.id, userId, rejection),
                  'Versão recusada; o acordo anterior mantém-se.'
                )}
                className="px-3 py-2 border border-rose-300 text-rose-700 rounded-lg font-semibold disabled:opacity-60">
                Rejeitar versão com motivo
              </button>
            </div>
          )}
        </div>
      )}
      {items.length > 0 && (
        <details className="text-xs border border-gray-100 rounded-xl p-3">
          <summary className="font-bold text-gray-800 cursor-pointer">
            Histórico de versões ({items.length})
          </summary>
          <div className="mt-3 space-y-3">
            {items.map(v => (
              <div key={v.id} className="border-t border-gray-100 pt-2 space-y-1 text-gray-600">
                <p className="font-semibold text-gray-800">
                  v{v.number} — {statusNames[v.status]} · {v.createdAt.slice(0,16).replace('T',' ')}
                </p>
                <p>Justificação: {v.reason}</p>
                <p className="whitespace-pre-wrap">Âmbito preservado: {v.terms.scope}</p>
                <p>Valor: {v.terms.budget.toLocaleString('pt-MZ')} MT</p>
                <details>
                  <summary className="cursor-pointer text-blue-700">Ver conteúdo e eventos desta versão</summary>
                  <p className="mt-2 whitespace-pre-wrap">Entregáveis: {v.terms.deliverables || '(não definidos no rascunho)'}</p>
                  <p className="whitespace-pre-wrap">Critérios: {v.terms.acceptanceCriteria || '(não definidos no rascunho)'}</p>
                  <p>Prazo: {v.terms.startDate} a {v.terms.endDate}</p>
                  {v.terms.paymentConditions.map(c => (
                    <p key={c.id}>{stageNames[c.stage]}: {c.amount.toLocaleString('pt-MZ')} MT · {c.method} · {c.moment}</p>
                  ))}
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    {v.events.map((e, index) => (
                      <li key={index}>
                        {e.at.slice(0,16).replace('T',' ')} · Utilizador #{e.actorUserId}: {e.note}
                      </li>
                    ))}
                  </ul>
                </details>
              </div>
            ))}
          </div>
        </details>
      )}
    </section>
  );
};
