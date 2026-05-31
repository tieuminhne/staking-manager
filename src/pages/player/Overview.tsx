import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db, type Profile } from '@/lib/db';
import { DollarSign, Activity, TrendingDown, Target } from 'lucide-react';
import { formatCurrency as formatC } from '@/lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PlayerOverview({ user }: { user: Profile }) {
  const player = useLiveQuery(() => db.players.where('profile_id').equals(user.id).first(), [user.id]);
  const sessions = useLiveQuery(() => player ? db.sessions.where('player_id').equals(player.id).toArray() : [], [player?.id]) || [];
  const deal = useLiveQuery(() => player ? db.deals.where('player_id').equals(player.id).first() : undefined, [player?.id]);
  const primaryStakeInfo = useLiveQuery(async () => {
    if (!player) return null;
    const stakeLink = await db.playerStakes.where('player_id').equals(player.id).and(s => s.current_primary_stake).first();
    if (!stakeLink) return null;
    return await db.stakeLevels.get(stakeLink.stake_level_id);
  }, [player?.id]);

  const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0);

  const sortedSessions = [...sessions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let currentMakeup = 0;
  if (deal?.makeup_enabled) {
    for (const s of sortedSessions) {
      if (s.profit < 0) currentMakeup += Math.abs(s.profit);
      else currentMakeup = Math.max(0, currentMakeup - s.profit);
    }
  }

  const chartData = sortedSessions.slice(-20).reduce((acc: { date: string; cumulative: number }[], s) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].cumulative : 0;
    acc.push({ date: s.date, cumulative: prev + s.profit });
    return acc;
  }, []);

  const recentSessions = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

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
             <div className={`text-2xl font-bold font-mono ${currentMakeup > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatC(currentMakeup)}</div>
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

      {deal && (
        <div className="flex gap-4 flex-wrap">
          <div className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2">
            <span className="text-[10px] text-slate-500 uppercase">Deal</span>
            <span className="ml-2 font-mono text-white text-sm">{deal.backer_share}/{deal.player_share}</span>
          </div>
          {totalProfit > 0 && currentMakeup === 0 && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2">
              <span className="text-[10px] text-emerald-400 uppercase">Your share: </span>
              <span className="font-mono text-emerald-400 text-sm font-bold">{formatC(totalProfit * deal.player_share / 100)}</span>
            </div>
          )}
        </div>
      )}

      {chartData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Profit Trend</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorProfitPlayer" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="cumulative" stroke="#10b981" fillOpacity={1} fill="url(#colorProfitPlayer)" name="Cumulative P&L" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <h2 className="text-sm font-bold text-white uppercase tracking-tight mt-8 mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {recentSessions.map(s => (
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
