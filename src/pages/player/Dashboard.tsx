import { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, PlusCircle, History, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/db';
import PlayerOverview from './Overview';
import NewSession from './NewSession';
import PlayerHistory from './PlayerHistory';
import PlayerProfile from './PlayerProfile';

const navItems = [
  { href: '/player', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/player/new-session', label: 'Log Session', icon: PlusCircle },
  { href: '/player/history', label: 'History', icon: History },
  { href: '/player/profile', label: 'Profile', icon: User },
];

export default function PlayerDashboard({ user, onLogout }: { user: Profile, onLogout: () => void }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900">
          ♠
        </div>
        <h2 className="font-bold tracking-tight text-white uppercase text-sm">Grinder Portal</h2>
        <button className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
      </div>
      <div className="px-6 pb-2 pt-4">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest">{user.email}</p>
      </div>
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-sm font-medium",
                isActive ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-400 hover:text-slate-200 hover:bg-slate-700"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-slate-700 bg-slate-900/50">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      <aside className="w-64 border-r border-slate-700 bg-slate-800 flex-col hidden md:flex">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-slate-800 border-r border-slate-700 flex flex-col z-10">
            {sidebar}
          </aside>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden flex items-center gap-3 p-4 border-b border-slate-700 bg-slate-800">
          <button onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5 text-slate-300" /></button>
          <span className="font-bold text-white text-sm uppercase">Grinder Portal</span>
        </div>
        <div className="p-4 md:p-8">
          <Routes>
            <Route path="/" element={<PlayerOverview user={user} />} />
            <Route path="/new-session" element={<NewSession user={user} />} />
            <Route path="/history" element={<PlayerHistory user={user} />} />
            <Route path="/profile" element={<PlayerProfile user={user} />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
