import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency as formatC } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Reports() {
  const data = useLiveQuery(async () => {
    const players = await db.players.toArray();
    const sessions = await db.sessions.toArray();
    const stakes = await db.stakeLevels.toArray();

    const playerStats = await Promise.all(players.map(async (p) => {
      const pSessions = sessions.filter(s => s.player_id === p.id);
      const profit = pSessions.reduce((a, s) => a + s.profit, 0);
      const wins = pSessions.filter(s => s.profit > 0).length;
      return { name: p.nickname, sessions: pSessions.length, profit, winRate: pSessions.length > 0 ? Math.round(wins / pSessions.length * 100) : 0 };
    }));

    const bySite: Record<string, number> = {};
    const byStake: Record<string, number> = {};
    const byMonth: Record<string, number> = {};

    for (const s of sessions) {
      bySite[s.site] = (bySite[s.site] || 0) + s.profit;
      const stake = stakes.find(st => st.id === s.stake_level_id);
      const stakeName = stake?.name || 'Unknown';
      byStake[stakeName] = (byStake[stakeName] || 0) + s.profit;
      const month = s.date.substring(0, 7);
      byMonth[month] = (byMonth[month] || 0) + s.profit;
    }

    const siteData = Object.entries(bySite).map(([name, value]) => ({ name, value: Math.abs(value), profit: value }));
    const stakeData = Object.entries(byStake).map(([name, profit]) => ({ name, profit }));
    const monthData = Object.entries(byMonth).sort().map(([name, profit]) => ({ name, profit }));

    const totalProfit = sessions.reduce((a, s) => a + s.profit, 0);
    const totalSessions = sessions.length;
    const avgProfit = totalSessions > 0 ? totalProfit / totalSessions : 0;

    return { playerStats, siteData, stakeData, monthData, totalProfit, totalSessions, avgProfit };
  }, []);

  if (!data) return <div className="text-slate-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Reports</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Profit</p>
            <p className={`text-2xl font-bold font-mono ${data.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(data.totalProfit)}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Total Sessions</p>
            <p className="text-2xl font-bold font-mono text-white">{data.totalSessions}</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardContent className="pt-4">
            <p className="text-[10px] uppercase font-bold text-slate-500">Avg Profit/Session</p>
            <p className={`text-2xl font-bold font-mono ${data.avgProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(data.avgProfit)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Monthly Profit</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px]">
              {data.monthData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.monthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-500">No data</div>}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Profit by Site</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[250px]">
              {data.siteData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data.siteData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name }) => name}>
                      {data.siteData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} formatter={(_, __, props) => [formatC(props.payload.profit), 'Profit']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="h-full flex items-center justify-center text-slate-500">No data</div>}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Player Performance</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {data.playerStats.map(p => (
              <div key={p.name} className="bg-slate-900 rounded-lg p-4 border border-slate-700">
                <p className="font-bold text-white mb-2">{p.name}</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Sessions</p>
                    <p className="font-mono text-sm text-white">{p.sessions}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Profit</p>
                    <p className={`font-mono text-sm ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(p.profit)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase">Win Rate</p>
                    <p className="font-mono text-sm text-blue-400">{p.winRate}%</p>
                  </div>
                </div>
              </div>
            ))}
            {data.playerStats.length === 0 && <p className="text-slate-500">No players.</p>}
          </div>
        </CardContent>
      </Card>

      {data.stakeData.length > 0 && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Profit by Stake Level</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.stakeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }} />
                  <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
