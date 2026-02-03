import { actions } from "astro:actions";
import { useState } from "react";

interface Testimonial {
  id: number;
  name: string;
  text: string;
  rating: number;
  date: string;
}

export function TestimonialsManager({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials);
  const [showForm, setShowForm] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    text: "",
    rating: 5,
    date: new Date().toISOString().split("T")[0],
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await actions.addTestimonial(newTestimonial);
    if (!error && data) {
      setTestimonials([{ ...newTestimonial, id: data.id }, ...testimonials]);
      setNewTestimonial({
        name: "",
        text: "",
        rating: 5,
        date: new Date().toISOString().split("T")[0],
      });
      setShowForm(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this testimonial?")) return;
    const { error } = await actions.deleteTestimonial({ id });
    if (!error) {
      setTestimonials(testimonials.filter((t) => t.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <p className="opacity-60">{testimonials.length} testimonials</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? "Cancel" : "+ Add Testimonial"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card bg-base-200">
          <div className="card-body">
            <h3 className="card-title">New Testimonial</h3>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Customer Name</span>
                </label>
                <input
                  type="text"
                  value={newTestimonial.name}
                  onChange={(e) =>
                    setNewTestimonial({ ...newTestimonial, name: e.target.value })
                  }
                  className="input input-bordered"
                  required
                />
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Rating</span>
                </label>
                <select
                  value={newTestimonial.rating}
                  onChange={(e) =>
                    setNewTestimonial({ ...newTestimonial, rating: Number(e.target.value) })
                  }
                  className="select select-bordered"
                >
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>
                      {"★".repeat(r)}{"☆".repeat(5 - r)} ({r})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Review</span>
              </label>
              <textarea
                value={newTestimonial.text}
                onChange={(e) =>
                  setNewTestimonial({ ...newTestimonial, text: e.target.value })
                }
                className="textarea textarea-bordered"
                rows={3}
                required
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Date</span>
              </label>
              <input
                type="date"
                value={newTestimonial.date}
                onChange={(e) =>
                  setNewTestimonial({ ...newTestimonial, date: e.target.value })
                }
                className="input input-bordered w-fit"
              />
            </div>

            <div className="card-actions justify-end mt-4">
              <button type="submit" className="btn btn-primary">
                Add Testimonial
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {testimonials.map((t) => (
          <div key={t.id} className="card bg-base-200">
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="rating rating-sm">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <input
                          key={star}
                          type="radio"
                          className="mask mask-star-2 bg-warning"
                          checked={star === t.rating}
                          disabled
                          readOnly
                        />
                      ))}
                    </div>
                    <span className="text-sm opacity-60">{t.date}</span>
                  </div>
                  <p className="opacity-80 mb-2">"{t.text}"</p>
                  <p className="font-bold">— {t.name}</p>
                </div>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="btn btn-error btn-outline btn-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {testimonials.length === 0 && !showForm && (
        <div className="text-center py-12 opacity-60">
          <p>No testimonials yet. Add customer reviews to build trust!</p>
        </div>
      )}
    </div>
  );
}
