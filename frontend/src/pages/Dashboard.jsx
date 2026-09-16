import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getEntries, deleteEntry } from "../api/entries";
import EditEntryModal from "../components/EditEntryModal";
import ConfirmDialog from "../components/ConfirmDialog";

const VARIABLES = [
  { key: "sleep_hours", label: "Sleep hours", unit: "h", domain: [0, 12] },
  { key: "sleep_quality", label: "Sleep quality", unit: "/10", domain: [0, 10] },
  { key: "nutrition_quality", label: "Nutrition quality", unit: "/10", domain: [0, 10] },
  { key: "physical_activity", label: "Physical activity", unit: "min", domain: ["auto", "auto"] },
  { key: "stress_level", label: "Stress level", unit: "/10", domain: [0, 10] },
  { key: "energy_level", label: "Energy level", unit: "/10", domain: [0, 10] },
];

export default function Dashboard() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariable, setSelectedVariable] = useState("sleep_hours");
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingEntry, setDeletingEntry] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    setError("");
    try {
      const data = await getEntries();
      setEntries(data);
    } catch (err) {
      setError("Failed to load entries.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmDelete() {
    setDeleteLoading(true);
    try {
      await deleteEntry(deletingEntry.id);
      setDeletingEntry(null);
      await loadEntries();
    } catch (err) {
      setError("Failed to delete entry.");
      setDeletingEntry(null);
    } finally {
      setDeleteLoading(false);
    }
  }

  const avg = (key) => {
    const vals = entries.map((e) => e[key]).filter((v) => v !== null && v !== undefined);
    if (vals.length === 0) return "-";
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  };

  const chartData = useMemo(() => {
    return entries
      .slice()
      .sort((a, b) => (a.entry_date > b.entry_date ? 1 : -1))
      .slice(-14);
  }, [entries]);

  const activeVariable = VARIABLES.find((v) => v.key === selectedVariable);

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Overview</span>
          <h1>Dashboard</h1>
        </div>
        <Link to="/entries/new" className="btn btn-primary" style={{ width: "auto" }}>
          + Add today's entry
        </Link>
      </div>

      {!loading && entries.length > 0 && (
        <div className="stat-grid">
          <div className="stat-card">
            <div className="stat-label">Entries logged</div>
            <div className="stat-value">{entries.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg sleep (h)</div>
            <div className="stat-value">{avg("sleep_hours")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg stress</div>
            <div className="stat-value">{avg("stress_level")}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Avg energy</div>
            <div className="stat-value">{avg("energy_level")}</div>
          </div>
        </div>
      )}

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && entries.length === 0 && (
        <div className="card empty-state">
          <h3>No entries yet</h3>
          <p style={{ marginTop: 8 }}>Log your first day to start building your baseline.</p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <>
          <div className="card chart-card">
            <div className="chart-card-header">
              <div>
                <h3>Recent trend</h3>
                <span style={{ fontSize: "0.82rem", color: "var(--color-ink-soft)" }}>
                  Last {chartData.length} entries
                </span>
              </div>
              <select
                className="select"
                value={selectedVariable}
                onChange={(e) => setSelectedVariable(e.target.value)}
              >
                {VARIABLES.map((v) => (
                  <option key={v.key} value={v.key}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#E0E3DB" vertical={false} />
                <XAxis dataKey="entry_date" tick={{ fontSize: 11, fill: "#5A655E" }} />
                <YAxis
                  domain={activeVariable.domain}
                  tick={{ fontSize: 11, fill: "#5A655E" }}
                  label={{
                    value: activeVariable.unit,
                    angle: -90,
                    position: "insideLeft",
                    fontSize: 11,
                    fill: "#5A655E",
                  }}
                />
                <Tooltip
                  formatter={(value) => [`${value} ${activeVariable.unit}`, activeVariable.label]}
                  labelStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}
                  contentStyle={{ borderRadius: 8, borderColor: "#E0E3DB", fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey={selectedVariable}
                  stroke="#2F6F5E"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#2F6F5E" }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sleep (h)</th>
                  <th>Sleep quality</th>
                  <th>Nutrition</th>
                  <th>Activity</th>
                  <th>Stress</th>
                  <th>Energy</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="mono">{entry.entry_date}</td>
                    <td className="mono">{entry.sleep_hours ?? "-"}</td>
                    <td className="mono">{entry.sleep_quality ?? "-"}</td>
                    <td className="mono">{entry.nutrition_quality ?? "-"}</td>
                    <td className="mono">{entry.physical_activity ?? "-"}</td>
                    <td className="mono">{entry.stress_level ?? "-"}</td>
                    <td className="mono">{entry.energy_level ?? "-"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="icon-btn" onClick={() => setEditingEntry(entry)}>
                          Edit
                        </button>
                        <button
                          className="icon-btn danger"
                          onClick={() => setDeletingEntry(entry)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onClose={() => setEditingEntry(null)}
          onSaved={() => {
            setEditingEntry(null);
            loadEntries();
          }}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          title="Delete this entry?"
          message={`This will permanently delete the entry for ${deletingEntry.entry_date}.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeletingEntry(null)}
          loading={deleteLoading}
        />
      )}
    </div>
  );
}