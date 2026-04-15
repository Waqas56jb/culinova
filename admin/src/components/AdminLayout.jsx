import React, { useState, useContext, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../App.jsx";

const GOLD = "#C9A84C";
const DARK = "#0f0f0f";
const SIDEBAR_W = 260;

const navItems = [
  { path: "/",              icon: "📊", label: "Dashboard"    },
  { path: "/leads",         icon: "🎯", label: "Leads"        },
  { path: "/chat-history",  icon: "💬", label: "Chat History" },
  { path: "/analytics",     icon: "📈", label: "Analytics"    },
  { path: "/knowledge-base",icon: "📚", label: "Knowledge Base" },
  { path: "/settings",      icon: "⚙️", label: "Settings"     },
];

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= bp : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth <= bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

export default function AdminLayout({ children }) {
  const { auth, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Close drawer on route change */
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);
  /* Close drawer when resizing to desktop */
  useEffect(() => { if (!isMobile) setSidebarOpen(false); }, [isMobile]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  const currentLabel = navItems.find(n => n.path === location.pathname)?.label || "Dashboard";

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f4f5f7" }}>

      {/* ── Mobile overlay ── */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.55)",
            zIndex: 998,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          width: SIDEBAR_W,
          minHeight: "100vh",
          background: DARK,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          left: 0, top: 0, bottom: 0,
          zIndex: 999,
          transition: "transform .3s cubic-bezier(.4,0,.2,1)",
          transform: isMobile && !sidebarOpen ? `translateX(-${SIDEBAR_W}px)` : "translateX(0)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.25)",
        }}
      >
        {/* Logo + close button on mobile */}
        <div style={{ padding: "22px 20px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: GOLD, letterSpacing: 2 }}>CULINOVA</div>
            <div style={{ fontSize: 11, color: "#555", marginTop: 3, letterSpacing: 1 }}>Admin Dashboard</div>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: "transparent", border: "none", color: "#888", fontSize: 20, cursor: "pointer", padding: 4, lineHeight: 1 }}>✕</button>
          )}
        </div>

        {/* User info */}
        <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},#a07830)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
            {(auth?.admin?.username || "A")[0].toUpperCase()}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ color: "#fff", fontSize: 13, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{auth?.admin?.username || "Admin"}</div>
            <div style={{ color: "#555", fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{auth?.admin?.email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 12,
                  padding: "11px 14px", borderRadius: 10, marginBottom: 2,
                  background: active ? "linear-gradient(135deg,rgba(201,168,76,0.15),rgba(201,168,76,0.05))" : "transparent",
                  border: active ? "1px solid rgba(201,168,76,0.2)" : "1px solid transparent",
                  color: active ? GOLD : "#777",
                  fontSize: 14, fontWeight: active ? 600 : 400,
                  cursor: "pointer", transition: "all .2s", textAlign: "left",
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.color = "#bbb"; }}}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#777"; }}}
              >
                <span style={{ fontSize: 17 }}>{item.icon}</span>
                <span>{item.label}</span>
                {active && <div style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: GOLD }} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={handleLogout}
            style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 10, background: "rgba(231,76,60,0.08)", border: "1px solid rgba(231,76,60,0.15)", color: "#e74c3c", fontSize: 14, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(231,76,60,0.18)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(231,76,60,0.08)"}
          >
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        className="admin-main"
        style={{ flex: 1, marginLeft: isMobile ? 0 : SIDEBAR_W, minHeight: "100vh", display: "flex", flexDirection: "column", transition: "margin-left .3s" }}
      >
        {/* Topbar */}
        <header
          className="admin-topbar"
          style={{ height: 64, background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", padding: isMobile ? "0 16px" : "0 28px", borderBottom: "1px solid #eee", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
            {/* Hamburger */}
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(true)}
                style={{ background: "transparent", border: "none", padding: 6, cursor: "pointer", display: "flex", flexDirection: "column", gap: 5 }}
                aria-label="Open menu"
              >
                {[0,1,2].map(i => (
                  <span key={i} style={{ display: "block", width: 22, height: 2, background: "#333", borderRadius: 2 }} />
                ))}
              </button>
            )}
            <div>
              <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, color: "#111", lineHeight: 1.2 }}>{currentLabel}</h1>
              {!isMobile && (
                <p style={{ fontSize: 12, color: "#888" }}>
                  {new Date().toLocaleDateString("en-SA", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {!isMobile && (
              <a
                href={import.meta.env.VITE_CLIENT_URL || "http://localhost:3000"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "7px 14px", borderRadius: 8, background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)", color: GOLD, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}
              >
                🔗 View Chatbot
              </a>
            )}
            {/* Mobile avatar */}
            {isMobile && (
              <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg,${GOLD},#a07830)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                {(auth?.admin?.username || "A")[0].toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <div className="admin-content" style={{ flex: 1, padding: isMobile ? "16px" : "28px", overflow: "auto" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
