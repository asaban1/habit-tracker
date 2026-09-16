import { useState } from "react";
import { updateEntry } from "../api/entries";
import { validateEntryForm } from "../utils/validation";

export default function EditEntryModal({ entry, onClose, onSaved }) {
  const [form, setForm] = useState({
    entry_date: entry.entry_date,
    sleep_hours: entry.sleep_hours ?? "",
    sleep_quality: entry.sleep_quality ?? "",
    nutrition_quality: entry.nutrition_quality ?? "",
    physical_activity: entry.physical_activity ?? "",
    stress_level: entry.stress_level ?? "",
    energy_level: entry.energy_level ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const errors = validateEntryForm(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    const payload = {
      sleep_hours: form.sleep_hours === "" ? null : Number(form.sleep_hours),
      sleep_quality: form.sleep_quality === "" ? null : Number(form.sleep_quality),
      nutrition_quality: form.nutrition_quality === "" ? null : Number(form.nutrition_quality),
      physical_activity: form.physical_activity === "" ? null : Number(form.physical_activity),
      stress_level: form.stress_level === "" ? null : Number(form.stress_level),
      energy_level: form.energy_level === "" ? null : Number(form.energy_level),
    };

    try {
      await updateEntry(entry.id, payload);
      onSaved();
    } catch (err) {
      setFormError(err.response?.data?.detail || "Failed to update entry.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit entry — {entry.entry_date}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <div className="field">
              <label>Sleep hours <span className="hint">0–24</span></label>
              <input
                type="number" step="0.1" name="sleep_hours"
                value={form.sleep_hours} onChange={handleChange}
                className={`input ${fieldErrors.sleep_hours ? "invalid" : ""}`}
              />
              {fieldErrors.sleep_hours && <p className="field-error">{fieldErrors.sleep_hours}</p>}
            </div>
            <div className="field">
              <label>Sleep quality <span className="hint">1–10</span></label>
              <input
                type="number" step="1" name="sleep_quality"
                value={form.sleep_quality} onChange={handleChange}
                className={`input ${fieldErrors.sleep_quality ? "invalid" : ""}`}
              />
              {fieldErrors.sleep_quality && <p className="field-error">{fieldErrors.sleep_quality}</p>}
            </div>
            <div className="field">
              <label>Nutrition quality <span className="hint">1–10</span></label>
              <input
                type="number" step="1" name="nutrition_quality"
                value={form.nutrition_quality} onChange={handleChange}
                className={`input ${fieldErrors.nutrition_quality ? "invalid" : ""}`}
              />
              {fieldErrors.nutrition_quality && <p className="field-error">{fieldErrors.nutrition_quality}</p>}
            </div>
            <div className="field">
              <label>Physical activity <span className="hint">min</span></label>
              <input
                type="number" step="1" name="physical_activity"
                value={form.physical_activity} onChange={handleChange}
                className={`input ${fieldErrors.physical_activity ? "invalid" : ""}`}
              />
              {fieldErrors.physical_activity && <p className="field-error">{fieldErrors.physical_activity}</p>}
            </div>
            <div className="field">
              <label>Stress level <span className="hint">1–10</span></label>
              <input
                type="number" step="1" name="stress_level"
                value={form.stress_level} onChange={handleChange}
                className={`input ${fieldErrors.stress_level ? "invalid" : ""}`}
              />
              {fieldErrors.stress_level && <p className="field-error">{fieldErrors.stress_level}</p>}
            </div>
            <div className="field">
              <label>Energy level <span className="hint">1–10</span></label>
              <input
                type="number" step="1" name="energy_level"
                value={form.energy_level} onChange={handleChange}
                className={`input ${fieldErrors.energy_level ? "invalid" : ""}`}
              />
              {fieldErrors.energy_level && <p className="field-error">{fieldErrors.energy_level}</p>}
            </div>
          </div>

          {formError && <p className="error-text">{formError}</p>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} style={{ width: "auto" }}>
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "auto" }}>
              {loading ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}