import React from 'react';

export default function BuildTeam(){
  const [players, setPlayers] = React.useState([]);
  const [picks, setPicks] = React.useState([]);
  const [tiebreaker, setTiebreaker] = React.useState('');
  const [search, setSearch] = React.useState('');

  React.useEffect(()=>{ fetch('/api/players').then(r=>r.json()).then(setPlayers); },[]);

  function togglePick(player){
    const exists = picks.find(p=>p.player_id===player.id);
    if (exists){
      setPicks(picks.filter(p=>p.player_id!==player.id).map((p,i)=>({...p, sort_order:i})));
    } else {
      if (picks.length >= 7) { alert('Max 7 players'); return; }
      setPicks([...picks, { player_id: player.id, sort_order: picks.length, active_rounds: { R64: picks.length < 5 } }]);
    }
  }

  function setActive(round, playerId, value){
    setPicks(picks.map(p=> p.player_id===playerId ? { ...p, active_rounds: { ...p.active_rounds, [round]: value } } : p));
  }

  function save(){
    // Validate: exactly 7 or up to 7; and max 5 active per round
    const rounds = ['R64','R32','S16','E8','F4','CH'];
    for (const r of rounds){
      const activeCount = picks.filter(p=>p.active_rounds?.[r]).length;
      if (activeCount > 5) return alert('Max 5 active in ' + r);
    }
    fetch('/api/team/save', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ picks, tiebreaker: tiebreaker? parseInt(tiebreaker,10): null })
    }).then(r=>r.json()).then(d=>{
      if (d.ok) alert('Saved!');
      else alert('Failed');
    });
  }

  const filtered = players.filter(p=> (p.name.toLowerCase().includes(search.toLowerCase()) || p.school.toLowerCase().includes(search.toLowerCase())));

  return (
    <div className="card">
      <h3>Build Team / Redraft</h3>
      <div style={{display:'flex', gap:10, alignItems:'center'}}>
        <input placeholder="Search player or school" value={search} onChange={e=>setSearch(e.target.value)} />
        <label>Tiebreaker total: <input type="number" value={tiebreaker} onChange={e=>setTiebreaker(e.target.value)} style={{width:120}} /></label>
        <button className="btn" onClick={save}>Save Roster</button>
      </div>
      <p style={{opacity:.8}}>Pick up to 7 players. Use the checkboxes to mark who is active each round (max 5).</p>
      <table>
        <thead>
          <tr>
            <th>Pick</th><th>Player</th><th>School</th><th>Pos</th><th>Seed</th><th>PPG</th><th>3PA</th><th>3PM</th><th>3P%</th>
            <th>Active: R64 R32 S16 E8 F4 CH</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(p=>{
            const chosen = picks.find(x=>x.player_id===p.id);
            return (
              <tr key={p.id}>
                <td><input type="checkbox" checked={!!chosen} onChange={()=>togglePick(p)} /></td>
                <td>{p.name}</td>
                <td>{p.school}</td>
                <td>{p.position}</td>
                <td>{p.seed}</td>
                <td>{p.ppg}</td>
                <td>{p.three_pa}</td>
                <td>{p.three_pm}</td>
                <td>{(p.three_pct*100).toFixed(1)}%</td>
                <td>
                  {['R64','R32','S16','E8','F4','CH'].map(r=>{
                    const checked = !!(chosen && chosen.active_rounds?.[r]);
                    return <label key={r} style={{marginRight:6}}><input type="checkbox" disabled={!chosen} checked={checked} onChange={e=> setActive(r, p.id, e.target.checked)} /></label>
                  })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  );
}
