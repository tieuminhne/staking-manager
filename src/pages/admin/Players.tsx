import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from 'lucide-react';

export default function Players() {
  const players = useLiveQuery(() => db.players.toArray(), []) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Players Management</h1>
        <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">
          + ADD PLAYER
        </button>
      </div>

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Active Players</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Real Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {players.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 h-24">No players found.</TableCell>
                </TableRow>
              ) : (
                players.map(player => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium text-white">{player.nickname}</TableCell>
                    <TableCell className="text-slate-300">{player.real_name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                        player.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border border-slate-700 text-slate-400'
                      }`}>
                        {player.status.toUpperCase()}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-400">{new Date(player.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <button className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
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
