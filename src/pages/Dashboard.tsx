/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ProfileRolesPanel } from '../components/ProfileRolesPanel';
import { mockApi } from '../services/mockApi';
import { 
  Offer, Proposal, Contract, Payment, User as SystemUser, Notification 
} from '../types';
import { 
  LayoutDashboard, PlusCircle, FileText, Send, UserCheck, 
  AlertTriangle, Shield, CheckCircle2, CircleDollarSign, LucideStar, 
  MessageSquare, FileSignature, Sparkles, Scale, RefreshCw, Search
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, profile, refreshUserData, uploadDocument } = useAuth();
  const navigate = useNavigate();

  // Master Lists
  const [userOffers, setUserOffers] = useState<Offer[]>([]);
  const [userProposals, setUserProposals] = useState<Proposal[]>([]);
  const [userContracts, setUserContracts] = useState<Contract[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<SystemUser[]>([]);

  // Selection states
  const [activeTab, setActiveTab] = useState<'overview' | 'offers' | 'proposals' | 'contracts' | 'admin'>('overview');
  
  // Create Offer Form State
  const [offerTitle, setOfferTitle] = useState('');
  const [offerCategory, setOfferCategory] = useState('Desenvolvimento Web');
  const [offerBudget, setOfferBudget] = useState('');
  const [offerLoc, setOfferLoc] = useState('Remoto');
  const [offerSkills, setOfferSkills] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerSuccess, setOfferSuccess] = useState(false);
  const [offerError, setOfferError] = useState('');

  // Payment Form Escrow State
  const [payingContract, setPayingContract] = useState<Contract | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<'M-Pesa' | 'e-Mola' | 'Transferência Bancária'>('M-Pesa');
  const [payoutInProgress, setPayoutInProgress] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Review Form state
  const [reviewContract, setReviewContract] = useState<Contract | null>(null);
  const [reviewScore, setReviewScore] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Document upload mockup
  const [docFileUrl, setDocFileUrl] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);

  // Global Loader
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadData();
  }, [user]);

  // Não manter uma aba exclusiva do papel anterior após mudar de contexto.
  useEffect(() => {
    setActiveTab('overview');
    setUserOffers([]);
    setUserProposals([]);
    setUserContracts([]);
  }, [user?.role]);

  const loadData = async () => {
    if (!user) return;
    try {
      if (user.role === 'employer') {
        const offers = await mockApi.offers.list();
        const myOffers = offers.filter(o => o.employerProfile.userId === user.id);
        setUserOffers(myOffers);

        const proposals = await mockApi.proposals.list();
        // Proposals on employer's offers
        const myOfferIds = myOffers.map(o => o.id);
        const myProposals = proposals.filter(p => myOfferIds.includes(p.offerId));
        setUserProposals(myProposals);

        const myContracts = await mockApi.contracts.getForUser(user.id, 'employer');
        setUserContracts(myContracts);

      } else if (user.role === 'worker' && profile) {
        const myProposals = await mockApi.proposals.getForWorker(profile.id);
        setUserProposals(myProposals);

        const myContracts = await mockApi.contracts.getForUser(user.id, 'worker');
        setUserContracts(myContracts);
        
      } else if (user.role === 'admin') {
        const pDocs = await mockApi.admin.listPendingVerifications();
        setPendingVerifications(pDocs);

        const usersList = await mockApi.admin.listAllUsers();
        setAllUsers(usersList);

        const allContracts = await mockApi.contracts.list();
        setUserContracts(allContracts);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ---- WORKER ACTIONS ----
  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFileUrl) return;
    setUploadLoading(true);
    try {
      await uploadDocument(docFileUrl);
      await loadData();
      setDocFileUrl('');
    } catch (err) {
      console.error(err);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleSignContract = async (contractId: number) => {
    setLoadingAction(true);
    try {
      await mockApi.contracts.sign(contractId, user!.id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // ---- EMPLOYER ACTIONS ----
  const handleOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerTitle || !offerBudget) return;
    setOfferError('');
    setOfferSuccess(false);

    try {
      const skillsArr = offerSkills.split(',').map(s => s.trim()).filter(Boolean);
      await mockApi.offers.create(user!.id, {
        title: offerTitle,
        category: offerCategory,
        salaryBudget: Number(offerBudget),
        location: offerLoc,
        requiredSkills: skillsArr,
        description: offerDesc
      });
      setOfferSuccess(true);
      setOfferTitle('');
      setOfferBudget('');
      setOfferDesc('');
      setOfferSkills('');
      loadData();
    } catch (err: any) {
      setOfferError(err.message || 'Erro durante a publicação da vaga.');
    }
  };

  const handleCreateContract = async (proposalId: number) => {
    setLoadingAction(true);
    try {
      await mockApi.contracts.createFromProposal(user!.id, proposalId);
      await loadData();
      setActiveTab('contracts');
    } catch (err: any) {
      alert(err.message || 'Erro ao criar o contrato.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handlePayEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingContract) return;

    setPayoutInProgress(true);
    try {
      await mockApi.payments.createPay(payingContract.id, {
        amount: payingContract.budget,
        method: payoutMethod
      });
      setPayoutSuccess(true);
      await loadData();
      setTimeout(() => {
        setPayoutSuccess(false);
        setPayingContract(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setPayoutInProgress(false);
    }
  };

  const handleCompleteContract = async (contractId: number) => {
    setLoadingAction(true);
    try {
      await mockApi.contracts.complete(contractId);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleRaiseDispute = async (contractId: number) => {
    const conf = window.confirm("Tens a certeza que desejas entrar em disputa oficial para mediação técnica com a equipa ServiPlus?");
    if (!conf) return;

    setLoadingAction(true);
    try {
      await mockApi.contracts.dispute(contractId, user!.id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  // ---- REVIEW ACTIONS ----
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContract) return;

    try {
      await mockApi.reviews.create(reviewContract.id, user!.id, reviewScore, reviewComment);
      setReviewSuccess(true);
      setReviewComment('');
      loadData();
      setTimeout(() => {
        setReviewSuccess(false);
        setReviewContract(null);
      }, 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // ---- ADMIN ACTIONS ----
  const handleVerifyDocument = async (userId: number, approve: boolean) => {
    setLoadingAction(true);
    try {
      await mockApi.admin.approveDocument(userId, approve);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAdminResolveDispute = async (contractId: number, outcome: 'completed' | 'active') => {
    setLoadingAction(true);
    try {
      await mockApi.admin.resolveDispute(contractId, outcome);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAction(false);
    }
  };

  if (!user) return null;

  // Render Stats Row helper
  const renderStatsRow = () => {
    if (user.role === 'worker') {
      const activeContractsCount = userContracts.filter(c => c.status === 'active').length;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Candidaturas Ativas</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{userProposals.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Contratos Ativos</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{activeContractsCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Serviços Entregues</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{profile && 'completedJobs' in profile ? profile.completedJobs : 0}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Rating Médio</p>
            <p className="text-2xl font-bold text-amber-500 mt-1 flex items-center gap-1">
              <LucideStar className="fill-current text-amber-400 shrink-0" size={18} />
              {profile && 'averageRating' in profile ? profile.averageRating : '5.0'}
            </p>
          </div>
        </div>
      );
    } else if (user.role === 'employer') {
      const activeOffersCount = userOffers.filter(o => o.status === 'active').length;
      const pendingBids = userProposals.filter(p => p.status === 'pending').length;
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Projetos Ativos</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{activeOffersCount}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Propostas Pendentes</p>
            <p className="text-2xl font-bold text-orange-655 text-orange-500 mt-1">{pendingBids}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Contratos Ativos</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{userContracts.filter(c => c.status === 'active').length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Sob Custódia (Escrow)</p>
            <p className="text-2xl font-bold text-gray-700 font-mono mt-1">
              {userContracts.filter(c => c.status === 'active').reduce((acc, current) => acc + current.budget, 0).toLocaleString()} MT
            </p>
          </div>
        </div>
      );
    } else {
      // Admin stats
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Utilizadores Totais</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{allUsers.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Dossiês em Revisão</p>
            <p className="text-2xl font-bold text-orange-500 mt-1 bg-orange-50 px-2 py-0.5 rounded inline-block">{pendingVerifications.length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Disputas em Curso</p>
            <p className="text-2xl font-bold text-red-600 mt-1 bg-red-50 px-2 py-0.5 rounded inline-block">{userContracts.filter(c => c.status === 'disputed').length}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase">Total Contratado</p>
            <p className="text-2xl font-bold text-gray-800 font-mono mt-1">{userContracts.reduce((acc, c) => acc + c.budget, 0).toLocaleString()} MT</p>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen">
      {/* Header and Sync indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-8">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
            ✓ Logado como {user.first_name} ({user.role === 'worker' ? 'Prestador' : user.role === 'employer' ? 'Contratante' : 'Admin'})
          </span>
          <h1 className="font-sans font-bold text-3xl text-gray-900 tracking-tight mt-1">
            Painel Geral de Gestão
          </h1>
        </div>

        <button 
          onClick={loadData}
          className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary bg-gray-100 hover:bg-gray-200/60 px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
        >
          <RefreshCw size={14} className={loadingAction ? 'animate-spin' : ''} /> actualizar dados
        </button>
      </div>

      {user.role !== 'admin' && <ProfileRolesPanel />}
      {renderStatsRow()}

      {/* Tabs list based on user roles */}
      <div className="flex border-b border-gray-100 mb-8 overflow-x-auto gap-4 scrollbar-none font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'overview' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Vista Geral
        </button>

        {user.role === 'employer' && (
          <>
            <button
              onClick={() => setActiveTab('offers')}
              className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'offers' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Minhas Vagas & Publicar
            </button>
            <button
              onClick={() => setActiveTab('proposals')}
              className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap ${
                activeTab === 'proposals' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Propostas Recebidas
            </button>
          </>
        )}

        {user.role === 'worker' && (
          <button
            onClick={() => setActiveTab('proposals')}
            className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap ${
              activeTab === 'proposals' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Minhas Candidaturas
          </button>
        )}

        <button
          onClick={() => setActiveTab('contracts')}
          className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all whitespace-nowrap ${
            activeTab === 'contracts' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Contratos & Estágio ({userContracts.length})
        </button>

        {user.role === 'admin' && (
          <button
            onClick={() => setActiveTab('admin')}
            className={`pb-4 px-1 text-sm border-b-2 font-bold cursor-pointer transition-all text-rose-650 ${
              activeTab === 'admin' ? 'border-rose-500 text-rose-600' : 'border-transparent text-gray-500 hover:text-rose-700'
            }`}
          >
            Moderação de BI ({pendingVerifications.length})
          </button>
        )}
      </div>

      {loadingAction && (
        <div className="text-center py-4 text-xs font-semibold text-primary">
          Processando instrução técnica na base de dados local...
        </div>
      )}

      {/* --------------------- TAB CONTENT: OVERVIEW --------------------- */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main content col */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Verification banner if pending/unsubmitted */}
            {profile && 'documentStatus' in profile && profile.documentStatus !== 'approved' && (
              <div className="bg-amber-50 rounded-2xl border border-amber-100 p-6 space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="p-2 rounded bg-amber-100 text-amber-700 shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-850">A sua conta ainda não está Verificada!</h3>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                      De acordo com as políticas do Ministério da Ciência e Tecnologia em Moçambique para trabalho autónomo, exigimos BI/NUIT ou Registo Comercial para processamentos seguros.
                    </p>
                    {profile.documentStatus === 'pending' ? (
                      <span className="inline-block mt-3 px-2 py-1 text-xs bg-amber-200 text-amber-800 rounded-md font-bold">
                        Dossiê em Análise Editorial
                      </span>
                    ) : (
                      <span className="inline-block mt-3 px-2 py-1 text-xs bg-amber-200 text-amber-800 rounded-md font-bold">
                        Estado: Documento em Falta
                      </span>
                    )}
                  </div>
                </div>

                {profile.documentStatus !== 'pending' && (
                  <form onSubmit={handleUploadDocument} className="pt-3 border-t border-amber-150/40">
                    <label className="block text-xs font-extrabold text-amber-800 uppercase mb-1">
                      Link / URL do seu Bilhete de Identidade (BI) ou NUIT:
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={docFileUrl}
                        onChange={(e) => setDocFileUrl(e.target.value)}
                        placeholder="Ex: https://comprova.com/bi_carlos.pdf"
                        className="flex-1 px-3 py-1.5 bg-white border border-amber-200 rounded-lg text-xs"
                      />
                      <button 
                        type="submit" 
                        disabled={uploadLoading} 
                        className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded-lg hover:bg-amber-700"
                      >
                        {uploadLoading ? 'Enviando...' : 'Submeter Documento'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Quick overview panels */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h2 className="font-bold text-lg text-gray-850 mb-4 flex items-center gap-1.5">
                <Sparkles size={18} className="text-blue-500" /> Atividade Recente
              </h2>

              {userContracts.length > 0 ? (
                <div className="space-y-4">
                  {userContracts.slice(0, 3).map((c, i) => (
                    <div key={i} className="flex justify-between items-center p-3.5 bg-gray-55 rounded-xl text-xs">
                      <div>
                        <p className="font-bold text-gray-800">{c.title}</p>
                        <p className="text-gray-400 mt-0.5">Orçamento do Projecto: <span className="font-mono text-gray-650 font-semibold">{c.budget.toLocaleString()} MT</span></p>
                      </div>
                      <span className={`px-2.5 py-1.5 rounded-lg text-xxs font-extrabold uppercase ${
                        c.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                        c.status === 'active' ? 'bg-blue-50 text-blue-700 animate-pulse' :
                        c.status === 'disputed' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {c.status}
                      </span>
                    </div>
                  ))}
                  <button 
                    onClick={() => setActiveTab('contracts')}
                    className="text-xs text-blue-600 font-bold hover:underline"
                  >
                    Ver todos os contratos ({userContracts.length}) →
                  </button>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-gray-500/80">
                  Ainda não tem contratos de TI em curso na plataforma.
                  <div className="pt-2">
                    <Link to={user.role === 'worker' ? '/offers' : '/workers'} className="text-blue-600 font-bold hover:underline">
                      {user.role === 'worker' ? 'Explorar Vagas' : 'Procurar Profissionais'}
                    </Link>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right sidebar col */}
          <div className="space-y-8">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <h3 className="font-bold text-gray-800 text-base mb-4">Acesso de Chat Direto</h3>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Abra conversas instantâneas para esclarecer requisitos técnicos ou alinhar orçamentos de entregas.
              </p>
              <Link 
                to="/messages" 
                className="w-full text-center inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 p-2.5 rounded-xl transition-all"
              >
                <MessageSquare size={16} /> Abrir Sala de Mensagens
              </Link>
            </div>

            <div className="bg-gradient-to-tr from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-50 p-6 space-y-4">
              <h4 className="font-bold text-gray-800 text-sm flex items-center gap-1.5"><Shield size={16} className="text-blue-600" /> Suporte e Árbitros</h4>
              <p className="text-xs text-gray-550 leading-relaxed">
                Está com dificuldades em validar o escopo técnico do projeto ou o pagamento M-Pesa de um projeto? A nossa equipa de administradores em Maputo faz a mediação técnica do código.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* --------------------- TAB CONTENT: OFFERS (Employer only) --------------------- */}
      {activeTab === 'offers' && user.role === 'employer' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Post Offer Form */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-auto">
            <h2 className="font-bold text-lg text-gray-850 mb-4 flex items-center gap-1.5">
              <PlusCircle size={18} className="text-blue-600" /> Publicar Novo Projeto
            </h2>

            {user.is_verified === false ? (
              <div className="rounded-xl bg-amber-50 p-4 border border-amber-100 text-xs text-amber-800 font-semibold mb-4 leading-relaxed">
                <AlertTriangle size={18} className="mr-1 inline align-middle shrink-0" /> Apenas empresas verificadas podem lançar novas vagas públicas no ServiPlus. Submeta os seus documentos primeiro.
              </div>
            ) : (
              <form onSubmit={handleOfferSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1">Título do Projecto</label>
                  <input 
                    type="text" 
                    required
                    value={offerTitle}
                    onChange={(e) => setOfferTitle(e.target.value)}
                    placeholder="Ex: Integração Checkout M-Pesa em React"
                    className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Categoria</label>
                    <select
                      value={offerCategory}
                      onChange={(e) => setOfferCategory(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                    >
                      <option value="Desenvolvimento Web">Desenvolvimento Web</option>
                      <option value="Aplicações Móveis">Aplicações Móveis</option>
                      <option value="Design UI/UX">Design UI/UX</option>
                      <option value="Redes e Telecomunicações">Redes e Telecomunicações</option>
                      <option value="Análise de Dados">Análise de Dados</option>
                      <option value="Suporte Técnico">Suporte Técnico</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Orçamento (MT)</label>
                    <input 
                      type="number" 
                      required
                      value={offerBudget}
                      onChange={(e) => setOfferBudget(e.target.value)}
                      placeholder="Ex: 50000"
                      className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">Modalidade / Local</label>
                    <select
                      value={offerLoc}
                      onChange={(e) => setOfferLoc(e.target.value)}
                      className="w-full px-2.5 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                    >
                      <option value="Remoto">Remoto</option>
                      <option value="Híbrido (Maputo)">Híbrido (Maputo)</option>
                      <option value="Presencial (Maputo)">Presencial (Maputo)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">Skills (separadas por vírgula)</label>
                    <input 
                      type="text" 
                      value={offerSkills}
                      onChange={(e) => setOfferSkills(e.target.value)}
                      placeholder="React, Django, SQL"
                      className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">Descrição do Escopo de Trabalho</label>
                  <textarea 
                    rows={4}
                    required
                    value={offerDesc}
                    onChange={(e) => setOfferDesc(e.target.value)}
                    placeholder="Especifique as entregas esperadas, prazos e requisitos técnicos..."
                    className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none resize-none"
                  />
                </div>

                {offerSuccess && (
                  <div className="bg-emerald-50 text-emerald-800 p-2 border border-emerald-100 rounded-lg text-xs leading-normal">
                    Projecto lançado com sucesso! Já está listado na pesquisa pública de vagas.
                  </div>
                )}

                {offerError && (
                  <div className="bg-rose-50 text-rose-800 p-2 border border-rose-100 rounded-lg text-xs">
                    {offerError}
                  </div>
                )}

                <button 
                  type="submit"
                  className="w-full text-center py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer"
                >
                  Confirmar e Lançar Vaga
                </button>
              </form>
            )}
          </div>

          {/* Active Published list */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg text-gray-850 mb-4">Meus Projectos Publicados</h2>
            {userOffers.length > 0 ? (
              <div className="space-y-4">
                {userOffers.map((o) => (
                  <div key={o.id} className="p-4 border border-gray-100 hover:border-blue-105 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{o.title}</p>
                      <div className="flex gap-4 text-gray-400 mt-1 font-medium font-sans">
                        <span>Categoria: {o.category}</span>
                        <span>Orçamento: <span className="font-mono text-gray-650 font-semibold">{o.salaryBudget.toLocaleString()} MT</span></span>
                        <span>Modalidade: {o.location}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 font-semibold rounded text-[10px] capitalize">
                      {o.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-8">Não possui vagas publicadas. Crie uma no formulário ao lado.</p>
            )}
          </div>
        </div>
      )}

      {/* --------------------- TAB CONTENT: PROPOSALS --------------------- */}
      {activeTab === 'proposals' && (
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm max-w-4xl">
          <h2 className="font-bold text-lg text-gray-850 mb-2">
            {user.role === 'employer' ? 'Propostas Recebidas de Freelancers' : 'Candidaturas Enviadas'}
          </h2>
          <p className="text-xs text-gray-500 mb-6">
            {user.role === 'employer' 
              ? 'Analise as qualificações de TI dos freelancers locais que enviaram orçamentos para os seus projectos.' 
              : 'Verifique o estado dos orçamentos e lances que submeteu para os projectos ativos em Maputo.'}
          </p>

          {userProposals.length > 0 ? (
            <div className="space-y-6">
              {userProposals.map((prop) => (
                <div key={prop.id} className="p-5 border border-gray-100 rounded-2xl flex flex-col justify-between hover:border-blue-100 transition-all gap-4">
                  <div>
                    {/* Title & Badge */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-50 pb-3 mb-3">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Projecto Associado:</p>
                        <h4 className="text-sm font-bold text-blue-600">{prop.offerTitle}</h4>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        prop.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                        prop.status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {prop.status === 'pending' ? 'Pendente de resposta' : prop.status}
                      </span>
                    </div>

                    {/* Proposer details */}
                    {user.role === 'employer' && (
                      <div className="bg-gray-50 p-3 rounded-xl flex items-center justify-between mb-3 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center text-xs">
                            {prop.workerProfile.firstName.charAt(0)}{prop.workerProfile.lastName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{prop.workerProfile.firstName} {prop.workerProfile.lastName}</p>
                            <p className="text-gray-400 font-medium text-xxs truncate capitalize">{prop.workerProfile.title}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-xxs font-semibold">
                          <span className="text-amber-500 font-bold flex items-center gap-0.5">★ {prop.workerProfile.averageRating}</span>
                          <span className="text-gray-400">{prop.workerProfile.completedJobs} Projectos</span>
                          <Link to={`/profile/${prop.workerProfile.userId}`} className="text-blue-600 font-bold hover:underline">Ver Perfil</Link>
                        </div>
                      </div>
                    )}

                    {/* Proposal parameters */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50/50 p-3 rounded-xl text-xs mb-3 font-semibold text-gray-650">
                      <div>
                        <p className="text-gray-400 font-normal">Valor do Lance</p>
                        <p className="font-bold font-mono text-gray-800 text-sm mt-0.5">{prop.priceProposal.toLocaleString('pt-MZ')} MT</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-normal">Prazo Estimado</p>
                        <p className="font-bold text-gray-800 text-sm mt-0.5">{prop.timelineDays} dias úteis</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-550 leading-relaxed italic border-l-2 border-gray-150 pl-3">
                      "{prop.description}"
                    </p>
                  </div>

                  {/* Actions */}
                  {user.role === 'employer' && prop.status === 'pending' && (
                    <div className="flex justify-end gap-2 border-t border-gray-50 pt-3">
                      <Link 
                        to={`/messages?peer=${prop.workerProfile.userId}`}
                        className="px-3.5 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <MessageSquare size={14} /> Esclarecer no Chat
                      </Link>
                      
                      <button
                        onClick={() => handleCreateContract(prop.id)}
                        className="px-4 py-1.5 text-xs text-white bg-emerald-600 hover:bg-emerald-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <FileSignature size={14} /> Aceitar e Iniciar Contrato
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-xs text-center py-12 bg-gray-50 rounded-2xl">Não foram encontradas propostas ativas.</p>
          )}
        </div>
      )}

      {/* --------------------- TAB CONTENT: CONTRACTS --------------------- */}
      {activeTab === 'contracts' && (
        <div className="max-w-4xl space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg text-gray-850 mb-2">
              Meus Contratos Ativos & Escrow
            </h2>
            <p className="text-xs text-gray-500 mb-6">
              Todos os contratos no ServiPlus utilizam o modelo de custódia segura local para garantir que tanto desenvolvedor quanto empresa fiquem resguardados.
            </p>

            {userContracts.length > 0 ? (
              <div className="space-y-6">
                {userContracts.map((con) => (
                  <div key={con.id} className="p-5 border border-gray-100 rounded-2xl hover:border-blue-50 transition-all space-y-4">
                    
                    {/* Mini header */}
                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-55 pb-3">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          con.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          con.status === 'active' ? 'bg-blue-50 text-blue-700 border border-blue-105 animate-pulse' :
                          con.status === 'disputed' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          Contrato: {con.status}
                        </span>
                        <h4 className="font-bold text-base text-gray-805 mt-1.5">{con.title}</h4>
                      </div>

                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-semibold">Orçamento em Custódia</p>
                        <p className="text-base font-bold font-mono text-gray-800">{con.budget.toLocaleString('pt-MZ')} MT</p>
                      </div>
                    </div>

                    {/* Parties detail list */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-gray-650 bg-gray-50 p-3 rounded-xl">
                      <div>
                        <p className="text-gray-400 font-normal">Contratante / Empresa</p>
                        <p className="font-bold text-gray-800 mt-0.5">{con.employerProfile.companyName}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 font-normal">Freelancer / Especialista</p>
                        <p className="font-bold text-gray-800 mt-0.5">{con.workerProfile.firstName} {con.workerProfile.lastName}</p>
                      </div>
                    </div>

                    {/* Signature Status */}
                    <div className="flex flex-wrap gap-4 text-xs font-medium text-gray-500 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${con.signedByEmployer ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        Assinado pela Empresa
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${con.signedByWorker ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        Assinado pelo Freelancer
                      </div>
                    </div>

                    {/* Actions and Triggers depending on state & role */}
                    <div className="border-t border-gray-105 pt-4 flex flex-wrap justify-between items-center gap-3">
                      <Link 
                        to={`/messages?peer=${user.role === 'employer' ? con.workerProfile.userId : con.employerId}`}
                        className="px-3.5 py-1.5 text-xs text-blue-650 font-bold border border-blue-105 rounded-lg flex items-center gap-1 hover:bg-blue-50/50"
                      >
                        <MessageSquare size={14} /> Chat do Projecto
                      </Link>

                      <div className="flex gap-2">
                        {/* Worker Action: Read and Sign Pending Contract */}
                        {user.role === 'worker' && !con.signedByWorker && con.status === 'pending' && (
                          <button
                            onClick={() => handleSignContract(con.id)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Ler e Assinar Contrato
                          </button>
                        )}

                        {/* Employer Actions for Active Contracts */}
                        {user.role === 'employer' && con.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleRaiseDispute(con.id)}
                              className="px-3 py-1.5 text-xs font-semibold text-rose-650 hover:bg-rose-50 rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Scale size={14} /> Levantar Disputa
                            </button>

                            <button
                              onClick={() => {
                                handleCompleteContract(con.id);
                                setPayingContract(con);
                              }}
                              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                            >
                              Marcar como Entregue & Pagar
                            </button>
                          </>
                        )}

                        {/* Universal Review Button for Completed Contracts */}
                        {con.status === 'completed' && (
                          <button
                            onClick={() => {
                              setReviewContract(con);
                              setReviewScore(5);
                              setReviewComment('');
                            }}
                            className="px-3.5 py-1.5 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                          >
                            ★ Avaliar Serviço
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-12">Não existem contratos activos cadastrados.</p>
            )}
          </div>
        </div>
      )}

      {/* --------------------- TAB CONTENT: ADMIN QUEUES --------------------- */}
      {activeTab === 'admin' && user.role === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* List pending verifications */}
          <div className="col-span-2 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-lg text-rose-850 flex items-center gap-1.5 mb-2"><Shield size={18} /> Verificação Editorial de BI / Registos</h2>
            <p className="text-xs text-gray-500 mb-6">Analise as identidades e aprova ou recusa conformidades regulamentares no mercado moçambicano.</p>

            {pendingVerifications.length > 0 ? (
              <div className="space-y-4">
                {pendingVerifications.map((item) => (
                  <div key={item.id} className="p-4 border border-gray-100 rounded-xl space-y-3.5 text-xs">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-xxs text-gray-400 font-semibold capitalize">Papel: {item.role} • Detalhe: {item.detail}</p>
                      </div>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">Pendente</span>
                    </div>

                    <div className="p-3 bg-gray-55 border border-gray-150 rounded-xl font-mono text-gray-550 break-words flex justify-between items-center">
                      <span className="truncate max-w-sm">Ficheiro BI: {item.docUrl}</span>
                      <a href={item.docUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline shrink-0">Abrir comprovativo 🔎</a>
                    </div>

                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleVerifyDocument(item.userId, false)}
                        className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg cursor-pointer"
                      >
                        Recusar BI
                      </button>
                      
                      <button
                        onClick={() => handleVerifyDocument(item.userId, true)}
                        className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg cursor-pointer"
                      >
                        Aprovar e Verificar Conta ✓
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs text-center py-12">Não existem solicitações pendentes de verificação.</p>
            )}
          </div>

          {/* Manage active disputes */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm h-auto">
            <h2 className="font-semibold text-gray-850 text-base mb-4 flex items-center gap-1.5 border-b border-gray-50 pb-2"><Scale size={18} /> Auditoria de Disputas</h2>
            
            {userContracts.filter(c => c.status === 'disputed').length > 0 ? (
              <div className="space-y-4">
                {userContracts.filter(c => c.status === 'disputed').map((dis) => (
                  <div key={dis.id} className="p-3.5 border border-gray-150 rounded-xl space-y-3.5 text-xs">
                    <div>
                      <p className="font-bold text-gray-800">{dis.title}</p>
                      <p className="text-xxs text-gray-400 font-semibold font-mono mt-0.5">Orçamento sob disputa: {dis.budget.toLocaleString()} MT</p>
                    </div>

                    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleAdminResolveDispute(dis.id, 'completed')}
                        className="w-full text-center py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg"
                      >
                        Decidir a favor do Freelancer ✓
                      </button>
                      <button
                        onClick={() => handleAdminResolveDispute(dis.id, 'active')}
                        className="w-full text-center py-2 bg-gray-500 hover:bg-gray-600 text-white font-bold rounded-lg"
                      >
                        Reabrir Contrato para Ajuste Técnica ↺
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-450 text-xs">Não existem litígios ou disputas pendentes em Moçambique.</p>
            )}
          </div>

        </div>
      )}

      {/* --------------------------- PAYMENT OVERLAY --------------------------- */}
      {payingContract && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-xl space-y-5 animate-scale-in">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-850">Garantia Escrow - Pagamento Seguro</h3>
                <p className="text-xs text-gray-400">Projecto: {payingContract.title}</p>
              </div>
              <button onClick={() => setPayingContract(null)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex justify-between items-center">
              <span className="text-xs font-semibold text-emerald-800">Valor Total a Pagar</span>
              <span className="text-lg font-mono font-bold text-emerald-950">{payingContract.budget.toLocaleString('pt-MZ')} MT</span>
            </div>

            <form onSubmit={handlePayEscrow} className="space-y-4 text-xs font-semibold text-gray-600">
              <div>
                <label className="block mb-1">Método de Liquidação</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                >
                  <option value="M-Pesa">Vodacom M-Pesa (SMS instantâneo)</option>
                  <option value="e-Mola">mCel e-Mola (SMS instantâneo)</option>
                  <option value="Transferência Bancária">Transferência de Banco Local (Millennium BIM / Standard Bank)</option>
                </select>
              </div>

              <div>
                <label className="block mb-1">Contacto Celular / NIB do Destinatário</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ex: 84XXXXXXX ou NIB Oficial"
                  className="w-full px-3 py-2 bg-gray-55 border border-gray-200 rounded-xl focus:outline-none"
                />
              </div>

              {payoutSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 p-2.5 border border-emerald-100 rounded-lg text-center font-bold">
                  ✓ Transação Concluída! Fundos creditados.
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={payoutInProgress}
                  className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 size={16} /> {payoutInProgress ? 'Analisando PIN...' : 'Confirmar e Transferir Fundos'}
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* --------------------------- REVIEW OVERLAY --------------------------- */}
      {reviewContract && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 border border-gray-100 shadow-xl space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg text-gray-850">Classificar Serviço</h3>
                <p className="text-xs text-gray-400">Deixe uma avaliação objetiva de satisfação.</p>
              </div>
              <button onClick={() => setReviewContract(null)} className="text-gray-400 hover:text-gray-600 font-bold">×</button>
            </div>

            <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs font-semibold text-gray-600">
              <div>
                <label className="block mb-1.5">Nota / Stars (1 a 5)</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewScore(star)}
                      className={`p-2 rounded-lg border flex-1 text-center font-bold ${
                        reviewScore === star ? 'bg-amber-50 border-amber-400 text-amber-600' : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      ★ {star}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block mb-1">Comentário Público</label>
                <textarea 
                  required
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Excelente comunicação, cumpriu todos os prazos e regras técnicas estipuladas no contrato..."
                  className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none resize-none"
                />
              </div>

              {reviewSuccess ? (
                <div className="bg-emerald-50 text-emerald-800 p-2 border border-emerald-100 rounded-lg text-xs font-bold text-center">
                  Avaliação enviada com sucesso!
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold font-sans transition-all cursor-pointer"
                >
                  Enviar Nota de Avaliação
                </button>
              )}
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
