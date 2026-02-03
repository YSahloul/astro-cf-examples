import { actions } from "astro:actions";
import { useState } from "react";

interface Hours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export function HoursManager({ initialHours }: { initialHours: Hours[] }) {
  const [hours, setHours] = useState<Hours[]>(initialHours);
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = async (dayData: Hours) => {
    setSaving(dayData.day);
    const { error } = await actions.updateHours(dayData);
    if (!error) {
      setHours(hours.map((h) => (h.day === dayData.day ? dayData : h)));
    }
    setSaving(null);
  };

  return (
    <div className="max-w-2xl space-y-3">
      {hours.map((h) => (
        <div key={h.day} className="flex flex-wrap items-center gap-4 p-4 bg-base-200 rounded-lg">
          <span className="w-28 font-bold">{h.day}</span>

          <label className="label cursor-pointer gap-2">
            <input
              type="checkbox"
              className="checkbox checkbox-primary"
              checked={h.closed}
              onChange={(e) => handleUpdate({ ...h, closed: e.target.checked })}
            />
            <span className="label-text">Closed</span>
          </label>

          {!h.closed && (
            <>
              <input
                type="time"
                value={h.open}
                onChange={(e) => handleUpdate({ ...h, open: e.target.value })}
                className="input input-bordered input-sm w-32"
              />
              <span className="opacity-60">to</span>
              <input
                type="time"
                value={h.close}
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
