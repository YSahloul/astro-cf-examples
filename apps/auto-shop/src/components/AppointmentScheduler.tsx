import { useState, useEffect } from "react";

interface Service {
  id: number;
  name: string;
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

type Step = "service" | "datetime" | "contact" | "success";

export function AppointmentScheduler({ services }: { services: Service[] }) {
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<string>("");
  const [preferredDate, setPreferredDate] = useState<string>("");
  const [preferredTime, setPreferredTime] = useState<string>("");
  const [contact, setContact] = useState({ name: "", phone: "", vehicle: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  // Listen for vehicle selection from hero
  useEffect(() => {
    const handleVehicleIntent = (e: Event) => {
      const event = e as VehicleIntentEvent;
      const { vehicle } = event.detail;
      const vehicleString = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
      setContact(prev => ({ ...prev, vehicle: vehicleString }));
    };

    window.addEventListener('vehicle-intent-set', handleVehicleIntent);
    return () => window.removeEventListener('vehicle-intent-set', handleVehicleIntent);
  }, []);

  const timeSlots = [
    "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM",
    "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
  ];

  const availableDates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  }).filter(d => d.getDay() !== 0);

  const handleServiceSelect = (serviceName: string) => {
    setSelectedService(serviceName);
    setStep("datetime");
  };

  const handleDateTimeNext = () => {
    if (preferredDate && preferredTime) {
      setStep("contact");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: selectedService,
          preferredDate,
          preferredTime,
          ...contact,
        }),
      });

      if (res.ok) {
        setStep("success");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const formatDate = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return {
      day: days[date.getDay()],
      date: date.getDate(),
      month: months[date.getMonth()],
      full: date.toISOString().split("T")[0],
    };
  };

  const stepNumber = step === "service" ? 1 : step === "datetime" ? 2 : step === "contact" ? 3 : 3;

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6 md:p-10">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-black uppercase mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Schedule Your <span className="text-primary">Service</span>
        </h2>
        {contact.vehicle ? (
          <p className="text-base-content/60">
            For your <span className="font-bold text-primary">{contact.vehicle}</span>
          </p>
        ) : (
          <p className="text-base-content/60">Book online in seconds</p>
        )}
      </div>

      {/* Progress Steps */}
      {step !== "success" && (
        <ul className="steps steps-horizontal w-full mb-10">
          <li className={`step ${stepNumber >= 1 ? "step-primary" : ""}`}>Service</li>
          <li className={`step ${stepNumber >= 2 ? "step-primary" : ""}`}>Date & Time</li>
          <li className={`step ${stepNumber >= 3 ? "step-primary" : ""}`}>Your Info</li>
        </ul>
      )}

      {/* Step 1: Service Selection - Two Columns */}
      {step === "service" && (
        <div>
          <p className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-4">
            What do you need today?
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => handleServiceSelect(s.name)}
                className="flex items-center justify-between p-4 bg-base-200 hover:bg-primary hover:text-primary-content rounded-lg transition-all"
              >
                <span className="font-bold">{s.name}</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Date & Time Selection - Two Columns */}
      {step === "datetime" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep("service")} className="btn btn-ghost btn-sm gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <span className="badge badge-primary badge-lg">{selectedService}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left: Date Picker */}
            <div>
              <p className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-4">Select a Date</p>
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map((date) => {
                  const d = formatDate(date);
                  const isSelected = preferredDate === d.full;
                  return (
                    <button
                      key={d.full}
                      onClick={() => setPreferredDate(d.full)}
                      className={`flex flex-col items-center justify-center py-3 rounded-lg border-2 transition-all ${
                        isSelected ? "border-primary bg-primary text-primary-content" : "border-base-300 hover:border-primary"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase opacity-70">{d.day}</span>
                      <span className="text-xl font-black">{d.date}</span>
                      <span className="text-xs opacity-70">{d.month}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right: Time Picker */}
            <div>
              <p className="font-bold text-sm uppercase tracking-wide text-base-content/60 mb-4">Select a Time</p>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => {
                  const isSelected = preferredTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setPreferredTime(time)}
                      className={`py-3 px-4 rounded-lg border-2 font-bold transition-all ${
                        isSelected ? "border-primary bg-primary text-primary-content" : "border-base-300 hover:border-primary"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {preferredDate && preferredTime && (
            <button onClick={handleDateTimeNext} className="btn btn-primary btn-block btn-lg mt-8">
              Continue
            </button>
          )}
        </div>
      )}

      {/* Step 3: Contact Information - Two Columns */}
      {step === "contact" && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setStep("datetime")} className="btn btn-ghost btn-sm gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-right">
              <p className="font-bold">{selectedService}</p>
              <p className="text-sm text-base-content/60">
                {new Date(preferredDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })} at {preferredTime}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold">Name *</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="John Smith"
                  />
                </div>

                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-bold">Phone *</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    className="input input-bordered w-full"
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {contact.vehicle ? (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold">Vehicle</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-lg py-4 px-4 text-base">{contact.vehicle}</span>
                      <button 
                        type="button"
                        onClick={() => setContact({ ...contact, vehicle: "" })}
                        className="btn btn-ghost btn-xs"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="form-control">
                    <label className="label py-1">
                      <span className="label-text font-bold">Vehicle</span>
                    </label>
                    <input
                      type="text"
                      value={contact.vehicle}
                      onChange={(e) => setContact({ ...contact, vehicle: e.target.value })}
                      className="input input-bordered w-full"
                      placeholder="2023 Ford F-150"
                    />
                  </div>
                )}

                {status === "error" && (
                  <div className="alert alert-error">
                    <span>Something went wrong. Please try again.</span>
                  </div>
                )}
              </div>
            </div>

            <button type="submit" disabled={status === "loading"} className="btn btn-primary btn-block btn-lg mt-8">
              {status === "loading" ? <span className="loading loading-spinner loading-sm"></span> : "Confirm Appointment"}
            </button>
          </form>
        </div>
      )}

      {/* Success State */}
      {step === "success" && (
        <div className="text-center py-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-primary-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-2xl font-black uppercase mb-4" style={{ fontFamily: "'Oswald', sans-serif" }}>
            You're All Set!
          </h3>
          <p className="text-base-content/60">
            <strong>{selectedService}</strong><br />
            {new Date(preferredDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at {preferredTime}
          </p>
          <p className="text-sm text-base-content/50 mt-4">
            We'll text you at {contact.phone} to confirm.
          </p>
        </div>
      )}
    </div>
  );
}
