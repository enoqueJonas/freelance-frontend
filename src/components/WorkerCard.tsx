/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { WorkerProfile } from '../types';
import { Award, Code2, LucideStar, MapPin, UserCheck, MessageSquare } from 'lucide-react';

interface WorkerCardProps {
  worker: WorkerProfile;
}

export const WorkerCard: React.FC<WorkerCardProps> = ({ worker }) => {
  return (
    <div className="conecta-card p-6 group flex flex-col justify-between h-full">
      <div>
        {/* Verification & Avatar Name row */}
        <div className="flex gap-4 items-start mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#E5F2E9] text-primary font-extrabold flex items-center justify-center text-lg uppercase shadow-inner border border-primary/20">
            {worker.firstName.charAt(0)}{worker.lastName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-display font-extrabold text-base text-[#173037] hover:text-secondary transition-colors">
                <Link to={`/profile/${worker.userId}?role=worker`}>
                  {worker.firstName} {worker.lastName}
                </Link>
              </h3>
              {worker.documentStatus === 'approved' && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100" title="Identidade Verificada">
                  <UserCheck size={10} /> Verificado
                </span>
              )}
            </div>
            <p className="text-sm font-medium text-primary leading-tight">
              {worker.title}
            </p>
          </div>
        </div>

        {/* Rating and Reviews count */}
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3 font-semibold">
          <span className="flex items-center gap-1 text-amber-500 font-bold">
            <LucideStar size={14} className="fill-current" />
            {worker.averageRating || '5.0'}
          </span>
          <span>•</span>
          <span className="text-gray-550 flex items-center gap-1">
            <Award size={14} className="text-gray-400" />
            {worker.completedJobs} Projectos Concluídos
          </span>
          <span>•</span>
          <span className="text-gray-500 font-mono">
            {worker.experienceYears || '1+'} {worker.experienceYears === 1 ? 'ano' : 'anos'} exp
          </span>
        </div>

        {/* Short bio preview */}
        <p className="text-sm text-[#607578] line-clamp-3 mb-4 leading-relaxed">
          {worker.bio || 'Profissional de TI pronto para colaborar no desenvolvimento da sua infraestrutura web ou mobile em Moçambique.'}
        </p>

        {/* Technical skills list */}
        <div className="flex flex-wrap gap-1 mb-4">
          {worker.skills.slice(0, 5).map((skill, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 text-xs text-gray-600 bg-[#EBF5EF] text-[#146B5E] rounded-md text-[11px] font-medium border border-[#D6E8DC]"
            >
              {skill}
            </span>
          ))}
          {worker.skills.length > 5 && (
            <span className="text-xxs text-gray-400 self-center font-bold px-1">
              +{worker.skills.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Footer link card */}
      <div className="pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 font-medium">
        <span className="flex items-center gap-1">
          <MapPin size={14} className="text-gray-400" />
          {worker.location}
        </span>
        
        <div className="flex gap-2">
          <Link
            to={`/messages?peer=${worker.userId}`}
            className="p-2 text-primary hover:text-white bg-[#E8F2EE] hover:bg-primary rounded-lg transition-colors"
            title="Enviar mensagem"
          >
            <MessageSquare size={14} />
          </Link>
          <Link 
            to={`/profile/${worker.userId}?role=worker`}
            className="px-3 py-1.5 font-semibold text-primary hover:bg-primary/10 rounded-lg transition-colors border border-primary/20"
          >
            Ver Perfil
          </Link>
        </div>
      </div>
    </div>
  );
};
