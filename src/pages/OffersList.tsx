/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { Offer, Proposal } from '../types';
import { OfferCard } from '../components/OfferCard';
import { 
  Search, SlidersHorizontal, Briefcase, MapPin, 
  CircleDollarSign, Calendar, Clock, ChevronLeft, Send, AlertTriangle, CheckCircle 
} from 'lucide-react';

export const OffersList: React.FC = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { offerId } = useParams();

  // Offers Data State
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('');
  const [minBudget, setMinBudget] = useState('');

  // Selected Offer Detail overlay/drawer State
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  
  // Proposal Form State
  const [proposalDesc, setProposalDesc] = useState('');
  const [proposalPrice, setProposalPrice] = useState('');
  const [proposalDays, setProposalDays] = useState('');
  const [proposalStatus, setProposalStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [proposalErrorMsg, setProposalErrorMsg] = useState('');
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  // Load initial offers
  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const list = await mockApi.offers.list();
        setOffers(list);
        setFilteredOffers(list.filter(o => o.status === 'active'));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  // Filter Action
  const applyFilters = () => {
    let result = offers.filter(o => o.status === 'active');

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        o => o.title.toLowerCase().includes(q) || 
             o.description.toLowerCase().includes(q) ||
             o.requiredSkills.some(s => s.toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      result = result.filter(o => o.category === selectedCategory);
    }

    if (selectedLoc) {
      result = result.filter(o => o.location.toLowerCase().includes(selectedLoc.toLowerCase()));
    }

    if (minBudget) {
      result = result.filter(o => o.salaryBudget >= Number(minBudget));
    }

    setFilteredOffers(result);
  };

  // Run filters dynamically when states change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, selectedCategory, selectedLoc, minBudget, offers]);

  // Handle URL deep link to specific offer
  useEffect(() => {
    if (offerId && offers.length > 0) {
      const target = offers.find(o => o.id === Number(offerId));
      if (target) {
        handleSelectOffer(target);
      }
    }
  }, [offerId, offers]);

  const handleSelectOffer = async (offer: Offer) => {
    setSelectedOffer(offer);
    setProposalStatus('idle');
    setProposalDesc('');
    setProposalPrice(offer.salaryBudget.toString());
    setProposalDays('15');
    setAlreadyApplied(false);

    // Check if worker already submitted a proposal for this offer
    if (user && user.role === 'worker' && profile) {
      try {
        const userProposals = await mockApi.proposals.getForWorker(profile.id);
        const exists = userProposals.some(p => p.offerId === offer.id);
        setAlreadyApplied(exists);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedLoc('');
    setMinBudget('');
  };

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'worker' || !profile || !selectedOffer) return;
    if (selectedOffer.employerProfile.userId === user.id) {
      setProposalErrorMsg('RN02: não pode submeter uma proposta à sua própria oportunidade.');
      setProposalStatus('error');
      return;
    }
    if (profile.documentStatus !== 'approved') {
      setProposalErrorMsg('Apenas freelancers formalmente VERIFICADOS com BI/NUIT podem enviar propostas.');
      setProposalStatus('error');
      return;
    }

    setProposalStatus('submitting');
    try {
      await mockApi.proposals.create(user.id, selectedOffer!.id, {
        description: proposalDesc,
        priceProposal: Number(proposalPrice),
        timelineDays: Number(proposalDays)
      });
      setProposalStatus('success');
      setAlreadyApplied(true);
    } catch (err: any) {
      setProposalErrorMsg(err.message || 'Erro durante a submissão.');
      setProposalStatus('error');
    }
  };

  const categories = [
    'Desenvolvimento Web',
    'Aplicações Móveis',
    'Design UI/UX',
    'Redes e Telecomunicações',
    'Análise de Dados',
    'Suporte Técnico'
  ];

  const locations = ['Remoto', 'Híbrido', 'Polana', 'Bairro Central', 'Sommerschield', 'Matola'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-sans font-bold text-3xl text-gray-900 tracking-tight">
          Pesquisar Oportunidades de TI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Encontre os projectos mais recentes publicados no ecossistema serviplus em Maputo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm self-start h-auto">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
            <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <SlidersHorizontal size={16} className="text-primary" /> Filtros Ativos
            </span>
            <button 
              onClick={handleClearFilters}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Limpar Todos
            </button>
          </div>

          <div className="space-y-5">
            {/* Keyword Search */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Palavra-chave
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ex: React, Figma, Linux..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200/80 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Categoria de Projecto
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories.map((cat, i) => (
                  <option key={i} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Location Preference */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Preferência de Localidade
              </label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Moçambique (Qualquer)</option>
                {locations.map((loc, i) => (
                  <option key={i} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Budget Range */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Orçamento Mínimo (MT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={minBudget}
                  onChange={(e) => setMinBudget(e.target.value)}
                  placeholder="Ex: 25000"
                  className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-mono"
                />
                <CircleDollarSign size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Offers Grid & Detail Panel */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-sm animate-pulse">Carregando ofertas de emprego com segurança...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOffers.length > 0 ? (
                filteredOffers.map((offer) => (
                  <div key={offer.id} onClick={() => handleSelectOffer(offer)} className="cursor-pointer">
                    <OfferCard offer={offer} />
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-16 bg-white border border-gray-100 rounded-2xl p-8">
                  <p className="text-sm font-medium text-gray-500">Nenhum projecto corresponde aos seus critérios.</p>
                  <button onClick={handleClearFilters} className="mt-3 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-bold">
                    Mostrar Todas as Vagas
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Selected Offer Detail Overlay Slide-over Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end transition-opacity duration-300">
          {/* Modal mask */}
          <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedOffer(null)}></div>
          
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-6 sm:p-8 transform transition-transform duration-300 animate-slide-in">
            
            {/* Drawer Header */}
            <div>
              <button 
                onClick={() => setSelectedOffer(null)}
                className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary font-semibold mb-6 uppercase tracking-wider"
              >
                <ChevronLeft size={16} /> Voltar à lista
              </button>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary">
                    {selectedOffer.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                    Ativo • Custódia Garantida
                  </span>
                </div>

                <h2 className="title-display font-bold text-2xl text-gray-900 leading-tight">
                  {selectedOffer.title}
                </h2>

                {/* Company banner */}
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center font-bold text-gray-700 text-lg border border-gray-150">
                    {selectedOffer.employerProfile.companyName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">{selectedOffer.employerProfile.companyName}</h4>
                    <p className="text-xs text-gray-400 capitalize">{selectedOffer.employerProfile.location}</p>
                  </div>
                </div>

                {/* Details layout */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 py-4 border-y border-gray-100 text-xs text-gray-600">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-primary">
                      <CircleDollarSign size={16} />
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Orçamento</p>
                      <p className="font-bold font-mono text-gray-800">{selectedOffer.salaryBudget.toLocaleString('pt-MZ')} MT</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-primary">
                      <MapPin size={16} />
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Localização</p>
                      <p className="font-bold text-gray-800">{selectedOffer.location}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-primary">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-gray-400 font-medium">Publicado em</p>
                      <p className="font-bold text-gray-800">{new Date(selectedOffer.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Full job Description */}
                <div className="space-y-2.5 pt-2">
                  <h3 className="font-bold text-base text-gray-850">Descrição Detalhada do Projecto</h3>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {selectedOffer.description}
                  </p>
                </div>

                {/* Core skills */}
                <div className="space-y-2">
                  <h4 className="font-bold text-sm text-gray-850">Competências Requeridas:</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedOffer.requiredSkills.map((skill, idx) => (
                      <span key={idx} className="px-2.5 py-1 text-xs text-gray-700 bg-gray-100 rounded-lg border border-gray-200">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Proposal submit zone / warnings */}
            <div className="mt-8 pt-6 border-t border-gray-150">
              {!user ? (
                <div className="rounded-xl bg-primary/5 border border-primary/10 p-4 text-center">
                  <p className="text-xs text-primary font-semibold mb-3">Estás interessado neste projecto? Faça o login ou registe-se para submeter a sua proposta.</p>
                  <Link to="/login" className="px-4 py-2 text-xs font-bold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors block max-w-xs mx-auto">
                    Entrar na Plataforma
                  </Link>
                </div>
              ) : user.role !== 'worker' ? (
                <div className="rounded-xl bg-amber-50 border border-amber-105 p-3.5 text-xs text-amber-800 flex items-center gap-2 font-medium leading-relaxed">
                  <AlertTriangle size={20} className="text-amber-550 shrink-0" />
                  <span>Apenas contas registadas no papel de **Freelancer / Prestador** podem submeter propostas comerciais para projectos.</span>
                </div>
              ) : selectedOffer.employerProfile.userId === user.id ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                  Esta oportunidade foi publicada pela sua própria conta. A RN02 impede a autocontratação, mesmo que possua ambos os perfis.
                </div>
              ) : alreadyApplied ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-center flex flex-col items-center gap-2">
                  <CheckCircle size={24} className="text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-800">Já submeteu uma proposta para esta vaga!</p>
                  <p className="text-xs text-emerald-600">Aceda ao seu Painel Geral para acompanhar o progresso e conversar com o contratante no chat.</p>
                </div>
              ) : (
                /* Proposal Form for worker */
                <form onSubmit={handleProposalSubmit} className="space-y-4">
                  <h3 className="font-bold text-base text-gray-850">Submeter a sua Proposta Comercial</h3>
                  
                  {profile?.documentStatus !== 'approved' && (
                    <div className="rounded-xl bg-rose-50 border border-rose-100 p-3.5 text-xs text-rose-800 flex flex-col gap-2 font-medium leading-relaxed">
                      <span className="flex items-center gap-2 font-bold"><AlertTriangle size={18} className="text-rose-550" /> Perfil Não Verificado</span>
                      <span>O seu documento de identidade ou registo comercial ainda não foi aprovado pelo suporte ServiPlus. Por razões de conformidade legal, só profissionais verificados podem licitar projectos locais. Por favor, submeta os seus documentos no seu perfil.</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Carta de Apresentação / Abordagem Técnica
                    </label>
                    <textarea
                      required
                      rows={4}
                      disabled={profile?.documentStatus !== 'approved'}
                      value={proposalDesc}
                      onChange={(e) => setProposalDesc(e.target.value)}
                      placeholder="Explique porque é o profissional ideal para este projecto. Detalhe a sua experiência relacionada e abordagem metodológica..."
                      className="w-full px-4 py-2 bg-gray-55 border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs text-gray-700 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Preço da sua proposta (MT)
                      </label>
                      <input
                        type="number"
                        required
                        disabled={profile?.documentStatus !== 'approved'}
                        value={proposalPrice}
                        onChange={(e) => setProposalPrice(e.target.value)}
                        placeholder="Ex: 65000"
                        className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                        Tempo de entrega (Dias)
                      </label>
                      <input
                        type="number"
                        required
                        disabled={profile?.documentStatus !== 'approved'}
                        value={proposalDays}
                        onChange={(e) => setProposalDays(e.target.value)}
                        placeholder="Ex: 15"
                        className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-xs font-mono"
                      />
                    </div>
                  </div>

                  {proposalStatus === 'error' && (
                    <div className="text-xs font-semibold text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100">
                      {proposalErrorMsg}
                    </div>
                  )}

                  {proposalStatus === 'success' && (
                    <div className="text-xs font-semibold text-emerald-850 bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                      Proposta enviada com sucesso! O contratante foi notificado e poderá iniciar um chat consigo em breve.
                    </div>
                  )}

                  {proposalStatus !== 'success' && (
                    <button
                      type="submit"
                      disabled={proposalStatus === 'submitting' || profile?.documentStatus !== 'approved'}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer"
                    >
                      <Send size={14} /> {proposalStatus === 'submitting' ? 'A enviar...' : 'Enviar Proposta Comercial'}
                    </button>
                  )}
                </form>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
