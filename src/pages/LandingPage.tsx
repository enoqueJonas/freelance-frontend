import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Check,
  Code2, Database, Headphones, Layers3, MapPin, MessageSquareText,
  Network, Smartphone, UsersRound, FileCheck2
} from 'lucide-react';
import { mockApi } from '../services/mockApi';
import { OfferCard } from '../components/OfferCard';
import { Offer } from '../types';

const specialities = [
  { name: 'Desenvolvimento Web', description: 'Aplicações, websites, APIs e integrações.', icon: Code2, tint: 'bg-[#E7F3EF]' },
  { name: 'Desenvolvimento Mobile', description: 'Aplicações Android, iOS e multiplataforma.', icon: Smartphone, tint: 'bg-[#EAF1FA]' },
  { name: 'Design de Produto', description: 'UX, UI, prototipagem e interfaces digitais.', icon: Layers3, tint: 'bg-[#F4F0E9]' },
  { name: 'Redes e Infraestrutura', description: 'Redes, servidores, cloud e sistemas.', icon: Network, tint: 'bg-[#E8F2F5]' },
  { name: 'Dados e Bases de Dados', description: 'SQL, dashboards, analytics e automação.', icon: Database, tint: 'bg-[#EDF1E9]' },
  { name: 'Suporte Técnico', description: 'Diagnóstico, manutenção e assistência de TI.', icon: Headphones, tint: 'bg-[#F2EDF5]' }
];

const steps = [
  { number: '01', title: 'Publique ou encontre', description: 'Oportunidades e especialidades' },
  { number: '02', title: 'Converse e proponha', description: 'Contacto e condições de trabalho' },
  { number: '03', title: 'Formalize o acordo', description: 'Aceitação expressa das duas partes' },
  { number: '04', title: 'Acompanhe o serviço', description: 'Registos de execução e ocorrências' }
];

export const LandingPage: React.FC = () => {
  const [featuredOffers, setFeaturedOffers] = useState<Offer[]>([]);
  useEffect(() => {
    mockApi.offers.list()
      .then(offers => setFeaturedOffers(offers.filter(o => o.status === 'active').slice(0, 3)))
      .catch(error => console.error('Não foi possível obter oportunidades', error));
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <section className="relative isolate overflow-hidden bg-[#123943] text-white conecta-hero-pattern">
        <div className="absolute inset-0 pointer-events-none opacity-30"
          style={{ backgroundImage: 'linear-gradient(90deg, transparent 99%, rgba(255,255,255,.14) 100%), linear-gradient(0deg, transparent 99%, rgba(255,255,255,.14) 100%)', backgroundSize: '64px 64px' }} />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 md:py-24 lg:py-28 grid grid-cols-1 lg:grid-cols-12 items-center gap-14">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#A7CCBE]/35 bg-white/5 px-4 py-2 text-[11px] sm:text-xs font-bold tracking-[.13em] uppercase text-[#D9F781] mb-7">
              <span className="h-2 w-2 rounded-full bg-[#D9F781]"/>
              Tecnologia e trabalho independente em Maputo
            </div>
            <h1 className="font-display font-extrabold tracking-[-.055em] leading-[1.12] text-4xl sm:text-5xl lg:text-[3.75rem] max-w-[750px]">
              O talento certo.
              <span className="block text-[#D9F781] mt-1">A conexão certa.</span>
            </h1>
            <p className="mt-7 max-w-xl text-base sm:text-lg leading-relaxed text-[#C6D8D7]">
              Uma plataforma para aproximar profissionais independentes de TI e empregadores,
              organizar propostas e formalizar acordos com condições claras.
            </p>
            <div className="flex flex-wrap gap-3 mt-9">
              <Link to="/workers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#D9F781] text-[#163238] hover:bg-[#E6FFA5] font-extrabold text-sm transition-colors shadow-lg shadow-black/10">
                Encontrar profissionais <ArrowUpRight size={18}/>
              </Link>
              <Link to="/offers"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/5 text-white border border-white/30 hover:bg-white/15 font-bold text-sm transition-colors">
                Explorar oportunidades <ArrowRight size={18}/>
              </Link>
            </div>
            <p className="mt-8 text-xs text-[#ADCCC8] flex items-start gap-2 leading-relaxed max-w-lg">
              <BadgeCheck size={16} className="shrink-0 text-[#D9F781]"/>
              Protótipo académico demonstrativo. Não processa pagamentos nem substitui a validação de identidades.
            </p>
          </div>

          <div className="lg:col-span-5">
            <div className="relative max-w-md lg:max-w-none mx-auto rounded-[28px] border border-white/20 bg-white/[.075] backdrop-blur-md p-5 sm:p-7 shadow-[0_28px_80px_rgba(0,0,0,.16)]">
              <div className="flex justify-between items-start gap-3 pb-5 border-b border-white/15">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[.15em] text-[#C2D5D2]">Exemplo de percurso</p>
                  <h2 className="font-display text-xl font-bold text-white mt-2">Do primeiro contacto ao acordo</h2>
                </div>
                <span className="rounded-xl border border-white/20 bg-white/10 p-3 text-[#D9F781]"><BriefcaseBusiness size={22}/></span>
              </div>
              <div className="mt-5 space-y-3">
                {steps.map((step, i) => (
                  <div key={step.number} className="flex gap-4 items-center p-3.5 rounded-2xl bg-white/[.075] border border-white/10">
                    <div className={`h-10 w-10 rounded-xl flex justify-center items-center shrink-0 font-display text-sm font-extrabold ${i === 2 ? 'bg-[#D9F781] text-[#123943]' : 'bg-white/10 text-white'}`}>
                      {i === 2 ? <Check size={20}/> : step.number}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-white">{step.title}</p>
                      <p className="text-xs text-[#B8D0CE] mt-0.5">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between gap-3 rounded-xl p-3 bg-[#D9F781]/10 border border-[#D9F781]/20 text-[#E6F8CC]">
                <span className="flex items-center gap-2 text-xs font-semibold"><FileCheck2 size={17}/> Condições documentadas</span>
                <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">Demonstração</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20">
        <div className="flex flex-col md:flex-row justify-between md:items-end gap-5 mb-9">
          <div className="max-w-xl">
            <p className="conecta-eyebrow mb-3">Especialidades</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight text-[#173037]">
              Encontre a competência certa
            </h2>
            <p className="text-[#5D7376] mt-3 text-base leading-relaxed">
              Explore as áreas de tecnologia presentes no protótipo e descubra profissionais e oportunidades.
            </p>
          </div>
          <Link to="/workers" className="inline-flex items-center gap-2 text-secondary font-bold text-sm hover:underline underline-offset-4">
            Ver profissionais <ArrowUpRight size={18}/>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {specialities.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.name} to="/workers"
                className="conecta-card group p-6 sm:p-7 flex flex-col min-h-[215px]">
                <div className="flex justify-between gap-3">
                  <span className={`h-13 w-13 rounded-2xl flex items-center justify-center text-[#123943] ${item.tint}`}>
                    <Icon size={25} strokeWidth={1.9}/>
                  </span>
                  <ArrowUpRight size={18} className="text-[#9AB1AE] group-hover:text-secondary transition-colors"/>
                </div>
                <h3 className="font-display font-bold text-lg text-[#19373C] mt-7">{item.name}</h3>
                <p className="text-sm leading-relaxed text-[#65797A] mt-2">{item.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-[#E7F0EB] border-y border-[#D5E4DB]">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5">
            <p className="conecta-eyebrow mb-3">Uma relação profissional clara</p>
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-[#173037] leading-tight">
              Mais organização. Menos incerteza.
            </h2>
            <p className="mt-5 text-[#596F70] leading-relaxed text-base">
              A colaboração não termina quando duas pessoas entram em contacto.
              O ConecTA organiza propostas, condições aceites e registos
              do acompanhamento do trabalho.
            </p>
          </div>
          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {[
              { icon: UsersRound, title: 'Perfis e propostas', desc: 'Apresentação das competências e comunicação entre as partes.' },
              { icon: FileCheck2, title: 'Acordos por versão', desc: 'Condições submetidas e aprovadas por ambas as partes.' },
              { icon: MessageSquareText, title: 'Acompanhamento', desc: 'Registo documental de ocorrências e esclarecimentos.' },
              { icon: BadgeCheck, title: 'Pagamentos externos', desc: 'Declarações e confirmações sem custódia de fundos.' }
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="bg-white border border-[#DCE7E0] rounded-2xl p-5 sm:p-6">
                  <span className="inline-flex h-10 w-10 rounded-xl bg-[#E7F3EF] items-center justify-center text-secondary"><Icon size={21}/></span>
                  <h3 className="font-display text-base font-bold text-[#173037] mt-4">{item.title}</h3>
                  <p className="mt-2 text-sm text-[#627778] leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20">
        <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
          <div>
            <p className="conecta-eyebrow mb-3">Oportunidades</p>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-[#173037]">Projectos em destaque</h2>
            <p className="text-[#627778] mt-3">Explore oportunidades de tecnologia disponíveis na demonstração.</p>
          </div>
          <Link to="/offers" className="text-secondary font-bold text-sm inline-flex items-center gap-2 hover:underline underline-offset-4">
            Ver todas as oportunidades <ArrowRight size={18}/>
          </Link>
        </div>
        {featuredOffers.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredOffers.map(offer => <OfferCard key={offer.id} offer={offer}/>)}
          </div>
        ) : (
          <div className="conecta-surface p-10 text-center">
            <p className="text-[#627778]">Não há oportunidades em destaque neste momento.</p>
          </div>
        )}
      </section>
    </div>
  );
};
