export default function TimeElapsed({ createdAt, compact = false }) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const rem = totalMinutes % 60;
  const isOverdue = hours >= 1;

  const text = hours >= 1
    ? compact ? `${hours}h ${rem}m` : `${hours}h ${rem}m`
    : `${totalMinutes}m`;

  return (
    <span className={isOverdue ? "text-red-600 font-semibold" : "text-gray-500"}>
      {text}
    </span>
  );
}
