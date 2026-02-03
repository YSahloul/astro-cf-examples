import { useState, useEffect } from 'react';
import { useAgent } from 'agents/react';
import { actions } from 'astro:actions';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

type Goal = 'wheels_tires' | 'schedule' | 'browse';

interface Vehicle {
  year: number;
  make: string;
  model: string;
  trim?: string;
}

interface AgentState {
  visitorId: string;
  vehicle: Vehicle | null;
  intent: string | null;
  recommendations: any[] | null;
  selectedRecommendation: any | null;
  quoteId: string | null;
}

interface HeroVehicleCardProps {
  phone?: string | null;
}

// Get or create visitor ID
function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('visitor_id', id);
  }
  return id;
}

export default function HeroVehicleCard({ phone }: HeroVehicleCardProps) {
  const [year, setYear] = useState<number | null>(null);
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [agentState, setAgentState] = useState<AgentState | null>(null);

  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  const [loadingMakes, setLoadingMakes] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [initializing, setInitializing] = useState(true);

  const visitorId = typeof window !== 'undefined' ? getVisitorId() : '';

  // Connect to FitmentAgent
  const agent = useAgent({
    agent: 'fitment-agent',
    name: `visitor-${visitorId}`,
    onStateUpdate: (state: AgentState) => {
      setAgentState(state);
      // Sync local state from agent
      if (state.vehicle && initializing) {
        setYear(state.vehicle.year);
        setMake(state.vehicle.make);
        setModel(state.vehicle.model);
      }
    },
    onOpen: () => {
      console.log('Connected to FitmentAgent');
      // Get initial state
      agent?.call('getSessionState', []).then((state) => {
        if (state) {
          setAgentState(state as AgentState);
          if ((state as AgentState).vehicle) {
            setYear((state as AgentState).vehicle!.year);
            setMake((state as AgentState).vehicle!.make);
            setModel((state as AgentState).vehicle!.model);
          }
        }
        setInitializing(false);
      });
    },
  });

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

  // Save vehicle to agent when fully selected
  useEffect(() => {
    if (year && make && model && !initializing && agent) {
      agent.call('setVehicle', [{ year, make, model }]);
    }
  }, [year, make, model, initializing, agent]);

  const handleGoalSelect = async (selectedGoal: Goal) => {
    if (selectedGoal === 'wheels_tires') {
      // Set intent on agent then scroll to recommendations
      if (agent) {
        await agent.call('setIntent', ['wheels_and_tires']);
      }
      // Dispatch custom event so FitmentRecommendations can show results
      window.dispatchEvent(new CustomEvent('vehicle-intent-set', {
        detail: {
          vehicle: { year, make, model },
          intent: 'wheels_and_tires',
        },
      }));
      // Scroll to recommendations section
      setTimeout(() => {
        document.getElementById('recommendations')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else if (selectedGoal === 'schedule') {
      document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleChangeVehicle = async () => {
    if (agent) {
      await agent.call('clearSession', []);
    }
    setYear(null);
    setMake('');
    setModel('');
    setMakes([]);
    setModels([]);
    setAgentState(null);
  };

  const vehicleSelected = year && make && model;

  return (
    <div className="card bg-base-100 text-base-content w-full max-w-md shadow-2xl">
      <div className="card-body">
        <h2 
          className="card-title text-2xl md:text-3xl font-black justify-center"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          What Do You <span className="text-primary">Drive?</span>
        </h2>

        {/* Vehicle Selectors */}
        <div className="space-y-3 mt-4">
          <select
            value={year || ''}
            onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : null)}
            className="select select-bordered w-full"
          >
            <option value="">Select Year</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          <select
            value={make}
            onChange={(e) => setMake(e.target.value)}
            disabled={!year || loadingMakes}
            className="select select-bordered w-full"
          >
            <option value="">
              {loadingMakes ? 'Loading makes...' : 'Select Make'}
            </option>
            {makes.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make || loadingModels}
            className="select select-bordered w-full"
          >
            <option value="">
              {loadingModels ? 'Loading models...' : 'Select Model'}
            </option>
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* Goal Selection */}
        {vehicleSelected && (
          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold uppercase opacity-60">
                {year} {make} {model}
              </p>
              <button 
                onClick={handleChangeVehicle}
                className="btn btn-ghost btn-xs"
              >
                Change
              </button>
            </div>
            <button
              onClick={() => handleGoalSelect('wheels_tires')}
              className="btn btn-primary btn-block gap-2"
              style={{ fontFamily: "'Oswald', sans-serif" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Find Wheels & Tires
            </button>
            <button
              onClick={() => handleGoalSelect('schedule')}
              className="btn btn-outline btn-block gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Schedule Service
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="stats stats-vertical md:stats-horizontal shadow mt-6 bg-base-200">
          <div className="stat place-items-center py-3">
            <div className="stat-value text-primary text-xl">100K+</div>
            <div className="stat-desc">Verified Builds</div>
          </div>
          <div className="stat place-items-center py-3">
            <div className="stat-value text-primary text-xl">400+</div>
            <div className="stat-desc">Vehicles</div>
          </div>
          <div className="stat place-items-center py-3">
            <div className="stat-value text-primary text-xl">Free</div>
            <div className="stat-desc">Quotes</div>
          </div>
        </div>

        {phone && (
          <p className="text-center text-sm opacity-60 mt-4">
            Or call us: <a href={`tel:${phone.replace(/\D/g, '')}`} className="link link-primary font-bold">{phone}</a>
          </p>
        )}
      </div>
    </div>
  );
}
