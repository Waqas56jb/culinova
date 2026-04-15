import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { apiGet } from "../lib/api.js";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, ArcElement, Tooltip, Legend, Filler
);

const GOLD = "#C9A84C";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/admin/dashboard")
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (!data) return <div>Failed to load dashboard</div>;

  const { stats, charts, recentLeads } = data;

  const statCards = [
    { label: "Total Leads", value: stats.totalLeads, icon: "🎯", color: GOLD, sub: `+${stats.leadsToday} today` },
    { label: "Hot Leads", value: stats.hotLeads, icon: "🔥", color: "#e74c3c", sub: "High priority" },
    { label: "Total Visitors", value: stats.totalSessions, icon: "👥", color: "#3498db", sub: `${stats.sessionsToday} today` },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: "📈", color: "#27ae60", sub: "Visitor → Lead" },
    { label: "Warm Leads", value: stats.warmLeads, icon: "⚡", color: "#f39c12", sub: "Medium priority" },
    { label: "Avg Messages", value: stats.avgMessages, icon: "💬", color: "#9b59b6", sub: "Per session" },
  ];

  // Chart data
  const sessionDates = charts.sessionsByDay.map((d) =>
    new Date(d.date).toLocaleDateString("en-SA", { month: "short", day: "numeric" })
  );
  const sessionCounts = charts.sessionsByDay.map((d) => parseInt(d.count));

  const leadDates = charts.leadsByDay.map((d) =>
    new Date(d.date).toLocaleDateString("en-SA", { month: "short", day: "numeric" })
  );
  const leadCounts = charts.leadsByDay.map((d) => parseInt(d.count));

  const lineOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#888", fontSize: 11 } },
      y: { grid: { color: "#f0f0f0" }, ticks: { color: "#888" }, beginAtZero: true },
    },
  };

  const doughnutData = {
    labels: ["Hot", "Warm", "Cold"],
    datasets: [{
      data: [stats.hotLeads, stats.warmLeads, stats.coldLeads],
      backgroundColor: ["#e74c3c", "#f39c12", "#3498db"],
      borderWidth: 0,
    }],
  };

  const projectTypeData = {
    labels: charts.topProjectTypes.map((t) => t.project_type || "Unknown"),
    datasets: [{
      label: "Projects",
      data: charts.topProjectTypes.map((t) => parseInt(t.count)),
      backgroundColor: ["#C9A84C", "#a07830", "#e8c97a", "#8b6914", "#d4a017"],
      borderRadius: 6,
    }],
  };

  return (
    <div className="fade-in">
      {/* ── Stat Cards ── */}
      <div
        className="stat-grid"
        style={{ marginBottom: 28 }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            className="card"
            style={{
              display: "flex", alignItems: "center", gap: 18, padding: "20px 24px",
            }}
          >
            <div
              style={{
                width: 52, height: 52, borderRadius: 14,
                background: `${card.color}18`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div
                style={{
                  fontSize: 28, fontWeight: 700, color: card.color,
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                {card.value}
              </div>
              <div style={{ fontSize: 13, color: "#555", fontWeight: 600 }}>
                {card.label}
              </div>
              <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>
                {card.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div
        className="chart-grid-2"
        style={{ marginBottom: 28 }}
      >
        {/* Sessions Trend */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Chat Sessions</h3>
              <p style={{ fontSize: 12, color: "#888" }}>Last 30 days</p>
            </div>
            <div
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: "rgba(52,152,219,0.1)", color: "#3498db",
              }}
            >
              {stats.totalSessions} Total
            </div>
          </div>
          <div style={{ height: 200 }}>
            <Line
              data={{
                labels: sessionDates,
                datasets: [{
                  data: sessionCounts,
                  borderColor: "#3498db",
                  backgroundColor: "rgba(52,152,219,0.08)",
                  fill: true, tension: 0.4, pointRadius: 3,
                }],
              }}
              options={lineOptions}
            />
          </div>
        </div>

        {/* Leads Trend */}
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700 }}>Lead Captures</h3>
              <p style={{ fontSize: 12, color: "#888" }}>Last 30 days</p>
            </div>
            <div
              style={{
                padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                background: "rgba(201,168,76,0.1)", color: GOLD,
              }}
            >
              {stats.totalLeads} Total
            </div>
          </div>
          <div style={{ height: 200 }}>
            <Line
              data={{
                labels: leadDates,
                datasets: [{
                  data: leadCounts,
                  borderColor: GOLD,
                  backgroundColor: `rgba(201,168,76,0.08)`,
                  fill: true, tension: 0.4, pointRadius: 3,
                }],
              }}
              options={lineOptions}
            />
          </div>
        </div>

        {/* Lead Score Distribution */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Lead Quality Distribution</h3>
            <p style={{ fontSize: 12, color: "#888" }}>By priority score</p>
          </div>
          <div style={{ height: 180, display: "flex", justifyContent: "center" }}>
            <Doughnut
              data={doughnutData}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                    labels: { padding: 16, font: { size: 12 } },
                  },
                },
                cutout: "65%",
              }}
            />
          </div>
        </div>

        {/* Top Project Types */}
        <div className="card">
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700 }}>Top Project Types</h3>
            <p style={{ fontSize: 12, color: "#888" }}>From lead inquiries</p>
          </div>
          <div style={{ height: 200 }}>
            <Bar
              data={projectTypeData}
              options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  x: { grid: { display: false }, ticks: { color: "#888" } },
                  y: { grid: { color: "#f0f0f0" }, ticks: { color: "#888" }, beginAtZero: true },
                },
                borderRadius: 6,
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Recent Leads ── */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Recent Leads</h3>
          <a href="/leads" style={{ fontSize: 13, color: GOLD, fontWeight: 600 }}>
            View All →
          </a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Project Type</th>
                <th>Budget</th>
                <th>Score</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", color: "#888", padding: 40 }}>
                    No leads yet. Start the chatbot to capture leads.
                  </td>
                </tr>
              ) : (
                recentLeads.map((lead) => (
                  <tr key={lead.id}>
                    <td style={{ fontWeight: 600 }}>{lead.name || "—"}</td>
                    <td>{lead.phone || "—"}</td>
                    <td>{lead.project_type || "—"}</td>
                    <td>{lead.budget || "—"}</td>
                    <td>
                      <span className={`badge badge-${lead.lead_score}`}>
                        {lead.lead_score === "hot" ? "🔥" : lead.lead_score === "warm" ? "⚡" : "❄️"}
                        {" "}{lead.lead_score?.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ color: "#888", fontSize: 13 }}>
                      {new Date(lead.created_at).toLocaleDateString("en-SA")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid #eee", borderTopColor: "#C9A84C",
            margin: "0 auto 16px", animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ color: "#888", fontSize: 14 }}>Loading dashboard...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );
}
