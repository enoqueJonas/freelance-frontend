/** D53 — typed client for REAL Django/DRF API. No mocks.
 * JWT access token remains in React memory only; no localStorage.
 * Development routes /api through Vite proxy; production requires same-origin proxy.
 */
const base = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type Actor = { id: number; username: string; name: string; email: string; phone: string };
export type Worker = { id: number; name: string; skills: string; experience: string };
export type Employer = { id: number; employer_name: string; address: string; company_name: string };
export type Opportunity = {
  id: number; employer_user_id: number; title: string; description: string;
  status: 'DRAFT' | 'OPEN' | 'CLOSED'
};
export type Proposal = {
  id: number; opportunity_id: number; worker_user_id: number;
  worker_name: string; description: string;
  status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED'
};
export type OwnedProposal = {
  id: number; opportunity_id: number; opportunity_title: string;
  opportunity_status: 'DRAFT' | 'OPEN' | 'CLOSED';
  description: string; status: 'SUBMITTED' | 'ACCEPTED' | 'REJECTED';
};
export type AgreementVersion = {
  id: number; number: number;
  status: 'PROPOSED' | 'ACCEPTED' | 'SUPERSEDED' | 'REJECTED';
  is_current: boolean; scope: string; amount: string | null;
  price_after_diagnosis: boolean; content_fingerprint: string;
  proposed_by_user_id: number; rejected_by_user_id: number | null;
  rejected_at: string | null; rejection_reason: string; acceptances: number[];
};
export type Engagement = {
  id: number; proposal_id: number; status: 'PENDING_AGREEMENT' | 'ACTIVE';
  worker_user_id: number; employer_user_id: number;
  current_agreement_version_id: number | null; versions: AgreementVersion[];
};
export type Tokens = { access: string; refresh: string };

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function errorText(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const r = data as Record<string, unknown>;
    if (typeof r.detail === 'string') return r.detail;
    const parts = Object.entries(r).map(([k,v]) => k + ': ' + (Array.isArray(v) ? v.join(', ') : String(v)));
    if (parts.length) return parts.join(' · ');
  }
  return 'Pedido falhou (' + status + ')';
}
export async function request<T>(
  path: string, options: { method?: 'GET'|'POST'; body?: unknown; access?: string } = {}
): Promise<T> {
  const headers: Record<string,string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.access) headers.Authorization = 'Bearer ' + options.access;
  let response: Response;
  try {
    response = await fetch(base + path, {
      method: options.method || 'GET', headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: 'no-store', credentials: 'omit',
    });
  } catch {
    throw new ApiError(0, 'Não foi possível contactar a API Django. Verifique o servidor e o proxy /api.');
  }
  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try { data = JSON.parse(raw); }
    catch { throw new ApiError(response.status, 'A API devolveu conteúdo não JSON. Verifique o proxy.'); }
  }
  if (!response.ok) throw new ApiError(response.status, errorText(data, response.status));
  return data as T;
}
export const realApi = {
  login: (username:string,password:string) => request<Tokens>('/api/auth/login/',{method:'POST',body:{username,password}}),
  register: (data:{username:string;name:string;email:string;phone:string;password:string}) =>
    request<Actor>('/api/accounts/auth/register/',{method:'POST',body:data}),
  me: (access:string) => request<Actor>('/api/accounts/me/',{access}),
  worker: (access:string) => request<Worker>('/api/accounts/me/worker/',{access}),
  employer: (access:string) => request<Employer>('/api/accounts/me/employer/',{access}),
  createWorker: (access:string,data:{skills:string;experience:string}) =>
    request<Worker>('/api/accounts/me/worker/',{method:'POST',access,body:data}),
  createEmployer: (access:string,data:{company_name:string;address:string}) =>
    request<Employer>('/api/accounts/me/employer/',{method:'POST',access,body:data}),
  opportunities: (access:string) => request<Opportunity[]>('/api/marketplace/opportunities/',{access}),
  createOpportunity: (access:string,data:{title:string;description:string}) =>
    request<Opportunity>('/api/marketplace/opportunities/',{method:'POST',access,body:data}),
  publishOpportunity: (access:string,id:number) =>
    request<Opportunity>('/api/marketplace/opportunities/'+id+'/publish/',{method:'POST',access}),
  myProposals: (access:string) => request<OwnedProposal[]>('/api/marketplace/proposals/mine/',{access}),
  proposalsForOpportunity: (access:string,id:number) =>
    request<Proposal[]>('/api/marketplace/opportunities/'+id+'/proposals/',{access}),
  submitProposal: (access:string,id:number,description:string) =>
    request<Proposal>('/api/marketplace/opportunities/'+id+'/proposals/',{method:'POST',access,body:{description}}),
  acceptProposal: (access:string,id:number) =>
    request<{engagement_id:number;engagement_status:string}>('/api/marketplace/proposals/'+id+'/accept/',{method:'POST',access}),
  engagements: (access:string) => request<Engagement[]>('/api/contracts/engagements/',{access}),
  engagement: (access:string,id:number) => request<Engagement>('/api/contracts/engagements/'+id+'/',{access}),
  proposeAgreement: (access:string,id:number,data:{scope:string;amount?:string;price_after_diagnosis:boolean}) =>
    request<{version_id:number;content_fingerprint:string}>('/api/contracts/engagements/'+id+'/agreements/',{method:'POST',access,body:data}),
  acceptAgreement: (access:string,id:number,v:AgreementVersion) =>
    request<unknown>('/api/contracts/engagements/'+id+'/agreements/'+v.id+'/accept/',{method:'POST',access,body:{content_fingerprint:v.content_fingerprint}}),
  rejectAgreement: (access:string,id:number,v:AgreementVersion,reason:string) =>
    request<unknown>('/api/contracts/engagements/'+id+'/agreements/'+v.id+'/reject/',{method:'POST',access,body:{content_fingerprint:v.content_fingerprint,reason}}),
};
