/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { WorkerProfile, EmployerProfile, Review, Offer, User } from '../types';
import { 
  UserCheck, MapPin, Award, Star, Mail, Briefcase, 
  Github, Globe, MessageSquare, ShieldCheck, ChevronLeft 
} from 'lucide-react';

export const ProfileDetail: React.FC = () => {
  const { userId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedRole = searchParams.get('role');
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<WorkerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [offersList, setOffersList] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, [userId, currentUser, requestedRole]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      let resolvedUserId = Number(userId);

      // Handle "me" profile routing
      if (!userId || userId === 'me') {
        if (!currentUser) {
          navigate('/login');
          return;
        }
        resolvedUserId = currentUser.id;
      }

      // 1. Fetch system users
      const allUsers = await mockApi.admin.listAllUsers();
      const matchedUser = allUsers.find(u => u.id === resolvedUserId);
      if (!matchedUser) {
        setLoading(false);
        return;
      }
      // Perfil público contextual, especialmente importante para contas com ambos os papéis.
      const selectedRole = requestedRole === 'worker' || requestedRole === 'employer'
        ? requestedRole
        : currentUser?.id === resolvedUserId ? currentUser.role : matchedUser.role;
      setTargetUser({ ...matchedUser, role: selectedRole });
      setWorkerProfile(null);
      setEmployerProfile(null);
      setReviews([]);
      setOffersList([]);

      // 2. Fetch specific profile based on role
      if (selectedRole === 'worker') {
        const workers = await mockApi.workers.list();
        const wProfile = workers.find(w => w.userId === resolvedUserId);
        if (wProfile) {
          setWorkerProfile(wProfile);
          // Fetch ratings
          const listRev = await mockApi.reviews.listForTarget(resolvedUserId);
          setReviews(listRev);
        }
      } else if (selectedRole === 'employer') {
        const employers = await mockApi.employers.list();
        const eProfile = employers.find(e => e.userId === resolvedUserId);
        if (eProfile) {
          setEmployerProfile(eProfile);
          // Fetch active offers
          const offers = await mockApi.offers.list();
          setOffersList(offers.filter(o => o.employerId === eProfile.id));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24 select-none">
        <p className="text-gray-500 font-medium animate-pulse">Obtendo dados do utilizador do ConecTA...</p>
      </div>
    );
  }

  if (!targetUser) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24">
        <h2 className="font-bold text-xl text-gray-800">Utilizador Não Encontrado</h2>
        <p className="text-sm text-gray-500 mt-2">O perfil solicitado não pôde ser carregado na base de dados.</p>
        <Link to="/" className="text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg font-bold mt-4 inline-block">Voltar ao Início</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Back Shortcut */}
      <button 
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-600 font-bold mb-6 uppercase tracking-wider"
      >
        <ChevronLeft size={16} /> Voltar à página anterior
      </button>

      {/* --------------------- IF WORKER PROFILE --------------------- */}
      {targetUser.role === 'worker' && workerProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Hero Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 h-auto self-start">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-blue-105 bg-blue-50 text-blue-605 text-blue-600 font-extrabold flex items-center justify-center text-3xl shadow-inner border border-blue-100">
                {workerProfile.firstName.charAt(0)}{workerProfile.lastName.charAt(0)}
              </div>
              
              <div className="mt-4 flex items-center gap-1.5">
                <h2 className="font-sans font-bold text-xl text-gray-900 leading-tight">
                  {workerProfile.firstName} {workerProfile.lastName}
                </h2>
                {workerProfile.documentStatus === 'approved' && (
                  <span className="inline-flex text-emerald-500" title="Identidade Validada">
                    <ShieldCheck size={20} className="fill-emerald-100" />
                  </span>
                )}
              </div>

              <p className="text-sm font-semibold text-blue-600 mt-1 leading-tight capitalize">
                {workerProfile.title}
              </p>

              <p className="flex items-center gap-1 text-xs text-gray-400 mt-2.5 font-medium">
                <MapPin size={14} className="text-gray-400" />
                {workerProfile.location}
              </p>
            </div>

            {/* General metrics */}
            <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 text-center font-medium">
              <div>
                <p className="text-xxs text-gray-400 uppercase">Nota Média</p>
                <div className="font-bold text-sm text-amber-500 flex items-center justify-center gap-1.5 mt-0.5">
                  <Star size={14} className="fill-current" />
                  {workerProfile.averageRating}
                </div>
              </div>
              <div className="border-x border-gray-100">
                <p className="text-xxs text-gray-400 uppercase">Projetos</p>
                <p className="font-bold text-gray-800 mt-0.5">{workerProfile.completedJobs}</p>
              </div>
              <div>
                <p className="text-xxs text-gray-400 uppercase">Experiência</p>
                <p className="font-bold text-gray-800 mt-0.5">{workerProfile.experienceYears || '1+'} Anos</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Contactos Verificados:</span>
              <p className="truncate text-gray-600 flex items-center gap-2"><Mail size={14} className="text-gray-400" /> {workerProfile.email}</p>
              {workerProfile.githubLink && (
                <a href={workerProfile.githubLink} target="_blank" rel="noreferrer" className="truncate text-blue-600 font-semibold flex items-center gap-2 hover:underline">
                  <Github size={14} className="text-gray-600 shrink-0" /> github.com/perfil
                </a>
              )}
              {workerProfile.portfolioLink && (
                <a href={workerProfile.portfolioLink} target="_blank" rel="noreferrer" className="truncate text-blue-600 font-semibold flex items-center gap-2 hover:underline">
                  <Globe size={14} className="text-gray-600 shrink-0" /> Portfolio Behance / Link
                </a>
              )}
            </div>

            {/* Direct message link */}
            {currentUser?.id !== targetUser.id && (
              <div className="pt-2">
                <Link 
                  to={`/messages?peer=${resolvedUserId()}`}
                  className="w-full text-center inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 p-2.5 rounded-xl transition-all shadow-sm"
                >
                  <MessageSquare size={16} /> Entrar em Contacto
                </Link>
              </div>
            )}
          </div>

          {/* Right Detailed Section */}
          <div className="lg:col-span-2 space-y-8">
            {/* About bio */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-850">Resumo Profissional</h3>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {workerProfile.bio || 'Sem biografia adicional.'}
              </p>
            </div>

            {/* Technical skills */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-850 flex items-center gap-1.5"><Briefcase size={18} className="text-blue-500" /> Especialidades & Frameworks</h3>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-gray-700">
                {workerProfile.skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-gray-100 hover:bg-gray-150 rounded-xl border border-gray-205">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Reviews / Testimonials list */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-850 flex items-center gap-1.5"><Star size={18} className="text-amber-500 fill-amber-500" /> Avaliações dos Contratantes ({reviews.length})</h3>

              {reviews.length > 0 ? (
                <div className="space-y-4 pt-2 divide-y divide-gray-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="pt-4 first:pt-0 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-gray-800">{rev.authorName}</span>
                        <span className="font-bold text-amber-500 flex items-center gap-0.5">★ {rev.score}</span>
                      </div>
                      <p className="text-gray-400 mb-2 font-medium">{new Date(rev.createdAt).toLocaleDateString()}</p>
                      <p className="text-gray-650 italic leading-relaxed">"{rev.comment}"</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6">Este freelancer ainda não foi avaliado por projectos concluídos.</p>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --------------------- IF EMPLOYER PROFILE --------------------- */}
      {targetUser.role === 'employer' && employerProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Company Panel */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-6 h-auto self-start">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 font-extrabold flex items-center justify-center text-2xl shadow-inner border border-gray-150">
                {employerProfile.companyName.charAt(0)}
              </div>
              
              <div className="mt-4 flex items-center gap-1.5 justify-center flex-wrap">
                <h2 className="font-sans font-bold text-lg text-gray-900 leading-tight">
                  {employerProfile.companyName}
                </h2>
                {employerProfile.documentStatus === 'approved' && (
                  <span className="inline-flex text-blue-500" title="Empresa Verificada">
                    <UserCheck size={18} className="fill-blue-100" />
                  </span>
                )}
              </div>

              <p className="text-xs font-semibold text-gray-405 text-gray-500 mt-1 uppercase tracking-wider">
                {employerProfile.industry}
              </p>

              <p className="flex items-center gap-1 text-xs text-gray-400 mt-2 font-medium">
                <MapPin size={14} />
                {employerProfile.location}
              </p>
            </div>

            <div className="border-t border-gray-55 pt-4 space-y-3.5 text-xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Informações Gerais</span>
              <p className="text-gray-600">Contacto: <span className="font-bold">{employerProfile.contactName}</span></p>
              <p className="truncate text-gray-600">Email: <span className="font-bold">{employerProfile.email}</span></p>
              {employerProfile.website && (
                <a href={employerProfile.website} target="_blank" rel="noreferrer" className="text-blue-600 font-bold hover:underline flex items-center gap-1">
                  <Globe size={14} /> website oficial
                </a>
              )}
            </div>

            {/* Direct message link */}
            {currentUser?.id !== targetUser.id && (
              <div className="pt-2">
                <Link 
                  to={`/messages?peer=${resolvedUserId()}`}
                  className="w-full text-center inline-flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 p-2.5 rounded-xl transition-all shadow-sm"
                >
                  <MessageSquare size={16} /> Contactar Empresa
                </Link>
              </div>
            )}
          </div>

          {/* Right Detail Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-850">Sobre a Empresa</h3>
              <p className="text-sm text-gray-650 leading-relaxed whitespace-pre-wrap">
                {employerProfile.description || 'Sem descrição cadastrada.'}
              </p>
            </div>

            {/* Published Jobs list */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-lg text-gray-850">Projectos Disponíveis ({offersList.length})</h3>

              {offersList.filter(o => o.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {offersList.filter(o => o.status === 'active').map((o) => (
                    <div key={o.id} className="p-4 border border-gray-100 hover:border-blue-105 rounded-2xl flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{o.title}</h4>
                        <div className="flex gap-4 text-gray-400 mt-1 font-semibold">
                          <span>Categoria: {o.category}</span>
                          <span>Orçamento: <span className="font-mono text-gray-650 font-semibold">{o.salaryBudget.toLocaleString()} MT</span></span>
                        </div>
                      </div>
                      <Link 
                        to={`/offers?offerId=${o.id}`}
                        className="px-3.5 py-1.5 text-xs text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-600 hover:text-white transition-colors font-bold"
                      >
                        Ver Detalhes
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs text-center py-6">Esta empresa não possui vagas abertas no momento.</p>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );

  // Small internal helper
  function resolvedUserId() {
    return Number(userId) || (currentUser ? currentUser.id : 0);
  }
};
