import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import WidgetTitle from './WidgetTitle';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
}

interface CalendarWidgetProps {
  onDataChange?: () => void;
  widgetId: string;
}

export default function CalendarWidget({ onDataChange, widgetId }: CalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('');
  const storageKey = `widgetCalendar_${widgetId}`;

  useEffect(() => {
    // Load events from storage
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.storage) {
      browserAPI.storage.local.get([storageKey], (result: any) => {
        if (result[storageKey]) {
          setEvents(JSON.parse(result[storageKey]));
        }
      });
    } else {
      const savedEvents = localStorage.getItem(storageKey);
      if (savedEvents) {
        setEvents(JSON.parse(savedEvents));
      }
    }
  }, []);

  const saveEvents = (newEvents: CalendarEvent[]) => {
    const browserAPI = (window as any).browser || (window as any).chrome;
    
    if (browserAPI && browserAPI.storage) {
      browserAPI.storage.local.set({ [storageKey]: JSON.stringify(newEvents) }, () => {
        onDataChange?.();
      });
    } else {
      localStorage.setItem(storageKey, JSON.stringify(newEvents));
      onDataChange?.();
    }
    setEvents(newEvents);
  };

  const addEvent = () => {
    if (!newEventTitle.trim() || !selectedDate) return;

    const newEvent: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEventTitle.trim(),
      date: selectedDate,
      time: newEventTime || undefined
    };

    saveEvents([...events, newEvent]);
    setNewEventTitle('');
    setNewEventTime('');
    setSelectedDate('');
    setShowAddForm(false);
  };

  const removeEvent = (id: string) => {
    saveEvents(events.filter(e => e.id !== id));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const firstDayOfWeek = firstDay.getDay();
    
    const days: (number | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(day);
    }
    
    return days;
  };

  const getEventsForDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter(event => event.date === dateStr);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
      <WidgetTitle widgetId={widgetId} defaultTitle="Calendar" />
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1 text-green-500 hover:text-green-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {showAddForm && (
        <div className="mb-3 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
          <input
            type="text"
            placeholder="Event title"
            value={newEventTitle}
            onChange={(e) => setNewEventTitle(e.target.value)}
            className="w-full p-2 mb-2 border rounded text-sm bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
          />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full p-2 mb-2 border rounded text-sm bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
          />
          <input
            type="time"
            value={newEventTime}
            onChange={(e) => setNewEventTime(e.target.value)}
            className="w-full p-2 mb-2 border rounded text-sm bg-white dark:bg-gray-600 border-gray-300 dark:border-gray-500"
          />
          <div className="flex gap-2">
            <button
              onClick={addEvent}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1 bg-gray-300 dark:bg-gray-600 rounded text-sm hover:bg-gray-400 dark:hover:bg-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h4 className="font-medium">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h4>
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
            {day}
          </div>
        ))}
        {getDaysInMonth().map((day, index) => (
          <div
            key={index}
            className={`text-center text-sm p-1 h-8 flex items-center justify-center relative ${
              day ? 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer' : ''
            } ${
              day && isToday(day) ? 'bg-blue-500 text-white rounded' : ''
            }`}
          >
            {day}
            {day && getEventsForDate(day).length > 0 && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-500 rounded-full"></div>
            )}
          </div>
        ))}
      </div>

      {/* Upcoming Events */}
      <div className="max-h-32 overflow-y-auto">
        <h5 className="text-sm font-medium mb-2">Upcoming Events</h5>
        <div className="space-y-1">
          {events
            .filter(event => new Date(event.date) >= new Date(new Date().toDateString()))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 3)
            .map(event => (
              <div key={event.id} className="flex items-center justify-between text-xs p-1 bg-gray-50 dark:bg-gray-700 rounded">
                <div>
                  <div className="font-medium">{event.title}</div>
                  <div className="text-gray-500">
                    {new Date(event.date).toLocaleDateString()}
                    {event.time && ` at ${event.time}`}
                  </div>
                </div>
                <button
                  onClick={() => removeEvent(event.id)}
                  className="p-1 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          {events.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-2">
              No events scheduled
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
