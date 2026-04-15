import React, { useState, useContext } from "react";
import { AuthContext } from "../App.jsx";
import { apiPost } from "../lib/api.js";

const GOLD = "#C9A84C";

export default function Settings() {
  const { auth } = useContext(AuthContext);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwStatus, setPwStatus] = useState(null);
  const [pwLoading, setPwLoading] = useState(false);

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwStatus({ type: "error", msg: "New passwords do not match" });
      return;
    }
    if (pwForm.newPassword.length < 6) {
      setPwStatus({ type: "error", msg: "Password must be at least 6 characters" });
      return;
    }
    setPwLoading(true);
    try {
      await apiPost("/admin/change-password", {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      setPwStatus({ type: "success", msg: "Password changed successfully!" });
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPwStatus({ type: "error", msg: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 700 }}>
      {/* Profile */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Admin Profile</h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Your account information</p>

        <div
          style={{
            display: "flex", alignItems: "center", gap: 20,
            padding: "20px", background: "#f9f9f9", borderRadius: 10,
          }}
        >
          <div
            style={{
              width: 64, height: 64, borderRadius: "50%",
              background: `linear-gradient(135deg, ${GOLD}, #a07830)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 28,
            }}
          >
            {(auth?.admin?.username || "A")[0].toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>
              {auth?.admin?.username}
            </div>
            <div style={{ fontSize: 14, color: "#888" }}>{auth?.admin?.email}</div>
            <div
              style={{
                marginTop: 6, display: "inline-flex", alignItems: "center", gap: 6,
                background: "rgba(39,174,96,0.1)", color: "#27ae60",
                padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 600,
              }}
            >
              ● Administrator
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Change Password</h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 24 }}>Keep your account secure</p>

        {pwStatus && (
          <div
            style={{
              background: pwStatus.type === "success" ? "rgba(39,174,96,0.1)" : "rgba(231,76,60,0.1)",
              border: `1px solid ${pwStatus.type === "success" ? "rgba(39,174,96,0.3)" : "rgba(231,76,60,0.3)"}`,
              borderRadius: 8, padding: "12px 16px",
              color: pwStatus.type === "success" ? "#27ae60" : "#e74c3c",
              fontSize: 14, marginBottom: 20,
            }}
          >
            {pwStatus.type === "success" ? "✅" : "⚠️"} {pwStatus.msg}
          </div>
        )}

        <form onSubmit={changePassword}>
          {[
            { key: "currentPassword", label: "Current Password", placeholder: "Enter current password" },
            { key: "newPassword", label: "New Password", placeholder: "Enter new password (min 6 chars)" },
            { key: "confirmPassword", label: "Confirm New Password", placeholder: "Repeat new password" },
          ].map((f) => (
            <div key={f.key} className="form-group">
              <label className="form-label">{f.label}</label>
              <input
                className="form-input"
                type="password"
                placeholder={f.placeholder}
                value={pwForm[f.key]}
                onChange={(e) => setPwForm({ ...pwForm, [f.key]: e.target.value })}
                required
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={pwLoading}
            className="btn btn-primary"
            style={{ padding: "11px 28px" }}
          >
            {pwLoading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>

      {/* API Info */}
      <div className="card">
        <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>System Information</h3>
        <p style={{ fontSize: 13, color: "#888", marginBottom: 20 }}>Platform configuration overview</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            { label: "AI Model", value: "GPT-4o (OpenAI)", icon: "🤖" },
            { label: "Memory", value: "Last 20 prompts per session", icon: "🧠" },
            { label: "Language Support", value: "Multilingual (Arabic, English, + more)", icon: "🌍" },
            { label: "Email Notifications", value: "NodeMailer (Gmail SMTP)", icon: "📧" },
            { label: "Database", value: "Vercel Postgres (PostgreSQL)", icon: "🗄️" },
            { label: "Lead Scoring", value: "Automatic (Hot / Warm / Cold)", icon: "🎯" },
            { label: "Chatbot Position", value: "Bottom-right widget on client site", icon: "💬" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                flexWrap: "wrap", gap: 8,
                padding: "12px 16px", background: "#f9f9f9", borderRadius: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 18 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "#444" }}>{item.label}</span>
              </div>
              <span
                style={{
                  fontSize: 13, color: GOLD, fontWeight: 600,
                  background: "rgba(201,168,76,0.08)",
                  padding: "4px 12px", borderRadius: 20,
                }}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
