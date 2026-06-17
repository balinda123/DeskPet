import { useEffect, useState } from 'react';
import { Bell, Plus, Trash2 } from 'lucide-react';

interface Reminder {
  id: string;
  text: string;
  dueAt: string;
  done: boolean;
}

export function ReminderPanel() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>(() => {
    const raw = localStorage.getItem('cat_reminders');
    return raw ? JSON.parse(raw) as Reminder[] : [];
  });

  useEffect(() => {
    localStorage.setItem('cat_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();
      setReminders((prev) => prev.map((reminder) => {
        if (reminder.done || new Date(reminder.dueAt).getTime() > now) return reminder;
        notify(reminder.text);
        return { ...reminder, done: true };
      }));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const addReminder = () => {
    if (!text.trim() || !dueAt) return;
    setReminders((prev) => [...prev, { id: crypto.randomUUID(), text: text.trim(), dueAt, done: false }]);
    setText('');
    setDueAt('');
  };

  return (
    <div
      className="fixed left-6 top-6 z-[9998] pointer-events-auto"
      onMouseEnter={() => window.electronAPI?.setIgnoreMouseEvents(false)}
      onMouseLeave={() => window.electronAPI?.setIgnoreMouseEvents(true, { forward: true })}
    >
      <button onClick={() => setOpen(!open)} className="rounded-full bg-white/90 p-3 text-slate-800 shadow-lg hover:bg-white" title="备忘提醒">
        <Bell size={18} />
      </button>

      {open && (
        <div className="mt-3 w-80 rounded-lg border border-slate-200 bg-white/95 p-4 text-left shadow-xl backdrop-blur">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">小猫提醒</h2>
          <div className="grid gap-2">
            <input value={text} onChange={(event) => setText(event.target.value)} className="input" placeholder="提醒内容" />
            <input value={dueAt} onChange={(event) => setDueAt(event.target.value)} type="datetime-local" className="input" />
            <button onClick={addReminder} className="flex items-center justify-center gap-2 rounded-md bg-slate-900 px-3 py-2 text-sm text-white">
              <Plus size={15} />
              添加提醒
            </button>
          </div>
          <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
            {reminders.length === 0 && <div className="text-xs text-slate-500">还没有提醒。</div>}
            {reminders.map((reminder) => (
              <div key={reminder.id} className="flex items-start justify-between gap-2 rounded-md bg-slate-50 p-2 text-xs text-slate-700">
                <div className={reminder.done ? 'line-through opacity-60' : ''}>
                  <div className="font-medium">{reminder.text}</div>
                  <div className="mt-1 text-slate-500">{new Date(reminder.dueAt).toLocaleString()}</div>
                </div>
                <button onClick={() => setReminders((prev) => prev.filter((item) => item.id !== reminder.id))} title="删除">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function notify(text: string) {
  if (!('Notification' in window)) {
    globalThis.alert(`小猫提醒：${text}`);
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification('小猫提醒', { body: text });
    return;
  }

  if (Notification.permission === 'default') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') new Notification('小猫提醒', { body: text });
    });
  }
}
