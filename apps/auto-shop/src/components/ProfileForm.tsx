import { actions } from "astro:actions";
import { useState } from "react";

// Profile type matches Payload CMS structure
interface Profile {
  name: string;
  tagline?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
  } | null;
  heroImage?: { url?: string | null } | number | null;
  social?: {
    instagram?: string | null;
    facebook?: string | null;
  } | null;
  financingUrl?: string | null;
}

export function ProfileForm({ profile }: { profile: Profile }) {
  // Convert nested Payload structure to flat form fields
  const [formData, setFormData] = useState({
    name: profile.name || "",
    tagline: profile.tagline || "",
    description: profile.description || "",
    phone: profile.phone || "",
    email: profile.email || "",
    address: profile.address?.street || "",
    city: profile.address?.city || "",
    state: profile.address?.state || "",
    zip: profile.address?.zip || "",
    heroImage: typeof profile.heroImage === 'object' ? profile.heroImage?.url || "" : "",
    instagram: profile.social?.instagram || "",
    facebook: profile.social?.facebook || "",
    financingUrl: profile.financingUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Convert flat form data to nested Payload structure
    const payloadData = {
      name: formData.name || undefined,
      tagline: formData.tagline || undefined,
      description: formData.description || undefined,
      phone: formData.phone || undefined,
      email: formData.email || undefined,
      address: {
        street: formData.address || undefined,
        city: formData.city || undefined,
        state: formData.state || undefined,
        zip: formData.zip || undefined,
      },
      social: {
        instagram: formData.instagram || undefined,
        facebook: formData.facebook || undefined,
      },
      financingUrl: formData.financingUrl || undefined,
    };

    // Use type assertion as Astro action types may be stale
    const { error } = await (actions.updateProfile as any)(payloadData);

    if (error) {
      setMessage("Error saving profile");
    } else {
      setMessage("Profile saved!");
    }
    setSaving(false);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Basic Info</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Business Name</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Tagline</span>
            </label>
            <input
              type="text"
              name="tagline"
              value={formData.tagline}
              onChange={handleChange}
              placeholder="Your trusted local auto service"
              className="input input-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Description</span>
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Tell customers about your business..."
              className="textarea textarea-bordered"
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Hero Image URL</span>
            </label>
            <input
              type="url"
              name="heroImage"
              value={formData.heroImage}
              onChange={handleChange}
              placeholder="https://example.com/hero.jpg"
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Contact Info</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="info@autoshop.com"
                className="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Address</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Street Address</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 Main St"
              className="input input-bordered"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">City</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">State</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">ZIP</span>
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                className="input input-bordered"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title">Social & Financing</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Instagram</span>
              </label>
              <input
                type="text"
                name="instagram"
                value={formData.instagram}
                onChange={handleChange}
                placeholder="@yourshop"
                className="input input-bordered"
              />
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Facebook</span>
              </label>
              <input
                type="text"
                name="facebook"
                value={formData.facebook}
                onChange={handleChange}
                placeholder="YourShopPage"
                className="input input-bordered"
              />
            </div>
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Financing URL</span>
            </label>
            <input
              type="url"
              name="financingUrl"
              value={formData.financingUrl}
              onChange={handleChange}
              placeholder="https://financing-provider.com/apply"
              className="input input-bordered"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </button>
        {message && (
          <div className={`alert ${message.includes("Error") ? "alert-error" : "alert-success"} py-2`}>
            <span>{message}</span>
          </div>
        )}
      </div>
    </form>
  );
}
