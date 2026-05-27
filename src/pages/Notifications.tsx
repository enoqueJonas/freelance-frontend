/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Check, Trash2, ArrowLeft, ShieldAlert, CreditCard, MessageSquare, Briefcase, FileSignature } from 'lucide-react';

export const Notifications: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAuth();
  const navigate = useNavigate();

  const handleMarkRead = async (id: number) => {
    await markNotificationRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
  };

  // Icon mapping based on notification type
  const renderNotifIcon = (type: string) => {
    const classes = "p-2 rounded-xl shrink-0";
    switch (type) {
      case 'message':
        return <div className={`${classes} bg-blue-50 text-blue-600`}><MessageSquare size={16} /></div>;
      case 'proposal':
        return <div className={`${classes} bg-orange-50 text-orange-605 text-orange-600`}><Briefcase size={16} /></div>;
      case 'contract':
        return <div className={`${classes} bg-purple-50 text-purple-600`}><FileSignature size={16} /></div>;
      case 'payment':
        return <div className={`${classes} bg-emerald-50 text-emerald-600`}><CreditCard size={16} /></div>;
      case 'verification':
      case 'system':
      default:
        return <div className={`${classes} bg-amber-50 text-amber-600`}><ShieldAlert size={16} /></div>;
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 md:py-12 min-h-screen">
      {/* Header and Bulk Action */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-5 mb-8">
        <div>
          <h1 className="font-sans font-bold text-2xl text-gray-900 tracking-tight flex items-center gap-2">
            <Bell size={24} className="text-blue-500" /> Notificações
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Mantenha-se informado sobre os seus orçamentos, contratos de TI e mensagens em Maputo
          </p>
        </div>

        {notifications.some(n => !n.isRead) ? (
          <button
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg font-bold cursor-pointer"
          >
            <Check size={14} /> Marcar todas como lidas
          </button>
        ) : null}
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3.5">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-4 ${
                notif.isRead 
                  ? 'bg-white border-gray-50 opacity-75' 
                  : 'bg-white border-blue-50 shadow-tiny ring-1 ring-blue-50/20'
              }`}
            >
              {renderNotifIcon(notif.type)}
              
              <div className="flex-1 min-w-0">
                <p className={`text-xs leading-relaxed ${notif.isRead ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                  {notif.text}
                </p>
                
                <span className="block text-[10px] text-gray-405 text-gray-400 mt-1.5 font-sans font-medium">
                  {new Date(notif.createdAt).toLocaleDateString('pt-MZ', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              {!notif.isRead && (
                <button
                  onClick={() => handleMarkRead(notif.id)}
                  className="p-1 px-1.5 text-xxs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg self-center cursor-pointer"
                  title="Marcar como lida"
                >
                  Confirmar lida
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-gray-100 rounded-3xl p-8">
          <Bell size={40} className="mx-auto text-gray-200 animate-pulse" />
          <h3 className="font-bold text-gray-800 text-sm mt-3">Caixa de Entrada Vazia</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">Não possui notificações pendentes. Novas atualizações sobre orçamentos serão notificadas aqui.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="mt-5 text-xs text-blue-600 bg-blue-50 px-4 py-2 rounded-xl font-bold inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={14} /> Voltar ao Painel Geral
          </button>
        </div>
      )}
    </div>
  );
};
