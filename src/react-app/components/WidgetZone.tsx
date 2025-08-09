interface WidgetZoneProps {
  widgets: string[];
  onWidgetsChange: (widgets: string[]) => void;
  renderWidget: (type: string, index: number) => React.ReactNode;
}

const availableWidgets = [
  { id: 'bookmarks', name: 'Bookmarks' },
  { id: 'notes', name: 'Notes' },
  { id: 'calendar', name: 'Calendar' },
  { id: 'todo', name: 'Todo List' },
  { id: 'clock', name: 'Clock' },
  { id: 'calculator', name: 'Calculator' }
];

export default function WidgetZone({ widgets, onWidgetsChange, renderWidget }: WidgetZoneProps) {
  const addWidget = (widgetType: string) => {
    onWidgetsChange([...widgets, widgetType]);
  };

  const removeWidget = (widgetType: string) => {
    onWidgetsChange(widgets.filter(w => w !== widgetType));
  };

  return (
    <div className="space-y-3">
      {widgets.map((widgetType, i) => (
        <div key={widgetType + '_' + i} className="relative group">
          {renderWidget(widgetType, i)}
          <button
            onClick={() => removeWidget(widgetType)}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600 text-white p-1 rounded text-xs z-20 pointer-events-none group-hover:pointer-events-auto"
            style={{ transform: 'translate(8px, -8px)' }}
          >
            Remove
          </button>
        </div>
      ))}
      
      <div className="relative">
        <select
          onChange={(e) => {
            if (e.target.value) {
              addWidget(e.target.value);
              e.target.value = '';
            }
          }}
          className="w-full p-3 bg-white dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-green-400 transition-colors"
        >
          <option value="">+ Add Widget</option>
          {availableWidgets.map(widget => (
            <option key={widget.id} value={widget.id}>
              {widget.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
