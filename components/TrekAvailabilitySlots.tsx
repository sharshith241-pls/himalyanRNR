"use client";

export interface AvailabilitySlot {
  id?: string;
  slot_date: string;
  capacity: number;
  booked_count?: number;
}

interface TrekAvailabilitySlotsProps {
  slots: AvailabilitySlot[];
  onChange: (slots: AvailabilitySlot[]) => void;
}

export default function TrekAvailabilitySlots({ slots, onChange }: TrekAvailabilitySlotsProps) {
  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: string) => {
    onChange(slots.map((slot, slotIndex) => slotIndex === index
      ? { ...slot, [field]: field === "capacity" ? Math.max(1, Number(value)) : value }
      : slot));
  };

  return (
    <section className="rounded-lg border border-teal-200 bg-teal-50 p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-900">Available trek dates</h3>
          <p className="text-sm text-gray-600">Add the dates users can book and the number of places for each date.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...slots, { slot_date: "", capacity: 10 }])}
          className="shrink-0 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800"
        >
          + Add date
        </button>
      </div>

      {slots.length === 0 && <p className="rounded-lg bg-white p-3 text-sm text-gray-600">No dates added yet. Add a date to make this trek bookable on a specific day.</p>}

      <div className="space-y-3">
        {slots.map((slot, index) => {
          const remaining = Math.max(0, slot.capacity - (slot.booked_count || 0));
          return (
            <div key={slot.id || index} className="grid gap-3 rounded-lg border border-teal-100 bg-white p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
              <label className="text-sm font-semibold text-gray-800">
                Date
                <input
                  type="date"
                  value={slot.slot_date}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={(event) => updateSlot(index, "slot_date", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900"
                  required
                />
              </label>
              <label className="text-sm font-semibold text-gray-800">
                Places
                <input
                  type="number"
                  min="1"
                  value={slot.capacity}
                  onChange={(event) => updateSlot(index, "capacity", event.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 font-normal text-gray-900"
                  required
                />
                <span className="mt-1 block text-xs font-normal text-gray-500">{remaining} remaining</span>
              </label>
              <button
                type="button"
                onClick={() => onChange(slots.filter((_, slotIndex) => slotIndex !== index))}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
