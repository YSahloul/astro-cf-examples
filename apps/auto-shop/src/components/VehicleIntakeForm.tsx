// src/components/VehicleIntakeForm.tsx
import { useState, useEffect } from 'react';
import { actions } from 'astro:actions';
import { getSavedVehicle, saveVehicle } from '@/lib/vehicle-storage';

interface RecommendationsData {
  recommendations: any[];
  vehicle: { year: number; make: string; model: string };
  intent: string;
  totalBuilds: number;
}

interface VehicleIntakeFormProps {
  onRecommendations?: (data: RecommendationsData) => void;
  onLoadingChange?: (loading: boolean) => void;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 35 }, (_, i) => CURRENT_YEAR - i);
type Intent = 'tires_only' | 'wheels_only' | 'wheels_and_tires' | 'package' | 'package_and_lift';

const INTENTS: { value: Intent; label: string }[] = [
  { value: 'tires_only', label: 'Tires Only' },
  { value: 'wheels_only', label: 'Wheels Only' },
  { value: 'wheels_and_tires', label: 'Wheels + Tires' },
  { value: 'package', label: 'Full Package (Wheels + Tires + Lift)' },
];

export default function VehicleIntakeForm({ onRecommendations, onLoadingChange }: VehicleIntakeFormProps) {
  const [year, setYear] = useState<number | null>(null);
  const [make, setMake] = useState<string>('');
  const [model, setModel] = useState<string>('');
  const [intent, setIntent] = useState<Intent>('wheels_and_tires');
  
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // Load saved vehicle on mount
  useEffect(() => {
    const saved = getSavedVehicle();
    if (saved) {
      setYear(saved.year);
      setMake(saved.make);
      setModel(saved.model);
    }
    setInitializing(false);
  }, []);

  // Fetch makes when year changes
  useEffect(() => {
    if (!year || initializing) return;
    
    setLoadingMakes(true);
    
    actions.getVehicleMakes({ year })
      .then(result => {
        if (result.data) {
          setMakes(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingMakes(false));
  }, [year, initializing]);

  // Fetch models when make changes
  useEffect(() => {
    if (!year || !make || initializing) return;
    
    setLoadingModels(true);
    
    actions.getVehicleModels({ year, make })
      .then(result => {
        if (result.data) {
          setModels(result.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingModels(false));
  }, [year, make, initializing]);

  // Save vehicle when fully selected
  useEffect(() => {
    if (year && make && model && !initializing) {
      saveVehicle(year, make, model);
    }
  }, [year, make, model, initializing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!year || !make || !model) {
      setError('Please select year, make, and model');
      return;
    }
    
    setError(null);
    setSubmitting(true);
    onLoadingChange?.(true);
    
    try {
      const result = await actions.generateAIRecommendations({
        year,
        make,
        model,
        intent,
      });
      
      if (result.data) {
        onRecommendations?.(result.data);
      } else if (result.error) {
        setError(result.error.message || 'Failed to generate recommendations');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
      onLoadingChange?.(false);
    }
  };

  const isFormValid = year && make && model && intent;

  return (
    <form onSubmit={handleSubmit} className="card bg-base-100 shadow-md">
      <div className="card-body">
        <h2 className="card-title text-2xl">Find Your Perfect Setup</h2>
        
        {/* Vehicle Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Year */}
          <div className="form-control">
            <label className="label" htmlFor="year">
              <span className="label-text font-medium">Year</span>
            </label>
            <select
              id="year"
              value={year || ''}
              onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
              className="select select-bordered w-full"
            >
              <option value="">Select Year</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          
          {/* Make */}
          <div className="form-control">
            <label className="label" htmlFor="make">
              <span className="label-text font-medium">Make</span>
            </label>
            <select
              id="make"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              disabled={!year || loadingMakes}
              className="select select-bordered w-full"
            >
              <option value="">
                {loadingMakes ? 'Loading...' : 'Select Make'}
              </option>
              {makes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          
          {/* Model */}
          <div className="form-control">
            <label className="label" htmlFor="model">
              <span className="label-text font-medium">Model</span>
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              disabled={!make || loadingModels}
              className="select select-bordered w-full"
            >
              <option value="">
                {loadingModels ? 'Loading...' : 'Select Model'}
              </option>
              {models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Intent Selection */}
        <div className="form-control mt-4">
          <label className="label">
            <span className="label-text font-medium">What are you looking for?</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {INTENTS.map((option) => (
              <label
                key={option.value}
                className={`
                  flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-all
                  ${intent === option.value 
                    ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary' 
                    : 'border-base-300 hover:border-base-content/30 hover:bg-base-200'
                  }
                `}
              >
                <input
                  type="radio"
                  name="intent"
                  value={option.value}
                  checked={intent === option.value}
                  onChange={(e) => setIntent(e.target.value as Intent)}
                  className="sr-only"
                />
                <span className="text-sm font-medium text-center">{option.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="alert alert-error mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="card-actions justify-end mt-6">
          <button
            type="submit"
            disabled={!isFormValid || submitting}
            className="btn btn-primary btn-lg w-full"
          >
            {submitting ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Generating AI Recommendations...
              </>
            ) : (
              'Get AI Recommendations'
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
