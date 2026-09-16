import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import PulseMark from "./PulseMark";

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/entries/new", label: "New Entry" },
  { to: "/analysis", label: "Analysis" },
];

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isAuthenticated) return null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <PulseMark width={32} height={20} strokeWidth={2.5} />
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`sidebar-link ${location.pathname === link.to ? "active" : ""}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </div>
    </aside>
  );
}