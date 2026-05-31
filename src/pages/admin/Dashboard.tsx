import { useState } from 'react';
import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Trophy, Activity, ClipboardList, Wallet, LogOut, FileText, Settings, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import Overview from './Overview';
import Players from './Players';
import Sessions from './Sessions';
import StakeLevels from './StakeLevels';
import Makeup from './Makeup';
import Bankroll from './Bankroll';
import Reports from './Reports';
import AdminSettings from './AdminSettings';

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
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = (
    <>
      <div className="p-6 border-b border-slate-700 flex items-center gap-3">
        <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center font-bold text-slate-900">
          <Trophy className="h-5 w-5" />
        </div>
        <h2 className="font-bold tracking-tight text-white uppercase text-sm">Backer Panel</h2>
        <button className="ml-auto md:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5 text-slate-400" /></button>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
          <span className="font-bold text-white text-sm uppercase">Backer Panel</span>
        </div>
        <div className="p-4 md:p-8">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/players" element={<Players />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/stakes" element={<StakeLevels />} />
            <Route path="/makeup" element={<Makeup />} />
            <Route path="/bankroll" element={<Bankroll />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<AdminSettings />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
