import { useEffect, useState } from 'react';
import WidgetTitle from './WidgetTitle';

export default function ClockWidget({ widgetId }: { widgetId: string }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const dateStr = time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow flex flex-col items-center">
      <WidgetTitle widgetId={widgetId} defaultTitle="Clock" />
      <div className="text-4xl font-mono">
        {hours}:{minutes}
      </div>
      <div className="text-xs text-gray-500 mt-1">{dateStr}</div>
    </div>
  );
}
