import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency as formatC } from '@/lib/utils';
import { useState } from 'react';

export default function Sessions() {
  const sessions = useLiveQuery(async () => {
    const s = await db.sessions.orderBy('date').reverse().toArray();
    
    // Join logic to get player nickname
    const enhanced = await Promise.all(s.map(async (session) => {
      const player = await db.players.get(session.player_id);
      return { ...session, playerNickname: player?.nickname || 'Unknown' };
    }));
    return enhanced;
  }, []) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Sessions Ledger</h1>
      </div>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">All Sessions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Player</TableHead>
                <TableHead>Site / Game</TableHead>
                <TableHead className="text-right">Buy In</TableHead>
                <TableHead className="text-right">Cash Out</TableHead>
                <TableHead className="text-right">Net Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sessions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 h-24">No sessions recorded yet.</TableCell>
                </TableRow>
              ) : (
                sessions.map(session => (
                  <TableRow key={session.id}>
                    <TableCell className="text-slate-300">{new Date(session.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-white">{session.playerNickname}</TableCell>
                    <TableCell className="text-slate-300">{session.site} • {session.game_format}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(session.buy_in)}</TableCell>
                    <TableCell className="text-right text-slate-400 font-mono">{formatC(session.cash_out)}</TableCell>
                    <TableCell className={`text-right font-medium font-mono ${session.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {session.profit > 0 ? '+' : ''}{formatC(session.profit)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
