/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { OffersList } from './pages/OffersList';
import { WorkersList } from './pages/WorkersList';
import { Dashboard } from './pages/Dashboard';
import { ProfileDetail } from './pages/ProfileDetail';
import { Messages } from './pages/Messages';
import { Notifications } from './pages/Notifications';

function AppContent() {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F3F7FA] flex items-center justify-center">
        <div className="text-center font-sans">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold text-xl shadow-md mx-auto mb-4 animate-bounce">
            S+
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            A carregar ServiPlus...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans antialiased bg-[#F3F7FA] text-gray-800">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/offers" element={<OffersList />} />
          <Route path="/offers/:offerId" element={<OffersList />} />
          <Route path="/workers" element={<WorkersList />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile/:userId" element={<ProfileDetail />} />
          <Route path="/profile/me" element={<ProfileDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </HashRouter>
  );
}

