import React from 'react';

export default function Rules(){
  return (
    <div className="card">
      <h3>🏀 NCAA Player Points Pool – Game Rules</h3>
      <p><b>Objective:</b> Score the most points through your chosen players’ real-life performances during the NCAA Men’s Basketball Tournament. First Four games are excluded.</p>
      <ul>
        <li>Pick any <b>7 players</b> from the 64-team field. No exclusivity—multiple teams can pick the same player.</li>
        <li>Designate <b>5 active</b> and <b>2 bench</b> players each round. Only actives score.</li>
        <li><b>Default rule:</b> If you miss a deadline, your top 5 surviving players (by list order) are used.</li>
        <li><b>Sweet Sixteen redraft:</b> Refill to 7 (or at least 5). You may only add players from teams still alive.</li>
        <li><b>Ineligible picks:</b> Players must be on the official 64-team rosters; otherwise the slot scores 0 until redraft.</li>
        <li><b>Tiebreaker:</b> Predict your team’s total points across all rounds.</li>
      </ul>
      <p>Deadlines auto-adjust each year based on the official schedule. Admin may lock/unlock rounds for testing.</p>
    </div>
  );
}
