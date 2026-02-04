import { actions } from "astro:actions";
import { useState } from "react";

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

interface Hours {
  day: DayOfWeek;
  open: string | null;
  close: string | null;
  closed: boolean | null;
}

export function HoursManager({ initialHours }: { initialHours: Hours[] }) {
  const [hours, setHours] = useState<Hours[]>(initialHours);
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = async (dayData: Hours) => {
    setSaving(dayData.day);
    // Use type assertion as Astro action types may be stale
    const { error } = await (actions.updateHours as any)({
      day: dayData.day,
      open: dayData.open || '08:00',
      close: dayData.close || '18:00',
      closed: dayData.closed ?? false,
    });
    if (!error) {
      setHours(hours.map((h) => (h.day === dayData.day ? dayData : h)));
    }
    setSaving(null);
  };

  return (
    <div className="max-w-2xl space-y-3">
      {hours.map((h) => (
        <div key={h.day} className="flex flex-wrap items-center gap-4 p-4 bg-base-200 rounded-lg">
          <span className="w-28 font-bold capitalize">{h.day}</span>

          <label className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={h.closed ?? false}
              onChange={(e) => handleUpdate({ ...h, closed: e.target.checked })}
            />
            <span className="label-text">Closed</span>
          </label>

          {!h.closed && (
            <>
              <input
                type="time"
                value={h.open ?? '08:00'}
                onChange={(e) => handleUpdate({ ...h, open: e.target.value })}
                className="input input-bordered input-sm w-32"
              />
              <span className="opacity-60">to</span>
              <input
                type="time"
                value={h.close ?? '18:00'}
                onChange={(e) => handleUpdate({ ...h, close: e.target.value })}
                className="input input-bordered input-sm w-32"
              />
            </>
          )}

          {saving === h.day && (
            <span className="loading loading-spinner loading-sm text-primary"></span>
          )}
        </div>
      ))}
    </div>
  );
}
