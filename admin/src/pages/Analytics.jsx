import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, Tooltip, Legend, Filler,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import { apiGet } from "../lib/api.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend, Filler);

const GOLD = "#C9A84C";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("30");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGet(`/admin/analytics?range=${range}`)
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [range]);

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: "bottom", labels: { padding: 16, font: { size: 12 } } } },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#888", font: { size: 11 } } },
      y: { grid: { color: "#f0f0f0" }, ticks: { color: "#888" }, beginAtZero: true },
    },
  };

  if (loading) return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: 400 }}>
      <div style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #eee", borderTopColor: GOLD, animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); }}`}</style>
    </div>
  );

  if (!data) return <div>Failed to load analytics</div>;

  const avgSecs = parseFloat(data.avgSessionTime?.avg_seconds || 0);
  const avgMin = Math.floor(avgSecs / 60);
  const avgSec = Math.floor(avgSecs % 60);

  // Visitor vs Lead trend
  const trendDates = data.visitorTrend.map((d) =>
    new Date(d.date).toLocaleDateString("en-SA", { month: "short", day: "numeric" })
  );
  const visitors = data.visitorTrend.map((d) => parseInt(d.visitors));
  const leadsByDay = data.visitorTrend.map((d) => parseInt(d.leads));

  // Hourly activity
  const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
  const hourlyCount = hours.map((_, i) => {
    const found = data.hourlyActivity.find((h) => parseInt(h.hour) === i);
    return found ? parseInt(found.count) : 0;
  });

  const kpiCards = [
    {
      label: "Avg Session Time",
      value: `${avgMin}m ${avgSec}s`,
      icon: "⏱",
      color: "#9b59b6",
      desc: "Per conversation",
    },
    {
      label: "Total Messages",
      value: parseInt(data.messageStats?.total_messages || 0),
      icon: "💬",
      color: "#3498db",
      desc: "All time",
    },
    {
      label: "Avg Messages",
      value: parseFloat(data.messageStats?.avg_per_session || 0).toFixed(1),
      icon: "📊",
      color: GOLD,
      desc: "Per session",
    },
    {
      label: "Peak Activity Hour",
      value: (() => {
        const max = data.hourlyActivity.reduce((a, b) => parseInt(a.count) > parseInt(b.count) ? a : b, { count: 0, hour: 0 });
        return `${max.hour || 0}:00`;
      })(),
      icon: "🕐",
      color: "#e74c3c",
      desc: "Most active hour",
    },
  ];

  return (
    <div className="fade-in">
      {/* Range Selector */}
      <div style={{ display: "flex", gap: 10, marginBottom: 24, alignItems: "center" }}>
        <span style={{ fontSize: 14, color: "#888", fontWeight: 600 }}>Time Range:</span>
        {[
          { label: "7 Days", value: "7" },
          { label: "30 Days", value: "30" },
          { label: "90 Days", value: "90" },
        ].map((r) => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            style={{
              padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
              background: range === r.value ? GOLD : "#f0f0f0",
              color: range === r.value ? "#fff" : "#555",
              border: "none", cursor: "pointer", transition: "all .2s",
            }}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 16, marginBottom: 24,
        }}
      >
        {kpiCards.map((k) => (
          <div key={k.label} className="card" style={{ padding: "20px 24px" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{k.icon}</div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif", fontSize: 28,
                fontWeight: 700, color: k.color,
              }}
            >
              {k.value}
            </div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#333", marginTop: 4 }}>
              {k.label}
            </div>
            <div style={{ fontSize: 11, color: "#aaa" }}>{k.desc}</div>
          </div>
        ))}
      </div>

      {/* Visitor vs Lead Trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700 }}>Visitors vs Leads — {range} Day Trend</h3>
        </div>
        <div style={{ height: 260 }}>
          <Line
            data={{
              labels: trendDates,
              datasets: [
                {
                  label: "Visitors",
                  data: visitors,
                  borderColor: "#3498db",
                  backgroundColor: "rgba(52,152,219,0.07)",
                  fill: true, tension: 0.4, pointRadius: 3,
                },
                {
                  label: "Leads",
                  data: leadsByDay,
                  borderColor: GOLD,
                  backgroundColor: `rgba(201,168,76,0.07)`,
                  fill: true, tension: 0.4, pointRadius: 3,
                },
              ],
            }}
            options={chartOptions}
          />
        </div>
      </div>

      {/* 2-col row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20, marginBottom: 20 }}>
        {/* Hourly Activity */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Hourly Activity</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>When users interact most</p>
          <div style={{ height: 220 }}>
            <Bar
              data={{
                labels: hours,
                datasets: [{
                  label: "Sessions",
                  data: hourlyCount,
                  backgroundColor: hourlyCount.map((v) => v === Math.max(...hourlyCount) ? GOLD : `rgba(201,168,76,0.4)`),
                  borderRadius: 4,
                }],
              }}
              options={{
                ...chartOptions,
                plugins: { legend: { display: false } },
              }}
            />
          </div>
        </div>

        {/* Top Locations */}
        <div className="card">
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Top Locations</h3>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 20 }}>Where leads come from</p>
          {data.topLocations.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#aaa" }}>No location data yet</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.topLocations.slice(0, 6).map((loc, i) => {
                const max = parseInt(data.topLocations[0]?.count || 1);
                const pct = Math.round((parseInt(loc.count) / max) * 100);
                return (
                  <div key={loc.location}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 500 }}>{loc.location}</span>
                      <span style={{ fontSize: 13, color: "#888" }}>{loc.count}</span>
                    </div>
                    <div style={{ height: 6, background: "#f0f0f0", borderRadius: 3 }}>
                      <div
                        style={{
                          height: "100%", borderRadius: 3,
                          background: `linear-gradient(90deg, ${GOLD}, #a07830)`,
                          width: `${pct}%`, transition: "width .6s ease",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Language Breakdown */}
      <div className="card">
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Language Breakdown</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {data.languageBreakdown.length === 0 ? (
            <p style={{ color: "#aaa" }}>No language data yet</p>
          ) : (
            data.languageBreakdown.map((lang) => (
              <div
                key={lang.language}
                style={{
                  padding: "10px 20px", borderRadius: 10,
                  background: `rgba(201,168,76,0.08)`,
                  border: "1px solid rgba(201,168,76,0.2)",
                }}
              >
                <div style={{ fontWeight: 700, color: GOLD, fontSize: 20 }}>
                  {lang.count}
                </div>
                <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>
                  {lang.language || "unknown"}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
