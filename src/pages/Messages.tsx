/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockApi } from '../services/mockApi';
import { Message } from '../types';
import { Send, MessageSquare, ArrowLeft, LayoutDashboard, UserCheck } from 'lucide-react';

export const Messages: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const peerQueryId = searchParams.get('peer');

  // Chat Thread state
  const [contacts, setContacts] = useState<any[]>([]);
  const [activePeerId, setActivePeerId] = useState<number | null>(null);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    loadContacts();
  }, [user]);

  // Handle auto-focus peer from URL query
  useEffect(() => {
    if (peerQueryId && contacts.length > 0) {
      const targetId = Number(peerQueryId);
      setActivePeerId(targetId);
      // If contact isn't in contact lists yet, let's inject a provisional contact row!
      const exists = contacts.some(c => c.id === targetId);
      if (!exists) {
        injectProvisionalContact(targetId);
      }
    } else if (contacts.length > 0 && !activePeerId) {
      setActivePeerId(contacts[0].id);
    }
  }, [peerQueryId, contacts]);

  // Load message thread for active peer
  useEffect(() => {
    if (!user || !activePeerId) return;
    loadThread(activePeerId);

    // Dynamic thread poller
    const poller = setInterval(() => {
      loadThread(activePeerId);
    }, 5000);

    return () => clearInterval(poller);
  }, [user, activePeerId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const loadContacts = async () => {
    if (!user) return;
    try {
      const list = await mockApi.messages.listChatContacts(user.id);
      setContacts(list);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const injectProvisionalContact = async (peerId: number) => {
    try {
      const allUsers = await mockApi.admin.listAllUsers();
      const peer = allUsers.find(u => u.id === peerId);
      if (!peer) return;

      const newContact = {
        id: peer.id,
        name: `${peer.first_name} ${peer.last_name}`,
        subtitle: peer.role === 'worker' ? 'Profissional de TI' : 'Contratante',
        role: peer.role,
        lastMsg: 'Inicie uma conversa segura...',
        lastTime: new Date().toISOString()
      };
      setContacts(prev => [newContact, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const loadThread = async (peerId: number) => {
    if (!user) return;
    try {
      const thread = await mockApi.messages.listThread(user.id, peerId);
      setThreadMessages(thread);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePeerId || !typedMessage.trim()) return;

    try {
      const sText = typedMessage.trim();
      setTypedMessage('');
      
      const newMsg = await mockApi.messages.send(user.id, activePeerId, sText);
      setThreadMessages(prev => [...prev, newMsg]);
      
      // Reload contacts preview
      loadContacts();
    } catch (err) {
      console.error(err);
    }
  };

  const activeContactInfo = contacts.find(c => c.id === activePeerId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-140px)] min-h-[500px]">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm h-full flex overflow-hidden">
        
        {/* Left Contacts Sidebar */}
        <div className="w-full sm:w-80 border-r border-gray-100 flex flex-col h-full bg-gray-50/50 shrink-0">
          <div className="p-4 border-b border-gray-100 bg-white">
            <h2 className="font-bold text-gray-850 text-base flex items-center gap-1.5"><MessageSquare size={18} className="text-blue-500" /> Minhas Conversas</h2>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-gray-100/60 p-2 space-y-1">
            {loading ? (
              <p className="text-xs text-gray-400 text-center py-8">Carregando contatos...</p>
            ) : contacts.length > 0 ? (
              contacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setActivePeerId(contact.id)}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-start gap-3 cursor-pointer ${
                    activePeerId === contact.id 
                      ? 'bg-blue-50/80 border-l-4 border-l-blue-600 shadow-tiny' 
                      : 'hover:bg-gray-50 bg-transparent'
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-blue-105 bg-blue-100 text-blue-605 text-blue-600 font-extrabold flex items-center justify-center text-xs shrink-0 self-center">
                    {contact.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className="text-xs font-bold text-gray-805 truncate">{contact.name}</p>
                    </div>
                    <p className="text-xxs text-gray-400 font-medium capitalize mb-1">{contact.subtitle}</p>
                    <p className="text-xxs text-gray-400 truncate leading-tight font-normal italic">
                      "{contact.lastMsg}"
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-12 px-4 space-y-2">
                <p className="text-gray-400 text-xs">Sem conversas ativas.</p>
                <p className="text-xxs text-gray-400 font-medium">Ligue-se a empregadores ou candidate-se a vagas para iniciar uma negociação.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Active Conversation Panel */}
        <div className="flex-1 flex flex-col h-full bg-white relative">
          
          {activePeerId && activeContactInfo ? (
            <>
              {/* Thread Header info */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/20">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white font-extrabold flex items-center justify-center text-xs">
                    {activeContactInfo.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 text-sm leading-tight">{activeContactInfo.name}</h3>
                    <p className="text-xxs text-gray-400 leading-none mt-1 capitalize font-medium">{activeContactInfo.subtitle}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => navigate(`/profile/${activePeerId}`)} 
                    className="px-3 py-1.5 border border-gray-200 text-xxs font-bold text-gray-650 hover:bg-gray-100/50 rounded-lg"
                  >
                    Ver Perfil
                  </button>
                </div>
              </div>

              {/* Thread Messages List Container Scroll */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-55 bg-zinc-50/10">
                {threadMessages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  const msgTime = new Date(msg.createdAt).toLocaleTimeString('pt-MZ', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div 
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-md rounded-2xl px-4 py-2.5 text-xs font-sans leading-relaxed shadow-tiny ${
                          isMe 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-700 border border-gray-100 rounded-bl-none'
                        }`}
                      >
                        <p>{msg.text}</p>
                        <span className={`block text-[9px] mt-1 text-right font-semibold font-mono ${
                          isMe ? 'text-blue-150 text-blue-200' : 'text-gray-400'
                        }`}>
                          {msgTime}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Thread Chat composer footer */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex gap-2 bg-white">
                <input
                  type="text"
                  required
                  value={typedMessage}
                  onChange={(e) => setTypedMessage(e.target.value)}
                  placeholder="Escreva uma mensagem técnica ou proposta..."
                  className="flex-1 px-4 py-2 bg-gray-50 hover:bg-gray-100/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-gray-800"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center justify-center"
                  title="Enviar mensagem"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-400/80">
              <MessageSquare size={48} className="text-gray-250 animate-bounce" />
              <h3 className="font-bold text-gray-800 text-base mt-4">Nenhuma conversa selecionada</h3>
              <p className="text-xs text-gray-500 mt-1 max-w-sm">Escolha uma negociação na barra lateral ou visite o direct de um perfil para esclarecer escopos e termos.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
