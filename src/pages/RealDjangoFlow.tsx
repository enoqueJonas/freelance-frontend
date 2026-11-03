import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError, realApi } from '../services/realApi';
import type { Actor, Worker, Employer, Opportunity, Proposal, Engagement, AgreementVersion, OwnedProposal } from '../services/realApi';

const field = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const button = 'rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 hover:bg-blue-800';
const secondary = 'rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50 hover:bg-slate-50';

export function RealDjangoFlow() {
  // Intentionally independent of the legacy mock AuthContext and localStorage.
  const [access, setAccess] = useState<string | null>(null);
  const [actor, setActor] = useState<Actor | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [employer, setEmployer] = useState<Employer | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [proposals, setProposals] = useState<Record<number, Proposal[]>>({});
  const [myProposals, setMyProposals] = useState<OwnedProposal[]>([]);
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [mode, setMode] = useState<'login'|'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [company, setCompany] = useState('');
  const [address, setAddress] = useState('Maputo');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [proposalText, setProposalText] = useState<Record<number,string>>({});
  const [contractId, setContractId] = useState<number | null>(null);
  const [scope, setScope] = useState('');
  const [amount, setAmount] = useState('');
  const [diagnosis, setDiagnosis] = useState(false);
  const [rejection, setRejection] = useState<Record<number,string>>({});
  const [reviewed, setReviewed] = useState<Record<number,boolean>>({});
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  async function reload(token: string) {
    const [u, opps, contracts, w, e, owned] = await Promise.all([
      realApi.me(token),
      realApi.opportunities(token),
      realApi.engagements(token),
      realApi.worker(token).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
      realApi.employer(token).catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }),
      realApi.myProposals(token),
    ]);
    const incoming = await Promise.all(
      opps.filter(o => o.employer_user_id === u.id).map(async o => ({
        id: o.id, rows: await realApi.proposalsForOpportunity(token, o.id),
      }))
    );
    setActor(u);
    setOpportunities(opps);
    setEngagements(contracts);
    setWorker(w);
    setEmployer(e);
    setProposals(Object.fromEntries(incoming.map(x => [x.id,x.rows])));
    setMyProposals(owned);
  }

  function signOut() {
    setAccess(null);
    setActor(null);
    setWorker(null);
    setEmployer(null);
    setOpportunities([]);
    setEngagements([]);
    setProposals({});
    setMyProposals([]);
    setPassword('');
    setMode('login');
    setContractId(null);
    setReviewed({});
    setError('');
    setFeedback('Sessão encerrada. Para trocar de conta, inicie sessão com as credenciais reais.');
  }

  async function execute(action: (token:string) => Promise<unknown>, done: string) {
    if (!access || busy) return;
    setBusy(true); setError(''); setFeedback('');
    try {
      await action(access);
      await reload(access);
      setFeedback(done);
      setReviewed({});
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) signOut();
      setError(err instanceof Error ? err.message : 'Ocorreu um erro inesperado.');
    } finally { setBusy(false); }
  }

  async function authenticate(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(''); setFeedback('');
    try {
      if (mode === 'register') {
        await realApi.register({ username, password, name, email, phone });
      }
      const auth = await realApi.login(username, password);
      // Refresh token is deliberately not stored or used.
      await reload(auth.access);
      setAccess(auth.access);
      setPassword('');
      setFeedback('Sessão real iniciada. Os dados abaixo vêm da base de dados Django.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível autenticar.');
    } finally { setBusy(false); }
  }

  // D53 avoids mock polling, localStorage and the mock role selector.
  // Session is intentionally ephemeral: reload the page to end it.
  useEffect(() => { setReviewed({}); }, [contractId]);

  const mine = actor ? opportunities.filter(o => o.employer_user_id === actor.id) : [];
  const others = actor ? opportunities.filter(o => o.employer_user_id !== actor.id && o.status === 'OPEN') : [];
  const activeContract = engagements.find(e => e.id === contractId) || null;
  const myProposalByOpportunity = new Map(myProposals.map(p => [p.opportunity_id, p]));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-blue-700 uppercase">ConecTA · Integração D53</p>
            <h1 className="text-2xl font-bold mt-1">Fluxo real de contratação</h1>
            <p className="text-xs text-slate-500 mt-1">React → API Django → Base de dados · Sem mockApi</p>
          </div>
          <Link className={secondary} to="/">Voltar à demonstração antiga</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          <strong>Protótipo técnico, não produção.</strong> Este percurso utiliza endpoints reais D50–D53.
          As restantes páginas da aplicação continuam demonstrativas e não devem ser confundidas com
          operações validadas. Pagamentos, entregas, disputas e assinaturas qualificadas não estão implementados.
          A sessão desta página termina ao actualizar o browser.
        </div>

        {error && <div role="alert" className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">{error}</div>}
        {feedback && <div role="status" className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-900">{feedback}</div>}

        {!access ? (
          <section className="rounded-2xl border bg-white p-6 max-w-lg mx-auto shadow-sm">
            <div className="flex gap-2 mb-5">
              <button className={mode === 'login' ? button : secondary} onClick={() => setMode('login')}>Iniciar sessão</button>
              <button className={mode === 'register' ? button : secondary} onClick={() => setMode('register')}>Criar conta real</button>
            </div>
            <form onSubmit={authenticate} className="space-y-4">
              {mode === 'register' && (
                <>
                  <label className="block text-sm font-semibold">Nome completo
                    <input className={field} required value={name} onChange={e=>setName(e.target.value)} />
                  </label>
                  <label className="block text-sm font-semibold">Email
                    <input className={field} type="email" required value={email} onChange={e=>setEmail(e.target.value)} />
                  </label>
                  <label className="block text-sm font-semibold">Telefone moçambicano
                    <input className={field} required placeholder="84 123 4567" value={phone} onChange={e=>setPhone(e.target.value)} />
                  </label>
                </>
              )}
              <label className="block text-sm font-semibold">Nome de utilizador
                <input className={field} required autoComplete="username" value={username} onChange={e=>setUsername(e.target.value)} />
              </label>
              <label className="block text-sm font-semibold">Palavra-passe
                <input className={field} required type="password" autoComplete={mode === 'login' ? 'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} />
              </label>
              <button className={button} disabled={busy} type="submit">{busy?'A contactar Django...':mode==='login'?'Entrar com JWT real':'Registar e iniciar sessão'}</button>
            </form>
            <p className="text-xs text-slate-500 mt-4">Não há login por email sem palavra-passe nem contas fictícias nesta página.</p>
          </section>
        ) : (
          <>
            <section className="rounded-2xl border bg-white p-5 flex flex-wrap gap-4 items-center justify-between">
              <div><p className="font-semibold">{actor?.name || actor?.username}</p>
                <p className="text-xs text-slate-500">Conta #{actor?.id} · Perfis: {worker?'Trabalhador ':''}{employer?'Empregador':''}{!worker&&!employer?'nenhum':''}</p>
              </div>
              <div className="flex gap-2">
                <button className={secondary} disabled={busy} onClick={()=>void execute(async t=>{await reload(t);},'Dados actualizados da API.')}>Actualizar</button>
                <button className={secondary} onClick={signOut}>Sair / Trocar de conta</button>
              </div>
            </section>

            {(!worker || !employer) && (
              <section className="grid gap-4 md:grid-cols-2">
                {!worker && (
                  <form className="rounded-2xl bg-white border p-5 space-y-3" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.createWorker(t,{skills,experience}),'Perfil de trabalhador criado.');}}>
                    <h2 className="font-bold text-lg">Activar perfil de trabalhador</h2>
                    <input className={field} required placeholder="Competências: Django, React..." value={skills} onChange={e=>setSkills(e.target.value)} />
                    <input className={field} required placeholder="Experiência profissional" value={experience} onChange={e=>setExperience(e.target.value)} />
                    <button type="submit" className={button} disabled={busy}>Criar perfil</button>
                  </form>
                )}
                {!employer && (
                  <form className="rounded-2xl bg-white border p-5 space-y-3" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.createEmployer(t,{company_name:company,address}),'Perfil de empregador criado.');}}>
                    <h2 className="font-bold text-lg">Activar perfil de empregador</h2>
                    <input className={field} required placeholder="Nome da empresa" value={company} onChange={e=>setCompany(e.target.value)} />
                    <input className={field} required placeholder="Localização" value={address} onChange={e=>setAddress(e.target.value)} />
                    <button type="submit" className={button} disabled={busy}>Criar perfil</button>
                  </form>
                )}
              </section>
            )}

            {employer && (
              <section className="rounded-2xl border bg-white p-5">
                <h2 className="font-bold text-lg mb-3">1. Criar oportunidade real</h2>
                <form className="grid gap-3 md:grid-cols-[1fr_2fr_auto]" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.createOpportunity(t,{title,description}),'Oportunidade guardada como rascunho.');}}>
                  <input className={field} required placeholder="Título" value={title} onChange={e=>setTitle(e.target.value)} />
                  <input className={field} required placeholder="Descrição" value={description} onChange={e=>setDescription(e.target.value)} />
                  <button className={button} type="submit" disabled={busy}>Criar</button>
                </form>
              </section>
            )}

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 space-y-3">
                <h2 className="font-bold text-lg">2. Oportunidades disponíveis</h2>
                {others.length===0 && <p className="text-sm text-slate-500">Sem oportunidades abertas de outras contas.</p>}
                {others.map(o=>(
                  <div className="rounded-xl border p-4 space-y-2" key={o.id}>
                    <p className="font-semibold">{o.title} <span className="text-xs text-slate-400">#{o.id}</span></p>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">{o.description}</p>
                    {worker && myProposalByOpportunity.has(o.id) && (
                      <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800" data-testid={'proposal-status-'+o.id}>
                        Proposta submetida · {myProposalByOpportunity.get(o.id)?.status}
                      </p>
                    )}
                    {worker && !myProposalByOpportunity.has(o.id) && (
                      <form className="flex gap-2" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.submitProposal(t,o.id,proposalText[o.id]||''),'Proposta submetida ao empregador.');}}>
                        <input className={field} required placeholder="Descreva a proposta" value={proposalText[o.id]||''} onChange={e=>setProposalText(prev=>({...prev,[o.id]:e.target.value}))}/>
                        <button type="submit" className={button} disabled={busy}>Propor</button>
                      </form>
                    )}
                    {!worker && <p className="text-xs text-slate-500">Crie um perfil de trabalhador para submeter proposta.</p>}
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border bg-white p-5 space-y-3">
                <h2 className="font-bold text-lg">3. As minhas oportunidades e propostas</h2>
                {mine.length===0 && <p className="text-sm text-slate-500">Nenhuma oportunidade criada.</p>}
                {mine.map(o=>(
                  <div className="rounded-xl border p-4 space-y-3" key={o.id}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold">{o.title}</p><span className="text-xs rounded bg-slate-100 p-1">{o.status}</span>
                    </div>
                    {o.status==='DRAFT' && <button className={secondary} disabled={busy} onClick={()=>void execute(t=>realApi.publishOpportunity(t,o.id),'Oportunidade publicada.')}>Publicar</button>}
                    {(proposals[o.id]||[]).length===0 && <p className="text-xs text-slate-500">Ainda sem propostas.</p>}
                    {(proposals[o.id]||[]).map(p=>(
                      <div className="rounded-lg bg-slate-50 p-3 space-y-2" key={p.id}>
                        <p className="text-sm font-medium">{p.worker_name} · {p.status}</p>
                        <p className="text-sm text-slate-700">{p.description}</p>
                        {p.status==='SUBMITTED' && o.status==='OPEN' && <button disabled={busy} className={button} onClick={()=>void execute(t=>realApi.acceptProposal(t,p.id),'Proposta aceite; contratação pendente criada.')}>Aceitar proposta</button>}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            {worker && (
              <section className="rounded-2xl border bg-white p-5 space-y-3" aria-label="Minhas propostas">
                <h2 className="font-bold text-lg">Minhas propostas</h2>
                {myProposals.length===0 && <p className="text-sm text-slate-500">Ainda não submeteu propostas.</p>}
                {myProposals.map(p=>(
                  <article className="rounded-lg border bg-slate-50 p-3" key={p.id} data-testid={'my-proposal-'+p.id}>
                    <p className="text-sm font-semibold">{p.opportunity_title}</p>
                    <p className="text-sm text-slate-600">Proposta #{p.id}: {p.status} · Oportunidade: {p.opportunity_status}</p>
                  </article>
                ))}
              </section>
            )}

            <section className="rounded-2xl border bg-white p-5 space-y-4">
              <h2 className="font-bold text-lg">4. Contratações e acordos versionados</h2>
              {engagements.length===0 && <p className="text-sm text-slate-500">Sem contratações associadas a esta conta. Aceite uma proposta e entre com a outra conta para rever os termos.</p>}
              <div className="flex flex-wrap gap-2">
                {engagements.map(e=>(
                  <button key={e.id} className={contractId===e.id?button:secondary} onClick={()=>setContractId(e.id)}>
                    Contratação #{e.id} · {e.status}
                  </button>
                ))}
              </div>
              {activeContract && (
                <div className="space-y-5 border-t pt-5">
                  <p className="text-sm text-slate-600">Trabalhador #{activeContract.worker_user_id} · Empregador #{activeContract.employer_user_id} · <strong>{activeContract.status}</strong></p>
                  {!activeContract.versions.some(v=>v.status==='PROPOSED') && (
                    <form className="space-y-3" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.proposeAgreement(t,activeContract.id,{scope,price_after_diagnosis:diagnosis,...(diagnosis?{}:{amount})}),'Nova versão do acordo proposta.');}}>
                      <h3 className="font-semibold">Propor {activeContract.versions.length?'alteração ao acordo':'primeiro acordo'}</h3>
                      <textarea className={field} rows={3} required placeholder="Âmbito e entregáveis acordados" value={scope} onChange={e=>setScope(e.target.value)}/>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={diagnosis} onChange={e=>setDiagnosis(e.target.checked)} /> Definir preço após diagnóstico
                      </label>
                      {!diagnosis && <input type="number" min="0.01" step="0.01" className={field} required placeholder="Valor em MZN" value={amount} onChange={e=>setAmount(e.target.value)} />}
                      <button disabled={busy} className={button} type="submit">Submeter versão</button>
                    </form>
                  )}
                  <div className="space-y-3">
                    {activeContract.versions.map(v=>(
                      <article className="rounded-xl border border-slate-200 p-4 space-y-2" key={v.id}>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong>v{v.number}</strong>
                          <span className="rounded bg-slate-100 px-2 py-1 text-xs">{v.status}</span>
                          {v.is_current && <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-1 text-xs">Vigente</span>}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{v.scope}</p>
                        <p className="text-sm text-slate-600">{v.price_after_diagnosis?'Preço após diagnóstico': 'Valor: '+v.amount+' MZN'}</p>
                        <p className="text-xs text-slate-500">Aceites: {v.acceptances.length}/2 · Versão vinculada ao conteúdo apresentado</p>
                        {v.status==='REJECTED' && <p className="text-sm text-red-800">Motivo: {v.rejection_reason}</p>}
                        {v.status==='PROPOSED' && actor && (
                          <div className="space-y-3">
                            {!v.acceptances.includes(actor.id) && (
                              <>
                                <label className="flex gap-2 items-start text-sm">
                                  <input type="checkbox" checked={!!reviewed[v.id]} onChange={e=>setReviewed(old=>({...old,[v.id]:e.target.checked}))}/>
                                  Confirmo que li esta versão e pretendo aceitá-la nas condições apresentadas.
                                </label>
                                <button disabled={busy||!reviewed[v.id]} className={button} onClick={()=>void execute(t=>realApi.acceptAgreement(t,activeContract.id,v),'Aceitação registada na API.')}>Aceitar versão v{v.number}</button>
                              </>
                            )}
                            {v.proposed_by_user_id!==actor.id && (
                              <form className="flex gap-2" onSubmit={e=>{e.preventDefault();void execute(t=>realApi.rejectAgreement(t,activeContract.id,v,rejection[v.id]||''),'Alteração rejeitada, acordo anterior preservado.');}}>
                                <input className={field} required placeholder="Motivo da rejeição" value={rejection[v.id]||''} onChange={e=>setRejection(old=>({...old,[v.id]:e.target.value}))}/>
                                <button disabled={busy} type="submit" className={secondary}>Rejeitar</button>
                              </form>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
