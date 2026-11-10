/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { mockApi } from '../services/mockApi';
import { WorkerProfile } from '../types';
import { WorkerCard } from '../components/WorkerCard';
import { Search, MapPin, Users2, Star, SlidersHorizontal, Award } from 'lucide-react';

export const WorkersList: React.FC = () => {
  const [workers, setWorkers] = useState<WorkerProfile[]>([]);
  const [filteredWorkers, setFilteredWorkers] = useState<WorkerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [minExp, setMinExp] = useState('');
  const [selectedLoc, setSelectedLoc] = useState('');

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const list = await mockApi.workers.list();
        setWorkers(list);
        setFilteredWorkers(list);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWorkers();
  }, []);

  const handleFilter = () => {
    let result = workers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        w => w.firstName.toLowerCase().includes(q) ||
             w.lastName.toLowerCase().includes(q) ||
             w.title.toLowerCase().includes(q) ||
             w.bio.toLowerCase().includes(q)
      );
    }

    if (selectedSkill) {
      result = result.filter(w => w.skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase()));
    }

    if (minExp) {
      result = result.filter(w => w.experienceYears >= Number(minExp));
    }

    if (selectedLoc) {
      result = result.filter(w => w.location.toLowerCase().includes(selectedLoc.toLowerCase()));
    }

    setFilteredWorkers(result);
  };

  useEffect(() => {
    handleFilter();
  }, [searchQuery, selectedSkill, minExp, selectedLoc, workers]);

  // Aggregate skills for filter dropdown
  const allSkills = Array.from(
    new Set(workers.flatMap(w => w.skills))
  ).sort();

  const locations = ['Polana', 'Sommerschield', 'Bairro Central', 'Matola'];

  return (
    <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-10">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-[#173037] tracking-tight">
          Pesquisar Freelancers de TI
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Encontre e conecte-se com engenheiros de software, administradores de sistemas e designers verificados em Maputo
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="conecta-surface p-6 self-start h-auto">
          <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-5">
            <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
              <SlidersHorizontal size={16} className="text-primary" /> Filtros Ativos
            </span>
            <button 
              onClick={() => {
                setSearchQuery('');
                setSelectedSkill('');
                setMinExp('');
                setSelectedLoc('');
              }}
              className="text-xs text-primary hover:underline font-semibold"
            >
              Limpar Todos
            </button>
          </div>

          <div className="space-y-5">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Programador ou Título
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nome, bio, especialidade..."
                  className="w-full pl-9 pr-4 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              </div>
            </div>

            {/* Skill Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Tecnologia / Competência
              </label>
              <select
                value={selectedSkill}
                onChange={(e) => setSelectedSkill(e.target.value)}
                className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Qualquer tecnologia</option>
                {allSkills.map((skill, index) => (
                  <option key={index} value={skill}>{skill}</option>
                ))}
              </select>
            </div>

            {/* Local in Maputo */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Bairro / Localidade
              </label>
              <select
                value={selectedLoc}
                onChange={(e) => setSelectedLoc(e.target.value)}
                className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">Qualquer bairro</option>
                {locations.map((loc, index) => (
                  <option key={index} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Anos de Experiência Mínima
              </label>
              <select
                value={minExp}
                onChange={(e) => setMinExp(e.target.value)}
                className="w-full px-3 py-2 bg-gray-55 border border-gray-205 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm font-semibold"
              >
                <option value="">Todos os profissionais</option>
                <option value="1">Mais de 1 ano</option>
                <option value="3">Mais de 3 anos</option>
                <option value="5">Mais de 5 anos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Workers List Column Grid */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-16 animate-pulse">
              <p className="text-gray-500 text-sm">Carregando mentes técnicas em Maputo...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkers.length > 0 ? (
                filteredWorkers.map((worker) => (
                  <WorkerCard key={worker.id} worker={worker} />
                ))
              ) : (
                <div className="col-span-2 text-center py-16 conecta-surface p-8">
                  <p className="text-sm font-medium text-gray-505">Nenhum profissional corresponde aos filtros atuais.</p>
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedSkill('');
                      setMinExp('');
                      setSelectedLoc('');
                    }} 
                    className="mt-3 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-lg font-bold"
                  >
                    Mostrar Todos os Profissionais
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
