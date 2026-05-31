import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency as formatC } from '@/lib/utils';

export default function Makeup() {
  const data = useLiveQuery(async () => {
    const players = await db.players.toArray();
    const result = await Promise.all(players.map(async (player) => {
      const deal = await db.deals.where('player_id').equals(player.id).first();
      if (!deal || !deal.makeup_enabled) return { player, deal, makeup: 0, sessions: 0, totalProfit: 0, history: [] };
      const sessions = await db.sessions.where('player_id').equals(player.id).toArray();
      const sorted = sessions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      let makeup = 0;
      const history: { date: string; profit: number; oldMakeup: number; newMakeup: number }[] = [];
      for (const s of sorted) {
        const old = makeup;
        if (s.profit < 0) {
          makeup += Math.abs(s.profit);
        } else {
          makeup = Math.max(0, makeup - s.profit);
        }
        history.push({ date: s.date, profit: s.profit, oldMakeup: old, newMakeup: makeup });
      }
      const totalProfit = sessions.reduce((acc, s) => acc + s.profit, 0);
      return { player, deal, makeup, sessions: sessions.length, totalProfit, history };
    }));
    return result;
  }, []) || [];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-white uppercase">Makeup Tracking</h1>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.map(({ player, deal, makeup, sessions, totalProfit }) => (
          <Card key={player.id} className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
            <CardHeader className="border-b border-slate-700 pb-3">
              <CardTitle className="text-sm font-bold text-white">{player.nickname}</CardTitle>
              {deal && (
                <p className="text-[10px] text-slate-500">
                  Deal: {deal.backer_share}/{deal.player_share} | Makeup: {deal.makeup_enabled ? 'ON' : 'OFF'}
                </p>
              )}
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Current Makeup</span>
                <span className={`font-mono font-bold ${makeup > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatC(makeup)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Total Profit</span>
                <span className={`font-mono text-sm ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{formatC(totalProfit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-400">Sessions</span>
                <span className="font-mono text-sm text-white">{sessions}</span>
              </div>
              {deal && totalProfit > 0 && makeup === 0 && (
                <div className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 p-2 rounded">
                  Backer share: {formatC(totalProfit * deal.backer_share / 100)} | Player share: {formatC(totalProfit * deal.player_share / 100)}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {data.length === 0 && <p className="text-slate-500 col-span-full">No players with deals found.</p>}
      </div>

      {data.some(d => d.history.length > 0) && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Makeup History</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Player</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Session P&L</TableHead>
                  <TableHead className="text-right">Makeup Before</TableHead>
                  <TableHead className="text-right">Makeup After</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.flatMap(d => d.history.map((h, i) => (
                  <TableRow key={`${d.player.id}-${i}`}>
                    <TableCell className="font-medium text-white">{d.player.nickname}</TableCell>
                    <TableCell className="text-slate-300">{new Date(h.date).toLocaleDateString()}</TableCell>
                    <TableCell className={`text-right font-mono ${h.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {h.profit > 0 ? '+' : ''}{formatC(h.profit)}
                    </TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(h.oldMakeup)}</TableCell>
                    <TableCell className={`text-right font-mono ${h.newMakeup > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatC(h.newMakeup)}</TableCell>
                  </TableRow>
                )))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
