import { actions } from "astro:actions";
import { useState } from "react";

interface Service {
  id: number;
  name: string;
}

export function AppointmentForm({ services }: { services: Service[] }) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    vehicle: "",
    service: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      // Parse vehicle string into object if provided
      // Expected format: "2024 Toyota Tacoma" or similar
      const vehicleParts = formData.vehicle.trim().split(' ');
      const vehicleObj = vehicleParts.length >= 2 ? {
        year: parseInt(vehicleParts[0]) || undefined,
        make: vehicleParts[1] || undefined,
        model: vehicleParts.slice(2).join(' ') || undefined,
      } : undefined;

      // Use type assertion as Astro action types may be stale
      const { error } = await (actions.addLead as any)({
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        vehicle: vehicleObj,
        service: formData.service || undefined,
        message: formData.message || undefined,
        source: 'website',
      });
      if (error) {
        setStatus("error");
        setErrorMessage("Something went wrong. Please try again.");
      } else {
        setStatus("success");
        setFormData({ name: "", phone: "", email: "", vehicle: "", service: "", message: "" });
      }
    } catch (err) {
      setStatus("error");
      setErrorMessage("Something went wrong. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="bg-primary p-8 text-center">
        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-black uppercase text-white mb-2" style={{ fontFamily: "'Oswald', sans-serif" }}>
          Request Received!
        </h3>
        <p className="text-white/80 mb-6">We'll get back to you within 24 hours.</p>
        <button
          onClick={() => setStatus("idle")}
          className="bg-white text-primary font-bold uppercase px-6 py-3 hover:bg-gray-100"
        >
          Submit Another Request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name & Phone - required */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg"
            placeholder="John Smith"
          />
        </div>
        <div>
          <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Phone *</label>
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg"
            placeholder="(555) 123-4567"
          />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg"
          placeholder="john@email.com"
        />
      </div>

      {/* Vehicle */}
      <div>
        <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Vehicle (Year, Make, Model)</label>
        <input
          type="text"
          value={formData.vehicle}
          onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg"
          placeholder="2022 Ford F-150"
        />
      </div>

      {/* Service */}
      <div>
        <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Service Needed</label>
        <select
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg bg-white"
        >
          <option value="">Select a service...</option>
          {services.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="block text-sm font-bold uppercase text-gray-600 mb-1">Additional Details</label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 border-2 border-gray-200 focus:border-primary focus:outline-none text-lg resize-none"
          placeholder="Tell us about your project or any questions..."
        />
      </div>

      {errorMessage && (
        <p className="text-red-600 font-bold">{errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full bg-primary text-white text-xl font-black uppercase py-4 hover:bg-[#119924] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        {status === "loading" ? "Sending..." : "Get Free Quote"}
      </button>

      <p className="text-center text-sm text-gray-500">
        We'll respond within 24 hours. No spam, ever.
      </p>
    </form>
  );
}
