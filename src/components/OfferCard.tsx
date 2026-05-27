/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Offer } from '../types';
import { Briefcase, MapPin, Calendar, CircleDollarSign } from 'lucide-react';

interface OfferCardProps {
  offer: Offer;
  onApply?: (offerId: number) => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onApply }) => {
  const formattedSalary = offer.salaryBudget.toLocaleString('pt-MZ') + ' MT';
  const customDate = new Date(offer.createdAt).toLocaleDateString('pt-MZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 hover:border-primary/35 p-6 shadow-sm hover:shadow-md transition-all group flex flex-col justify-between h-full">
      <div>
        {/* Header - Role & Employer */}
        <div className="flex justify-between items-start gap-3 mb-3">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              {offer.category}
            </span>
            <h3 className="font-sans font-bold text-lg text-gray-800 hover:text-primary transition-colors group-hover:translate-x-0.5 transform duration-150">
              <Link to={`/offers/${offer.id}`}>
                {offer.title}
              </Link>
            </h3>
          </div>
        </div>

        {/* Employer details */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-600 uppercase border border-gray-150">
            {offer.employerProfile.companyName.charAt(0)}
          </div>
          <span className="text-sm font-medium text-gray-600">
            {offer.employerProfile.companyName}
          </span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs text-gray-400 font-mono capitalize">
            {offer.employerProfile.industry}
          </span>
        </div>

        {/* Main description preview */}
        <p className="text-sm text-gray-500 line-clamp-3 mb-4 leading-relaxed">
          {offer.description}
        </p>

        {/* Required skills */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {offer.requiredSkills.map((skill, index) => (
            <span 
              key={index} 
              className="px-2 py-0.5 text-xs text-gray-600 bg-gray-100 rounded-md border border-gray-150"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Meta data row */}
      <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 font-medium">
        <div className="flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 text-gray-600 font-semibold text-sm">
            <CircleDollarSign size={16} className="text-emerald-500" />
            {formattedSalary}
          </span>
          <span className="flex items-center gap-1">
            <MapPin size={14} className="text-gray-400" />
            {offer.location}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} className="text-gray-400" />
            {customDate}
          </span>
        </div>

        <div>
          <Link 
            to={`/offers/${offer.id}`}
            className="inline-flex items-center gap-1 px-4 py-2 text-xs font-semibold text-primary bg-primary/10 group-hover:bg-primary group-hover:text-white rounded-lg transition-all"
          >
            Ver Detalhes
          </Link>
        </div>
      </div>
    </div>
  );
};
