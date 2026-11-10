/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, ShieldCheck, Cpu, Code2, Users2, Library, 
  MapPin, CheckCircle, ChevronRight, Award, MessageSquare, PhoneCall
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { OfferCard } from '../components/OfferCard';
import { Offer } from '../types';

export const LandingPage: React.FC = () => {
  const [featuredOffers, setFeaturedOffers] = useState<Offer[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      try {
        const list = await mockApi.offers.list();
        // Show is active and top 3 offers
        setFeaturedOffers(list.filter(o => o.status === 'active').slice(0, 3));
      } catch (err) {
        console.error(err);
      }
    };
    fetchOffers();
  }, []);

  const categories = [
    { name: 'Desenvolvimento Web', count: 18, desc: 'React, Node, Django, WordPress e integrações de API.', color: 'from-blue-500/20 to-indigo-500/10' },
    { name: 'Aplicações Móveis', count: 9, desc: 'Flutter, React Native e desenvolvimento nativo iOS/Android.', color: 'from-purple-500/20 to-indigo-500/10' },
    { name: 'Design UI/UX & Figma', count: 14, desc: 'Prototipagem de interfaces, wireframes e logotipos.', color: 'from-pink-500/20 to-rose-500/10' },
    { name: 'Redes e Telecomunicações', count: 7, desc: 'Configuração de Servidores Linux, AWS, Docker e Redes.', color: 'from-emerald-500/20 to-teal-500/10' },
    { name: 'Análise de Dados & SQL', count: 5, desc: 'Especialistas em bases de dados, visualizações e PowerBI.', color: 'from-amber-500/20 to-orange-500/10' },
    { name: 'Suporte Técnico & Helpdesk', count: 11, desc: 'Instalação física de hardware e securização local de TI.', color: 'from-cyan-500/20 to-sky-500/10' }
  ];

  return (
    <div className="bg-[#F3F7FA] min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white/70 py-16 sm:py-24 border-b border-gray-150">
        <div className="absolute inset-0 bg-radial-at-t from-primary/5 via-transparent to-transparent opacity-50"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <MapPin size={12} /> Maputo, Moçambique
            </span>
            <h1 className="font-sans font-bold text-4xl sm:text-5xl lg:text-6xl text-gray-900 tracking-tight leading-tight">
              Ligue-se aos melhores <span className="text-primary">profissionais de TI</span> em Maputo.
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl leading-relaxed">
              Protótipo de conexão entre trabalhadores autónomos de TI e empregadores em Maputo. Permite acompanhar oportunidades, acordos e declarações de pagamentos externos; não processa transacções.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link 
                to="/register?role=employer" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-transparent text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/95 shadow-md hover:shadow-lg transition-all"
              >
                Contratar Talentos <ArrowRight size={16} />
              </Link>
              <Link 
                to="/register?role=worker" 
                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-250 text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
              >
                Trabalhar como Freelancer
              </Link>
            </div>
            
            <div className="flex flex-wrap gap-6 pt-6 text-xs text-gray-500 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-500" /> Perfis demonstrativos
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-500" /> Acompanhamento de pagamentos externos
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} className="text-emerald-500" /> Registo e acompanhamento de conflitos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-sans font-bold text-2xl sm:text-3xl text-gray-900">
            Pesquise por Categorias de Especialidade
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            Encontre autonomistas qualificados para projetos estruturados ou apoio técnico diário.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((c, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all group">
              <div>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${c.color} flex items-center justify-center mb-4 text-primary group-hover:scale-105 transition-transform duration-200`}>
                  {i === 0 && <Code2 size={24} />}
                  {i === 1 && <Cpu size={24} />}
                  {i === 2 && <Library size={24} />}
                  {i === 3 && <Users2 size={24} />}
                  {i === 4 && <Award size={24} />}
                  {i === 5 && <PhoneCall size={24} />}
                </div>
                <h3 className="font-sans font-bold text-gray-800 text-lg group-hover:text-primary transition-colors">
                  {c.name}
                </h3>
                <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                  {c.desc}
                </p>
              </div>
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-50 text-xs font-semibold text-gray-500">
                <span>{c.count} projectos ativos</span>
                <span className="text-primary hover:text-primary/90 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Ver ofertas <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Acompanhamento declarativo, sem custódia */}
      <section className="bg-gradient-to-r from-primary to-[#1E62AE] text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-block px-3 py-1 rounded bg-primary font-semibold text-xs tracking-wider uppercase">
              COMO TRABALHAMOS
            </span>
            <h2 className="font-sans font-extrabold text-3xl sm:text-4xl">
              Clareza nas condições e no acompanhamento de pagamentos
            </h2>
            <p className="text-blue-100 text-base leading-relaxed">
              As partes definem valores e condições no acordo. Quando ocorre um pagamento fora da aplicação, o empregador pode registar a declaração com método, etapa e referência fornecida pelo prestador, quando disponível.
            </p>
            <p className="text-blue-100 text-base leading-relaxed">
              O trabalhador pode confirmar a recepção ou contestar a declaração. O protótipo não recebe, transfere, guarda ou verifica fundos. Os conflitos podem ser reportados e acompanhados administrativamente, sem arbitragem jurídica pela plataforma.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10 space-y-6">
            <div className="flex gap-4 items-start pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h4 className="text-lg font-bold">Verificação de perfis</h4>
                <p className="text-sm text-blue-150 text-blue-200 mt-1">Os perfis podem apresentar informação e estados de verificação. A validação efectiva depende de procedimentos próprios e não é garantida pelo protótipo.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start pb-4 border-b border-white/10">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <Cpu size={22} />
              </div>
              <div>
                <h4 className="text-lg font-bold">Registo de pagamento externo</h4>
                <p className="text-sm text-blue-150 text-blue-200 mt-1">As partes podem declarar pagamentos feitos por M-Pesa, e-Mola, transferência bancária ou outros meios. Não existe integração financeira activa.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 className="text-lg font-bold">Acompanhamento de ocorrências</h4>
                <p className="text-sm text-blue-150 text-blue-200 mt-1">As partes podem reportar divergências e manter um histórico administrativo. O protótipo não toma decisões arbitrais vinculativas.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Offers */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap justify-between items-end mb-10 gap-4">
          <div>
            <h2 className="font-sans font-bold text-2xl sm:text-3xl text-gray-900">
              Projectos em Destaque em Maputo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Candidate-se às melhores vagas publicadas recentemente por empresas certificadas.
            </p>
          </div>
          <Link 
            to="/offers" 
            className="text-sm font-semibold text-primary hover:text-primary/90 flex items-center gap-1 group"
          >
            Ver todos os projectos <ArrowRight size={16} className="group-hover:translate-x-1 duration-150 transition-transform" />
          </Link>
        </div>

        {featuredOffers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredOffers.map((o) => (
              <OfferCard key={o.id} offer={o} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-500 text-sm">Carregando projectos de TI locais...</p>
          </div>
        )}
      </section>
    </div>
  );
};
