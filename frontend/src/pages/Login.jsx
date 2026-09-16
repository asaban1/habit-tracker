import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PulseMark from "../components/PulseMark";
import { isValidEmail } from "../utils/validation";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  function validate() {
    const errors = {};
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      errors.email = "Enter a valid email address";
    }
    if (!password) {
      errors.password = "Password is required";
    }
    return errors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 404) {
        setFormError("No account found with this email address.");
      } else if (status === 401) {
        setFormError("Incorrect password. Please try again.");
      } else {
        setFormError(detail || "Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <PulseMark width={64} height={16} strokeWidth={2} />
          <span className="auth-eyebrow">Habit Tracker</span>
          <h1>Welcome back</h1>
          <span className="auth-subtitle">Log in to see how today compares to your baseline.</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`input ${fieldErrors.email ? "invalid" : ""}`}
            />
            {fieldErrors.email && <p className="field-error">{fieldErrors.email}</p>}
          </div>
          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input ${fieldErrors.password ? "invalid" : ""}`}
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="auth-footer">
          No account yet? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
}