import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then(({ teams: results }) => setTeams(results))
      .catch(() => setError(true));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    <p>Manage teams and members.</p>
    {error
      ? <p role="alert">Unable to load teams. Please try again.</p>
      : teams === null
        ? <p role="status">Loading teams...</p>
        : teams.length === 0
          ? <p>No teams yet.</p>
          : <ul>{teams.map((team) =>
            <li key={team.name}>{team.name}{team.members.length > 0 ? ` — ${team.members.join(', ')}` : ''}</li>,
          )}</ul>}
  </div></section>;
}
