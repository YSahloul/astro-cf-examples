import { useState, useEffect } from "react";

type Step = "year" | "make" | "model" | "goal" | "contact" | "success";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => CURRENT_YEAR - i);

const GOALS = [
  { id: "bigger_tires", label: "Bigger Tires", icon: "🛞", description: "Fit larger tires for off-road or looks" },
  { id: "new_wheels", label: "New Wheels", icon: "⚡", description: "Upgrade to aftermarket wheels" },
  { id: "lift_level", label: "Lift or Level", icon: "⬆️", description: "Raise your truck's stance" },
  { id: "aggressive_look", label: "Aggressive Look", icon: "💪", description: "Wheels that poke outside the fender" },
  { id: "not_sure", label: "Not Sure Yet", icon: "🤔", description: "Just exploring options" },
];

export function FitmentQuiz({ isOpen: initialOpen = false, onClose: externalOnClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [step, setStep] = useState<Step>("year");
  const [year, setYear] = useState<number | null>(null);
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [goal, setGoal] = useState("");
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);
  
  // Contact form
  const [contactData, setContactData] = useState({ name: "", phone: "", email: "" });
  const [submitStatus, setSubmitStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const onClose = () => {
    setIsOpen(false);
    externalOnClose?.();
  };

  // Listen for open event from Astro
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-fitment-quiz', handleOpen);
    return () => window.removeEventListener('open-fitment-quiz', handleOpen);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep("year");
        setYear(null);
        setMake("");
        setModel("");
        setGoal("");
        setContactData({ name: "", phone: "", email: "" });
        setSubmitStatus("idle");
      }, 300);
    }
  }, [isOpen]);

  // Fetch makes when year is selected
  useEffect(() => {
    if (year) {
      setMakes(["Chevrolet", "Ford", "GMC", "Ram", "Toyota", "Dodge", "Nissan", "Jeep"]);
    }
  }, [year]);

  // Fetch models when make is selected
  useEffect(() => {
    if (make) {
      fetchModels();
    }
  }, [make]);

  const fetchModels = async () => {
    try {
      const res = await fetch(`/api/fitment/models?make=${encodeURIComponent(make)}`);
      const data = await res.json() as { models?: string[] };
      setModels(data.models || []);
    } catch (err) {
      const fallbacks: Record<string, string[]> = {
        "Chevrolet": ["Silverado 1500", "Silverado 2500", "Colorado", "Tahoe", "Suburban"],
        "Ford": ["F-150", "F-250", "F-350", "Ranger", "Bronco", "Expedition"],
        "GMC": ["Sierra 1500", "Sierra 2500", "Canyon", "Yukon"],
        "Ram": ["1500", "2500", "3500"],
        "Toyota": ["Tacoma", "Tundra", "4Runner", "Sequoia"],
        "Dodge": ["Ram 1500", "Ram 2500", "Durango"],
        "Nissan": ["Titan", "Frontier"],
        "Jeep": ["Wrangler", "Gladiator", "Grand Cherokee"],
      };
      setModels(fallbacks[make] || []);
    }
  };

  const handleGoalSelect = (goalId: string) => {
    setGoal(goalId);
    setStep("contact");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitStatus("loading");
    
    try {
      const res = await fetch("/api/fitment/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactData.name,
          phone: contactData.phone,
          email: contactData.email,
          vehicle: `${year} ${make} ${model}`,
          goal: GOALS.find(g => g.id === goal)?.label || goal,
        }),
      });
      
      if (res.ok) {
        setSubmitStatus("success");
        setStep("success");
      } else {
        setSubmitStatus("error");
      }
    } catch (err) {
      setSubmitStatus("error");
    }
  };

  // Calculate progress percentage
  const getProgressPercent = () => {
    switch (step) {
      case "year": return 20;
      case "make": return 40;
      case "model": return 60;
      case "goal": return 80;
      case "contact": return 100;
      default: return 0;
    }
  };

  if (!isOpen) return null;

  const renderStep = () => {
    switch (step) {
      case "year":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                What year is your vehicle?
              </h3>
              <p className="text-base-content/60 mt-1">Let's find the perfect wheels & tires for you</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-64 overflow-y-auto">
              {YEARS.map((y) => (
                <button
                  key={y}
                  onClick={() => { setYear(y); setStep("make"); }}
                  className="btn btn-outline btn-sm h-auto py-3"
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
        );

      case "make":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Select your make
              </h3>
              <p className="text-base-content/60 mt-1">{year}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {makes.map((m) => (
                <button
                  key={m}
                  onClick={() => { setMake(m); setStep("model"); }}
                  className="btn btn-outline justify-start h-auto py-4"
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("year")} className="btn btn-ghost btn-sm">
              ← Back
            </button>
          </div>
        );

      case "model":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Select your model
              </h3>
              <p className="text-base-content/60 mt-1">{year} {make}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {models.map((m) => (
                <button
                  key={m}
                  onClick={() => { setModel(m); setStep("goal"); }}
                  className="btn btn-outline justify-start h-auto py-4"
                >
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("make")} className="btn btn-ghost btn-sm">
              ← Back
            </button>
          </div>
        );

      case "goal":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                What are you looking for?
              </h3>
              <p className="text-base-content/60 mt-1">{year} {make} {model}</p>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => handleGoalSelect(g.id)}
                  className="btn btn-outline justify-start h-auto p-4 gap-4"
                >
                  <span className="text-3xl">{g.icon}</span>
                  <div className="text-left">
                    <span className="font-black uppercase text-lg block">{g.label}</span>
                    <span className="text-base-content/60 text-sm font-normal">{g.description}</span>
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setStep("model")} className="btn btn-ghost btn-sm">
              ← Back
            </button>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
                Almost there!
              </h3>
              <p className="text-base-content/60 mt-1">We'll text you personalized recommendations</p>
            </div>

            <div className="alert alert-success">
              <div>
                <p className="font-bold text-sm mb-1">Your Vehicle</p>
                <p className="font-black text-lg">{year} {make} {model}</p>
                <p className="opacity-80">{GOALS.find(g => g.id === goal)?.label}</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold uppercase">Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="John Smith"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold uppercase">Phone *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={contactData.phone}
                  onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-bold uppercase">Email</span>
                </label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="input input-bordered w-full"
                  placeholder="john@email.com"
                />
              </div>

              {submitStatus === "error" && (
                <div className="alert alert-error">
                  <span>Something went wrong. Please try again.</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitStatus === "loading"}
                className="btn btn-primary w-full text-lg"
                style={{ fontFamily: "'Oswald', sans-serif" }}
              >
                {submitStatus === "loading" ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  "Get My Recommendations"
                )}
              </button>
              
              <p className="text-center text-xs text-base-content/60">
                We'll text you within minutes with personalized options for your {make}.
              </p>
            </form>

            <button onClick={() => setStep("goal")} className="btn btn-ghost btn-sm">
              ← Back
            </button>
          </div>
        );

      case "success":
        return (
          <div className="text-center py-8">
            <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-black uppercase mb-3" style={{ fontFamily: "'Oswald', sans-serif" }}>
              You're All Set!
            </h3>
            <p className="text-base-content/80 mb-2 text-lg">
              We're looking up the best options for your <strong>{year} {make} {model}</strong>.
            </p>
            <p className="text-base-content/60 mb-8">
              Check your phone — we'll text you shortly with personalized recommendations.
            </p>
            <button
              onClick={onClose}
              className="btn btn-neutral"
            >
              Done
            </button>
          </div>
        );
    }
  };

  return (
    <dialog className="modal modal-open">
      {/* Backdrop */}
      <div className="modal-backdrop bg-black/70" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="modal-box max-w-lg p-0 rounded-none">
        {/* Header */}
        <div className="bg-neutral text-neutral-content px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase" style={{ fontFamily: "'Oswald', sans-serif" }}>
            <span className="text-primary">Find</span> Your Fit
          </h2>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress */}
        {step !== "success" && (
          <progress 
            className="progress progress-primary w-full h-1 rounded-none" 
            value={getProgressPercent()} 
            max="100"
          ></progress>
        )}

        {/* Content */}
        <div className="p-6">
          {renderStep()}
        </div>
      </div>
    </dialog>
  );
}
