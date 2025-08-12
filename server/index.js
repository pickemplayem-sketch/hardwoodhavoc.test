
import express from 'express';
import cors from 'cors';
import cookieSession from 'cookie-session';
import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(cors({
  origin: true,
  credentials: true
}));

const SESSION_SECRET = process.env.SESSION_SECRET || 'devsecret';
app.use(cookieSession({
  name: 'session',
  secret: SESSION_SECRET,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  sameSite: 'lax'
}));

const dbPath = path.join(__dirname, 'app.db');
const db = new Database(dbPath);

function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      password TEXT,
      display_name TEXT,
      team_name TEXT,
      role TEXT CHECK(role IN ('admin','player')) NOT NULL DEFAULT 'player',
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS teams (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      tiebreaker INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS picks (
      id TEXT PRIMARY KEY,
      team_id TEXT,
      player_id TEXT,
      sort_order INTEGER DEFAULT 0,
      active_rounds TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
}
initDb();

function getConfig(key, fallback=null) {
  const row = db.prepare('SELECT value FROM config WHERE key=?').get(key);
  if (!row) return fallback;
  try { return JSON.parse(row.value); } catch { return row.value; }
}
function setConfig(key, value) {
  db.prepare('INSERT OR REPLACE INTO config(key,value) VALUES(?,?)')
    .run(key, JSON.stringify(value));
}

function seed() {
  const seeded = getConfig('seeded', false);
  if (seeded) return;
  const now = new Date().toISOString();
  const adminId = nanoid();
  db.prepare('INSERT INTO users(id,email,password,display_name,team_name,role,created_at) VALUES(?,?,?,?,?,?,?)')
    .run(adminId, 'admin@example.com', 'TestAdmin!234', 'CSK', 'Admin Team', 'admin', now);
  const teamId = nanoid();
  db.prepare('INSERT INTO teams(id,user_id,tiebreaker,created_at) VALUES(?,?,?,?)')
    .run(teamId, adminId, 600, now);
  setConfig('seeded', true);
  setConfig('TOURNAMENT_YEAR', parseInt(process.env.TOURNAMENT_YEAR || '2025',10));
  setConfig('GAME_PUBLIC', process.env.GAME_PUBLIC === 'true' ? true : false);
  setConfig('ADMIN_INVITE_CODE', process.env.ADMIN_INVITE_CODE || 'MARCH2025-ADMIN');
  setConfig('PLAYER_INVITE_CODE', process.env.PLAYER_INVITE_CODE || 'MARCH2025');
  setConfig('CURRENT_ROUND', 'R64'); // R64,R32,S16,E8,F4,CH,DONE
}
seed();

// Players data (sample file can be replaced with full dataset later)
const playersPath = path.join(__dirname, 'data', 'players_2025.json');
let players = [];
if (fs.existsSync(playersPath)) {
  players = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
} else {
  players = [];
}

function requireAuth(req,res,next) {
  if (!req.session || !req.session.userId) return res.status(401).json({error:'unauthorized'});
  next();
}
function requireAdmin(req,res,next) {
  if (!req.session || !req.session.userId) return res.status(401).json({error:'unauthorized'});
  const row = db.prepare('SELECT role FROM users WHERE id=?').get(req.session.userId);
  if (!row || row.role !== 'admin') return res.status(403).json({error:'forbidden'});
  next();
}

// Auth
app.post('/api/register', (req,res)=>{
  const { email, password, displayName, teamName, inviteCode } = req.body;
  const gamePublic = !!getConfig('GAME_PUBLIC', false);
  const playerCode = getConfig('PLAYER_INVITE_CODE', 'MARCH2025');
  const adminCode = getConfig('ADMIN_INVITE_CODE', 'MARCH2025-ADMIN');

  if (!gamePublic) {
    if (!inviteCode) return res.status(400).json({error:'inviteCode required'});
    if (![playerCode, adminCode].includes(inviteCode)) return res.status(400).json({error:'invalid inviteCode'});
  }
  const role = inviteCode === adminCode ? 'admin' : 'player';
  const id = nanoid();
  const now = new Date().toISOString();
  try {
    db.prepare('INSERT INTO users(id,email,password,display_name,team_name,role,created_at) VALUES(?,?,?,?,?,?,?)')
      .run(id, email, password, displayName, teamName, role, now);
    const teamId = nanoid();
    db.prepare('INSERT INTO teams(id,user_id,tiebreaker,created_at) VALUES(?,?,?,?)')
      .run(teamId, id, null, now);
    req.session.userId = id;
    res.json({ok:true, role});
  } catch (e) {
    res.status(400).json({error: 'email already used? ' + e.message});
  }
});

app.post('/api/login', (req,res)=>{
  const { email, password } = req.body;
  const row = db.prepare('SELECT id,password FROM users WHERE email=?').get(email);
  if (!row || row.password !== password) return res.status(400).json({error:'invalid credentials'});
  req.session.userId = row.id;
  res.json({ok:true});
});

app.post('/api/logout', (req,res)=>{
  req.session = null;
  res.json({ok:true});
});

app.get('/api/me', (req,res)=>{
  if (!req.session || !req.session.userId) return res.json({user:null});
  const u = db.prepare('SELECT id,email,display_name,team_name,role FROM users WHERE id=?').get(req.session.userId);
  res.json({user:u, config:{
    TOURNAMENT_YEAR:getConfig('TOURNAMENT_YEAR',2025),
    CURRENT_ROUND:getConfig('CURRENT_ROUND','R64'),
    GAME_PUBLIC:getConfig('GAME_PUBLIC',false)
  }});
});

// Config + Admin
app.get('/api/config', (req,res)=>{
  res.json({
    TOURNAMENT_YEAR:getConfig('TOURNAMENT_YEAR',2025),
    CURRENT_ROUND:getConfig('CURRENT_ROUND','R64'),
    GAME_PUBLIC:getConfig('GAME_PUBLIC',false)
  });
});

app.post('/api/admin/togglePublic', requireAdmin, (req,res)=>{
  const { value } = req.body;
  setConfig('GAME_PUBLIC', !!value);
  res.json({ok:true, GAME_PUBLIC:getConfig('GAME_PUBLIC',false)});
});

app.post('/api/admin/advanceRound', requireAdmin, (req,res)=>{
  const order = ['R64','R32','S16','E8','F4','CH','DONE'];
  const current = getConfig('CURRENT_ROUND','R64');
  const idx = order.indexOf(current);
  const next = idx >= 0 && idx < order.length - 1 ? order[idx+1] : 'DONE';
  setConfig('CURRENT_ROUND', next);
  res.json({ok:true, CURRENT_ROUND: next});
});

// Players
app.get('/api/players', (req,res)=>{
  const sorted = [...players].sort((a,b)=> (b.ppg||0) - (a.ppg||0));
  res.json(sorted);
});

// Team & Picks
app.get('/api/team', requireAuth, (req,res)=>{
  const team = db.prepare('SELECT id,tiebreaker FROM teams WHERE user_id=?').get(req.session.userId);
  const picks = db.prepare('SELECT id,player_id,sort_order,active_rounds FROM picks WHERE team_id=? ORDER BY sort_order ASC').all(team.id);
  const mapped = picks.map(p=>{
    return { id:p.id, player_id:p.player_id, sort_order:p.sort_order, active_rounds: JSON.parse(p.active_rounds||'{}') }
  });
  res.json({team, picks:mapped});
});

app.post('/api/team/save', requireAuth, (req,res)=>{
  const { picks, tiebreaker } = req.body; // picks: array of {player_id, sort_order, active_rounds}
  const team = db.prepare('SELECT id FROM teams WHERE user_id=?').get(req.session.userId);
  db.prepare('UPDATE teams SET tiebreaker=? WHERE id=?').run(tiebreaker, team.id);
  db.prepare('DELETE FROM picks WHERE team_id=?').run(team.id);
  const insert = db.prepare('INSERT INTO picks(id,team_id,player_id,sort_order,active_rounds) VALUES(?,?,?,?,?)');
  for (const p of picks) {
    insert.run(nanoid(), team.id, p.player_id, p.sort_order ?? 0, JSON.stringify(p.active_rounds||{}));
  }
  res.json({ok:true});
});

// Leaderboard (sums active players for each round <= CURRENT_ROUND)
function computeTeamScore(teamId) {
  const current = getConfig('CURRENT_ROUND','R64');
  const order = ['R64','R32','S16','E8','F4','CH'];
  const cutoffIdx = order.indexOf(current);
  const roundsIncluded = cutoffIdx >= 0 ? order.slice(0, cutoffIdx+1) : [];

  const picks = db.prepare('SELECT player_id, sort_order, active_rounds FROM picks WHERE team_id=?').all(teamId);
  let total = 0;
  for (const p of picks) {
    const act = JSON.parse(p.active_rounds||'{}');
    for (const r of roundsIncluded) {
      if (act[r]) {
        const pl = players.find(x=>x.id===p.player_id);
        if (pl && pl.round_points && typeof pl.round_points[r] === 'number') {
          total += pl.round_points[r];
        }
      }
    }
  }
  return total;
}

app.get('/api/leaderboard', (req,res)=>{
  const teams = db.prepare(`
    SELECT t.id as team_id, u.display_name, u.team_name, t.tiebreaker
    FROM teams t
    JOIN users u ON u.id = t.user_id
  `).all();
  const rows = teams.map(t=>{
    return {
      display_name: t.display_name,
      team_name: t.team_name,
      tiebreaker: t.tiebreaker,
      score: computeTeamScore(t.team_id)
    }
  }).sort((a,b)=> b.score - a.score);
  res.json(rows);
});

// Serve client build
app.use(express.static(path.join(__dirname, '..', 'client', 'dist')));
app.get('*', (req,res)=>{
  res.sendFile(path.join(__dirname, '..', 'client', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, ()=>{
  console.log('Server running on :' + PORT);
});
