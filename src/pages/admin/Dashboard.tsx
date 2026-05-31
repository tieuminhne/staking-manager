import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Activity, ClipboardList, Wallet, LogOut, FileText, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Overview from './Overview';
import Players from './Players';
import Sessions from './Sessions';

const navItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/players', label: 'Players', icon: Users },
  { href: '/admin/stakes', label: 'Stake Levels', icon: Trophy },
  { href: '/admin/sessions', label: 'Sessions', icon: Activity },
  { href: '/admin/makeup', label: 'Makeup', icon: ClipboardList },
  { href: '/admin/bankroll', label: 'Bankroll', icon: Wallet },
  { href: '/admin/reports', label: 'Reports', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-700 bg-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-700 flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900">
            <Trophy className="h-5 w-5" />
          </div>
          <h2 className="font-bold tracking-tight text-white uppercase text-sm">Backer Panel</h2>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
      <main className="flex-1 overflow-y-auto p-8">
        <Routes>
          <Route path="/" element={<Overview />} />
          <Route path="/players" element={<Players />} />
          <Route path="/sessions" element={<Sessions />} />
          <Route path="*" element={<div className="text-slate-400">Not implemented in demo.</div>} />
        </Routes>
      </main>
    </div>
  );
}
