import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createEntry } from "../api/entries";
import { validateEntryForm } from "../utils/validation";

const today = new Date().toISOString().split("T")[0];

export default function NewEntry() {
  const [form, setForm] = useState({
    entry_date: today,
    sleep_hours: "",
    sleep_quality: "",
    nutrition_quality: "",
    physical_activity: "",
    stress_level: "",
    energy_level: "",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

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

    if (!form.entry_date || form.entry_date.trim() === "") {
      setFormError("Please select a date before saving.");
      return;
    }

    setLoading(true);

    const payload = {
      entry_date: form.entry_date,
      sleep_hours: form.sleep_hours === "" ? null : Number(form.sleep_hours),
      sleep_quality: form.sleep_quality === "" ? null : Number(form.sleep_quality),
      nutrition_quality: form.nutrition_quality === "" ? null : Number(form.nutrition_quality),
      physical_activity: form.physical_activity === "" ? null : Number(form.physical_activity),
      stress_level: form.stress_level === "" ? null : Number(form.stress_level),
      energy_level: form.energy_level === "" ? null : Number(form.energy_level),
    };

    try {
      await createEntry(payload);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 400) {
        setFormError(detail || "An entry for this date already exists.");
      } else if (status === 422) {
        setFormError("Please check the highlighted fields and try again.");
      } else {
        setFormError(detail || "Failed to save entry. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="centered-page">
      <div className="page-header" style={{ display: "block" }}>
        <span className="eyebrow">Daily log</span>
        <h1>New entry</h1>
        <span className="page-subtitle">
          A couple of minutes today gives your baseline one more reference point.
        </span>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-section">
            <span className="form-section-title">Date</span>
            <div className="field">
              <input
                type="date"
                name="entry_date"
                value={form.entry_date}
                onChange={handleChange}
                max={today}
                className={`input ${fieldErrors.entry_date ? "invalid" : ""}`}
              />
              {fieldErrors.entry_date && <p className="field-error">{fieldErrors.entry_date}</p>}
            </div>
          </div>

          <div className="form-section">
            <span className="form-section-title">Sleep</span>
            <div className="form-grid">
              <div className="field">
                <label>Sleep hours <span className="hint">0–24</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="sleep_hours"
                  value={form.sleep_hours}
                  onChange={handleChange}
                  className={`input ${fieldErrors.sleep_hours ? "invalid" : ""}`}
                />
                {fieldErrors.sleep_hours && <p className="field-error">{fieldErrors.sleep_hours}</p>}
              </div>
              <div className="field">
                <label>Sleep quality <span className="hint">1–10</span></label>
                <input
                  type="number"
                  step="1"
                  name="sleep_quality"
                  value={form.sleep_quality}
                  onChange={handleChange}
                  className={`input ${fieldErrors.sleep_quality ? "invalid" : ""}`}
                />
                {fieldErrors.sleep_quality && <p className="field-error">{fieldErrors.sleep_quality}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <span className="form-section-title">Nutrition &amp; activity</span>
            <div className="form-grid">
              <div className="field">
                <label>Nutrition quality <span className="hint">1–10</span></label>
                <input
                  type="number"
                  step="1"
                  name="nutrition_quality"
                  value={form.nutrition_quality}
                  onChange={handleChange}
                  className={`input ${fieldErrors.nutrition_quality ? "invalid" : ""}`}
                />
                {fieldErrors.nutrition_quality && <p className="field-error">{fieldErrors.nutrition_quality}</p>}
              </div>
              <div className="field">
                <label>Physical activity <span className="hint">min</span></label>
                <input
                  type="number"
                  step="1"
                  name="physical_activity"
                  value={form.physical_activity}
                  onChange={handleChange}
                  className={`input ${fieldErrors.physical_activity ? "invalid" : ""}`}
                />
                {fieldErrors.physical_activity && <p className="field-error">{fieldErrors.physical_activity}</p>}
              </div>
            </div>
          </div>

          <div className="form-section">
            <span className="form-section-title">Mood</span>
            <div className="form-grid">
              <div className="field">
                <label>Stress level <span className="hint">1–10</span></label>
                <input
                  type="number"
                  step="1"
                  name="stress_level"
                  value={form.stress_level}
                  onChange={handleChange}
                  className={`input ${fieldErrors.stress_level ? "invalid" : ""}`}
                />
                {fieldErrors.stress_level && <p className="field-error">{fieldErrors.stress_level}</p>}
              </div>
              <div className="field">
                <label>Energy level <span className="hint">1–10</span></label>
                <input
                  type="number"
                  step="1"
                  name="energy_level"
                  value={form.energy_level}
                  onChange={handleChange}
                  className={`input ${fieldErrors.energy_level ? "invalid" : ""}`}
                />
                {fieldErrors.energy_level && <p className="field-error">{fieldErrors.energy_level}</p>}
              </div>
            </div>
          </div>

          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: 8 }}>
            {loading ? "Saving..." : "Save entry"}
          </button>
        </form>
      </div>
    </div>
  );
}