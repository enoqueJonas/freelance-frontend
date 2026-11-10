/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, MapPin, Globe, CreditCard } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-905 bg-zinc-900 text-gray-300">
      {/* Upper footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: About the platform */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white font-extrabold text-lg shadow">
                CT
              </div>
              <span className="font-sans font-bold text-lg text-white">
                ConecTA Maputo
              </span>
            </div>
            <p className="text-sm text-gray-400">
              Protótipo académico de conexão entre trabalhadores autónomos da área de TI e empregadores na cidade de Maputo.
            </p>
            <div className="flex flex-col gap-1.5 text-xs text-gray-400 font-mono mt-4">
              <p className="flex items-center gap-2">
                <MapPin size={12} className="text-primary" /> Maputo, Moçambique
              </p>
              <p className="flex items-center gap-2">
                <Mail size={12} className="text-primary" /> Contacto institucional por definir (protótipo)
              </p>
            </div>
          </div>

          {/* Col 2: For Workers */}
          <div>
            <h3 className="font-semibold text-white text-sm tracking-wider uppercase mb-4">Para Freelancers</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/offers" className="text-gray-400 hover:text-white transition-colors">
                  Pesquisar Vagas de TI
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-gray-400 hover:text-white transition-colors">
                  Criar Perfil de Prestador
                </Link>
              </li>
              <li>
                <span className="text-gray-500 flex items-center gap-1">
                  Pagamentos registados externamente <ShieldCheck size={14} className="text-emerald-500" />
                </span>
              </li>
              <li>
                <span className="text-gray-550 block text-xs">
                  Sem integração financeira activa
                </span>
              </li>
            </ul>
          </div>

          {/* Col 3: For Employers */}
          <div>
            <h3 className="font-semibold text-white text-sm tracking-wider uppercase mb-4">Para Empresas</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/workers" className="text-gray-400 hover:text-white transition-colors">
                  Pesquisar Freelancers
                </Link>
              </li>
              <li>
                <Link to="/offers/new" className="text-gray-400 hover:text-white transition-colors">
                  Publicar Projecto (Vaga)
                </Link>
              </li>
              <li>
                <span className="text-gray-400 block hover:text-white cursor-pointer transition-colors">
                  Condições de pagamento e conflitos
                </span>
              </li>
              <li>
                <span className="text-gray-400 block hover:text-white cursor-pointer transition-colors">
                  Serviços Empresariais
                </span>
              </li>
            </ul>
          </div>

          {/* Col 4: Trust & Local Payments */}
          <div className="space-y-4">
            <h3 className="font-semibold text-white text-sm tracking-wider uppercase">Registos de pagamento</h3>
            <p className="text-xs text-gray-400">
              Os pagamentos são efectuados fora da aplicação. O protótipo regista declarações de pagamento e permite confirmação ou contestação pelas partes; não custodia fundos.
            </p>
            <div className="pt-2 border-t border-zinc-800">
              <span className="text-xs font-semibold text-gray-400 block tracking-wider uppercase mb-2">Métodos externos registáveis:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 text-[10px] bg-zinc-800 text-emerald-400 rounded font-semibold border border-zinc-750">
                  M-Pesa
                </span>
                <span className="px-2 py-1 text-[10px] bg-zinc-800 text-yellow-400 rounded font-semibold border border-zinc-750">
                  e-Mola
                </span>
                <span className="px-2 py-1 text-[10px] bg-zinc-800 text-blue-400 rounded font-semibold border border-zinc-750">
                  Ref Bancária
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Lower Copyright Area */}
      <div className="border-t border-zinc-800 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} ConecTA Maputo. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-400 cursor-pointer">Termos de Serviço</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Políticas de Privacidade</span>
            <span>•</span>
            <span className="hover:text-gray-400 cursor-pointer">Django API Sync</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
