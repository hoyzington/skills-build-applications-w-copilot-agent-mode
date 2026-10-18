import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type LeaderboardEntry = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then(({ leaderboard: results }) => setLeaderboard(results))
      .catch(() => setError(true));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    <p>Compare team point totals.</p>
    {error
      ? <p role="alert">Unable to load leaderboard. Please try again.</p>
      : leaderboard === null
        ? <p role="status">Loading leaderboard...</p>
        : leaderboard.length === 0
          ? <p>No leaderboard rankings yet.</p>
          : <ol>{leaderboard.map((entry) =>
            <li key={entry.rank}>{entry.teamName} — {entry.totalPoints} points</li>,
          )}</ol>}
  </div></section>;
}
