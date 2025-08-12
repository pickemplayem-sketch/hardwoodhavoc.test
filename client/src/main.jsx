import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import BuildTeam from './pages/BuildTeam.jsx';
import ActivePlayers from './pages/ActivePlayers.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Rules from './pages/Rules.jsx';
import Terms from './pages/Terms.jsx';
import Admin from './pages/Admin.jsx';

function Layout() {
  const [user, setUser] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [agreed, setAgreed] = React.useState(false);
  const [inviteCode, setInviteCode] = React.useState('');
  const [form, setForm] = React.useState({ email:'', password:'', displayName:'', teamName:'' });
  const [mode, setMode] = React.useState('register'); // or 'login'

  React.useEffect(()=>{
    fetch('/api/me', { credentials:'include' }).then(r=>r.json()).then(d=>{
      if (d.user) { setUser(d.user); setConfig(d.config); }
      else { fetch('/api/config').then(r=>r.json()).then(setConfig) }
    });
  },[]);

  function onRegister(e){
    e.preventDefault();
    fetch('/api/register', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'include',
      body: JSON.stringify({ ...form, inviteCode })
    }).then(r=>r.json()).then(d=>{
      if (d.ok){ 
        return fetch('/api/me',{credentials:'include'}).then(r=>r.json()).then(m=>{
          setUser(m.user); setConfig(m.config);
        });
      } else { alert(d.error||'Failed'); }
    });
  }
  function onLogin(e){
    e.preventDefault();
    fetch('/api/login', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ email:form.email, password:form.password })
    }).then(r=>r.json()).then(d=>{
      if (d.ok){ return fetch('/api/me',{credentials:'include'}).then(r=>r.json()).then(m=>{ setUser(m.user); setConfig(m.config); }); }
      else alert(d.error||'Failed');
    });
  }

  function onLogout(){
    fetch('/api/logout',{method:'POST',credentials:'include'}).then(()=>{ setUser(null); setAgreed(false); });
  }

  if (!user){
    const publicMode = config?.GAME_PUBLIC;
    return (
      <div className="shell">
        <header>
          <h2>Pickem, Playem, Survive and Win!</h2>
        </header>
        <div className="hero card">
          <h3>Own March Madness.</h3>
          <p style={{maxWidth:760, lineHeight:1.4}}>
            Draft seven. Activate five. Ride real NCAA Men&apos;s Tournament stats to the top.
            Redraft at the Sweet Sixteen. Outsmart friends. Score bragging rights.
          </p>
          <form onSubmit={mode==='register'?onRegister:onLogin}>
            {!publicMode && (
              <div style={{margin:'10px 0'}}>
                <label>Invite code</label><br/>
                <input value={inviteCode} onChange={e=>setInviteCode(e.target.value)} placeholder="Enter invite code"/>
              </div>
            )}
            {mode==='register' && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div><label>Email</label><br/><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
                <div><label>Password</label><br/><input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
                <div><label>Display name</label><br/><input value={form.displayName} onChange={e=>setForm({...form, displayName:e.target.value})} /></div>
                <div><label>Team name</label><br/><input value={form.teamName} onChange={e=>setForm({...form, teamName:e.target.value})} /></div>
              </div>
            )}
            {mode==='login' && (
              <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
                <div><label>Email</label><br/><input value={form.email} onChange={e=>setForm({...form, email:e.target.value})} /></div>
                <div><label>Password</label><br/><input type="password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} /></div>
              </div>
            )}
            <div style={{marginTop:10}}>
              <label><input type="checkbox" checked={agreed} onChange={e=>setAgreed(e.target.checked)} /> I have read and agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms & Conditions</a>.</label>
            </div>
            <div style={{marginTop:10, display:'flex', gap:8}}>
              <button className="btn" disabled={!agreed} type="submit">{mode==='register'?'Continue':'Log in'}</button>
              <button type="button" className="btn" onClick={()=>setMode(mode==='register'?'login':'register')}>{mode==='register'?'Have an account? Log in':'Need an account? Register'}</button>
            </div>
          </form>
        </div>
        <footer>© PTPP, LLC., St. Louis, Missouri</footer>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="shell">
        <header>
          <h2>Pickem, Playem, Survive and Win!</h2>
          <nav>
            <NavLink to="/" end>Dashboard</NavLink>
            <NavLink to="/build">Build Team</NavLink>
            <NavLink to="/active">Active Players</NavLink>
            <NavLink to="/leaderboard">Leaderboard</NavLink>
            <NavLink to="/rules">Rules</NavLink>
            <NavLink to="/admin">Admin</NavLink>
            <button className="btn" onClick={onLogout} style={{marginLeft:12}}>Logout</button>
          </nav>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/build" element={<BuildTeam />} />
          <Route path="/active" element={<ActivePlayers />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
        <footer>© PTPP, LLC., St. Louis, Missouri</footer>
      </div>
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(<Layout />);
