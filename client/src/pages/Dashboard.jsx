import React from 'react';

export default function Dashboard({ user }){
  const [config, setConfig] = React.useState(null);
  const [team, setTeam] = React.useState(null);

  React.useEffect(()=>{
    fetch('/api/config').then(r=>r.json()).then(setConfig);
    fetch('/api/team',{credentials:'include'}).then(r=>r.json()).then(setTeam);
  },[]);

  return (
    <div className="card">
      <h3>Welcome {user?.display_name || ''}</h3>
      <p>Current Round: <b>{config?.CURRENT_ROUND}</b>. Tournament Year: <b>{config?.TOURNAMENT_YEAR}</b>.</p>
      <p>Your team and picks are shown below. Use <b>Build Team</b> to edit your roster or set your tiebreaker.</p>
      <pre style={{whiteSpace:'pre-wrap', background:'#0f172a', padding:12, borderRadius:10}}>{JSON.stringify(team,null,2)}</pre>
    </div>
  );
}
