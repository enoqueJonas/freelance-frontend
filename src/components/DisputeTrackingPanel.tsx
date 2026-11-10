import React, { useEffect, useState } from 'react';
import { Contract, Dispute, DisputeCategory, DisputeStatus } from '../types';
import { disputeService } from '../services/disputes';

interface Props {
  contract: Contract;
  userId: number;
}
const categories: Record<DisputeCategory, string> = {
  SCOPE: 'Âmbito e alterações',
  DEADLINE: 'Prazos',
  DELIVERABLE: 'Entregas e qualidade',
  PAYMENT: 'Condições de pagamento',
  COMMUNICATION: 'Comunicação',
  OTHER: 'Outro'
};
const statusLabels: Record<DisputeStatus, string> = {
  OPEN: 'Reportado',
  UNDER_REVIEW: 'Em análise administrativa',
  WAITING_INFORMATION: 'A aguardar informação',
  RESOLVED: 'Resultado administrativo registado',
  CLOSED: 'Acompanhamento encerrado'
};
export const DisputeTrackingPanel: React.FC<Props> = ({ contract, userId }) => {
  const [cases, setCases] = useState<Dispute[]>([]);
  const [showReport, setShowReport] = useState(false);
  const [category, setCategory] = useState<DisputeCategory>('DELIVERABLE');
  const [description, setDescription] = useState('');
  const [evidenceDescription, setEvidenceDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceFor, setEvidenceFor] = useState<number | null>(null);
  const [addDescription, setAddDescription] = useState('');
  const [addUrl, setAddUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const eligible = userId === contract.employerId || userId === contract.workerProfile.userId;

  const load = async () => {
    try {
      const result = await disputeService.listForUser(userId);
      setCases(result.filter(d => d.contractId === contract.id));
    } catch (err: any) {
      setError(err.message || 'Não foi possível consultar os conflitos.');
    }
  };
  useEffect(() => {
    setCases([]);
    setError('');
    void load();
  }, [contract.id, userId]);

  const report = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eligible || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await disputeService.report(contract.id, userId, {
        category, description, evidenceDescription, evidenceUrl
      });
      setShowReport(false);
      setDescription('');
      setEvidenceDescription('');
      setEvidenceUrl('');
      setNotice('Conflito registado para acompanhamento. Não existe decisão arbitral.');
      await load();
    } catch (err: any) {
      setError(err.message || 'Falha ao registar o conflito.');
    } finally {
      setBusy(false);
    }
  };
  const addEvidence = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!eligible || evidenceFor === null || busy) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await disputeService.addEvidence(evidenceFor, userId, addDescription, addUrl);
      setNotice('Informação adicionada ao histórico.');
      setEvidenceFor(null);
      setAddDescription('');
      setAddUrl('');
      await load();
    } catch (err: any) {
      setError(err.message || 'Falha ao acrescentar evidências.');
    } finally {
      setBusy(false);
    }
  };
  if (!eligible) return null;
  return (
    <section className="mt-5 pt-5 border-t border-gray-100 space-y-4" aria-label="Reporte e acompanhamento de conflitos">
      <div className="flex flex-wrap gap-3 justify-between items-start">
        <div>
          <h5 className="text-sm font-bold text-gray-800">Conflitos associados à contratação</h5>
          <p className="text-xs text-gray-500 mt-1">
            Registo e acompanhamento documental. A plataforma não arbitra direitos, não
            decide pagamentos e não altera unilateralmente o contrato.
          </p>
        </div>
        <button type="button" onClick={() => setShowReport(!showReport)}
          className="px-3 py-2 text-xs font-semibold text-blue-700 border border-blue-200 rounded-lg bg-blue-50">
          {showReport ? 'Fechar' : 'Reportar conflito'}
        </button>
      </div>
      {error && <p role="alert" className="text-xs text-red-700 bg-red-50 p-3 rounded-lg">{error}</p>}
      {notice && <p role="status" className="text-xs text-green-700 bg-green-50 p-3 rounded-lg">{notice}</p>}
      {contract.status === 'disputed' && cases.length === 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 p-3 rounded-lg">
          Esta contratação contém um estado legado de disputa sem registo estruturado.
          Esse estado não constitui prova de análise administrativa.
        </p>
      )}
      {showReport && (
        <form onSubmit={report} className="border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
          <p className="text-gray-600">Utilize apenas dados de demonstração. Evidências reais e documentos privados não devem ser guardados neste protótipo.</p>
          <label className="block font-semibold text-gray-700">
            Categoria
            <select value={category} onChange={e => setCategory(e.target.value as DisputeCategory)}
              className="mt-1 block w-full border border-gray-200 rounded-lg p-2">
              {(Object.keys(categories) as DisputeCategory[]).map(k => (
                <option key={k} value={k}>{categories[k]}</option>
              ))}
            </select>
          </label>
          <label className="block font-semibold text-gray-700">
            Descrição dos factos
            <textarea required rows={3} minLength={20} maxLength={4000}
              value={description} onChange={e => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-lg p-2"
              placeholder="Descreva o acontecimento e o que pretende esclarecer." />
          </label>
          <label className="block font-semibold text-gray-700">
            Descrição da evidência
            <textarea required rows={2} minLength={8} maxLength={2000}
              value={evidenceDescription} onChange={e => setEvidenceDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-lg p-2"
              placeholder="Ex.: mensagem de aceitação enviada a 5 de novembro." />
          </label>
          <label className="block font-semibold text-gray-700">
            URL da referência (opcional)
            <input type="url" value={evidenceUrl} onChange={e => setEvidenceUrl(e.target.value)}
              className="mt-1 block w-full border border-gray-200 rounded-lg p-2"
              placeholder="https://exemplo.test/referencia-sintetica" />
          </label>
          <button type="submit" disabled={busy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60">
            {busy ? 'A guardar...' : 'Registar ocorrência'}
          </button>
        </form>
      )}
      {cases.length === 0 ? (
        <p className="text-xs text-gray-500">Ainda não existem conflitos formalmente registados nesta contratação.</p>
      ) : cases.map(dispute => {
        const canAdd = dispute.status !== 'RESOLVED' && dispute.status !== 'CLOSED';
        const requested = dispute.status === 'WAITING_INFORMATION' && dispute.requestedFromUserId === userId;
        return (
          <article key={dispute.id} className="border border-gray-200 rounded-xl p-4 space-y-3 text-xs">
            <div className="flex flex-wrap justify-between gap-2">
              <strong className="text-gray-800">Ocorrência #{dispute.id} · {categories[dispute.category]}</strong>
              <span className="text-blue-700 font-semibold">{statusLabels[dispute.status]}</span>
            </div>
            <p className="text-gray-700 whitespace-pre-wrap">{dispute.description}</p>
            {requested && (
              <p className="text-amber-800 bg-amber-50 p-2 rounded-lg">
                Foi solicitada informação adicional ao teu utilizador. Adiciona uma evidência para devolver o caso à análise.
              </p>
            )}
            {dispute.administrativeResult && (
              <p className="bg-gray-50 p-3 rounded-lg text-gray-700">
                Resultado do acompanhamento: {dispute.administrativeResult}
              </p>
            )}
            <details>
              <summary className="cursor-pointer font-semibold text-gray-700">
                Evidências registadas ({dispute.evidence.length})
              </summary>
              <ul className="pl-4 mt-2 list-disc space-y-2 text-gray-600">
                {dispute.evidence.map(e => (
                  <li key={e.id}>
                    Utilizador #{e.authorUserId} · {e.createdAt.slice(0, 16).replace('T', ' ')}:
                    {' '}{e.description}
                    {e.url && <span> · <a href={e.url} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">Referência externa</a></span>}
                  </li>
                ))}
              </ul>
            </details>
            <details>
              <summary className="cursor-pointer font-semibold text-gray-700">
                Histórico administrativo ({dispute.events.length})
              </summary>
              <ol className="pl-4 mt-2 list-decimal space-y-2 text-gray-600">
                {dispute.events.map(e => (
                  <li key={e.id}>
                    {e.recordedAt.slice(0, 16).replace('T', ' ')} · Utilizador #{e.actorUserId}:
                    {' '}{e.note} ({statusLabels[e.statusAfter]})
                  </li>
                ))}
              </ol>
            </details>
            {canAdd && (
              <div>
                <button type="button" onClick={() => { setEvidenceFor(dispute.id); setAddDescription(''); setAddUrl(''); }}
                  className="text-xs text-blue-700 font-semibold underline">
                  {requested ? 'Responder ao pedido de informação' : 'Adicionar evidência'}
                </button>
                {evidenceFor === dispute.id && (
                  <form onSubmit={addEvidence} className="mt-3 p-3 rounded-lg bg-gray-50 space-y-2">
                    <label className="block font-semibold text-gray-700">
                      Nova descrição da evidência
                      <textarea required minLength={8} maxLength={2000} rows={2}
                        value={addDescription} onChange={e => setAddDescription(e.target.value)}
                        className="mt-1 block w-full border border-gray-200 rounded-lg p-2" />
                    </label>
                    <label className="block font-semibold text-gray-700">
                      URL (opcional)
                      <input type="url" value={addUrl} onChange={e => setAddUrl(e.target.value)}
                        className="mt-1 block w-full border border-gray-200 rounded-lg p-2" />
                    </label>
                    <button type="submit" disabled={busy}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg font-semibold disabled:opacity-60">
                      Registar evidência
                    </button>
                    <button type="button" onClick={() => setEvidenceFor(null)}
                      className="ml-2 px-3 py-2 border border-gray-200 rounded-lg">Cancelar</button>
                  </form>
                )}
              </div>
            )}
          </article>
        );
      })}
    </section>
  );
};
