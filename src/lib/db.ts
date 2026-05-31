import Dexie, { type Table } from 'dexie';

export interface Profile {
  id: string; // uuid
  username: string;
  password: string;
  email: string;
  full_name: string;
  role: 'admin' | 'player';
  created_at: string;
}

export interface Player {
  id: string;
  profile_id: string;
  nickname: string;
  real_name: string;
  discord?: string;
  telegram?: string;
  notes?: string;
  status: 'active' | 'inactive' | 'banned';
  created_at: string;
}

export interface Deal {
  id: string;
  player_id: string;
  backer_share: number;
  player_share: number;
  makeup_enabled: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
}

export interface StakeLevel {
  id: string;
  name: string;
  small_blind: number;
  big_blind: number;
  max_buyin: number;
  required_bankroll: number;
  move_up_threshold?: number;
  move_down_threshold?: number;
  max_tables?: number;
  stop_loss?: number;
  created_at: string;
}

export interface PlayerStake {
  id: string;
  player_id: string;
  stake_level_id: string;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  current_primary_stake: boolean;
}

export interface Session {
  id: string;
  player_id: string;
  date: string;
  start_time: string;
  end_time: string;
  site: string;
  game_format: string;
  stake_level_id: string;
  buy_in: number;
  cash_out: number;
  rakeback: number;
  bonus: number;
  profit: number;
  notes?: string;
  created_at: string;
}

export interface BankrollTransaction {
  id: string;
  player_id: string;
  type: 'deposit' | 'withdrawal' | 'adjustment';
  amount: number;
  notes?: string;
  created_at: string;
}

export interface MakeupHistory {
  id: string;
  player_id: string;
  session_id: string;
  old_makeup: number;
  new_makeup: number;
  created_at: string;
}

export class PokerStakingDB extends Dexie {
  profiles!: Table<Profile>;
  players!: Table<Player>;
  deals!: Table<Deal>;
  stakeLevels!: Table<StakeLevel>;
  playerStakes!: Table<PlayerStake>;
  sessions!: Table<Session>;
  bankrollTransactions!: Table<BankrollTransaction>;
  makeupHistory!: Table<MakeupHistory>;

  constructor() {
    super('PokerStakingDB');
    this.version(2).stores({
      profiles: 'id, role, email, username',
      players: 'id, profile_id, status',
      deals: 'id, player_id',
      stakeLevels: 'id, name',
      playerStakes: 'id, player_id, stake_level_id',
      sessions: 'id, player_id, date, stake_level_id',
      bankrollTransactions: 'id, player_id, type',
      makeupHistory: 'id, player_id, session_id'
    });
  }
}

export const db = new PokerStakingDB();

// Mock Auth system to simulate Supabase login
export const AuthStore = {
  getUser: () => {
    const userJson = localStorage.getItem('mock_user');
    return userJson ? JSON.parse(userJson) as Profile : null;
  },
  login: async (username: string, password: string) => {
    const user = await db.profiles.where('username').equals(username).first();
    if (user && user.password === password) {
      localStorage.setItem('mock_user', JSON.stringify(user));
      return user;
    }
    return null;
  },
  logout: () => {
    localStorage.removeItem('mock_user');
  }
};

// Seed DB for preview
export async function seedDatabase() {
  const count = await db.profiles.count();
  if (count === 0) {
    const adminId = crypto.randomUUID();
    const playerId = crypto.randomUUID();
    const playerRecordId = crypto.randomUUID();
    const stakeId1 = crypto.randomUUID();
    const stakeId2 = crypto.randomUUID();

    await db.profiles.bulkAdd([
      { id: adminId, username: 'tuongduong', password: '123456', email: 'admin@backer.com', full_name: 'Tuong Duong', role: 'admin', created_at: new Date().toISOString() },
      { id: playerId, username: 'player1', password: '123456', email: 'player@grinder.com', full_name: 'Daniel Negreanu', role: 'player', created_at: new Date().toISOString() }
    ]);

    await db.players.add({
      id: playerRecordId,
      profile_id: playerId,
      nickname: 'DNegs',
      real_name: 'Daniel Negreanu',
      status: 'active',
      created_at: new Date().toISOString()
    });

    await db.deals.add({
      id: crypto.randomUUID(),
      player_id: playerRecordId,
      backer_share: 50,
      player_share: 50,
      makeup_enabled: true,
      start_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    await db.stakeLevels.bulkAdd([
      { id: stakeId1, name: 'NL50', small_blind: 0.25, big_blind: 0.50, max_buyin: 50, required_bankroll: 2500, move_up_threshold: 20, move_down_threshold: -10, stop_loss: 5, created_at: new Date().toISOString() },
      { id: stakeId2, name: 'NL100', small_blind: 0.50, big_blind: 1.00, max_buyin: 100, required_bankroll: 5000, move_up_threshold: 20, move_down_threshold: -10, stop_loss: 5, created_at: new Date().toISOString() }
    ]);

    await db.playerStakes.add({
      id: crypto.randomUUID(),
      player_id: playerRecordId,
      stake_level_id: stakeId1,
      approved: true,
      current_primary_stake: true
    });

    await db.bankrollTransactions.add({
       id: crypto.randomUUID(),
       player_id: playerRecordId,
       type: 'deposit',
       amount: 3000,
       notes: 'Initial stake',
       created_at: new Date().toISOString()
    });
  }
}
