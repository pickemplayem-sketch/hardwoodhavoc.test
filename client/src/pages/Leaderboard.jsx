import React from 'react';

export default function Leaderboard(){
  const [rows, setRows] = React.useState([]);
  React.useEffect(()=>{
    const pull = ()=> fetch('/api/leaderboard').then(r=>r.json()).then(setRows);
    pull();
    const t = setInterval(pull, 3000);
    return ()=> clearInterval(t);
  },[]);
  return (
    <div className="card">
      <h3>Leaderboard</h3>
      <table>
        <thead><tr><th>Team</th><th>Owner</th><th>Tiebreaker</th><th>Score</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}><td>{r.team_name}</td><td>{r.display_name}</td><td>{r.tiebreaker||'-'}</td><td><b>{r.score}</b></td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
