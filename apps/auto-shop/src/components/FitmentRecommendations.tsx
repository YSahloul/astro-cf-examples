import { useState, useEffect } from 'react';

interface Fitment {
  wheel_name: string;
  wheel_diameter: number;
  wheel_width: number;
  wheel_offset: number;
  tire_name: string;
  tire_size: string;
  tire_overall_diameter: number;
  suspension_type: string;
  rubbing: string;
  trimming: string;
  stance: string;
  url: string;
}

interface Vehicle {
  year: number;
  make: string;
  model: string;
}

interface VehicleIntentEvent extends CustomEvent {
  detail: {
    vehicle: Vehicle;
    intent: string;
  };
}

interface QuizAnswers {
  lift: 'no' | 'leveling' | 'small' | 'big' | 'any';
  stance: 'stock' | 'flush' | 'aggressive' | 'super' | 'any';
  rubbingOk: boolean;
  trimmingOk: boolean;
}

type QuizStep = 'lift' | 'stance' | 'rubbing' | 'trimming' | 'done';

export default function FitmentRecommendations() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [intent, setIntent] = useState<string | null>(null);
  const [fitments, setFitments] = useState<Fitment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz state
  const [quizStep, setQuizStep] = useState<QuizStep>('lift');
  const [answers, setAnswers] = useState<QuizAnswers>({
    lift: 'any',
    stance: 'any',
    rubbingOk: false,
    trimmingOk: false,
  });

  // Listen for vehicle-intent-set event from HeroVehicleCard
  useEffect(() => {
    const handleVehicleIntent = (e: Event) => {
      const event = e as VehicleIntentEvent;
      setVehicle(event.detail.vehicle);
      setIntent(event.detail.intent);
      // Reset quiz when new vehicle selected
      setQuizStep('lift');
      setAnswers({
        lift: 'any',
        stance: 'any',
        rubbingOk: false,
        trimmingOk: false,
      });
      setFitments([]);
    };

    window.addEventListener('vehicle-intent-set', handleVehicleIntent);
    return () => window.removeEventListener('vehicle-intent-set', handleVehicleIntent);
  }, []);

  // Fetch fitments when quiz is done
  useEffect(() => {
    if (!vehicle || quizStep !== 'done') return;

    const fetchFitments = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          year: vehicle.year.toString(),
          make: vehicle.make,
          model: vehicle.model,
          limit: '100',
        });
        
        // Add rubbing/trimming filters
        if (!answers.rubbingOk) {
          params.set('rubbing', 'none');
        }
        if (!answers.trimmingOk) {
          params.set('trimming', 'none');
        }
        
        const response = await fetch(`/api/fitment/search?${params}`);

        if (!response.ok) throw new Error('Failed to fetch fitments');

        const data = await response.json();
        let results = data.fitments || [];
        
        // Filter by lift preference
        if (answers.lift !== 'any') {
          results = results.filter((f: Fitment) => {
            const susp = (f.suspension_type || '').toLowerCase();
            if (answers.lift === 'no') {
              return susp.includes('stock') || susp === '' || !susp;
            }
            if (answers.lift === 'leveling') {
              return susp.includes('leveling') || susp.includes('stock');
            }
            if (answers.lift === 'small') {
              return susp.includes('2"') || susp.includes('3"') || susp.includes('leveling');
            }
            if (answers.lift === 'big') {
              return susp.includes('4"') || susp.includes('5"') || susp.includes('6"') || 
                     susp.includes('7"') || susp.includes('8"') || susp.includes('10"') || 
                     susp.includes('12"');
            }
            return true;
          });
        }
        
        // Filter by stance preference
        if (answers.stance !== 'any') {
          results = results.filter((f: Fitment) => {
            const stance = (f.stance || '').toLowerCase();
            if (answers.stance === 'stock') {
              return stance.includes('tucked') || stance.includes('stock') || !stance;
            }
            if (answers.stance === 'flush') {
              return stance.includes('flush') || stance.includes('nearly flush');
            }
            if (answers.stance === 'aggressive') {
              return stance.includes('aggressive') && !stance.includes('super');
            }
            if (answers.stance === 'super') {
              return stance.includes('super aggressive');
            }
            return true;
          });
        }
        
        setFitments(results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load fitments');
      } finally {
        setLoading(false);
      }
    };

    fetchFitments();
  }, [vehicle, quizStep, answers]);

  // Don't render if no vehicle or intent
  if (!vehicle || !intent) {
    return null;
  }

  const handleLiftAnswer = (lift: QuizAnswers['lift']) => {
    setAnswers(prev => ({ ...prev, lift }));
    setQuizStep('stance');
  };

  const handleStanceAnswer = (stance: QuizAnswers['stance']) => {
    setAnswers(prev => ({ ...prev, stance }));
    setQuizStep('rubbing');
  };

  const handleRubbingAnswer = (rubbingOk: boolean) => {
    setAnswers(prev => ({ ...prev, rubbingOk }));
    setQuizStep('trimming');
  };

  const handleTrimmingAnswer = (trimmingOk: boolean) => {
    setAnswers(prev => ({ ...prev, trimmingOk }));
    setQuizStep('done');
  };

  const resetQuiz = () => {
    setQuizStep('lift');
    setAnswers({
      lift: 'any',
      stance: 'any',
      rubbingOk: false,
      trimmingOk: false,
    });
    setFitments([]);
  };

  return (
    <section id="recommendations" className="bg-base-200 py-12 md:py-20">
      <div className="max-w-2xl mx-auto px-4">
        
        {/* Vehicle Header */}
        <div className="text-center mb-8">
          <h2
            className="text-2xl md:text-3xl font-black uppercase"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h2>
        </div>

        {/* QUIZ */}
        {quizStep !== 'done' && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              
              {/* Progress */}
              <div className="flex gap-1 mb-6">
                {['lift', 'stance', 'rubbing', 'trimming'].map((step, i) => (
                  <div 
                    key={step}
                    className={`h-1 flex-1 rounded ${
                      ['lift', 'stance', 'rubbing', 'trimming'].indexOf(quizStep) >= i 
                        ? 'bg-primary' 
                        : 'bg-base-300'
                    }`}
                  />
                ))}
              </div>

              {/* Lift Question */}
              {quizStep === 'lift' && (
                <>
                  <h3 className="text-xl font-bold mb-4">Want a lift kit?</h3>
                  <div className="grid gap-2">
                    <button onClick={() => handleLiftAnswer('no')} className="btn btn-outline btn-lg justify-start">
                      No lift - keep it stock height
                    </button>
                    <button onClick={() => handleLiftAnswer('leveling')} className="btn btn-outline btn-lg justify-start">
                      Leveling kit only
                    </button>
                    <button onClick={() => handleLiftAnswer('small')} className="btn btn-outline btn-lg justify-start">
                      Small lift (2-3")
                    </button>
                    <button onClick={() => handleLiftAnswer('big')} className="btn btn-outline btn-lg justify-start">
                      Big lift (4"+)
                    </button>
                    <button onClick={() => handleLiftAnswer('any')} className="btn btn-ghost btn-sm mt-2">
                      Show me everything
                    </button>
                  </div>
                </>
              )}

              {/* Stance Question */}
              {quizStep === 'stance' && (
                <>
                  <h3 className="text-xl font-bold mb-4">How aggressive do you want it?</h3>
                  <div className="grid gap-2">
                    <button onClick={() => handleStanceAnswer('stock')} className="btn btn-outline btn-lg justify-start">
                      Stock look - wheels tucked in
                    </button>
                    <button onClick={() => handleStanceAnswer('flush')} className="btn btn-outline btn-lg justify-start">
                      Flush - wheels even with fenders
                    </button>
                    <button onClick={() => handleStanceAnswer('aggressive')} className="btn btn-outline btn-lg justify-start">
                      Aggressive - wheels poking out
                    </button>
                    <button onClick={() => handleStanceAnswer('super')} className="btn btn-outline btn-lg justify-start">
                      Super aggressive - way out there
                    </button>
                    <button onClick={() => handleStanceAnswer('any')} className="btn btn-ghost btn-sm mt-2">
                      Show me everything
                    </button>
                  </div>
                </>
              )}

              {/* Rubbing Question */}
              {quizStep === 'rubbing' && (
                <>
                  <h3 className="text-xl font-bold mb-4">OK if the tires rub at full turn?</h3>
                  <p className="text-sm opacity-60 mb-4">Some aggressive setups may rub when turning all the way</p>
                  <div className="grid gap-2">
                    <button onClick={() => handleRubbingAnswer(false)} className="btn btn-outline btn-lg justify-start">
                      No rubbing - must be clean
                    </button>
                    <button onClick={() => handleRubbingAnswer(true)} className="btn btn-outline btn-lg justify-start">
                      Some rubbing is fine
                    </button>
                  </div>
                </>
              )}

              {/* Trimming Question */}
              {quizStep === 'trimming' && (
                <>
                  <h3 className="text-xl font-bold mb-4">OK with trimming plastic?</h3>
                  <p className="text-sm opacity-60 mb-4">Some setups need minor trimming of fender liners or mud flaps</p>
                  <div className="grid gap-2">
                    <button onClick={() => handleTrimmingAnswer(false)} className="btn btn-outline btn-lg justify-start">
                      No trimming - bolt on only
                    </button>
                    <button onClick={() => handleTrimmingAnswer(true)} className="btn btn-outline btn-lg justify-start">
                      Trimming is fine
                    </button>
                  </div>
                </>
              )}

            </div>
          </div>
        )}

        {/* RESULTS */}
        {quizStep === 'done' && (
          <>
            {/* Summary */}
            <div className="flex flex-wrap gap-2 justify-center mb-6">
              <span className="badge badge-lg">
                {answers.lift === 'no' ? 'Stock' : 
                 answers.lift === 'leveling' ? 'Leveling' :
                 answers.lift === 'small' ? '2-3" Lift' :
                 answers.lift === 'big' ? '4"+ Lift' : 'Any Lift'}
              </span>
              <span className="badge badge-lg">
                {answers.stance === 'stock' ? 'Stock Stance' :
                 answers.stance === 'flush' ? 'Flush' :
                 answers.stance === 'aggressive' ? 'Aggressive' :
                 answers.stance === 'super' ? 'Super Aggressive' : 'Any Stance'}
              </span>
              <span className={`badge badge-lg ${answers.rubbingOk ? 'badge-warning' : 'badge-success'}`}>
                {answers.rubbingOk ? 'Rubbing OK' : 'No Rubbing'}
              </span>
              <span className={`badge badge-lg ${answers.trimmingOk ? 'badge-warning' : 'badge-success'}`}>
                {answers.trimmingOk ? 'Trimming OK' : 'No Trimming'}
              </span>
              <button onClick={resetQuiz} className="btn btn-ghost btn-xs">
                Change
              </button>
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex justify-center py-12">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            {/* Results */}
            {!loading && !error && fitments.length > 0 && (
              <div className="space-y-4">
                <p className="text-center text-sm opacity-60">{fitments.length} setups match</p>
                
                {fitments.slice(0, 20).map((fit, index) => (
                  <div key={index} className="card bg-base-100 shadow">
                    <div className="card-body p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-lg">
                            {fit.wheel_diameter}x{fit.wheel_width} ET{fit.wheel_offset}
                          </h3>
                          <p className="text-primary font-semibold">{fit.tire_size}</p>
                          <p className="text-sm opacity-60">{fit.suspension_type || 'Stock'}</p>
                        </div>
                        <div className="text-right">
                          <span className={`badge ${
                            fit.stance?.includes('Super') ? 'badge-error' :
                            fit.stance?.includes('Aggressive') ? 'badge-warning' :
                            'badge-ghost'
                          }`}>
                            {fit.stance || 'Stock'}
                          </span>
                        </div>
                      </div>
                      <div className="card-actions mt-2">
                        <a
                          href={`/quote?wheel=${fit.wheel_diameter}x${fit.wheel_width}&offset=${fit.wheel_offset}&tire=${encodeURIComponent(fit.tire_size)}&lift=${encodeURIComponent(fit.suspension_type || 'Stock')}&vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`}
                          className="btn btn-primary btn-sm"
                        >
                          Get Quote
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
                
                {fitments.length > 20 && (
                  <p className="text-center text-sm opacity-60">
                    Showing 20 of {fitments.length} options
                  </p>
                )}
              </div>
            )}

            {/* No Results */}
            {!loading && !error && fitments.length === 0 && (
              <div className="card bg-base-100">
                <div className="card-body text-center">
                  <h3 className="font-bold text-lg">No exact matches</h3>
                  <p className="opacity-60">Try adjusting your preferences or contact us</p>
                  <div className="card-actions justify-center mt-4">
                    <button onClick={resetQuiz} className="btn btn-outline">
                      Try Again
                    </button>
                    <a href="#services" className="btn btn-primary">
                      Contact Us
                    </a>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  );
}
