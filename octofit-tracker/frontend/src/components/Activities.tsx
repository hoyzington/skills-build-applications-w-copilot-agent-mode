import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points?: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then(({ activities: results }) => setActivities(results))
      .catch(() => setError(true));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Activities</h2>
    <p>Track student activity minutes and points.</p>
    {error
      ? <p role="alert">Unable to load activities. Please try again.</p>
      : activities === null
        ? <p role="status">Loading activities...</p>
        : activities.length === 0
          ? <p>No activities yet.</p>
          : <ul>{activities.map((activity, index) =>
            <li key={`${activity.type}-${index}`}>
              {activity.type} — {activity.minutes} minutes{activity.points === undefined ? '' : `, ${activity.points} points`}
            </li>,
          )}</ul>}
  </div></section>;
}
