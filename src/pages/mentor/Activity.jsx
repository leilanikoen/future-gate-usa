import { useEffect, useState } from "react";
import { listActivity } from "../../lib/db.js";
import { activityPhrase, timeAgo } from "../../lib/constants.js";
import Card from "../../components/ui/Card.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import { Spinner, EmptyState } from "../../components/ui/Feedback.jsx";

export default function MentorActivity() {
  const [events, setEvents] = useState(null);
  useEffect(() => { listActivity({ limit: 50 }).then(setEvents); }, []);
  if (events === null) return <Spinner />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">Activity</h1>
      <p className="text-muted mt-1 mb-6">Recent activity across your assigned students.</p>
      {events.length === 0 ? (
        <EmptyState title="No activity yet" hint="Uploads, submissions, and feedback will show up here." />
      ) : (
        <Card className="divide-y divide-slate-50">
          {events.map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-5 py-3.5">
              <Avatar name={e.actorName} src={e.actorAvatar} size="sm" />
              <div className="flex-1 min-w-0 text-sm text-ink/80">{activityPhrase(e)}</div>
              <span className="text-xs text-muted shrink-0">{timeAgo(e.created_at)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
