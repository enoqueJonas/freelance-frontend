import React, { useEffect, useState } from 'react';
import { Dispute, DisputeStatus } from '../types';
import { disputeService } from '../services/disputes';

interface Props {
  adminId: number;
  onUpdated?: () => void;
}

const labels: Record<DisputeStatus, string> = {
  OPEN: 'Novo reporte',
  UNDER_REVIEW: 'Em análise documental',
  WAITING_INFORMATION: 'Informação adicional solicitada',
  RESOLVED: 'Resultado administrativo registado',
  CLOSED: 'Encerrado administrativamente'
};

export const AdminDisputesPanel: React.FC<Props> = ({ adminId, onUpdated }) => {
  const [cases, setCases] = useState<Dispute[]>([]);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [recipients, setRecipients] = useState<Record<number, number>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    try {
      setCases(await disputeService.listForUser(adminId));
    } catch (err: any) {
      setError(err.message || 'Falha ao consultar ocorrências.');
    }
  };

  useEffect(() => { void load(); }, [adminId]);

  const perform = async (d: Dispute, action: 'start' | 'ask' | 'result' | 'close') => {
    if (busyId !== null) return;
    setBusyId(d.id);
    setError('');
    setSuccess('');
    const reason = notes[d.id] ?? '';
    try {
      if (action === 'start') {
        await disputeService.beginReview(d.id, adminId, reason);
      } else if (action === 'ask') {
        await disputeService.requestInformation(
          d.id, adminId, recipients[d.id] || d.reportedByUserId, reason
        );
      } else if (action === 'result') {
        await disputeService.registerAdministrativeResult(d.id, adminId, reason);
      } else {
        await disputeService.closeCase(d.id, adminId, reason);
      }
      setNotes(prev => ({ ...prev, [d.id]: '' }));
      setSuccess('A actividade foi registada com autoria, data e estado.');
      await load();
      onUpdated?.();
    } catch (err: any) {
      setError(err.message || 'Não foi possível registar a actividade.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4"
      aria-label="Gestão administrativa de conflitos">
      <div>
        <h3 className="font-bold text-base text-gray-850">Acompanhamento de conflitos</h3>
        <p className="text-xs text-gray-500 mt-1">
          Organização de reportes, pedidos de informação e encerramentos documentados.
          Não constitui mediação vinculativa, arbitragem nem decisão sobre direitos contratuais.
        </p>
      </div>
      {error && <p role="alert" className="text-xs text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
      {success && <p role="status" className="text-xs text-emerald-700 bg-emerald-50 p-3 rounded-lg">{success}</p>}
      {cases.length === 0 ? <p className="text-xs text-gray-500">Nenhum conflito foi reportado.</p> : (
        <div className="space-y-4">
          {cases.map(d => (
            <article key={d.id} className="rounded-xl border border-gray-200 p-4 space-y-3 text-xs">
              <div className="flex justify-between gap-2 flex-wrap">
                <strong className="text-gray-800">Ocorrência #{d.id} · Contrato #{d.contractId}</strong>
                <span className="text-blue-700 font-bold">{labels[d.status]}</span>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{d.description}</p>
              <p className="text-gray-500">
                Categoria: {d.category} · Reportado pelo utilizador #{d.reportedByUserId}
              </p>
              <details>
                <summary className="cursor-pointer text-gray-700 font-semibold">
                  Evidências ({d.evidence.length})
                </summary>
                <ul className="mt-2 pl-4 space-y-2 list-disc text-gray-600">
                  {d.evidence.map(e => (
                    <li key={e.id}>
                      #{e.authorUserId} · {e.createdAt.slice(0, 16).replace('T', ' ')}:
                      {' '}{e.description}
                      {e.url && <span> · <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Referência</a></span>}
                    </li>
                  ))}
                </ul>
              </details>
              <details>
                <summary className="cursor-pointer text-gray-700 font-semibold">
                  Histórico ({d.events.length})
                </summary>
                <ol className="mt-2 pl-4 list-decimal space-y-1 text-gray-600">
                  {d.events.map(e => (
                    <li key={e.id}>
                      {e.recordedAt.slice(0,16).replace('T',' ')} · Utilizador #{e.actorUserId}
                      {' — '}{e.note} ({labels[e.statusAfter]})
                    </li>
                  ))}
                </ol>
              </details>
              {d.administrativeResult && (
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-700">
                  Resultado administrativo (não arbitral): {d.administrativeResult}
                </div>
              )}
              {d.status === 'WAITING_INFORMATION' && (
                <p className="text-amber-800 bg-amber-50 p-3 rounded-lg">
                  A aguardar resposta do utilizador #{d.requestedFromUserId}. A informação é recebida
                  no painel da parte; o administrador não pode fabricar a resposta.
                </p>
              )}
              {d.status !== 'WAITING_INFORMATION' && d.status !== 'CLOSED' && (
                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <label className="block font-semibold text-gray-700">
                    {d.status === 'RESOLVED' ? 'Justificação do encerramento' :
                      d.status === 'OPEN' ? 'Motivo da abertura de análise' :
                      'Pedido de informação ou resultado administrativo'}
                    <textarea rows={2} value={notes[d.id] || ''}
                      onChange={e => setNotes(prev => ({ ...prev, [d.id]: e.target.value }))}
                      className="mt-1 block w-full border border-gray-200 rounded-lg p-2"
                      placeholder="Registe factos e medidas administrativas; não decida direitos, pagamentos ou a validade do contrato." />
                  </label>
                  {d.status === 'UNDER_REVIEW' && (
                    <label className="block font-semibold text-gray-700">
                      Solicitar informação a
                      <select value={recipients[d.id] || d.reportedByUserId}
                        onChange={e => setRecipients(prev => ({ ...prev, [d.id]: Number(e.target.value) }))}
                        className="mt-1 block w-full border border-gray-200 rounded-lg p-2">
                        <option value={d.employerUserId}>Empregador (#{d.employerUserId})</option>
                        <option value={d.workerUserId}>Trabalhador (#{d.workerUserId})</option>
                      </select>
                    </label>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    {d.status === 'OPEN' && (
                      <button type="button" disabled={busyId !== null || (notes[d.id] || '').trim().length < 8}
                        onClick={() => void perform(d, 'start')}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60">
                        Iniciar análise documental
                      </button>
                    )}
                    {d.status === 'UNDER_REVIEW' && (
                      <>
                        <button type="button" disabled={busyId !== null || (notes[d.id] || '').trim().length < 12}
                          onClick={() => void perform(d, 'ask')}
                          className="px-3 py-2 bg-amber-600 text-white rounded-lg font-semibold disabled:opacity-60">
                          Solicitar informação
                        </button>
                        <button type="button" disabled={busyId !== null || (notes[d.id] || '').trim().length < 20}
                          onClick={() => void perform(d, 'result')}
                          className="px-3 py-2 bg-gray-800 text-white rounded-lg font-semibold disabled:opacity-60">
                          Registar resultado administrativo
                        </button>
                      </>
                    )}
                    {d.status === 'RESOLVED' && (
                      <button type="button" disabled={busyId !== null || (notes[d.id] || '').trim().length < 8}
                        onClick={() => void perform(d, 'close')}
                        className="px-3 py-2 bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-60">
                        Encerrar acompanhamento
                      </button>
                    )}
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
