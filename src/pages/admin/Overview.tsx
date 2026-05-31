import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { DollarSign, Users, Activity, TrendingDown } from 'lucide-react';
import { formatCurrency as formatC } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Overview() {
  const playersCount = useLiveQuery(() => db.players.count(), []) || 0;
  const sessions = useLiveQuery(() => db.sessions.toArray(), []) || [];
  
  const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0);
  const totalLoss = sessions.filter(s => s.profit < 0).reduce((acc, s) => acc + s.profit, 0);
  
  // Just mock makeup for demo
  const currentMakeup = Math.abs(totalLoss); 

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Players</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{playersCount}</div>
            <p className="text-[10px] text-slate-500 mt-1">Active grinders</p>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatC(totalProfit)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Lifetime across all players</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Sessions</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{sessions.length}</div>
            <p className="text-[10px] text-slate-500 mt-1">Tracked cash game sessions</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Makeup</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono text-red-400">{formatC(currentMakeup)}</div>
            <p className="text-[10px] text-slate-500 mt-1">Estimated uncleared makeup</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Recent Sessions & Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
             <div className="h-[200px] w-full mb-4">
                {sessions.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={sessions.slice(0, 30).reverse()} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                      <Area type="monotone" dataKey="profit" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500">No chart data</div>
                )}
             </div>
             
             <div className="mt-4 border-t border-slate-700 pt-4 space-y-4">
               {sessions.slice(0, 5).map(session => (
                  <div key={session.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{session.site} - {session.game_format}</p>
                      <p className="text-xs text-slate-500">{new Date(session.date).toLocaleDateString()}</p>
                    </div>
                    <div className={`font-mono font-medium ${session.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {session.profit > 0 ? '+' : ''}{formatC(session.profit)}
                    </div>
                  </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
