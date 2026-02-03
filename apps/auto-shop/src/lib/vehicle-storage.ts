const STORAGE_KEY = 'saved_vehicle';

export interface SavedVehicle {
  year: number;
  make: string;
  model: string;
  savedAt: string;
}

export function getSavedVehicle(): SavedVehicle | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const vehicle = JSON.parse(saved) as SavedVehicle;
    // Expire after 30 days
    const savedDate = new Date(vehicle.savedAt);
    const daysSince = (Date.now() - savedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSince > 30) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return vehicle;
  } catch {
    return null;
  }
}

export function saveVehicle(year: number, make: string, model: string) {
  if (typeof window === 'undefined') return;
  const vehicle: SavedVehicle = { year, make, model, savedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicle));
}

export function clearSavedVehicle() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
