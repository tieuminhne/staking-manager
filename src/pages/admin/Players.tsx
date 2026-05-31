import type React from 'react';
import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Player, type Deal } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export default function Players() {
  const players = useLiveQuery(() => db.players.toArray(), []) || [];
  const deals = useLiveQuery(() => db.deals.toArray(), []) || [];
  const stakeLevels = useLiveQuery(() => db.stakeLevels.toArray(), []) || [];
  const playerStakes = useLiveQuery(() => db.playerStakes.toArray(), []) || [];

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Player | null>(null);
  const [nickname, setNickname] = useState('');
  const [realName, setRealName] = useState('');
  const [email, setEmail] = useState('');
  const [discord, setDiscord] = useState('');
  const [telegram, setTelegram] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'inactive' | 'banned'>('active');
  const [backerShare, setBackerShare] = useState('50');
  const [playerShare, setPlayerShare] = useState('50');
  const [makeupEnabled, setMakeupEnabled] = useState(true);
  const [selectedStakes, setSelectedStakes] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState('');

  const resetForm = () => {
    setNickname(''); setRealName(''); setEmail(''); setDiscord(''); setTelegram('');
    setNotes(''); setStatus('active'); setBackerShare('50'); setPlayerShare('50');
    setMakeupEnabled(true); setSelectedStakes([]); setEditing(null); setShowForm(false);
  };

  const openEdit = (p: Player) => {
    setEditing(p);
    setNickname(p.nickname);
    setRealName(p.real_name);
    setDiscord(p.discord || '');
    setTelegram(p.telegram || '');
    setNotes(p.notes || '');
    setStatus(p.status);
    const deal = deals.find(d => d.player_id === p.id);
    setBackerShare(deal ? String(deal.backer_share) : '50');
    setPlayerShare(deal ? String(deal.player_share) : '50');
    setMakeupEnabled(deal?.makeup_enabled ?? true);
    const stakes = playerStakes.filter(ps => ps.player_id === p.id).map(ps => ps.stake_level_id);
    setSelectedStakes(stakes);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await db.players.update(editing.id, {
        nickname, real_name: realName, discord: discord || undefined,
        telegram: telegram || undefined, notes: notes || undefined, status
      });
      const existingDeal = deals.find(d => d.player_id === editing.id);
      if (existingDeal) {
        await db.deals.update(existingDeal.id, {
          backer_share: parseInt(backerShare), player_share: parseInt(playerShare), makeup_enabled: makeupEnabled
        });
      }
      await db.playerStakes.where('player_id').equals(editing.id).delete();
      for (const stakeId of selectedStakes) {
        await db.playerStakes.add({
          id: crypto.randomUUID(), player_id: editing.id, stake_level_id: stakeId,
          approved: true, current_primary_stake: selectedStakes.indexOf(stakeId) === 0
        });
      }
    } else {
      const profileId = crypto.randomUUID();
      const playerId = crypto.randomUUID();
      await db.profiles.add({
        id: profileId, email: email || `${nickname.toLowerCase()}@player.com`,
        full_name: realName || nickname, role: 'player', created_at: new Date().toISOString()
      });
      await db.players.add({
        id: playerId, profile_id: profileId, nickname, real_name: realName,
        discord: discord || undefined, telegram: telegram || undefined,
        notes: notes || undefined, status, created_at: new Date().toISOString()
      });
      await db.deals.add({
        id: crypto.randomUUID(), player_id: playerId,
        backer_share: parseInt(backerShare), player_share: parseInt(playerShare),
        makeup_enabled: makeupEnabled, start_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
      for (const stakeId of selectedStakes) {
        await db.playerStakes.add({
          id: crypto.randomUUID(), player_id: playerId, stake_level_id: stakeId,
          approved: true, current_primary_stake: selectedStakes.indexOf(stakeId) === 0
        });
      }
    }
    resetForm();
  };

  const handleDelete = async (p: Player) => {
    if (confirm(`Delete player "${p.nickname}" and all their data?`)) {
      await db.sessions.where('player_id').equals(p.id).delete();
      await db.deals.where('player_id').equals(p.id).delete();
      await db.playerStakes.where('player_id').equals(p.id).delete();
      await db.bankrollTransactions.where('player_id').equals(p.id).delete();
      await db.makeupHistory.where('player_id').equals(p.id).delete();
      await db.profiles.delete(p.profile_id);
      await db.players.delete(p.id);
    }
  };

  const toggleStake = (id: string) => {
    setSelectedStakes(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const filtered = filterStatus ? players.filter(p => p.status === filterStatus) : players;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold tracking-tight text-white uppercase">Players Management</h1>
        <div className="flex items-center gap-3">
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-slate-700 bg-slate-900 px-3 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="banned">Banned</option>
          </select>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">
            + ADD PLAYER
          </button>
        </div>
      </div>

      {showForm && (
        <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
          <CardHeader className="border-b border-slate-700 pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">{editing ? 'Edit' : 'New'} Player</CardTitle>
            <button onClick={resetForm}><X className="h-4 w-4 text-slate-400 hover:text-white" /></button>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Nickname *</Label>
                  <Input value={nickname} onChange={e => setNickname(e.target.value)} required className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Real Name</Label>
                  <Input value={realName} onChange={e => setRealName(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                </div>
                {!editing && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Email (login)</Label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="player@email.com" className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                  </div>
                )}
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Discord</Label>
                  <Input value={discord} onChange={e => setDiscord(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Telegram</Label>
                  <Input value={telegram} onChange={e => setTelegram(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-400">Status</Label>
                  <select value={status} onChange={e => setStatus(e.target.value as 'active' | 'inactive' | 'banned')} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="banned">Banned</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Notes</Label>
                <Input value={notes} onChange={e => setNotes(e.target.value)} className="bg-slate-900 border-slate-700 focus-visible:ring-emerald-500" />
              </div>

              <div className="border-t border-slate-700 pt-4">
                <p className="text-xs font-bold text-slate-400 uppercase mb-3">Deal Terms</p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Backer Share %</Label>
                    <Input type="number" value={backerShare} onChange={e => { setBackerShare(e.target.value); setPlayerShare(String(100 - (parseInt(e.target.value) || 0))); }} className="bg-slate-900 border-slate-700 font-mono focus-visible:ring-emerald-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Player Share %</Label>
                    <Input type="number" value={playerShare} disabled className="bg-slate-900 border-slate-700 font-mono text-slate-500" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Makeup</Label>
                    <select value={makeupEnabled ? 'yes' : 'no'} onChange={e => setMakeupEnabled(e.target.value === 'yes')} className="flex h-10 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </div>
                </div>
              </div>

              {stakeLevels.length > 0 && (
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-3">Approved Stakes</p>
                  <div className="flex flex-wrap gap-2">
                    {stakeLevels.map(sl => (
                      <button key={sl.id} type="button" onClick={() => toggleStake(sl.id)}
                        className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                          selectedStakes.includes(sl.id) ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border border-slate-700 text-slate-400 hover:text-white'
                        }`}>{sl.name}</button>
                    ))}
                  </div>
                </div>
              )}

              <Button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-900/20">
                {editing ? 'UPDATE' : 'CREATE'} PLAYER
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-slate-800 border-slate-700 rounded-lg shadow-none">
        <CardHeader className="border-b border-slate-700 pb-4">
          <CardTitle className="text-sm font-bold text-white uppercase tracking-tight">Players ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nickname</TableHead>
                <TableHead>Real Name</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 h-24">No players found.</TableCell>
                </TableRow>
              ) : (
                filtered.map(player => {
                  const deal = deals.find(d => d.player_id === player.id);
                  return (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium text-white">{player.nickname}</TableCell>
                      <TableCell className="text-slate-300">{player.real_name || '-'}</TableCell>
                      <TableCell className="text-slate-400 text-xs font-mono">
                        {deal ? `${deal.backer_share}/${deal.player_share}` : '-'}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wider ${
                          player.status === 'active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                          player.status === 'banned' ? 'bg-red-500/10 border border-red-500/20 text-red-400' :
                          'bg-slate-800 border border-slate-700 text-slate-400'
                        }`}>
                          {player.status.toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-400">{new Date(player.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-3">
                        <button onClick={() => openEdit(player)} className="text-blue-400 hover:text-blue-300 text-sm">Edit</button>
                        <button onClick={() => handleDelete(player)} className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
