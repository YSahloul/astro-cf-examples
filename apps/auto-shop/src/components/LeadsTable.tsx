import { useState, useEffect } from "react";
import { actions } from "astro:actions";

interface LeadWithAI {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  vehicle: string | null;
  service: string | null;
  message: string | null;
  status: string | null;
  createdAt: string | null;
  vehicleYear: number | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  intent: string | null;
  quoteId: string | null;
  source: string | null;
}

const INTENT_LABELS: Record<string, string> = {
  tires_only: "Tires Only",
  wheels_only: "Wheels Only",
  wheels_and_tires: "Wheels & Tires",
  package: "Package Deal",
  package_and_lift: "Package + Lift",
};

const STATUS_BADGES: Record<string, string> = {
  new: "badge-info",
  contacted: "badge-warning",
  converted: "badge-success",
  closed: "badge-neutral",
};

export default function LeadsTable() {
  const [leads, setLeads] = useState<LeadWithAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [intentFilter, setIntentFilter] = useState<string>("");
  const [makeFilter, setMakeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchLeads();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    try {
      const result = await actions.getLeadsWithAI();
      if (result.error) {
        setError("Failed to fetch leads");
        return;
      }
      setLeads(result.data || []);
    } catch (err) {
      setError("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }

  const uniqueIntents = [...new Set(leads.map((l) => l.intent).filter(Boolean))];
  const uniqueMakes = [...new Set(leads.map((l) => l.vehicleMake).filter(Boolean))];
  const uniqueStatuses = [...new Set(leads.map((l) => l.status).filter(Boolean))];

  const filteredLeads = leads
    .filter((lead) => {
      if (intentFilter && lead.intent !== intentFilter) return false;
      if (makeFilter && lead.vehicleMake !== makeFilter) return false;
      if (statusFilter && lead.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  }

  function formatVehicle(lead: LeadWithAI) {
    if (lead.vehicleYear && lead.vehicleMake && lead.vehicleModel) {
      return `${lead.vehicleYear} ${lead.vehicleMake} ${lead.vehicleModel}`;
    }
    return lead.vehicle || "-";
  }

  async function updateStatus(id: number, status: string) {
    try {
      await actions.updateLeadStatus({ id, status: status as any });
      setLeads((prev) =>
        prev.map((lead) => (lead.id === id ? { ...lead, status } : lead))
      );
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error">
        <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span>{error}</span>
        <button onClick={fetchLeads} className="btn btn-sm">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Intent</span>
          </label>
          <select
            value={intentFilter}
            onChange={(e) => setIntentFilter(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">All Intents</option>
            {uniqueIntents.map((intent) => (
              <option key={intent} value={intent!}>
                {INTENT_LABELS[intent!] || intent}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Vehicle Make</span>
          </label>
          <select
            value={makeFilter}
            onChange={(e) => setMakeFilter(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">All Makes</option>
            {uniqueMakes.map((make) => (
              <option key={make} value={make!}>
                {make}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Status</span>
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="select select-bordered select-sm"
          >
            <option value="">All Statuses</option>
            {uniqueStatuses.map((status) => (
              <option key={status} value={status!}>
                {status!.charAt(0).toUpperCase() + status!.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Sort by Date</span>
          </label>
          <button
            onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))}
            className="btn btn-ghost btn-sm"
          >
            {sortOrder === "desc" ? "Newest First ↓" : "Oldest First ↑"}
          </button>
        </div>

        {(intentFilter || makeFilter || statusFilter) && (
          <button
            onClick={() => {
              setIntentFilter("");
              setMakeFilter("");
              setStatusFilter("");
            }}
            className="btn btn-ghost btn-sm"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm opacity-60">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="table table-zebra">
          <thead>
            <tr>
              <th>Name</th>
              <th>Contact</th>
              <th>Vehicle</th>
              <th>Intent</th>
              <th>Quote</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-8 opacity-60">
                  No leads found
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <div className="font-bold">{lead.name}</div>
                    {lead.source && (
                      <div className="text-xs opacity-60">via {lead.source}</div>
                    )}
                  </td>
                  <td>
                    <div className="text-sm">
                      {lead.email && (
                        <a href={`mailto:${lead.email}`} className="link link-primary block">
                          {lead.email}
                        </a>
                      )}
                      {lead.phone && (
                        <a href={`tel:${lead.phone}`} className="opacity-70 block">
                          {lead.phone}
                        </a>
                      )}
                      {!lead.email && !lead.phone && "-"}
                    </div>
                  </td>
                  <td className="text-sm">{formatVehicle(lead)}</td>
                  <td>
                    {lead.intent ? (
                      <span className="badge badge-secondary badge-sm">
                        {INTENT_LABELS[lead.intent] || lead.intent}
                      </span>
                    ) : (
                      <span className="opacity-60">-</span>
                    )}
                  </td>
                  <td>
                    {lead.quoteId ? (
                      <a
                        href={`/quote/${lead.quoteId}`}
                        className="link link-primary text-sm font-mono"
                      >
                        {lead.quoteId.substring(0, 12)}...
                      </a>
                    ) : (
                      <span className="opacity-60">-</span>
                    )}
                  </td>
                  <td>
                    <select
                      value={lead.status || "new"}
                      onChange={(e) => updateStatus(lead.id, e.target.value)}
                      className={`select select-bordered select-xs ${STATUS_BADGES[lead.status || "new"] || ""}`}
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td className="text-sm opacity-60">{formatDate(lead.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
