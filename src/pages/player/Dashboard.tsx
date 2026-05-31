import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut, PlusCircle, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Profile } from '@/lib/db';
import PlayerOverview from './Overview';
import NewSession from './NewSession';

const navItems = [
  { href: '/player', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/player/new-session', label: 'Log Session', icon: PlusCircle },
  { href: '/player/history', label: 'History', icon: History },
  { href: '/player/profile', label: 'Profile', icon: User },
];

export default function PlayerDashboard({ user, onLogout }: { user: Profile, onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900">
            ♠
          </div>
          <h2 className="font-bold tracking-tight text-white uppercase text-sm">Grinder Portal</h2>
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
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <Routes>
          <Route path="/" element={<PlayerOverview user={user} />} />
          <Route path="/new-session" element={<NewSession user={user} />} />
          <Route path="*" element={<div className="text-slate-400">Not implemented in demo.</div>} />
        </Routes>
      </main>
    </div>
  );
}
