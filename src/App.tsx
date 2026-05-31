/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { AuthStore, seedDatabase, type Profile } from './lib/db';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import PlayerDashboard from './pages/player/Dashboard';

export default function App() {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Seed db on load and check auth
    seedDatabase().then(() => {
      const u = AuthStore.getUser();
      setUser(u);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="dark bg-slate-900 text-slate-200 min-h-screen font-sans selection:bg-emerald-500/30">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/player') : '/login'} replace />} />
          <Route path="/login" element={<Login onLogin={setUser} />} />
          
          {/* Admin Routes */}
          {user?.role === 'admin' && (
            <Route path="/admin/*" element={<AdminDashboard onLogout={() => { AuthStore.logout(); setUser(null); }} />} />
          )}

          {/* Player Routes */}
          {user?.role === 'player' && (
            <Route path="/player/*" element={<PlayerDashboard user={user} onLogout={() => { AuthStore.logout(); setUser(null); }} />} />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

