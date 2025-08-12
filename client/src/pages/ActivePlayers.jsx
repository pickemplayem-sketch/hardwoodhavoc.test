import React from 'react';

export default function ActivePlayers(){
  const [team, setTeam] = React.useState(null);
  const [players, setPlayers] = React.useState({});
  const rounds = ['R64','R32','S16','E8','F4','CH'];

  React.useEffect(()=>{
    fetch('/api/team',{credentials:'include'}).then(r=>r.json()).then(setTeam);
    fetch('/api/players').then(r=>r.json()).then(list=>{
      const map = {}; list.forEach(p=> map[p.id]=p); setPlayers(map);
    });
  },[]);

  function save(){
    fetch('/api/team/save', {
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ picks: team?.picks || [], tiebreaker: team?.team?.tiebreaker || null })
    }).then(r=>r.json()).then(d=> alert(d.ok?'Saved!':'Failed'));
  }

  if (!team) return <div className="card">Loading...</div>;

  return (
    <div className="card">
      <h3>Active Players (per Round)</h3>
      <p>Edit the active flags for each round (max 5 active per round).</p>
      <table>
        <thead><tr><th>Player</th><th>School</th><th>R64</th><th>R32</th><th>S16</th><th>E8</th><th>F4</th><th>CH</th></tr></thead>
        <tbody>
          {team.picks.map(p=>{
            const pl = players[p.player_id] || {};
            return (
              <tr key={p.id}>
                <td>{pl.name||p.player_id}</td>
                <td>{pl.school||''}</td>
                {rounds.map(r=>{
                  const checked = !!p.active_rounds?.[r];
                  return <td key={r}><input type="checkbox" checked={checked} onChange={e=>{
                    const next = { ...team };
                    next.picks = next.picks.map(x=> x.id===p.id ? {...x, active_rounds: {...x.active_rounds, [r]: e.target.checked}} : x);
                    setTeam(next);
                  }} /></td>
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <button className="btn" onClick={save}>Save</button>
    </div>
  );
}
