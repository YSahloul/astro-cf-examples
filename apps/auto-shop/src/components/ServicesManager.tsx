import { actions } from "astro:actions";
import { useState } from "react";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: string;
  featured: boolean;
}

export function ServicesManager({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [editing, setEditing] = useState<number | null>(null);
  const [newService, setNewService] = useState({
    name: "",
    description: "",
    price: 0,
    duration: "",
    featured: false,
  });
  const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await actions.addService(newService);
    if (!error && data) {
      setServices([...services, { ...newService, id: data.id }]);
      setNewService({ name: "", description: "", price: 0, duration: "", featured: false });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this service?")) return;
    const { error } = await actions.deleteService({ id });
    if (!error) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  const handleUpdate = async (service: Service) => {
    const { error } = await actions.updateService(service);
    if (!error) {
      setServices(services.map((s) => (s.id === service.id ? service : s)));
      setEditing(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="opacity-60">{services.length} services</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "Cancel" : "+ Add Service"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">New Service</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Name</span>
                </label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Price ($)</span>
                </label>
                <input
                  type="number"
                  value={newService.price}
                  onChange={(e) => setNewService({ ...newService, price: Number(e.target.value) })}
                  className="input input-bordered"
                />
              </div>
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="textarea textarea-bordered"
                rows={3}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Duration</span>
                </label>
                <input
                  type="text"
                  value={newService.duration}
                  onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                  placeholder="e.g., 30 min"
                  className="input input-bordered"
                />
              </div>
              <div className="form-control">
                <label className="label cursor-pointer justify-start gap-3">
                  <input
                    type="checkbox"
                    checked={newService.featured}
                    onChange={(e) => setNewService({ ...newService, featured: e.target.checked })}
                    className="checkbox checkbox-primary"
                  />
                  <span className="label-text">Featured service</span>
                </label>
              </div>
            </div>
            <div className="card-actions justify-end mt-4">
              <button type="submit" className="btn btn-primary">
                Add Service
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {services.map((service) => (
          <div key={service.id} className="card bg-base-200">
            <div className="card-body">
              {editing === service.id ? (
                <EditForm
                  service={service}
                  onSave={handleUpdate}
                  onCancel={() => setEditing(null)}
                />
              ) : (
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="card-title">{service.name}</h3>
                      {service.featured && (
                        <span className="badge badge-primary">Featured</span>
                      )}
                    </div>
                    {service.description && (
                      <p className="opacity-70 mb-3">{service.description}</p>
                    )}
                    <div className="flex gap-4 text-sm">
                      {service.price > 0 && (
                        <span className="font-bold">${service.price}</span>
                      )}
                      {service.duration && (
                        <span className="opacity-60">{service.duration}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditing(service.id)}
                      className="btn btn-ghost btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="btn btn-error btn-outline btn-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !showForm && (
        <div className="text-center py-16 bg-base-200 rounded-box">
          <div className="w-16 h-16 bg-primary/10 rounded-box flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
          </div>
          <p className="opacity-60">No services yet. Add your first service to get started!</p>
        </div>
      )}
    </div>
  );
}

function EditForm({
  service,
  onSave,
  onCancel,
}: {
  service: Service;
  onSave: (s: Service) => void;
  onCancel: () => void;
}) {
  const [data, setData] = useState(service);

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <input
          type="text"
          value={data.name}
          onChange={(e) => setData({ ...data, name: e.target.value })}
          className="input input-bordered"
          placeholder="Name"
        />
        <input
          type="number"
          value={data.price}
          onChange={(e) => setData({ ...data, price: Number(e.target.value) })}
          className="input input-bordered"
          placeholder="Price"
        />
      </div>
      <textarea
        value={data.description}
        onChange={(e) => setData({ ...data, description: e.target.value })}
        className="textarea textarea-bordered w-full"
        rows={3}
        placeholder="Description"
      />
      <div className="flex gap-4 items-center">
        <input
          type="text"
          value={data.duration}
          onChange={(e) => setData({ ...data, duration: e.target.value })}
          placeholder="Duration"
          className="input input-bordered"
        />
        <label className="label cursor-pointer gap-2">
          <input
            type="checkbox"
            checked={data.featured}
            onChange={(e) => setData({ ...data, featured: e.target.checked })}
            className="checkbox checkbox-primary"
          />
          <span className="label-text">Featured</span>
        </label>
      </div>
      <div className="flex gap-3">
        <button onClick={() => onSave(data)} className="btn btn-primary">
          Save
        </button>
        <button onClick={onCancel} className="btn btn-ghost">
          Cancel
        </button>
      </div>
    </div>
  );
}
