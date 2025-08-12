import React from 'react';

export default function Admin(){
  const [me, setMe] = React.useState(null);
  const [config, setConfig] = React.useState(null);
  const [note, setNote] = React.useState('Budget-based mode scaffolding present (player costs + cap).');

  function pull(){
    fetch('/api/me',{credentials:'include'}).then(r=>r.json()).then(d=>{
      setMe(d.user); setConfig(d.config);
    });
  }
  React.useEffect(()=>{ pull(); },[]);

  function togglePublic(){
    fetch('/api/admin/togglePublic',{
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include',
      body: JSON.stringify({ value: !config.GAME_PUBLIC })
    }).then(r=>r.json()).then(()=>pull());
  }

  function advance(){
    fetch('/api/admin/advanceRound',{
      method:'POST', headers:{'Content-Type':'application/json'}, credentials:'include'
    }).then(r=>r.json()).then(()=>pull());
  }

  if (!me) return <div className="card">Loading...</div>;
  if (me.role !== 'admin') return <div className="card">Admins only.</div>;

  return (
    <div className="card">
      <h3>Admin</h3>
      <p>Game Visibility: <b>{config?.GAME_PUBLIC ? 'Public' : 'Private (Invite-Only)'}</b></p>
      <button className="btn" onClick={togglePublic}>Toggle Public/Private</button>
      <p style={{marginTop:14}}>Current Round: <b>{config?.CURRENT_ROUND}</b></p>
      <button className="btn" onClick={advance}>Advance Round (Sim)</button>
      <div style={{marginTop:18}}>
        <h4>Notes for future builds</h4>
        <textarea value={note} onChange={e=>setNote(e.target.value)} style={{width:'100%', minHeight:120}}/>
        <p style={{opacity:.75}}>Scaffold present for budget-based mode (per-player costs, cap, admin toggle), per your spec.</p>
      </div>
      <div style={{marginTop:18}}>
        <h4>Invite Codes</h4>
        <p>Player invite code: <code>MARCH2025</code></p>
        <p>Admin invite code: <code>MARCH2025-ADMIN</code></p>
      </div>
    </div>
  );
}
