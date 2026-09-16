import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { getCombinedAnalysis, getInsights } from "../api/analysis";
import { getEntries } from "../api/entries";

const VARIABLES = [
  { key: "sleep_hours", label: "Sleep hours", unit: "h", domain: [0, 12] },
  { key: "sleep_quality", label: "Sleep quality", unit: "/10", domain: [0, 10] },
  { key: "nutrition_quality", label: "Nutrition quality", unit: "/10", domain: [0, 10] },
  { key: "physical_activity", label: "Physical activity", unit: "min", domain: ["auto", "auto"] },
  { key: "stress_level", label: "Stress level", unit: "/10", domain: [0, 10] },
  { key: "energy_level", label: "Energy level", unit: "/10", domain: [0, 10] },
];

const INSIGHT_TYPE_LABELS = {
  correlation: "Correlation",
  trend: "Trend",
  anomaly_frequency: "Pattern",
};

function mergeData(entries, analysisResults) {
  const analysisByDate = new Map(analysisResults.map((r) => [r.entry_date, r]));
  return entries
    .slice()
    .sort((a, b) => (a.entry_date > b.entry_date ? 1 : -1))
    .map((e) => {
      const a = analysisByDate.get(e.entry_date);
      return {
        entry_date: e.entry_date,
        sleep_hours: e.sleep_hours,
        sleep_quality: e.sleep_quality,
        nutrition_quality: e.nutrition_quality,
        physical_activity: e.physical_activity,
        stress_level: e.stress_level,
        energy_level: e.energy_level,
        anomalousVariables: a?.zscore?.anomalous_variables || [],
        ifScore: a?.isolation_forest?.anomaly_score ?? null,
        ifAnomalous: a?.isolation_forest?.is_anomalous || false,
      };
    });
}

function makeVariableDot(variableKey) {
  return function VariableDot(props) {
    const { cx, cy, payload } = props;
    if (cx == null || cy == null) return null;
    const isAnomalous = payload.anomalousVariables.includes(variableKey);
    return (
      <circle
        cx={cx}
        cy={cy}
        r={isAnomalous ? 5 : 3}
        fill={isAnomalous ? "#B84139" : "#2F6F5E"}
        stroke={isAnomalous ? "#fff" : "none"}
        strokeWidth={isAnomalous ? 1.5 : 0}
      />
    );
  };
}

function IfDot(props) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={payload.ifAnomalous ? 5 : 3}
      fill={payload.ifAnomalous ? "#B84139" : "#2F6F5E"}
      stroke={payload.ifAnomalous ? "#fff" : "none"}
      strokeWidth={payload.ifAnomalous ? 1.5 : 0}
    />
  );
}

export default function Analysis() {
  const [data, setData] = useState(null);
  const [entries, setEntries] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedVariable, setSelectedVariable] = useState("sleep_hours");

  useEffect(() => {
    loadAnalysis();
  }, []);

  async function loadAnalysis() {
    setLoading(true);
    setError("");
    try {
      const [analysisResult, entryList, insightsResult] = await Promise.all([
        getCombinedAnalysis(),
        getEntries(),
        getInsights(),
      ]);
      setData(analysisResult);
      setEntries(entryList);
      setInsights(insightsResult.insights);
    } catch (err) {
      setError("Failed to load analysis.");
    } finally {
      setLoading(false);
    }
  }

  const chartData = useMemo(() => {
    if (!data) return [];
    return mergeData(entries, data.results);
  }, [entries, data]);

  const activeVariable = VARIABLES.find((v) => v.key === selectedVariable);
  const VariableDot = useMemo(() => makeVariableDot(selectedVariable), [selectedVariable]);

  const MIN_ENTRIES_FOR_ANALYSIS = 10;
  const hasEnoughData = data && data.total_entries >= MIN_ENTRIES_FOR_ANALYSIS;
  const entriesNeeded = data ? Math.max(0, MIN_ENTRIES_FOR_ANALYSIS - data.total_entries) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <span className="eyebrow">Anomaly detection</span>
          <h1>Analysis</h1>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {data && chartData.length > 0 && !hasEnoughData && (
        <div className="card notice-card">
          <div className="notice-icon">i</div>
          <div>
            <h3>Not enough data yet</h3>
            <p style={{ marginTop: 6, color: "var(--color-ink-soft)" }}>
              Anomaly detection needs at least {MIN_ENTRIES_FOR_ANALYSIS} days of entries for
              reliable results. You have {data.total_entries} — log {entriesNeeded} more day
              {entriesNeeded === 1 ? "" : "s"} to unlock full analysis.
            </p>
            <div className="progress-bar" style={{ marginTop: 14 }}>
              <div
                className="progress-bar-fill"
                style={{ width: `${Math.min(100, (data.total_entries / MIN_ENTRIES_FOR_ANALYSIS) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {insights.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <h3 style={{ marginBottom: 14 }}>Insights</h3>
          <div className="insights-grid">
            {insights.map((insight, idx) => {
              const isNegative = insight.type === "trend"
                ? insight.direction === "declined"
                : insight.type === "anomaly_frequency";
              return (
                <div key={idx} className={`insight-card ${isNegative ? "negative" : ""}`}>
                  <span className="insight-card-type">
                    {INSIGHT_TYPE_LABELS[insight.type] || insight.type}
                  </span>
                  <h4>{insight.title}</h4>
                  <p>{insight.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data && chartData.length > 0 && (
        <>
          <p style={{ color: "var(--color-ink-soft)", marginBottom: 24 }}>
            {data.total_entries} entries analyzed with Z-score and Isolation Forest.
          </p>

          <div className="analysis-layout">
            <div>
              {/* Chart 1: selected variable over time, Z-score anomalies highlighted */}
              <div className="card chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>{activeVariable.label} over time</h3>
                    <span className="legend-row" style={{ marginTop: 8 }}>
                      <span className="legend-chip">
                        <span className="legend-dot" style={{ background: "#2F6F5E" }} />
                        Normal day
                      </span>
                      <span className="legend-chip">
                        <span className="legend-dot" style={{ background: "#B84139" }} />
                        Z-score anomaly
                      </span>
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

                <ResponsiveContainer width="100%" height={280}>
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
                      dot={<VariableDot />}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Chart 2: Isolation Forest anomaly score over time */}
              <div className="card chart-card">
                <div className="chart-card-header">
                  <div>
                    <h3>Isolation Forest anomaly score</h3>
                    <span className="legend-row" style={{ marginTop: 8 }}>
                      <span className="legend-chip">
                        <span className="legend-dot" style={{ background: "#2F6F5E" }} />
                        Normal day
                      </span>
                      <span className="legend-chip">
                        <span className="legend-dot" style={{ background: "#B84139" }} />
                        Flagged anomaly
                      </span>
                    </span>
                  </div>
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke="#E0E3DB" vertical={false} />
                    <XAxis dataKey="entry_date" tick={{ fontSize: 11, fill: "#5A655E" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#5A655E" }} />
                    <ReferenceLine y={0} stroke="#8B958E" strokeDasharray="4 4" />
                    <Tooltip
                      formatter={(value) => [value, "Anomaly score"]}
                      labelStyle={{ fontFamily: "IBM Plex Mono, monospace", fontSize: 12 }}
                      contentStyle={{ borderRadius: 8, borderColor: "#E0E3DB", fontSize: 12 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ifScore"
                      stroke="#2F6F5E"
                      strokeWidth={2}
                      dot={<IfDot />}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="analysis-table-col">
              <div className="card">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Z-score</th>
                      <th>Variables</th>
                      <th>IF score</th>
                      <th>IF</th>
                      <th>Agreement</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.results.map((row) => {
                      const anomalous = row.zscore.is_anomalous || row.isolation_forest.is_anomalous;
                      return (
                        <tr key={row.entry_date} className={anomalous ? "is-anomalous" : ""}>
                          <td className="mono">{row.entry_date}</td>
                          <td>
                            <span className={`badge ${row.zscore.is_anomalous ? "badge-anomaly" : "badge-normal"}`}>
                              {row.zscore.is_anomalous ? "Anomaly" : "Normal"}
                            </span>
                          </td>
                          <td>
                            {row.zscore.anomalous_variables.length > 0 ? (
                              <div className="variable-chips">
                                {row.zscore.anomalous_variables.slice(0, 2).map((v) => (
                                  <span key={v} className="variable-chip">
                                    {v.replace(/_/g, " ")}
                                  </span>
                                ))}
                                {row.zscore.anomalous_variables.length > 2 && (
                                  <span
                                    className="variable-chip variable-chip-more"
                                    title={row.zscore.anomalous_variables
                                      .slice(2)
                                      .map((v) => v.replace(/_/g, " "))
                                      .join(", ")}
                                  >
                                    +{row.zscore.anomalous_variables.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span style={{ color: "var(--color-ink-faint)" }}>—</span>
                            )}
                          </td>
                          <td className="mono">{row.isolation_forest.anomaly_score ?? "-"}</td>
                          <td>
                            <span className={`badge ${row.isolation_forest.is_anomalous ? "badge-anomaly" : "badge-normal"}`}>
                              {row.isolation_forest.is_anomalous ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            {row.zscore.is_anomalous === row.isolation_forest.is_anomalous ? (
                              <span className="agreement-icon agree" title="Both methods agree">
                                ✓
                              </span>
                            ) : (
                              <span className="agreement-icon disagree" title="Methods disagree">
                                ⚠
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {data && chartData.length === 0 && (
        <div className="card empty-state">
          <h3>No data yet</h3>
          <p style={{ marginTop: 8 }}>Add some daily entries to see your analysis here.</p>
        </div>
      )}
    </div>
  );
}