import React, { useEffect, useState } from 'react';
import { Contract, Payment, PaymentMethod, PaymentStage, UserRole } from '../types';
import { externalPayments } from '../services/externalPayments';

interface Props {
  contract: Contract;
  userId: number;
  role: UserRole;
}

const methods: PaymentMethod[] = ['M-Pesa', 'e-Mola', 'Transferência Bancária', 'Outro'];
const stageLabels: Record<PaymentStage, string> = {
  ADVANCE: 'Adiantamento', MILESTONE: 'Pagamento por etapa', FINAL: 'Pagamento final'
};
const statusLabels = {
  REPORTED_PAID: 'Declarado pelo empregador — por confirmar',
  CONFIRMED: 'Recepção confirmada pelo trabalhador',
  CONTESTED: 'Registo contestado'
};

export const PaymentTrackingPanel: React.FC<Props> = ({ contract, userId, role }) => {
  const [items, setItems] = useState<Payment[]>([]);
  const [legacyCount, setLegacyCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('M-Pesa');
  const [stage, setStage] = useState<PaymentStage>('FINAL');
  const [moment, setMoment] = useState('');
  const [paidOn, setPaidOn] = useState(new Date().toISOString().slice(0, 10));
  const [externalReference, setExternalReference] = useState('');
  const [notes, setNotes] = useState('');
  const [contestingId, setContestingId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  const employer = role === 'employer' && contract.employerId === userId;
  const worker = role === 'worker' && contract.workerProfile.userId === userId;
  const eligible = contract.status === 'active' || contract.status === 'completed';

  const load = async () => {
    try {
      const data = await externalPayments.listForContract(contract.id, userId);
      setItems(data.items);
      setLegacyCount(data.legacyUnverifiedCount);
    } catch (err: any) {
      setError(err.message || 'Não foi possível consultar os registos.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setError('');
    setSuccess('');
    setLoading(true);
    void load();
  }, [contract.id, userId]);

  const report = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!employer || !eligible || busy) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await externalPayments.report(contract.id, userId, {
        amount: Number(amount), method, stage, moment, paidOn, externalReference, notes
      });
      setSuccess('Declaração registada. Aguarda a resposta do trabalhador.');
      setShowForm(false);
      setAmount('');
      setExternalReference('');
      setNotes('');
      setMoment('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Não foi possível registar a declaração.');
    } finally {
      setBusy(false);
    }
  };

  const respond = async (paymentId: number, action: 'CONFIRMED' | 'CONTESTED') => {
    if (!worker || busy) return;
    if (action === 'CONFIRMED' && !window.confirm(
      'Confirma que recebeu realmente o valor indicado fora desta aplicação?'
    )) return;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await externalPayments.respond(paymentId, userId, action, reason);
      setSuccess(action === 'CONFIRMED' ?
        'Recepção declarada e registada.' : 'Contestação registada para acompanhamento.');
      setContestingId(null);
      setReason('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Não foi possível guardar a resposta.');
    } finally {
      setBusy(false);
    }
  };

  if (!employer && !worker && role !== 'admin') return null;

  return (
    <section className="mt-5 pt-4 border-t border-gray-100 space-y-3" aria-label="Acompanhamento de pagamentos externos">
      <h5 className="text-sm font-bold text-gray-800">Pagamentos externos — registos declarativos</h5>
      <p className="text-xs text-gray-600">
        O sistema não recebe, transfere nem guarda fundos. O estado indica declarações das partes,
        não uma liquidação verificada pelo banco ou pela carteira móvel.
      </p>
      {legacyCount > 0 && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 p-2 rounded-lg">
          Há {legacyCount} registo(s) legado(s) da antiga simulação de pagamento. Não são considerados
          pagamentos confirmados; devem ser revistos separadamente.
        </p>
      )}
      {error && <p role="alert" className="text-xs text-red-700 bg-red-50 p-2 rounded-lg">{error}</p>}
      {success && <p role="status" className="text-xs text-emerald-800 bg-emerald-50 p-2 rounded-lg">{success}</p>}
      {loading ? <p className="text-xs text-gray-400">A consultar registos...</p> : (
        items.length ? (
          <div className="space-y-3">
            {items.map(payment => (
              <div key={payment.id} className="rounded-xl border border-gray-200 bg-gray-50/60 p-3 space-y-2 text-xs">
                <div className="flex justify-between gap-2 flex-wrap">
                  <strong className="text-gray-800">{payment.amount.toLocaleString('pt-MZ')} MT</strong>
                  <span className={payment.status === 'CONTESTED' ? 'text-rose-700 font-semibold' :
                    payment.status === 'CONFIRMED' ? 'text-emerald-700 font-semibold' : 'text-amber-800 font-semibold'}>
                    {statusLabels[payment.status]}
                  </span>
                </div>
                <p className="text-gray-600">
                  {stageLabels[payment.stage]} · {payment.method} · Declaração referente a {payment.moment}
                </p>
                <p className="text-gray-500">
                  Data indicada: {payment.paidOn}
                  {payment.externalReference ? ' · Referência informada: ' + payment.externalReference : ''}
                </p>
                {payment.notes && <p className="text-gray-600">Observação: {payment.notes}</p>}
                {payment.responseNote && <p className="text-gray-600">Resposta: {payment.responseNote}</p>}
                <details>
                  <summary className="cursor-pointer text-blue-700 font-medium">Histórico do registo</summary>
                  <ul className="pl-4 mt-2 space-y-1 list-disc text-gray-500">
                    {payment.history.map((event, index) => (
                      <li key={index}>
                        {event.recordedAt.slice(0, 16).replace('T', ' ')} · Utilizador #{event.actorUserId}: {event.note}
                      </li>
                    ))}
                  </ul>
                </details>
                {worker && payment.status === 'REPORTED_PAID' && (
                  <div className="pt-2 border-t border-gray-200 space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={busy}
                        onClick={() => void respond(payment.id, 'CONFIRMED')}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg font-semibold disabled:opacity-60">
                        Confirmar recepção
                      </button>
                      <button type="button" disabled={busy}
                        onClick={() => { setContestingId(payment.id); setReason(''); }}
                        className="px-3 py-2 bg-white border border-rose-200 text-rose-700 rounded-lg font-semibold">
                        Contestar registo
                      </button>
                    </div>
                    {contestingId === payment.id && (
                      <div className="space-y-2">
                        <label className="block font-semibold text-gray-600">
                          Motivo da contestação
                          <textarea rows={2} value={reason} onChange={event => setReason(event.target.value)}
                            className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
                        </label>
                        <button type="button" disabled={busy || reason.trim().length < 8}
                          onClick={() => void respond(payment.id, 'CONTESTED')}
                          className="px-3 py-2 bg-rose-600 text-white rounded-lg font-semibold disabled:opacity-60">
                          Registar contestação
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : <p className="text-xs text-gray-500">Nenhum pagamento externo foi declarado neste contrato.</p>
      )}
      {employer && eligible && (
        <div className="pt-2">
          <button type="button" onClick={() => setShowForm(prev => !prev)}
            className="px-3 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
            {showForm ? 'Fechar formulário' : 'Registar pagamento realizado fora da plataforma'}
          </button>
          {showForm && (
            <form onSubmit={report} className="mt-3 p-4 border border-gray-200 rounded-xl space-y-3 text-xs">
              <p className="text-amber-800 font-semibold">
                Apenas declare um pagamento efectivamente efectuado por um canal externo.
                Este formulário não transfere dinheiro.
              </p>
              <label className="block text-gray-600 font-semibold">Valor declarado (MT)
                <input type="number" min="0.01" step="0.01" max={contract.budget}
                  value={amount} onChange={event => setAmount(event.target.value)} required
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <label className="block text-gray-600 font-semibold">Método externo
                <select value={method} onChange={event => setMethod(event.target.value as PaymentMethod)}
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg">
                  {methods.map(value => <option key={value} value={value}>{value}</option>)}
                </select>
              </label>
              <label className="block text-gray-600 font-semibold">Etapa
                <select value={stage} onChange={event => setStage(event.target.value as PaymentStage)}
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg">
                  {(Object.keys(stageLabels) as PaymentStage[]).map(value => (
                    <option key={value} value={value}>{stageLabels[value]}</option>
                  ))}
                </select>
              </label>
              <label className="block text-gray-600 font-semibold">Momento / condição acordada
                <input value={moment} onChange={event => setMoment(event.target.value)}
                  placeholder="Ex.: após aceitação da primeira entrega" required
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <label className="block text-gray-600 font-semibold">Data indicada da transacção externa
                <input type="date" max={new Date().toISOString().slice(0, 10)}
                  value={paidOn} onChange={event => setPaidOn(event.target.value)} required
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <label className="block text-gray-600 font-semibold">Referência fornecida pelo prestador (opcional)
                <input value={externalReference} onChange={event => setExternalReference(event.target.value)}
                  placeholder="Não geramos referências bancárias"
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <label className="block text-gray-600 font-semibold">Observações (opcional)
                <textarea rows={2} value={notes} onChange={event => setNotes(event.target.value)}
                  className="block mt-1 w-full p-2 border border-gray-200 rounded-lg" />
              </label>
              <button type="submit" disabled={busy}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60">
                {busy ? 'A guardar...' : 'Guardar declaração — não confirmar liquidação'}
              </button>
            </form>
          )}
        </div>
      )}
    </section>
  );
};
