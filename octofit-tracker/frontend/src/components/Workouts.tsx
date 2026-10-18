import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then(({ suggestions: results }) => setSuggestions(results))
      .catch(() => setError(true));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    <p>Recommend workouts from activity patterns.</p>
    {error
      ? <p role="alert">Unable to load workout suggestions. Please try again.</p>
      : suggestions === null
        ? <p role="status">Loading workout suggestions...</p>
        : suggestions.length === 0
          ? <p>No workout suggestions yet.</p>
          : <ul>{suggestions.map((suggestion) =>
            <li key={suggestion.title}>{suggestion.title} — {suggestion.reason}</li>,
          )}</ul>}
  </div></section>;
}
