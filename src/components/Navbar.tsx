/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, X, Bell, MessageSquare, LogOut, User as UserIcon, 
  Briefcase, Shield, FileText, LayoutDashboard, PlusCircle, Search
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, logout, unreadCount } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    setShowProfileDropdown(false);
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  // Render navigation links based on user role
  const renderNavLinks = (mobile: boolean = false) => {
    const baseClass = mobile
      ? "block px-4 py-2.5 text-base font-medium rounded-lg transition-colors "
      : "px-3 py-2 text-sm font-medium rounded-lg transition-colors ";

    const activeStyle = "bg-primary/10 text-primary font-semibold";
    const inactiveStyle = "text-gray-600 hover:bg-primary/5 hover:text-primary";

    const linkStyle = (path: string) => `${baseClass} ${isActive(path) ? activeStyle : inactiveStyle}`;

    return (
      <>
        <Link to="/" className={linkStyle('/')} onClick={() => setIsOpen(false)}>
          Início
        </Link>
        
        {/* Guest Search Options */}
        {(!user || user.role === 'worker') && (
          <Link to="/offers" className={linkStyle('/offers')} onClick={() => setIsOpen(false)}>
            <span className="flex items-center gap-1.5">
              <Search size={16} /> Pesquisar Vagas
            </span>
          </Link>
        )}

        {(!user || user.role === 'employer') && (
          <Link to="/workers" className={linkStyle('/workers')} onClick={() => setIsOpen(false)}>
            <span className="flex items-center gap-1.5">
              <Search size={16} /> Pesquisar Talentos
            </span>
          </Link>
        )}

        {/* Dashboards */}
        {user && (
          <Link to="/dashboard" className={linkStyle('/dashboard')} onClick={() => setIsOpen(false)}>
            <span className="flex items-center gap-1.5">
              <LayoutDashboard size={16} /> Painel Geral
            </span>
          </Link>
        )}

        {/* Role-Specific Shortcuts */}
        {user?.role === 'employer' && (
          <Link to="/offers/new" className={linkStyle('/offers/new')} onClick={() => setIsOpen(false)}>
            <span className="flex items-center gap-1.5 text-secondary hover:text-secondary/90 bg-secondary/10 px-2.5 py-1 rounded-md">
              <PlusCircle size={16} /> Publicar Vaga
            </span>
          </Link>
        )}
      </>
    );
  };

  const userInitial = user ? user.first_name.charAt(0).toUpperCase() : '';

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-xl shadow-md tracking-wider">
                S+
              </div>
              <div className="flex flex-col">
                <span className="font-sans font-bold text-lg text-gray-900 leading-none tracking-tight">
                  ServiPlus
                </span>
                <span className="font-sans text-[10px] text-primary/80 font-bold uppercase tracking-wider">
                  Maputo Freelance
                </span>
              </div>
            </Link>
            
            {/* Desktop Nav Items */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              {renderNavLinks()}
            </div>
          </div>

          {/* Desktop User Panel */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {user ? (
              <>
                {/* Chat shortcut */}
                <Link 
                  to="/messages" 
                  className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-primary/5 relative transition-colors"
                  title="Mensagens"
                >
                  <MessageSquare size={20} />
                </Link>

                {/* Notifications Link */}
                <Link 
                  to="/notifications" 
                  className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-primary/5 relative transition-colors"
                  title="Notificações"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {/* Avatar Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    onBlur={() => setTimeout(() => setShowProfileDropdown(false), 200)}
                    className="flex items-center gap-2 focus:outline-none p-1 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-white font-bold flex items-center justify-center text-sm shadow-inner uppercase">
                      {userInitial}
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-semibold text-gray-700 leading-tight">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-[10px] text-primary/80 uppercase font-semibold">
                        {user.role === 'worker' ? 'Prestador' : user.role === 'employer' ? 'Contratante' : 'Administrador'}
                      </p>
                    </div>
                  </button>

                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-xl border border-gray-100 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                        <p className="text-xs text-gray-400 truncate">{user.email}</p>
                        <span className={`inline-flex items-center px-1.5 py-0.5 mt-1 rounded text-[10px] font-medium ${
                          user.is_verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {user.is_verified ? '✓ Verificado' : '⚠️ Não verificado'}
                        </span>
                      </div>

                      <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary">
                        <LayoutDashboard size={16} /> Meu Painel
                      </Link>

                      <Link to="/profile/me" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-primary/5 hover:text-primary">
                        <UserIcon size={16} /> Ver Perfil Público
                      </Link>

                      {user.role === 'admin' && (
                        <div className="border-t border-gray-50 my-1">
                          <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50">
                            <Shield size={16} /> Moderação Admin
                          </Link>
                        </div>
                      )}

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left text-gray-700 hover:bg-red-50 hover:text-red-650 border-t border-gray-50"
                      >
                        <LogOut size={16} /> Sair da Conta
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                  Aceder
                </Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors">
                  Registar-se
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu */}
          <div className="flex items-center md:hidden">
            {user && (
              <Link 
                to="/notifications" 
                className="p-2 text-gray-500 hover:text-primary rounded-full hover:bg-primary/5 relative mr-1 transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white bg-red-500 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            
            <button
              onClick={toggleMenu}
              className="p-2 rounded-lg text-gray-500 hover:bg-primary/5 hover:text-primary focus:outline-none transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer menu */}
      {isOpen && (
        <div className="md:hidden border-t border-gray-150 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {renderNavLinks(true)}
          </div>
          
          <div className="pt-4 pb-3 border-t border-gray-150">
            {user ? (
              <div className="px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-white font-bold flex items-center justify-center text-base shadow-sm">
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-gray-800">{user.first_name} {user.last_name}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="mt-4 space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-primary/5 hover:text-primary rounded-lg"
                  >
                    Meu Painel
                  </Link>
                  <Link
                    to="/profile/me"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-primary/5 hover:text-primary rounded-lg"
                  >
                    Meu Perfil
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-2 text-base font-medium text-gray-600 hover:bg-primary/5 hover:text-primary rounded-lg"
                  >
                    Mensagens
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left block px-3 py-2 text-base font-medium text-red-650 hover:bg-red-50 rounded-lg"
                  >
                    Terminar Sessão
                  </button>
                </div>
              </div>
            ) : (
              <div className="px-4 flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-base font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Aceder
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2.5 text-base font-medium text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm transition-colors"
                >
                  Registar-se
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
