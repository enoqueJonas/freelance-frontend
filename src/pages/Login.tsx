/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, error, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');

  // Quick select accounts
  const demoAccounts = [
    { name: 'Carlos Tembe', email: 'charlie@gmail.com', role: 'Freelancer Verificado (React / Django)' },
    { name: 'Elena Nhaca', email: 'elena@gmail.com', role: 'Designer UI/UX Verificada' },
    { name: 'Nelson Macuácua', email: 'nelson@outlook.co.mz', role: 'Freelancer Não Verificado (Suporte)' },
    { name: 'Maputo Digital', email: 'vagas@maputodigital.co.mz', role: 'Contratante Verificado' },
    { name: 'Inove Sistemas', email: 'geral@inovemz.com', role: 'Contratante Verificado' },
    { name: 'Suporte Administrativo', email: 'admin@conecta.test', role: 'Administrador da Plataforma' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    const success = await login(email);
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    const success = await login(demoEmail);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            CT
          </div>
          <span className="font-sans font-bold text-xl text-gray-950">
            ConecTA Maputo
          </span>
        </Link>
        <h2 className="text-center text-2xl font-bold font-sans text-gray-900 tracking-tight">
          Aceder à sua conta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Ou{' '}
          <Link to="/register" className="font-medium text-blue-600 hover:text-blue-505 hover:underline">
            criar uma nova conta gratuitamente
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                Endereço de Email ou Nome de Utilizador
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  placeholder="exemplo@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 border border-red-100 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-550 shadow-sm transition-colors"
              >
                {isLoading ? 'Autenticando...' : 'Entrar na Plataforma'}
              </button>
            </div>
          </form>

          {/* Quick Demo Login */}
          <div className="mt-8 pt-6 border-t border-gray-100">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
              <ShieldCheck size={14} className="text-blue-500" /> Acesso de Demonstração Rápido
            </span>
            
            <p className="text-xs text-gray-400 mb-4 font-normal">
              Selecione qualquer utilizador abaixo para entrar instantaneamente sem necessidade de password, simulando o comportamento de tokens JWT salvos.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {demoAccounts.map((account, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickLogin(account.email)}
                  className="p-2.5 text-left border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-800 group-hover:text-blue-600 leading-tight">
                      {account.name}
                    </p>
                    <p className="text-[10px] text-gray-400 leading-none mt-1 font-mono truncate">
                      {account.email}
                    </p>
                  </div>
                  <span className="inline-block mt-2 text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-semibold self-start capitalize">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-650">
              <ArrowLeft size={12} /> voltar ao início
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};
