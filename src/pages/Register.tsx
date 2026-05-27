/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Briefcase, User, MapPin, Building2, CheckCircle2, ArrowLeft } from 'lucide-react';

export const Register: React.FC = () => {
  const { register, error, isLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Role selection
  const [role, setRole] = useState<'worker' | 'employer'>('worker');
  
  // Custom states
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [location, setLocation] = useState('Polana, Maputo');
  
  // Worker fields
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  
  // Employer fields
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');

  // Sync role with query parameter
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'employer' || r === 'worker') {
      setRole(r);
    }
  }, [searchParams]);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && skillInput) {
      e.preventDefault();
      if (!skills.includes(skillInput.trim())) {
        setSkills([...skills, skillInput.trim()]);
      }
      setSkillInput('');
    }
  };

  const removeSkill = (index: number) => {
    setSkills(skills.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !firstName || !lastName) return;

    const payload = {
      username,
      email,
      firstName,
      lastName,
      role,
      location,
      bio,
      skills,
      title: role === 'worker' ? title : undefined,
      companyName: role === 'employer' ? companyName : undefined,
      industry: role === 'employer' ? industry : undefined,
    };

    const success = await register(payload);
    if (success) {
      navigate('/dashboard');
    }
  };

  const locationsInMaputo = [
    'Polana, Maputo',
    'Sommerschield, Maputo',
    'Bairro Central, Maputo',
    'Coop, Maputo',
    'Malhangalene, Maputo',
    'Alto Maé, Maputo',
    'Bairro Triunfo, Maputo',
    'Matola, Província de Maputo',
    'Aeroporto, Maputo'
  ];

  const industries = [
    'Tecnologia de Informação',
    'Software de Gestão',
    'Consultoria Tecnológica',
    'Telecomunicações',
    'Construção e infraestrutura',
    'Bancos e Seguros',
    'Educação / Ensino',
    'Geral'
  ];

  return (
    <div className="min-h-screen bg-gray-55 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-md p-8 sm:p-10">
        
        {/* Header Block */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-base shadow">
              S+
            </div>
            <span className="font-sans font-bold text-lg text-gray-950">
              ServiPlus Maputo
            </span>
          </Link>
          <h2 className="title-display font-bold text-2xl text-gray-900 leading-tight">
            Registe uma nova conta
          </h2>
          <p className="text-sm text-gray-500 mt-1">Conectando cérebros de TI locais a empresas locais.</p>
        </div>

        {/* Role Select Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            type="button"
            onClick={() => setRole('worker')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
              role === 'worker'
                ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-150 hover:bg-gray-50'
            }`}
          >
            <Briefcase size={18} /> Sou Freelancer
          </button>
          
          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border font-semibold text-sm transition-all cursor-pointer ${
              role === 'employer'
                ? 'bg-blue-50 text-blue-600 border-blue-500 shadow-sm'
                : 'bg-white text-gray-600 border-gray-150 hover:bg-gray-50'
            }`}
          >
            <Building2 size={18} /> Sou Contratante
          </button>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Nome
              </label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Carlos"
                className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Apelido
              </label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Tembe"
                className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
                Nome de Utilizador
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="charlie_dev"
                className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-605 uppercase tracking-wider mb-1">
                Endereço de Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="charlie@gmail.com"
                className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Bairro / Localidade em Maputo
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
            >
              {locationsInMaputo.map((loc, index) => (
                <option key={index} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>

          {/* Conditional Role-Based Fields */}
          {role === 'worker' ? (
            /* Worker Inputs */
            <>
              <div>
                <label className="block text-xs font-bold text-gray-605 uppercase tracking-wider mb-1">
                  Título Profissional (Especialidade)
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Desenvolvedor React Native | Especialista DevOps"
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-605 uppercase tracking-wider mb-1">
                  Resumo Profissional / Biografia
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fale brevemente sobre o seu percurso de TI e as soluções que já entregou..."
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-605 uppercase tracking-wider mb-1">
                  Suas Skills de TI (Pressione Enter para adicionar)
                </label>
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleAddSkill}
                  placeholder="Ex: React, Django, Linux (e pressione Enter)"
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                />
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-650 px-2 py-0.5 rounded-lg text-xs font-semibold border border-blue-10/50"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="hover:text-red-500 font-extrabold focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* Employer Inputs */
            <>
              <div>
                <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">
                  Nome da Empresa / Entidade
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Maputo Digital Limitada"
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">
                  Setor Comercial / Indústria
                </label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm"
                >
                  <option value="">Selecione o setor...</option>
                  {industries.map((ind, index) => (
                    <option key={index} value={ind}>
                      {ind}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-650 uppercase tracking-wider mb-1">
                  Sobre a Empresa / Missão
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Fale um pouco sobre a actuação da sua empresa e o tipo de talentos digitais que costuma recrutar..."
                  className="w-full px-4 py-2 bg-white border border-gray-200 hover:border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-550 text-sm resize-none"
                />
              </div>
            </>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 text-xs text-red-650 font-semibold p-3 border border-red-100">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-650 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-md transition-colors cursor-pointer"
            >
              {isLoading ? 'Registando conta...' : 'Concluir Registo'}
            </button>
          </div>

          <div className="text-center pt-2 text-xs text-gray-500">
            Já possui uma conta?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Entrar aqui
            </Link>
          </div>

          <div className="flex justify-center border-t border-gray-50 pt-4">
            <Link to="/" className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600">
              <ArrowLeft size={12} /> voltar ao início
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
