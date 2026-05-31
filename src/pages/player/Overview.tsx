import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db, type Profile, type Player } from '@/lib/db';
import { DollarSign, Activity, TrendingDown, Target } from 'lucide-react';
import { formatCurrency as formatC } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';

export default function PlayerOverview({ user }: { user: Profile }) {
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);
  const sessions = useLiveQuery(() => player ? db.sessions.where('player_id').equals(player.id).toArray() : [], [player?.id]) || [];
  const primaryStakeInfo = useLiveQuery(async () => {
    if (!player) return null;
    const stakeLink = await db.playerStakes.where('player_id').equals(player.id).and(s => s.current_primary_stake).first();
    if (!stakeLink) return null;
    return await db.stakeLevels.get(stakeLink.stake_level_id);
  }, [player?.id]);

  const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0);
  const totalLoss = sessions.filter(s => s.profit < 0).reduce((acc, s) => acc + s.profit, 0);
  
  // Just mock makeup for demo
  const currentMakeup = Math.abs(totalLoss); 

  if (!player) return <div>Loading player data...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Welcome, {player.nickname}</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">My Net Profit</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold font-mono ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatC(totalProfit)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">Total sessions profit</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Current Makeup</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
             <div className="text-2xl font-bold font-mono text-red-400">{formatC(currentMakeup)}</div>
             <p className="text-[10px] text-slate-500 mt-1">To clear before splits</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Primary Stake</CardTitle>
            <Target className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{primaryStakeInfo?.name || 'Unassigned'}</div>
            <p className="text-[10px] text-slate-500 mt-1">Max buy-in: {primaryStakeInfo ? formatC(primaryStakeInfo.max_buyin) : '-'}</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Sessions Played</CardTitle>
            <Activity className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">{sessions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sessions */}
      <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-8 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {sessions.slice().reverse().slice(0, 10).map(s => (
          <Card key={s.id} className="bg-slate-800 border-slate-700 rounded-lg shadow-none hover:bg-slate-800/80 transition-colors">
             <CardContent className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{s.site}</span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-sm text-slate-400">{s.game_format}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Date(s.date).toLocaleDateString()} | {s.start_time} - {s.end_time}
                  </div>
               </div>
               <div className="flex items-center gap-6 text-sm">
                 <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-slate-500">Buy-in</p>
                   <p className="text-slate-300 font-mono">{formatC(s.buy_in)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-slate-500">Cash-out</p>
                   <p className="text-slate-300 font-mono">{formatC(s.cash_out)}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-[10px] uppercase font-bold text-slate-500">Profit</p>
                   <p className={`font-bold font-mono ${s.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                     {s.profit > 0 ? '+' : ''}{formatC(s.profit)}
                   </p>
                 </div>
               </div>
             </CardContent>
          </Card>
        ))}
        {sessions.length === 0 && <p className="text-slate-500">No sessions logged yet.</p>}
      </div>
    </div>
  );
}
