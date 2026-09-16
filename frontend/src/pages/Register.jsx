import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser, loginUser } from "../api/auth";
import { useAuth } from "../context/AuthContext";
import PulseMark from "../components/PulseMark";
import { isValidEmail, validatePassword } from "../utils/validation";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
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
      await registerUser({ email, password, full_name: fullName || null });
      const data = await loginUser({ email, password });
      login(data.access_token);
      navigate("/dashboard");
    } catch (err) {
      setFormError(err.response?.data?.detail || "Registration failed. Please try again.");
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
          <h1>Create your account</h1>
          <span className="auth-subtitle">Start logging your days to build a personal baseline.</span>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label>Full name <span className="hint">optional</span></label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
            />
          </div>
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
            <label>Password <span className="hint">min. 8 characters, 1 letter, 1 number</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input ${fieldErrors.password ? "invalid" : ""}`}
            />
            {fieldErrors.password && <p className="field-error">{fieldErrors.password}</p>}
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`input ${fieldErrors.confirmPassword ? "invalid" : ""}`}
            />
            {fieldErrors.confirmPassword && <p className="field-error">{fieldErrors.confirmPassword}</p>}
          </div>
          {formError && <p className="error-text">{formError}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </p>
      </div>
    </div>
  );
}