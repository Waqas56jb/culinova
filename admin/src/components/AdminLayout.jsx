import React, { useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App.jsx";

const GOLD = "#C9A84C";
const DARK = "#0f0f0f";

const navItems = [
  { path: "/", icon: "📊", label: "Dashboard" },
  { path: "/leads", icon: "🎯", label: "Leads" },
  { path: "/chat-history", icon: "💬", label: "Chat History" },
  { path: "/analytics", icon: "📈", label: "Analytics" },
  { path: "/knowledge-base", icon: "📚", label: "Knowledge Base" },
  { path: "/settings", icon: "⚙️", label: "Settings" },
];

export default function AdminLayout({ children }) {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f5f7" }}>
      {/* ── Mobile Overlay ── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 998, display: "none",
          }}
          className="mobile-overlay"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: 260, minHeight: "100vh", background: DARK,
          display: "flex", flexDirection: "column",
          position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 999,
          transition: "transform .3s",
          boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: "28px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div
            style={{
              fontFamily: "'Playfair Display', serif", fontSize: 26,
              fontWeight: 700, color: GOLD, letterSpacing: 2,
            }}
          >
            CULINOVA
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 4, letterSpacing: 1 }}>
            Admin Dashboard
          </div>
        </div>

        {/* User info */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", gap: 12,
          }}
        >
          <div
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16,
            }}
          >
            {(auth?.admin?.username || "A")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>
              {auth?.admin?.username || "Admin"}
            </div>
            <div style={{ color: "#555", fontSize: 12 }}>{auth?.admin?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", overflowY: "auto" }}>
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setSidebarOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 16px", borderRadius: 10,
                  background: active
                    ? `linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))`
                    : "transparent",
                  border: active ? `1px solid rgba(201,168,76,0.2)` : "1px solid transparent",
                  color: active ? GOLD : "#777",
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  cursor: "pointer", transition: "all .2s",
                  marginBottom: 4, textAlign: "left",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.color = "#bbb";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = "#777";
                  }
                }}
              >
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && (
                  <div
                    style={{
                      marginLeft: "auto", width: 6, height: 6,
                      borderRadius: "50%", background: GOLD,
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button
            onClick={handleLogout}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: 12,
              padding: "12px 16px", borderRadius: 10,
              background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.15)",
              color: "#e74c3c", fontSize: 14, fontWeight: 600, cursor: "pointer",
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(231,76,60,0.15)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(231,76,60,0.08)";
            }}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main style={{ flex: 1, marginLeft: 260, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Top Bar */}
        <header
          style={{
            height: 64, background: "#fff", display: "flex", alignItems: "center",
            justifyContent: "space-between", padding: "0 28px",
            borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 100,
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: "#111" }}>
              {navItems.find((n) => n.path === location.pathname)?.label || "Dashboard"}
            </h1>
            <p style={{ fontSize: 12, color: "#888" }}>
              {new Date().toLocaleDateString("en-SA", {
                weekday: "long", year: "numeric", month: "long", day: "numeric",
              })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href="http://localhost:3000"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "7px 16px", borderRadius: 8,
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
                color: GOLD, fontSize: 13, fontWeight: 600,
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              🔗 View Chatbot
            </a>
          </div>
        </header>

        <div style={{ flex: 1, padding: "28px", overflow: "auto" }}>
          {children}
        </div>
      </main>

      <style>{`
        @media (max-width: 768px) {
          main { margin-left: 0 !important; }
          aside { transform: translateX(${sidebarOpen ? "0" : "-100%"}); }
          .mobile-overlay { display: block !important; }
        }
      `}</style>
    </div>
  );
}
